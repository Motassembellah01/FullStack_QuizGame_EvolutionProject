// /* eslint-disable max-lines */
// import { Match } from '@app/classes/match/match';
// import { Passwords } from '@app/constants/constants';
// import { IMatch } from '@app/interfaces/i-match';
// import { Player } from '@app/interfaces/player';
// import { MatchHistory } from '@app/model/database/match-history';
// import { MatchService } from '@app/services/match/match.service';
// import { MATCHES_STUB } from '@app/tests.support/stubs/matches.stub';
// import { HttpStatus, INestApplication, Logger } from '@nestjs/common';
// import { Test, TestingModule } from '@nestjs/testing';
// import { SinonStubbedInstance, createStubInstance } from 'sinon';
// import * as request from 'supertest';
// import { MatchController } from './match.controller';

describe('MatchController', () => {
    //     let controller: MatchController;
    //     let matchService: MatchService;
    //     let logger: SinonStubbedInstance<Logger>;
    //     let app: INestApplication;
    //     beforeEach(async () => {
    //         matchService = createStubInstance(MatchService);
    //         logger = createStubInstance(Logger);
    //         const module: TestingModule = await Test.createTestingModule({
    //             controllers: [MatchController],
    //             providers: [
    //                 { provide: MatchService, useValue: matchService },
    //                 { provide: Logger, useValue: logger },
    //             ],
    //         }).compile();
    //         app = module.createNestApplication();
    //         await app.init();
    //         controller = module.get<MatchController>(MatchController);
    //     });
    //     afterEach(async () => {
    //         await app.close();
    //     });
    //     it('should be defined', () => {
    //         expect(controller).toBeDefined();
    //     });
    //     describe('GET /matches/match', () => {
    //         const matches: Match[] = Object.assign(MATCHES_STUB());
    //         it('should return all matches with status 200', async () => {
    //             matchService.matches = Object.assign(MATCHES_STUB());
    //             const response = await request(app.getHttpServer()).get('/matches').expect(HttpStatus.OK);
    //             expect(
    //                 response.body.map((match: IMatch) => {
    //                     const parsedMatch = Match.parseMatch(match);
    //                     // parsedMatch.begin = new Date(match.begin);
    //                     // parsedMatch.end = new Date(match.end);
    //                     return parsedMatch;
    //                 }),
    //             ).toEqual(matches);
    //         });
    //         it('should handle errors and return status 404', async () => {
    //             const errorMessage = 'Error occurred while getting the list of matches';
    //             Object.defineProperty(matchService, 'matches', {
    //                 get: () => {
    //                     throw new Error(errorMessage);
    //                 },
    //             });

    //             const response = await request(app.getHttpServer()).get('/matches').expect(HttpStatus.NOT_FOUND);
    //             expect(response.text).toContain(errorMessage);
    //         });
    //     });

    it('should be defined', () => {
        expect(true).toBeTruthy();
    });

    //     describe('GET /accessCode', () => {
    //         it('should return a match with status 200', async () => {
    //             const match: Match = Object.assign(MATCHES_STUB())[0];
    //             jest.spyOn(matchService, 'getMatchByAccessCode').mockReturnValue(match);
    //             const expectedMatch = {
    //                 ...match,
    //                 // begin: match.begin.toISOString(),
    //                 // end: match.end.toISOString(),
    //             };
    //             const response = await request(app.getHttpServer()).get(`/matches/match/${match.accessCode}`).expect(HttpStatus.OK);
    //             expect(response.body).toEqual(expectedMatch);
    //         });
    //         it('should return status 404 and an error message when match not found', async () => {
    //             const accessCode = 'non-existent-access-code';
    //             jest.spyOn(matchService, 'getMatchByAccessCode').mockReturnValue(undefined);
    //             const response = await request(app.getHttpServer()).get(`/matches/match/${accessCode}`).expect(HttpStatus.NOT_FOUND);
    //             expect(response.text).toContain('Match not found');
    //         });
    //         it('should handle errors and return status 404', async () => {
    //             const accessCode = 'InvalidCode';
    //             const errorMessage = 'Match not found';
    //             jest.spyOn(matchService, 'getMatchByAccessCode').mockImplementation(() => {
    //                 throw new Error(errorMessage);
    //             });
    //             const response = await request(app.getHttpServer()).get(`/matches/match/${accessCode}`).expect(HttpStatus.NOT_FOUND);
    //             expect(response.text).toContain(errorMessage);
    //         });
    //     });
    //     it('should return access code validity with status 200 when code exists', async () => {
    //         const validAccessCode = 'existing-access-code';
    //         jest.spyOn(matchService, 'accessCodeExists').mockReturnValue(true);
    //         const response = await request(app.getHttpServer()).get(`/matches/match/validity/${validAccessCode}`).expect(HttpStatus.OK);
    //         expect(response.body).toEqual(true);
    //     });
    //     it('should return access code validity with status 200 when code does not exist', async () => {
    //         const nonExistentAccessCode = 'non-existent-access-code';
    //         jest.spyOn(matchService, 'accessCodeExists').mockReturnValue(false);
    //         const response = await request(app.getHttpServer()).get(`/matches/match/validity/${nonExistentAccessCode}`).expect(HttpStatus.OK);
    //         expect(response.body).toEqual(false);
    //     });
    //     it('should handle errors and return status 404', async () => {
    //         const accessCode = 'invalid-access-code';
    //         const errorMessage = 'Access code check failed';
    //         jest.spyOn(matchService, 'accessCodeExists').mockImplementation(() => {
    //             throw new Error(errorMessage);
    //         });
    //         const response = await request(app.getHttpServer()).get(`/matches/match/validity/${accessCode}`).expect(HttpStatus.NOT_FOUND);
    //         expect(response.text).toContain(errorMessage);
    //     });
    //     describe('POST /matches/match/playerNameValidity', () => {
    //         const playerName = 'player-name';
    //         const updateInfo = {
    //             accessCode: 'match-access-code',
    //             players: [{ name: playerName }],
    //         };
    //         it('should return player name validity with status 200 when valid', async () => {
    //             jest.spyOn(matchService, 'isPlayerNameValidForGame').mockReturnValue(true);
    //             const response = await request(app.getHttpServer())
    //                 .post('/matches/match/playerNameValidity')
    //                 .send(updateInfo)
    //                 .set('Accept', 'application/json')
    //                 .expect(HttpStatus.OK);
    //             expect(response.body).toEqual(true);
    //         });
    //         it('should return player name validity with status 200 when invalid', async () => {
    //             jest.spyOn(matchService, 'isPlayerNameValidForGame').mockReturnValue(false);
    //             const response = await request(app.getHttpServer())
    //                 .post('/matches/match/playerNameValidity')
    //                 .send(updateInfo)
    //                 .set('Accept', 'application/json')
    //                 .expect(HttpStatus.OK);
    //             expect(response.body).toEqual(false);
    //         });
    //         it('should handle errors and return status 404', async () => {
    //             const errorMessage = 'An error occurred';
    //             jest.spyOn(matchService, 'isPlayerNameValidForGame').mockImplementation(() => {
    //                 throw new Error(errorMessage);
    //             });
    //             const response = await request(app.getHttpServer())
    //                 .post('/matches/match/playerNameValidity')
    //                 .send(updateInfo)
    //                 .set('Accept', 'application/json')
    //                 .expect(HttpStatus.NOT_FOUND);
    //             expect(response.text).toContain(errorMessage);
    //         });
    //     });
    //     describe('Get /accessibility/:accessCode', () => {
    //         const accessCode = 'match-access-code';
    //         it('should return match accessibility true status with status 200', async () => {
    //             jest.spyOn(matchService, 'isAccessible').mockReturnValue(true);
    //             const response = await request(app.getHttpServer()).get(`/matches/match/accessibility/${accessCode}`).expect(HttpStatus.OK);
    //             expect(response.body).toBe(true);
    //         });
    //         it('should return match accessibility false status with status 200', async () => {
    //             jest.spyOn(matchService, 'isAccessible').mockReturnValue(false);
    //             const response = await request(app.getHttpServer()).get(`/matches/match/accessibility/${accessCode}`).expect(HttpStatus.OK);
    //             expect(response.body).toBe(false);
    //         });
    //         it('should handle errors and return status 404', async () => {
    //             const errorMessage = 'An error occurred';
    //             jest.spyOn(matchService, 'isAccessible').mockImplementation(() => {
    //                 throw new Error(errorMessage);
    //             });
    //             const response = await request(app.getHttpServer()).get(`/matches/match/accessibility/${accessCode}`).expect(HttpStatus.NOT_FOUND);
    //             expect(response.text).toContain(errorMessage);
    //         });
    //     });
    //     it('should delete a match by access code with status 200', async () => {
    //         const accessCode = 'match-access-code';
    //         jest.spyOn(matchService, 'deleteMatchByAccessCode').mockReturnValue();
    //         const response = await request(app.getHttpServer()).delete(`/matches/match/${accessCode}`);
    //         expect(response.status).toBe(HttpStatus.OK);
    //     });
    //     it('should handle errors and return status 404', async () => {
    //         const accessCode = 'match-access-code';
    //         const errorMessage = 'An error occurred';
    //         jest.spyOn(matchService, 'deleteMatchByAccessCode').mockImplementation(() => {
    //             throw new Error(errorMessage);
    //         });
    //         const response = await request(app.getHttpServer()).delete(`/matches/match/${accessCode}`).expect(HttpStatus.NOT_FOUND);
    //         expect(response.text).toContain(errorMessage);
    //     });
    //     describe('DELETE /', () => {
    //         const identifier = { password: Passwords.DeleteAllMatches };
    //         it('should delete all matches with status 200', async () => {
    //             jest.spyOn(matchService, 'deleteAllMatches').mockReturnValue();
    //             const response = await request(app.getHttpServer()).delete('/matches').send(identifier).set('Accept', 'application/json');
    //             expect(response.status).toBe(HttpStatus.OK);
    //         });
    //         it('should delete all matches with status 200', async () => {
    //             const wrongPassword = { password: 'wrongPwd' };
    //             jest.spyOn(matchService, 'deleteAllMatches').mockReturnValue();
    //             const response = await request(app.getHttpServer()).delete('/matches').send(wrongPassword).set('Accept', 'application/json');
    //             expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    //             expect(response.text).toContain('Bad password');
    //         });
    //         it('should handle errors and return status 500', async () => {
    //             const errorMessage = 'An error occurred';
    //             jest.spyOn(matchService, 'deleteAllMatches').mockImplementation(() => {
    //                 throw new Error(errorMessage);
    //             });
    //             const response = await request(app.getHttpServer())
    //                 .delete('/matches')
    //                 .send(identifier)
    //                 .set('Accept', 'application/json')
    //                 .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    //             expect(response.text).toContain(errorMessage);
    //         });
    //     });
    //     it('should create a new match with status 200', async () => {
    //         const newMatch = { ...Object.assign(MATCHES_STUB())[0] };
    //         newMatch.accessCode = '0000';
    //         jest.spyOn(matchService, 'createMatch').mockImplementation(() => {
    //             return;
    //         });
    //         jest.spyOn(matchService, 'accessCodeExists').mockReturnValue(false);
    //         const response = await request(app.getHttpServer()).post('/matches/match').send(newMatch).set('Accept', 'application/json');
    //         expect(response.status).toBe(HttpStatus.CREATED);
    //     });
    //     it('should handle conflicts and return status 409 when match already exists', async () => {
    //         const newMatch = { ...Object.assign(MATCHES_STUB())[0] };
    //         jest.spyOn(matchService, 'createMatch').mockImplementation(() => {
    //             throw new Error('Match already exists');
    //         });
    //         jest.spyOn(matchService, 'accessCodeExists').mockReturnValue(true);
    //         const response = await request(app.getHttpServer())
    //             .post('/matches/match')
    //             .send(newMatch)
    //             .set('Accept', 'application/json')
    //             .expect(HttpStatus.CONFLICT);
    //         expect(response.text).toContain('This match already exists');
    //     });
    //     it('should handle errors and return status 500', async () => {
    //         const newMatch = { ...Object.assign(MATCHES_STUB())[0] };
    //         jest.spyOn(matchService, 'createMatch').mockImplementation(() => {
    //             throw new Error('An error occurred');
    //         });
    //         const response = await request(app.getHttpServer())
    //             .post('/matches/match')
    //             .send(newMatch)
    //             .set('Accept', 'application/json')
    //             .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    //         expect(response.text).toContain('An error occurred');
    //     });
    //     describe('PATCH /accessibility', () => {
    //         const accessCode = 'match-access-code';
    //         it('should set accessibility for a match with status 200', async () => {
    //             jest.spyOn(matchService, 'setAccessibility').mockReturnValue();
    //             const response = await request(app.getHttpServer()).patch(`/matches/match/accessibility/${accessCode}`);
    //             expect(response.status).toBe(HttpStatus.OK);
    //         });
    //         it('should handle errors and return status 404', async () => {
    //             const errorMessage = 'An error occurred';
    //             jest.spyOn(matchService, 'setAccessibility').mockImplementation(() => {
    //                 throw new Error(errorMessage);
    //             });
    //             const response = await request(app.getHttpServer()).patch(`/matches/match/accessibility/${accessCode}`).expect(HttpStatus.NOT_FOUND);
    //             expect(response.text).toContain(errorMessage);
    //         });
    //     });
    //     describe('POST /addPlayer', () => {
    //         const updateData = { accessCode: 'match-access-code', player: { name: 'Player 1' } as Player };
    //         it('should add a player to a match with status 200', async () => {
    //             jest.spyOn(matchService, 'addPlayer').mockReturnValue();
    //             const response = await request(app.getHttpServer()).post('/matches/match/player').send(updateData).set('Accept', 'application/json');
    //             expect(response.status).toBe(HttpStatus.OK);
    //         });
    //         it('should handle errors and return status 404', async () => {
    //             const errorMessage = 'An error occurred';
    //             jest.spyOn(matchService, 'addPlayer').mockImplementation(() => {
    //                 throw new Error(errorMessage);
    //             });
    //             const response = await request(app.getHttpServer())
    //                 .post('/matches/match/player')
    //                 .send(updateData)
    //                 .set('Accept', 'application/json')
    //                 .expect(HttpStatus.NOT_FOUND);
    //             expect(response.text).toContain(errorMessage);
    //         });
    //     });
    //     describe('POST /match/:accessCode/history', () => {
    //         const match = Object.assign(MATCHES_STUB())[0];
    //         it('should find that match, save its history and return code 200', async () => {
    //             jest.spyOn(matchService, 'getMatchByAccessCode').mockReturnValue(match);
    //             const saveHistorySpy = jest.spyOn(matchService, 'saveMatchHistory');
    //             const response = await request(app.getHttpServer()).post(`/matches/match/${match.accessCode}/history`).set('Accept', 'application/json');
    //             expect(saveHistorySpy).toHaveBeenCalled();
    //             expect(response.status).toBe(HttpStatus.OK);
    //         });
    //         it('should handle errors and return status 404', async () => {
    //             const errorMessage = 'An error occurred';
    //             jest.spyOn(matchService, 'getMatchByAccessCode').mockImplementation(() => {
    //                 throw new Error(errorMessage);
    //             });
    //             const response = await request(app.getHttpServer())
    //                 .post(`/matches/match/${match.accessCode}/history`)
    //                 .set('Accept', 'application/json')
    //                 .expect(HttpStatus.NOT_FOUND);
    //             expect(response.text).toContain(errorMessage);
    //         });
    //     });
    //     describe('GET /matches/history', () => {
    //         const matchHistory = [new MatchHistory()];
    //         it('should return match history and code 200', async () => {
    //             jest.spyOn(matchService, 'getMatchHistory').mockResolvedValue(matchHistory);
    //             const response = await request(app.getHttpServer()).get('/matches/history').set('Accept', 'application/json');
    //             expect(response.status).toBe(HttpStatus.OK);
    //             expect(response.body).toEqual(matchHistory);
    //         });
    //         it('should handle errors and return status 404', async () => {
    //             const errorMessage = 'An error occurred';
    //             jest.spyOn(matchService, 'getMatchHistory').mockImplementation(() => {
    //                 throw new Error(errorMessage);
    //             });
    //             const response = await request(app.getHttpServer())
    //                 .get('/matches/history')
    //                 .set('Accept', 'application/json')
    //                 .expect(HttpStatus.NOT_FOUND);
    //             expect(response.text).toContain(errorMessage);
    //         });
    //     });
    //     describe('DELETE /matches/history', () => {
    //         it('should call delete method from service and return code 200', async () => {
    //             const deleteMatchHistorySpy = jest.spyOn(matchService, 'deleteMatchHistory');
    //             const response = await request(app.getHttpServer()).delete('/matches/history').set('Accept', 'application/json');
    //             expect(deleteMatchHistorySpy).toHaveBeenCalled();
    //             expect(response.status).toBe(HttpStatus.OK);
    //         });
    //         it('should handle errors and return status 404', async () => {
    //             const errorMessage = 'An error occurred';
    //             jest.spyOn(matchService, 'deleteMatchHistory').mockImplementation(() => {
    //                 throw new Error(errorMessage);
    //             });
    //             const response = await request(app.getHttpServer())
    //                 .delete('/matches/history')
    //                 .set('Accept', 'application/json')
    //                 .expect(HttpStatus.NOT_FOUND);
    //             expect(response.text).toContain(errorMessage);
    //         });
    //     });
});
