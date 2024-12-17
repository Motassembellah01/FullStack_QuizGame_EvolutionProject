/* eslint-disable max-lines */
import { Match } from '@app/classes/match/match';
import { PlayerAnswers } from '@app/classes/player-answers/player-answers';
import { NAMES, SocketsEmitEvents } from '@app/constants/constants';
import { ChatAccessibilityRequest } from '@app/interfaces/chat-accessibility-request';
import { Message } from '@app/interfaces/message';
import { Player } from '@app/interfaces/player';
import { PlayerRequest } from '@app/interfaces/player-request';
import { QuestionRequest } from '@app/interfaces/question-request';
import { Room } from '@app/interfaces/room';
import { StopServerTimerRequest } from '@app/interfaces/stop-server-timer-request';
import { TimerRequest } from '@app/interfaces/timer-request';
import { UpdateAnswerRequest } from '@app/interfaces/update-answer-request';
import { UpdateChartDataRequest } from '@app/interfaces/update-chart-data-request';
import { MatchService } from '@app/services/match/match.service';
import { MATCHES_STUB } from '@app/tests.support/stubs/matches.stub';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { SocketHandlerGateway } from './socket-handler.gateway';

describe('SocketHandlerGateway', () => {
    let gateway: SocketHandlerGateway;
    let clientSocket: SinonStubbedInstance<Socket> = { id: 'mockId' } as SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let matchService: SinonStubbedInstance<MatchService>;
    let logger: SinonStubbedInstance<Logger>;

    beforeEach(async () => {
        matchService = createStubInstance<MatchService>(MatchService);
        clientSocket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);
        logger = createStubInstance<Logger>(Logger);
        matchService.logger = logger;

        const module: TestingModule = await Test.createTestingModule({
            providers: [SocketHandlerGateway, { provide: MatchService, useValue: matchService }],
        }).compile();

        gateway = module.get<SocketHandlerGateway>(SocketHandlerGateway);
        gateway.server = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
    describe('joinRoom', () => {
        const requestMock: PlayerRequest = {
            roomId: 'roomIdMock',
            name: 'nameMock',
        };
        it('joinRoom() should emit to newPlayer event', () => {
            jest.spyOn(matchService, 'addPlayer');
            jest.spyOn(matchService, 'addPlayerToBannedPlayer');
            server.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.NewPlayer);
                },
            } as BroadcastOperator<unknown, unknown>);

            jest.spyOn(matchService, 'getPlayersList').mockReturnValue([
                { name: requestMock.name, isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false } as Player,
            ]);

            gateway.joinMatchRoom(clientSocket, requestMock);
            expect(matchService.addPlayer).toHaveBeenCalledWith({
                accessCode: requestMock.roomId,
                player: { name: requestMock.name, isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false },
            });

            expect(matchService.addPlayerToBannedPlayer).toHaveBeenCalledWith({
                accessCode: requestMock.roomId,
                player: { name: requestMock.name, isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false },
            });

            expect(matchService.getPlayersList).toHaveBeenCalledWith({
                accessCode: requestMock.roomId,
            });
        });

        it('joinRoom() should handle an error', () => {
            server.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.NewPlayer);
                },
            } as BroadcastOperator<unknown, unknown>);

            jest.spyOn(matchService, 'getPlayersList').mockImplementation(() => {
                throw new Error('Match not found');
            });

            try {
                gateway.joinMatchRoom(clientSocket, requestMock);
            } catch (error) {
                expect(error.message).toBe('Match not found');
            }
        });
        it('should not join the room and not emit if the player name is "tester"', () => {
            const request = { ...requestMock };
            request.name = NAMES.tester;
            jest.spyOn(matchService, 'addPlayer');
            jest.spyOn(matchService, 'addPlayerToBannedPlayer');

            const serverToSpy = jest.spyOn(server, 'to');

            gateway.joinMatchRoom(clientSocket, request);

            expect(matchService.addPlayer).not.toHaveBeenCalled();
            expect(matchService.addPlayerToBannedPlayer).not.toHaveBeenCalled();
            expect(serverToSpy).not.toHaveBeenCalled();
        });

        it('should not join the room and not emit if the player name is "manager"', () => {
            const request = { ...requestMock };
            request.name = NAMES.manager;
            jest.spyOn(matchService, 'addPlayer');
            jest.spyOn(matchService, 'addPlayerToBannedPlayer');

            const serverToSpy = jest.spyOn(server, 'to');

            gateway.joinMatchRoom(clientSocket, request);

            expect(matchService.addPlayer).not.toHaveBeenCalled();
            expect(matchService.addPlayerToBannedPlayer).not.toHaveBeenCalled();
            expect(serverToSpy).not.toHaveBeenCalled();
        });
    });
    describe('sendMessage', () => {
        const msgMock: Message = {
            playerName: 'playerNameMock',
            matchAccessCode: 'matchAccessCodeMock',
            time: 'timeMock',
            data: 'dataMock',
        };
        it('sendMessage() should emit to chatMessage event', () => {
            stub(clientSocket, 'rooms').value(new Set());
            stub(clientSocket.rooms, 'has').returns(true);

            server.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.ChatMessage);
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.sendMessage(clientSocket, msgMock);
        });

        it('sendMessage() should not emit chatMessage event if client is not in the match room', () => {
            jest.spyOn(clientSocket, 'rooms', 'get').mockReturnValue(new Set());
            jest.spyOn(clientSocket.rooms, 'has').mockReturnValue(false);

            const toSpy = jest.spyOn(server, 'to');

            gateway.sendMessage(clientSocket, msgMock);

            expect(toSpy).not.toHaveBeenCalled();
        });
    });

    describe('switchQuestion', () => {
        const roomMock: Room = {
            id: 'roomMock',
        };

        it('should emit NextQuestion event', () => {
            server.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.NextQuestion);
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.switchQuestion(clientSocket, roomMock);
        });
    });

    describe('sendQuestionSelectedChoices', () => {
        const updateChartDataRequestMock: UpdateChartDataRequest = {
            matchAccessCode: 'id',
            questionChartData: { labelList: ['test'], chartData: [1], chartColor: '', xLineText: '' },
        };

        it('should emit sendQuestionSelectedChoices event', () => {
            server.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.UpdateChartDataList);
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.sendQuestionSelectedChoices(clientSocket, updateChartDataRequestMock);
        });
    });

    describe('panicModeActivatedHandler', () => {
        const roomMock: Room = {
            id: 'roomMock',
        };

        it('should emit PanicModeActivated event', () => {
            server.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.PanicModeActivated);
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.panicModeActivatedHandler(clientSocket, roomMock);
        });
    });

    describe('updateAnswer', () => {
        const answerRequestMock: UpdateAnswerRequest = {
            matchAccessCode: 'matchAccessCodeMock',
            playerAnswers: new PlayerAnswers(),
        };

        it('should emit AnswerUpdated event and update player answers', () => {
            server.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.AnswerUpdated);
                },
            } as BroadcastOperator<unknown, unknown>);

            jest.spyOn(matchService, 'updatePlayerAnswers');

            jest.spyOn(matchService, 'getMatchByAccessCode').mockReturnValue(Object.assign(MATCHES_STUB())[0]);
            const getPlayersAnswersListSpy = jest.spyOn(Match.prototype, 'getPlayersAnswersList');

            gateway.updateAnswer(clientSocket, answerRequestMock);

            expect(matchService.updatePlayerAnswers).toBeCalledWith(answerRequestMock);
            expect(matchService.getMatchByAccessCode).toBeCalledWith(answerRequestMock.matchAccessCode);
            expect(getPlayersAnswersListSpy).toBeCalled();
        });

        it('should handle errors', () => {
            server.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.AnswerUpdated);
                },
            } as BroadcastOperator<unknown, unknown>);

            jest.spyOn(matchService, 'updatePlayerAnswers').mockImplementation(() => {
                throw new Error('Update error');
            });
            try {
                gateway.updateAnswer(clientSocket, answerRequestMock);
            } catch (error) {
                expect(error).toContain('Update error');
            }
        });
    });

    describe('updateTimer', () => {
        const timerRequestMock: TimerRequest = {
            roomId: 'roomIdMock',
            timer: 60,
            timeInterval: 1000,
        };

        it('should start a timer and emit NewTime event', () => {
            jest.useFakeTimers();
            server.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.NewTime);
                },
            } as BroadcastOperator<unknown, unknown>);
            gateway.timerIntervalMap.delete(timerRequestMock.roomId);

            const setIntervalSpy = jest.spyOn(global, 'setInterval');

            gateway.updateTimer(clientSocket, timerRequestMock);
            const callback = setIntervalSpy.mock.calls[0][0];
            callback();

            expect(setIntervalSpy).toHaveBeenCalled();
            expect(gateway.timerIntervalMap.has(timerRequestMock.roomId)).toBe(true);
        });

        it('should stop the timer when timer <= 0', () => {
            gateway.timerIntervalMap = new Map();
            timerRequestMock.timer = 0;
            jest.useFakeTimers();
            server.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.NewTime);
                },
            } as BroadcastOperator<unknown, unknown>);
            gateway.timerIntervalMap.delete(timerRequestMock.roomId);
            const setIntervalSpy = jest.spyOn(global, 'setInterval');

            gateway.updateTimer(clientSocket, timerRequestMock);
            const callback = setIntervalSpy.mock.calls[0][0];
            callback();

            expect(setIntervalSpy).toHaveBeenCalled();
        });

        it('should stop an existing timer and emit NewTime event', () => {
            jest.useFakeTimers();
            const timerId = {} as NodeJS.Timer;
            server.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.NewTime);
                },
            } as BroadcastOperator<unknown, unknown>);
            gateway.timerIntervalMap.set(timerRequestMock.roomId, timerId);
            const stopTimerSpy = jest.spyOn(gateway, 'stopTimer');

            gateway.updateTimer(clientSocket, timerRequestMock);

            expect(stopTimerSpy).toHaveBeenCalledWith(gateway.timerIntervalMap, timerRequestMock.roomId);
        });

        it('should handle errors', () => {
            gateway.timerIntervalMap.delete(timerRequestMock.roomId);

            const setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => {
                throw new Error('Timer error');
            });

            try {
                gateway.updateTimer(clientSocket, timerRequestMock);
                const callback = setIntervalSpy.mock.calls[0][0];
                callback();
            } catch (error) {
                expect(error).toContain('Timer error');
            }
        });
    });

    describe('updateHistogramTime', () => {
        const timerRequestMock: TimerRequest = {
            roomId: 'roomIdMock',
            timer: 0,
            timeInterval: 1000,
        };

        it('should stop an existing timer, start a new one and emit HistogramTime event', () => {
            jest.useFakeTimers();
            const intervalKeyMock = timerRequestMock.roomId + clientSocket.id;
            const timerId = {} as NodeJS.Timer;
            server.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.HistogramTime);
                },
            } as BroadcastOperator<unknown, unknown>);
            gateway.histogramInterval.set(intervalKeyMock, timerId);
            const stopTimerSpy = jest.spyOn(gateway, 'stopTimer');
            const setIntervalSpy = jest.spyOn(global, 'setInterval');

            gateway.updateHistogramTime(clientSocket, timerRequestMock);

            const callback = setIntervalSpy.mock.calls[0][0];
            callback();

            expect(setIntervalSpy).toHaveBeenCalled();
            expect(gateway.histogramInterval.has(intervalKeyMock)).toBe(true);
            expect(stopTimerSpy).toHaveBeenCalledWith(gateway.histogramInterval, intervalKeyMock);
        });

        it('should handle errors', () => {
            const intervalKeyMock = timerRequestMock.roomId + clientSocket.id;
            gateway.histogramInterval.delete(intervalKeyMock);

            const setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => {
                throw new Error('Timer error');
            });

            try {
                gateway.updateHistogramTime(clientSocket, timerRequestMock);
                const callback = setIntervalSpy.mock.calls[0][0];
                callback();
            } catch (error) {
                expect(error).toContain('Timer error');
            }
        });
    });

    describe('stopTimerHandler', () => {
        it('should call stopTimer with timerIntervalMap if !isHistogramTimer', () => {
            const stopServerTimerRequestMock: StopServerTimerRequest = {
                roomId: 'roomMock',
                isHistogramTimer: false,
            };

            const stopTimerSpy = jest.spyOn(gateway, 'stopTimer');

            gateway.stopTimerHandler(clientSocket, stopServerTimerRequestMock);

            expect(stopTimerSpy).toHaveBeenCalledWith(gateway.timerIntervalMap, stopServerTimerRequestMock.roomId);
        });

        it('should call stopTimer with histogramInterval if isHistogramTimer', () => {
            const stopServerTimerRequestMock: StopServerTimerRequest = {
                roomId: 'roomMock',
                isHistogramTimer: true,
            };

            const stopTimerSpy = jest.spyOn(gateway, 'stopTimer');

            gateway.stopTimerHandler(clientSocket, stopServerTimerRequestMock);

            expect(stopTimerSpy).toHaveBeenCalledWith(gateway.histogramInterval, stopServerTimerRequestMock.roomId + clientSocket.id);
        });

        it('should  handle any errors', () => {
            const stopServerTimerRequestMock: StopServerTimerRequest = {
                roomId: 'roomMock',
                isHistogramTimer: false,
            };

            jest.spyOn(gateway, 'stopTimer').mockImplementation(() => {
                throw new Error('Error occurred while stopping the timer');
            });
            try {
                gateway.stopTimerHandler(clientSocket, stopServerTimerRequestMock);
            } catch (error) {
                expect(error).toContain('Error occurred while stopping the timer');
            }
        });
    });

    describe('cancelGame', () => {
        const roomMock: Room = {
            id: 'roomMock',
        };

        it('should emit GameCanceled event', () => {
            const serverToSpy = jest.spyOn(server, 'to');
            serverToSpy.mockReturnValue({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.GameCanceled);
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.cancelGame(clientSocket, roomMock);

            expect(serverToSpy).toHaveBeenCalledWith(roomMock.id);
        });
    });

    describe('finishMatch', () => {
        const roomMock: Room = {
            id: 'roomMock',
        };

        it('should emit MatchFinished event', () => {
            const serverToSpy = jest.spyOn(server, 'to');
            serverToSpy.mockReturnValue({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.MatchFinished);
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.finishMatch(clientSocket, roomMock);

            expect(serverToSpy).toHaveBeenCalledWith(roomMock.id);
        });
    });

    describe('redirectPlayersToMatch', () => {
        const roomMock: Room = {
            id: 'roomMock',
        };
        const matchMock = new Match(Object.assign(MATCHES_STUB())[0]);

        it('should emit JoinBegunMatch event', () => {
            const getMatchByAccessCodeSpy = jest.spyOn(matchService, 'getMatchByAccessCode');
            getMatchByAccessCodeSpy.mockReturnValue(matchMock);

            const serverToSpy = jest.spyOn(server, 'to');
            serverToSpy.mockReturnValue({
                emit: (event: string, data: Match) => {
                    expect(event).toEqual(SocketsEmitEvents.JoinBegunMatch);
                    expect(data).toEqual(matchMock);
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.redirectPlayersToMatch(clientSocket, roomMock);

            expect(getMatchByAccessCodeSpy).toHaveBeenCalledWith(roomMock.id);
            expect(serverToSpy).toHaveBeenCalledWith(roomMock.id);
        });

        it('should handle errors', () => {
            const getMatchByAccessCodeSpy = jest.spyOn(matchService, 'getMatchByAccessCode');
            getMatchByAccessCodeSpy.mockImplementation(() => {
                throw new Error('Match not found');
            });

            try {
                gateway.redirectPlayersToMatch(clientSocket, roomMock);
            } catch (error) {
                expect(error.message).toContain('Match not found');
            }
        });
    });
    describe('removePlayer', () => {
        const playerRequestMock: PlayerRequest = {
            roomId: 'roomIdMock',
            name: 'nameMock',
            hasPlayerLeft: true,
        };
        const playerMock: Player = {
            name: 'nameMock',
            isActive: true,
            score: 0,
            nBonusObtained: 0,
            chatBlocked: false,
        };
        const newPlayersListMock: Player[] = [playerMock];

        it('should emit PlayerRemoved event', () => {
            const removePlayerSpy = jest.spyOn(matchService, 'removePlayer');
            const removePlayerToBannedNameSpy = jest.spyOn(matchService, 'removePlayerToBannedName');
            const getPlayersListSpy = jest.spyOn(matchService, 'getPlayersList');

            getPlayersListSpy.mockReturnValue(newPlayersListMock);

            const serverToSpy = jest.spyOn(server, 'to');
            serverToSpy.mockReturnValue({
                emit: (event: string, data: Player[]) => {
                    expect(event).toEqual(SocketsEmitEvents.PlayerRemoved);
                    expect(data).toEqual(newPlayersListMock);
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.removePlayer(clientSocket, playerRequestMock);

            expect(removePlayerSpy).toHaveBeenCalledWith({
                accessCode: playerRequestMock.roomId,
                player: playerMock,
            });
            expect(removePlayerToBannedNameSpy).toHaveBeenCalledWith({
                accessCode: playerRequestMock.roomId,
                player: playerMock,
            });
            expect(getPlayersListSpy).toHaveBeenCalledWith({ accessCode: playerRequestMock.roomId });
            expect(serverToSpy).toHaveBeenCalledWith(playerRequestMock.roomId);
        });

        it('should emit PlayerRemoved event without removing from banned name list', () => {
            const request = { ...playerRequestMock };
            request.hasPlayerLeft = false;
            const removePlayerSpy = jest.spyOn(matchService, 'removePlayer');
            const removePlayerToBannedNameSpy = jest.spyOn(matchService, 'removePlayerToBannedName');
            const getPlayersListSpy = jest.spyOn(matchService, 'getPlayersList');

            getPlayersListSpy.mockReturnValue(newPlayersListMock);

            const serverToSpy = jest.spyOn(server, 'to');
            serverToSpy.mockReturnValue({
                emit: (event: string, data: Player[]) => {
                    expect(event).toEqual(SocketsEmitEvents.PlayerRemoved);
                    expect(data).toEqual(newPlayersListMock);
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.removePlayer(clientSocket, request);

            expect(removePlayerSpy).toHaveBeenCalledWith({
                accessCode: request.roomId,
                player: playerMock,
            });
            expect(removePlayerToBannedNameSpy).not.toBeCalled();

            expect(getPlayersListSpy).toHaveBeenCalledWith({ accessCode: request.roomId });
            expect(serverToSpy).toHaveBeenCalledWith(request.roomId);
        });

        it('should handle errors', () => {
            const removePlayerSpy = jest.spyOn(matchService, 'removePlayer');
            removePlayerSpy.mockImplementation(() => {
                throw new Error('Removal error');
            });

            try {
                gateway.removePlayer(clientSocket, playerRequestMock);
            } catch (error) {
                expect(error.message).toContain('Removal error');
            }
        });
    });

    describe('updatePlayerScore', () => {
        const questionRequestMock: QuestionRequest = {
            matchAccessCode: 'roomIdMock',
            player: {
                name: 'nameMock',
                isActive: true,
                score: 0,
                nBonusObtained: 0,
                chatBlocked: false,
            },
            questionId: 'questionIdMock',
            hasQrlEvaluationBegun: false,
        };
        const updatedPlayerMock: Player = {
            name: 'nameMock',
            isActive: true,
            score: 100,
            nBonusObtained: 1,
            chatBlocked: false,
        };

        it('should emit UpdatedScore event and update player score', () => {
            const updatePlayerScoreSpy = jest.spyOn(matchService, 'updatePlayerScore');
            updatePlayerScoreSpy.mockReturnValue();

            const getPlayerFromMatchSpy = jest.spyOn(matchService, 'getPlayerFromMatch');
            getPlayerFromMatchSpy.mockReturnValue(updatedPlayerMock);

            const serverToSpy = jest.spyOn(server, 'to');
            serverToSpy.mockReturnValue({
                emit: (event: string, data: Player) => {
                    expect(event).toEqual(SocketsEmitEvents.UpdatedScore);
                    expect(data).toEqual(updatedPlayerMock);
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.updatePlayerScore(clientSocket, questionRequestMock);

            expect(updatePlayerScoreSpy).toHaveBeenCalledWith(
                questionRequestMock.matchAccessCode,
                questionRequestMock.player,
                questionRequestMock.questionId,
            );
            expect(serverToSpy).toHaveBeenCalledWith(questionRequestMock.matchAccessCode);
        });

        it('should handle errors', () => {
            const updatePlayerScoreSpy = jest.spyOn(matchService, 'updatePlayerScore');
            updatePlayerScoreSpy.mockImplementation(() => {
                throw new Error('Update error');
            });

            try {
                gateway.updatePlayerScore(clientSocket, questionRequestMock);
            } catch (error) {
                expect(error.message).toContain('Update error');
            }
        });
    });

    describe('setFinalAnswer', () => {
        const answerRequestMock: UpdateAnswerRequest = {
            matchAccessCode: 'roomIdMock',
            playerAnswers: new PlayerAnswers(),
        };

        it('should emit FinalAnswerSet event and set final answer', () => {
            const setPlayerAnswersLastAnswerTimeAndFinalSpy = jest.spyOn(matchService, 'setPlayerAnswersLastAnswerTimeAndFinal');
            const allPlayersRespondedSpy = jest.spyOn(matchService, 'allPlayersResponded').mockReturnValue(false);

            const serverToSpy = jest.spyOn(server, 'to');
            serverToSpy.mockReturnValue({
                emit: (event: string, data: PlayerAnswers) => {
                    expect(event).toEqual(SocketsEmitEvents.FinalAnswerSet);
                    expect(data).toEqual(answerRequestMock.playerAnswers);
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.setFinalAnswer(clientSocket, answerRequestMock);

            expect(setPlayerAnswersLastAnswerTimeAndFinalSpy).toHaveBeenCalledWith(
                answerRequestMock.matchAccessCode,
                answerRequestMock.playerAnswers,
            );

            expect(serverToSpy).toHaveBeenCalledWith(answerRequestMock.matchAccessCode);

            expect(allPlayersRespondedSpy).toHaveBeenCalledWith(answerRequestMock.matchAccessCode, answerRequestMock.playerAnswers.questionId);
        });

        it('should emit FinalAnswerSet event and set final answer', () => {
            const setPlayerAnswersLastAnswerTimeAndFinalSpy = jest.spyOn(matchService, 'setPlayerAnswersLastAnswerTimeAndFinal');
            const allPlayersRespondedSpy = jest.spyOn(matchService, 'allPlayersResponded').mockReturnValue(true);

            const serverToSpy = jest.spyOn(server, 'to').mockReturnValue({
                emit: (event: string, data: PlayerAnswers) => {
                    if (event === SocketsEmitEvents.FinalAnswerSet) {
                        expect(data).toEqual(answerRequestMock.playerAnswers);
                    } else {
                        expect(event).toEqual(SocketsEmitEvents.AllPlayersResponded);
                    }
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.setFinalAnswer(clientSocket, answerRequestMock);

            expect(setPlayerAnswersLastAnswerTimeAndFinalSpy).toHaveBeenCalledWith(
                answerRequestMock.matchAccessCode,
                answerRequestMock.playerAnswers,
            );

            expect(serverToSpy).toHaveBeenCalledWith(answerRequestMock.matchAccessCode);

            expect(allPlayersRespondedSpy).toHaveBeenCalledWith(answerRequestMock.matchAccessCode, answerRequestMock.playerAnswers.questionId);
        });

        it('should handle errors', () => {
            const setPlayerAnswersLastAnswerTimeAndFinalSpy = jest.spyOn(matchService, 'setPlayerAnswersLastAnswerTimeAndFinal');
            setPlayerAnswersLastAnswerTimeAndFinalSpy.mockImplementation(() => {
                throw new Error('Set final answer error');
            });

            try {
                gateway.setFinalAnswer(clientSocket, answerRequestMock);
            } catch (error) {
                expect(error.message).toContain('Set final answer error');
            }
        });
    });
    describe('PlayerLeftAfterMatchBegun', () => {
        const questionRequestMock: QuestionRequest = {
            matchAccessCode: 'roomMock',
            player: {
                name: 'playerNameMock',
                isActive: true,
                score: 0,
                nBonusObtained: 0,
                chatBlocked: false,
            },
            questionId: 'questionIdMock',
            hasQrlEvaluationBegun: false,
        };
        const disabledPlayer = { ...questionRequestMock.player };
        disabledPlayer.isActive = false;

        it('should disable player and emit PlayerDisabled event', () => {
            const disablePlayerSpy = jest.spyOn(matchService, 'disablePlayer');
            const getPlayerFromMatchSpy = jest.spyOn(matchService, 'getPlayerFromMatch').mockReturnValue(disabledPlayer);
            const serverToSpy = jest.spyOn(server, 'to').mockReturnValue({
                emit: (event: string, data) => {
                    expect(event).toEqual(SocketsEmitEvents.PlayerDisabled);
                    expect(data).toEqual({
                        name: questionRequestMock.player.name,
                        players: disabledPlayer,
                    });
                },
            } as BroadcastOperator<unknown, unknown>);
            gateway.disablePlayer(clientSocket, questionRequestMock);
            expect(disablePlayerSpy).toHaveBeenCalledWith({
                accessCode: questionRequestMock.matchAccessCode,
                playerName: questionRequestMock.player.name,
            });
            expect(getPlayerFromMatchSpy).toBeCalledWith(questionRequestMock.matchAccessCode, questionRequestMock.player.name);
            expect(serverToSpy).toHaveBeenCalledWith(questionRequestMock.matchAccessCode);
        });

        it('should emit AllPlayersResponded event if all players have responded', () => {
            const disablePlayerSpy = jest.spyOn(matchService, 'disablePlayer');
            const allPlayersRespondedSpy = jest.spyOn(matchService, 'allPlayersResponded').mockReturnValue(true);
            const getMatchByAccessCodeSpy = jest.spyOn(matchService, 'getMatchByAccessCode').mockReturnValue(Object.assign(MATCHES_STUB())[0]);
            const getPlayersAnswersListSpy = jest.spyOn(Match.prototype, 'getPlayersAnswersList').mockReturnValue([]);
            const serverToSpy = jest.spyOn(server, 'to').mockReturnValue({
                emit: (event: string) => {
                    if (event !== SocketsEmitEvents.PlayerDisabled && event !== SocketsEmitEvents.AnswerUpdated) {
                        expect(event).toEqual(SocketsEmitEvents.AllPlayersResponded);
                    }
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.disablePlayer(clientSocket, questionRequestMock);
            expect(disablePlayerSpy).toHaveBeenCalledWith({
                accessCode: questionRequestMock.matchAccessCode,
                playerName: questionRequestMock.player.name,
            });
            expect(serverToSpy).toHaveBeenCalledWith(questionRequestMock.matchAccessCode);
            expect(allPlayersRespondedSpy).toHaveBeenCalledWith(questionRequestMock.matchAccessCode, questionRequestMock.questionId);
            expect(getPlayersAnswersListSpy).toHaveBeenCalled();
            expect(getMatchByAccessCodeSpy).toHaveBeenCalledWith(questionRequestMock.matchAccessCode);
        });

        it('should emit AnswerUpdated event', () => {
            const playersListMock = [{ name: 'playerNameMock', isTypingQrl: true } as PlayerAnswers];
            const disablePlayerSpy = jest.spyOn(matchService, 'disablePlayer');
            const allPlayersRespondedSpy = jest.spyOn(matchService, 'allPlayersResponded').mockReturnValue(false);
            const getMatchByAccessCodeSpy = jest.spyOn(matchService, 'getMatchByAccessCode').mockReturnValue(Object.assign(MATCHES_STUB())[0]);
            const getPlayersAnswersListSpy = jest.spyOn(Match.prototype, 'getPlayersAnswersList').mockReturnValue(playersListMock);
            const serverToSpy = jest.spyOn(server, 'to').mockReturnValue({
                emit: (event: string) => {
                    if (event !== SocketsEmitEvents.PlayerDisabled) {
                        expect(event).toEqual(SocketsEmitEvents.AnswerUpdated);
                    }
                },
            } as BroadcastOperator<unknown, unknown>);
            gateway.disablePlayer(clientSocket, questionRequestMock);
            expect(serverToSpy).toHaveBeenCalledWith(questionRequestMock.matchAccessCode);
            expect(disablePlayerSpy).toHaveBeenCalledWith({
                accessCode: questionRequestMock.matchAccessCode,
                playerName: questionRequestMock.player.name,
            });
            expect(allPlayersRespondedSpy).toHaveBeenCalledWith(questionRequestMock.matchAccessCode, questionRequestMock.questionId);
            expect(getPlayersAnswersListSpy).toHaveBeenCalled();
            expect(getMatchByAccessCodeSpy).toHaveBeenCalledWith(questionRequestMock.matchAccessCode);
            expect(playersListMock[0].isTypingQrl).toBeFalsy();
        });

        it('should handle errors', () => {
            const disablePlayerSpy = jest.spyOn(matchService, 'disablePlayer');
            disablePlayerSpy.mockImplementation(() => {
                throw new Error('error occurred while disabling a player');
            });
            try {
                gateway.disablePlayer(clientSocket, questionRequestMock);
            } catch (error) {
                expect(error).toContain('error occurred while disabling a player');
            }
        });
    });

    describe('changeChatAccessibilityHandler', () => {
        const chatAccessibilityRequestMock: ChatAccessibilityRequest = {
            matchAccessCode: 'roomIdMock',
            name: '',
            players: [],
        };
        it('should emit ChangeChatAccessibility event', () => {
            const getMatchByAccessCodeSpy = jest.spyOn(matchService, 'getMatchByAccessCode').mockReturnValue(Object.assign(MATCHES_STUB())[0]);
            const serverToSpy = jest.spyOn(server, 'to');
            serverToSpy.mockReturnValue({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.ChatAccessibilityChanged);
                },
            } as BroadcastOperator<unknown, unknown>);
            gateway.changeChatAccessibilityHandler(clientSocket, chatAccessibilityRequestMock);
            expect(serverToSpy).toHaveBeenCalledWith(chatAccessibilityRequestMock.matchAccessCode);
            expect(getMatchByAccessCodeSpy).toHaveBeenCalled();
        });

        it('should handle errors', () => {
            server.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.ChatAccessibilityChanged);
                },
            } as BroadcastOperator<unknown, unknown>);

            jest.spyOn(matchService, 'getMatchByAccessCode').mockImplementation(() => {
                throw new Error('chat accessibility not updated in server match');
            });
            try {
                gateway.changeChatAccessibilityHandler(clientSocket, chatAccessibilityRequestMock);
            } catch (error) {
                expect(error).toContain('chat accessibility not updated in server match');
            }
        });
    });

    describe('beginQrlEvaluation', () => {
        const roomMock: Room = {
            id: 'roomMock',
        };

        it('should emit QrlEvaluationBegun event', () => {
            server.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.QrlEvaluationBegun);
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.beginQrlEvaluation(clientSocket, roomMock);
        });
    });

    describe('finishQrlEvaluation', () => {
        const roomMock: Room = {
            id: 'roomMock',
        };

        it('should emit QrlEvaluationFinished event', () => {
            server.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(SocketsEmitEvents.QrlEvaluationFinished);
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.finishQrlEvaluation(clientSocket, roomMock);
        });
    });
});
