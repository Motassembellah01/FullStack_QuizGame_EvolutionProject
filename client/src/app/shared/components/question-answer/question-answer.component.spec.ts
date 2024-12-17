/* eslint-disable max-lines */
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Question } from '@app/core/classes/question/question';
import { ERRORS, QUESTION_TYPE, SocketsSendEvents } from '@app/core/constants/constants';
import { EXAMPLES, OPTIONS, QRL_QUESTIONS, QUESTIONS } from '@app/core/data/data';
import { Choice } from '@app/core/interfaces/choice';
import { PlayerAnswers } from '@app/core/interfaces/player-answers';
import { UpdateAnswerRequest } from '@app/core/interfaces/update-answer-request';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { QuestionEvaluationService } from '@app/core/services/question-evaluation/question-evaluation.service';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';
import { TimeService } from '@app/core/websocket/services/time-service/time.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuestionAnswerComponent } from './question-answer.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
describe('QuestionAnswerComponent', () => {
    let component: QuestionAnswerComponent;
    let fixture: ComponentFixture<QuestionAnswerComponent>;
    let matchPlayerServiceSpy: jasmine.SpyObj<MatchPlayerService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let timeServiceSpy: jasmine.SpyObj<TimeService>;
    let questionEvaluationServiceSpy: jasmine.SpyObj<QuestionEvaluationService>;
    const mockQcmQuestion: Question = QUESTIONS.map((obj) => Object.assign({ ...obj }))[0];
    const mockQrlQuestion: Question = QRL_QUESTIONS.map((obj) => Object.assign({ ...obj }))[0];
    const mockChoice: Choice = OPTIONS.map((obj) => Object.assign({ ...obj }))[0];
    const mockPlayerAnswers: PlayerAnswers = {
        name: 'Test',
        lastAnswerTime: '',
        final: false,
        questionId: '0',
        obtainedPoints: 0,
        qcmAnswers: [],
        qrlAnswer: '',
        isTypingQrl: false,
    };
    beforeEach(() => {
        timeServiceSpy = jasmine.createSpyObj('TimeService', ['timer', 'fiveSecondInterval$', 'stopServerTimer', 'startHistogramTimer']);
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['send']);
        questionEvaluationServiceSpy = jasmine.createSpyObj('QuestionEvaluationService', ['currentPlayerAnswer']);
        matchPlayerServiceSpy = jasmine.createSpyObj('MatchPlayerService', [
            'isTyping',
            'showingResults',
            'isFinalCurrentAnswer',
            'isChoiceSelected',
            'match',
            'updateCurrentAnswer',
            'setCurrentAnswersAsFinal',
            'updatePlayerAnswers',
            'showResults',
            'getCurrentAnswersIndex',
            'evaluateCurrentQuestion',
            'player',
            'getCurrentQuestion',
            'updateTypingState',
        ]);
        TestBed.configureTestingModule({
            declarations: [],
            imports: [AppMaterialModule, QuestionAnswerComponent, CommonModule, FormsModule],
            providers: [
                { provide: MatchPlayerService, useValue: matchPlayerServiceSpy },
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: TimeService, useValue: timeServiceSpy },
                { provide: QuestionEvaluationService, useValue: questionEvaluationServiceSpy },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });
        fixture = TestBed.createComponent(QuestionAnswerComponent);
        component = fixture.componentInstance;
        matchPlayerServiceSpy.currentQuestion = Object.assign(mockQcmQuestion) as Question;
        matchPlayerServiceSpy.match.playerAnswers = [mockPlayerAnswers].map((obj) => Object.assign({ ...obj }));
        matchPlayerServiceSpy.timeService = timeServiceSpy;
        component.matchSrv = matchPlayerServiceSpy;
    });
    describe('creation', () => {
        it('should create and set sendButtonDisabled to true if matchPlayerService.showingResults', () => {
            matchPlayerServiceSpy.showingResults = true;
            fixture.detectChanges();
            expect(component).toBeTruthy();
            expect(component.question).toEqual(mockQcmQuestion as Question);
            expect(component.sendButtonDisabled).toBe(true);
        });
        it('should create and set sendButtonDisabled to false if not matchPlayerService.showingResults', () => {
            matchPlayerServiceSpy.showingResults = false;
            fixture.detectChanges();
            expect(component).toBeTruthy();
            expect(component.question).toEqual(mockQcmQuestion as Question);
            expect(component.sendButtonDisabled).toBe(false);
        });
        it('should call buttonDetect if sendEvent is defined', () => {
            component.sendEvent = new EventEmitter<void>();
            spyOn(component, 'buttonDetect');
            fixture.detectChanges();
            component.sendEvent.subscribe((event: KeyboardEvent) => {
                expect(component.buttonDetect).toHaveBeenCalledWith(event);
            });
            component.sendEvent.emit();
            expect(component.sendEvent).toBeDefined();
        });
    });
    describe('destruction', () => {
        it('should call onSend on destruction if it is a qrl question', () => {
            matchPlayerServiceSpy.getCurrentQuestion.type = QUESTION_TYPE.qrl;
            component.finalAnswer = true;
            const spy = spyOn(component, 'onSend').and.stub();
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalled();
        });
    });
    describe('buttonDetect', () => {
        beforeEach(() => {
            matchPlayerServiceSpy.isTyping = false;
            fixture.detectChanges();
            spyOn(component, 'onSelect');
            spyOn(component, 'onSend');
        });
        it('should call onSend when Enter button is pressed', () => {
            component.sendButtonDisabled = false;
            const keyTest = 'Enter';
            const buttonEvent = {
                key: keyTest,
            } as KeyboardEvent;
            component.buttonDetect(buttonEvent);
            expect(component.onSend).toHaveBeenCalled();
        });
        it('should call onSelect when a valid QCM choice number button is pressed', () => {
            component.sendButtonDisabled = false;
            const keyTest = '1';
            const buttonEvent = {
                key: keyTest,
            } as KeyboardEvent;
            component.buttonDetect(buttonEvent);
            expect(component.onSelect).toHaveBeenCalled();
            expect(component.onSend).not.toHaveBeenCalled();
        });
        it('should not call onSelect when the QCM choice number button pressed is not valid', () => {
            const keyTest = '5';
            const buttonEvent = {
                key: keyTest,
            } as KeyboardEvent;
            component.buttonDetect(buttonEvent);
            expect(component.onSelect).not.toHaveBeenCalled();
        });
        it('should not call onSend or onSelect if isTyping is true', () => {
            matchPlayerServiceSpy.isTyping = true;
            expect(component.onSelect).not.toHaveBeenCalled();
            expect(component.onSend).not.toHaveBeenCalled();
        });
    });
    describe('getOptionBackgroundColor', () => {
        it('should call isFinalCurrentAnswer and isChoiceSelected when showingResults is false', () => {
            matchPlayerServiceSpy.showingResults = false;
            component.getOptionBackgroundColor({ text: 'choice', isCorrect: true });
            expect(matchPlayerServiceSpy.isFinalCurrentAnswer).toHaveBeenCalled();
            expect(matchPlayerServiceSpy.isChoiceSelected).toHaveBeenCalled();
        });
        it('should return background-yellow-border when isFinalCurrentAnswer is true and isChoiceSelected is true', () => {
            matchPlayerServiceSpy.isFinalCurrentAnswer.and.returnValue(true);
            matchPlayerServiceSpy.isChoiceSelected.and.returnValue(true);
            const colorBg = component.getOptionBackgroundColor({ text: 'choice', isCorrect: true });
            expect(colorBg).toEqual('background-yellow-border');
        });
        it('should return gray-bg when isFinalCurrentAnswer is true and isChoiceSelected is false', () => {
            matchPlayerServiceSpy.isFinalCurrentAnswer.and.returnValue(true);
            matchPlayerServiceSpy.isChoiceSelected.and.returnValue(false);
            const colorBg = component.getOptionBackgroundColor({ text: 'choice', isCorrect: false });
            expect(colorBg).toEqual('gray-bg');
        });
        it('should return background-yellow-border when isFinalCurrentAnswer is false and isChoiceSelected is true', () => {
            matchPlayerServiceSpy.isFinalCurrentAnswer.and.returnValue(false);
            matchPlayerServiceSpy.isChoiceSelected.and.returnValue(true);
            const colorBg = component.getOptionBackgroundColor({ text: 'choice', isCorrect: true });
            expect(colorBg).toEqual('background-yellow-border');
        });
        it('should return yellow-bg when isFinalCurrentAnswer is false and isChoiceSelected is false', () => {
            matchPlayerServiceSpy.isFinalCurrentAnswer.and.returnValue(false);
            matchPlayerServiceSpy.isChoiceSelected.and.returnValue(false);
            const colorBg = component.getOptionBackgroundColor({ text: 'choice', isCorrect: false });
            expect(colorBg).toEqual('yellow-bg');
        });
    });
    describe('onSelect', () => {
        it('should call isFinalCurrentAnswer when sendButtonDisabled is false', () => {
            matchPlayerServiceSpy.match.timer = 60;
            component.sendButtonDisabled = false;
            component.onSelect(mockChoice);
            expect(matchPlayerServiceSpy.isFinalCurrentAnswer).toHaveBeenCalled();
        });
        it('should call updateAnswer when sendButtonDisabled, timer <= 0, isFinalCurrentAnswer and showing results are false', () => {
            matchPlayerServiceSpy.match.timer = 60;
            component.sendButtonDisabled = false;
            matchPlayerServiceSpy.isFinalCurrentAnswer.and.returnValue(false);
            matchPlayerServiceSpy.showingResults = false;
            component.onSelect(mockChoice);
            expect(matchPlayerServiceSpy.updateCurrentAnswer).toHaveBeenCalledWith(mockChoice);
        });
        it('should not call updateAnswer or isFinalCurrentAnswer when sendButtonDisabled is true', () => {
            component.sendButtonDisabled = true;
            component.onSelect(mockChoice);
            expect(matchPlayerServiceSpy.updateCurrentAnswer).not.toHaveBeenCalled();
            expect(matchPlayerServiceSpy.isFinalCurrentAnswer).not.toHaveBeenCalled();
        });
        it('should not call updateAnswer when matchPlayerService.match.timer is less or equal to 0', () => {
            matchPlayerServiceSpy.match.timer = 0;
            component.onSelect(mockChoice);
            expect(matchPlayerServiceSpy.updateCurrentAnswer).not.toHaveBeenCalled();
        });
        it('should not call updateAnswer when matchPlayerService.isFinalCurrentAnswer returns true', () => {
            matchPlayerServiceSpy.match.timer = 60;
            matchPlayerServiceSpy.isFinalCurrentAnswer.and.returnValue(true);
            component.onSelect(mockChoice);
            expect(matchPlayerServiceSpy.updateCurrentAnswer).not.toHaveBeenCalled();
        });
        it('should not call updateAnswer when matchPlayerService.showingResults is true', () => {
            matchPlayerServiceSpy.match.timer = 60;
            matchPlayerServiceSpy.showingResults = true;
            component.onSelect(mockChoice);
            expect(matchPlayerServiceSpy.updateCurrentAnswer).not.toHaveBeenCalled();
        });
    });
    describe('onSend', () => {
        beforeEach(() => {
            component.sendButtonDisabled = false;
            spyOn(component, 'updatePlayerAnswers');
        });
        it('should call setCurrentAnswersAsFinal if sendButtonDisabled is false', () => {
            component.onSend();
            expect(matchPlayerServiceSpy.setCurrentAnswersAsFinal).toHaveBeenCalled();
        });
        it('should call setCurrentAnswersAsFinal if sendButtonDisabled is false', () => {
            component.onSend(true);
            expect(component.updatePlayerAnswers).toHaveBeenCalledWith(false);
        });
        it('should call showResults when matchPlayerService.match.testing is true', () => {
            matchPlayerServiceSpy.match.testing = true;
            component.onSend();
            expect(matchPlayerServiceSpy.showResults).toHaveBeenCalled();
            expect(component.updatePlayerAnswers).not.toHaveBeenCalled();
        });
        it('should call updatePlayerAnswers when calling onSend and matchPlayerService.match.testing is false', () => {
            matchPlayerServiceSpy.match.testing = false;
            component.onSend();
            expect(component.updatePlayerAnswers).toHaveBeenCalled();
            expect(matchPlayerServiceSpy.showResults).not.toHaveBeenCalled();
        });
        it('should not call setCurrentAnswersAsFinal, updatePlayerAnswers or showResults if sendButtonDisabled', () => {
            component.sendButtonDisabled = true;
            component.onSend();
            expect(matchPlayerServiceSpy.setCurrentAnswersAsFinal).not.toHaveBeenCalled();
            expect(component.updatePlayerAnswers).not.toHaveBeenCalled();
            expect(matchPlayerServiceSpy.showResults).not.toHaveBeenCalled();
        });
    });
    describe('onTextAreaChange', () => {
        it('should set matchPlayerService.isTypingQrl to true and call updateTypingState(true) if isFirstAttempt', () => {
            component.qrlAnswer = EXAMPLES.playerAnswer;
            component.isFirstAttempt = true;
            component.onTextAreaChange();
            expect(matchPlayerServiceSpy.isTypingQrl).toBeTrue();
            expect(component.isFirstAttempt).toBeFalse();
            expect(matchPlayerServiceSpy.qrlAnswer).toEqual(EXAMPLES.playerAnswer);
            expect(matchPlayerServiceSpy.updateTypingState).toHaveBeenCalledWith(true);
        });
        it('should matchPlayerService.isTypingQrl to true and call updateTypingState(false) if !isFirstAttempt and !isTypingQrl', () => {
            component.qrlAnswer = EXAMPLES.playerAnswer;
            component.isFirstAttempt = false;
            matchPlayerServiceSpy.isTypingQrl = false;
            component.onTextAreaChange();
            expect(matchPlayerServiceSpy.isTypingQrl).toBeTrue();
            expect(matchPlayerServiceSpy.updateTypingState).toHaveBeenCalledWith(false);
        });
        it('should call startHistogramTimer and histogramTimerCallbackAction if !isFirstAttempt and isTypingQrl', () => {
            component.qrlAnswer = EXAMPLES.playerAnswer;
            component.isFirstAttempt = false;
            matchPlayerServiceSpy.isTypingQrl = true;
            matchPlayerServiceSpy.currentQuestion = mockQrlQuestion;
            matchPlayerServiceSpy.match.accessCode = EXAMPLES.accessCode;
            spyOn(component, 'histogramTimerCallbackAction').and.stub();
            component.onTextAreaChange();
            expect(matchPlayerServiceSpy.isTypingQrl).toBeTrue();
            expect(timeServiceSpy.startHistogramTimer).toHaveBeenCalled();
        });
    });
    describe('histogramTimerCallbackAction', () => {
        it('should set matchPlayerService.isTypingQrl to false and call updateTypingState(true)', () => {
            component.histogramTimerCallbackAction();
            expect(matchPlayerServiceSpy.isTypingQrl).toBeFalse();
            expect(matchPlayerServiceSpy.updateTypingState).toHaveBeenCalledWith(true);
        });
    });
    describe('updatePlayerAnswers', () => {
        beforeEach(() => {
            timeServiceSpy.timer = 2;
            matchPlayerServiceSpy.match.playerAnswers = [mockPlayerAnswers].map((obj) => Object.assign({ ...obj }));
            spyOn(component, 'sendUpdatedAnswers').and.stub();
        });
        it('should call sendUpdatedAnswers if getCurrentAnswersIndex return value is !== -1', () => {
            matchPlayerServiceSpy.getCurrentAnswersIndex.and.returnValue(0);
            component.updatePlayerAnswers();
            expect(matchPlayerServiceSpy.getCurrentAnswersIndex).toHaveBeenCalled();
            expect(component.sendUpdatedAnswers).toHaveBeenCalled();
        });
        it('should call set lastAnswerTime and obtainedPoints if index is !== -1 and it is a qcm question', () => {
            matchPlayerServiceSpy.getCurrentAnswersIndex.and.returnValue(0);
            matchPlayerServiceSpy.currentQuestion = Object.assign(mockQcmQuestion);
            matchPlayerServiceSpy.match.playerAnswers[0].obtainedPoints = 0;
            matchPlayerServiceSpy.evaluateCurrentQuestion.and.returnValue(true);
            component.updatePlayerAnswers();
            expect(matchPlayerServiceSpy.match.playerAnswers[0].obtainedPoints).toEqual(mockQcmQuestion.points);
            matchPlayerServiceSpy.evaluateCurrentQuestion.and.returnValue(false);
            matchPlayerServiceSpy.match.playerAnswers = [mockPlayerAnswers].map((obj) => Object.assign({ ...obj }));
            matchPlayerServiceSpy.currentQuestion = Object.assign(mockQcmQuestion);
            component.updatePlayerAnswers();
            expect(matchPlayerServiceSpy.match.playerAnswers[0].obtainedPoints).toEqual(0);
            expect(matchPlayerServiceSpy.match.playerAnswers[0].lastAnswerTime).toEqual(timeServiceSpy.timer.toString());
        });
        it('should set questionEvaluation.currentPlayerAnswer and qrlAnswer if index is !== -1 and it is a qrl question', () => {
            matchPlayerServiceSpy.getCurrentAnswersIndex.and.returnValue(0);
            matchPlayerServiceSpy.currentQuestion = Object.assign(mockQrlQuestion);
            component.qrlAnswer = EXAMPLES.playerAnswer;
            component.updatePlayerAnswers();
            expect(matchPlayerServiceSpy.match.playerAnswers[0].qrlAnswer).toEqual(EXAMPLES.playerAnswer);
            expect(questionEvaluationServiceSpy.currentPlayerAnswer).toEqual(EXAMPLES.playerAnswer);
        });
        it('should call createPlayerAnswersAndSend if getCurrentAnswersIndex return value is === -1', () => {
            spyOn(component, 'createPlayerAnswersAndSend');
            matchPlayerServiceSpy.getCurrentAnswersIndex.and.returnValue(ERRORS.noIndexFound);
            component.updatePlayerAnswers();
            expect(matchPlayerServiceSpy.getCurrentAnswersIndex).toHaveBeenCalled();
            expect(component.createPlayerAnswersAndSend).toHaveBeenCalled();
        });
    });
    describe('sendUpdatedAnswers', () => {
        it('should send a request to set final answer', () => {
            const mockData: UpdateAnswerRequest = {
                matchAccessCode: EXAMPLES.accessCode,
                playerAnswers: Object.assign(mockPlayerAnswers),
            };
            matchPlayerServiceSpy.match.accessCode = EXAMPLES.accessCode;
            socketServiceSpy.send.and.callFake((event: string, data: unknown) => {
                expect(event).toEqual(SocketsSendEvents.SetFinalAnswer);
                expect(data).toEqual(mockData);
            });
            matchPlayerServiceSpy.socketService = socketServiceSpy;
            component.sendUpdatedAnswers(Object.assign(mockPlayerAnswers));
            expect(socketServiceSpy.send).toHaveBeenCalledWith(SocketsSendEvents.SetFinalAnswer, mockData);
        });
    });
    describe('createPlayerAnswersAndSend', () => {
        it('should send a request to set final answer', () => {
            const expectedPlayerAnswers: PlayerAnswers = {
                name: matchPlayerServiceSpy.player.name,
                questionId: matchPlayerServiceSpy.currentQuestion.id,
                lastAnswerTime: '',
                final: false,
                obtainedPoints: 0,
                qcmAnswers: [],
                qrlAnswer: '',
                isTypingQrl: false,
            };
            const mockData: UpdateAnswerRequest = {
                matchAccessCode: EXAMPLES.accessCode,
                playerAnswers: expectedPlayerAnswers,
            };
            matchPlayerServiceSpy.match.accessCode = EXAMPLES.accessCode;
            socketServiceSpy.send.and.callFake((event: string, data: unknown) => {
                expect(event).toEqual(SocketsSendEvents.SetFinalAnswer);
                expect(data).toEqual(mockData);
            });
            matchPlayerServiceSpy.socketService = socketServiceSpy;
            component.createPlayerAnswersAndSend();
            expect(socketServiceSpy.send).toHaveBeenCalledWith(SocketsSendEvents.SetFinalAnswer, mockData);
        });
    });
    describe('getAnswerIcon', () => {
        it('should return done if right choice ', () => {
            const iconName = component.getAnswerIcon({
                text: '',
                isCorrect: true,
            });
            expect(iconName).toEqual('done');
        });

        it('should return clear if not right choice ', () => {
            const iconName = component.getAnswerIcon({
                text: '',
                isCorrect: false,
            });
            expect(iconName).toEqual('clear');
        });
    });
});
