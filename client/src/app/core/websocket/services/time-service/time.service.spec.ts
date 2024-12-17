import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DURATIONS, SocketsOnEvents, SocketsSendEvents } from '@app/core/constants/constants';
import { StopServerTimerRequest } from '@app/core/interfaces/stop-server-timer-request';
import { TimerRequest } from '@app/core/interfaces/timer-request';
import { JoinMatchService } from '@app/core/services/join-match/join-match.service';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';
import { TimeService } from '@app/core/websocket/services/time-service/time.service';

describe('TimeService', () => {
    let service: TimeService;
    let spySocketService: jasmine.SpyObj<SocketService>;
    let spyJoinMatchService: jasmine.SpyObj<JoinMatchService>;
    const mockMatchAccessCode = '1234';

    beforeEach(() => {
        spySocketService = jasmine.createSpyObj('SocketService', ['send', 'on', 'removeListener']);
        spyJoinMatchService = jasmine.createSpyObj('JoinMatchService', ['playerName']);
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                { provide: SocketService, useValue: spySocketService },
                { provide: JoinMatchService, useValue: spyJoinMatchService },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });
        service = TestBed.inject(TimeService);
    });

    describe('creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('resumeTimer', () => {
        it('should relaunch timer', () => {
            const actionSpy = jasmine.createSpy('actionSpy');
            const startTimerSpy = spyOn(service, 'startTimer');
            service.resumeTimer(mockMatchAccessCode, actionSpy);
            expect(startTimerSpy).toHaveBeenCalledWith(0, mockMatchAccessCode, actionSpy);
        });
    });

    describe('get', () => {
        it('getter should return service.counter value', () => {
            const counter = service.timer;
            expect(counter).toEqual(0);
        });
    });

    describe('set', () => {
        it('setter should call stopTimer if counter is null', () => {
            spyOn(service, 'stopTimer');
            service.timer = 0;
            expect(service.stopTimer).toHaveBeenCalled();
        });

        it('setter should set service.counter value', () => {
            service.timer = 2;
            expect(service.timer).toEqual(2);
        });
    });

    describe('startTimer', () => {
        const mockStartValue = 10;
        const mockTimerRequest: TimerRequest = {
            roomId: mockMatchAccessCode,
            timer: 20,
        };
        const actionSpy = jasmine.createSpy('actionSpy');
        const mockData: TimerRequest = {
            roomId: mockMatchAccessCode,
            timer: mockStartValue,
            timeInterval: DURATIONS.timerInterval,
        };
        it('startTimer should send a request to start the timer if playerName is undefined', () => {
            spyJoinMatchService.playerName = undefined as unknown as string;
            service.startTimer(mockStartValue, mockMatchAccessCode, actionSpy);
            expect(spySocketService.send).toHaveBeenCalledWith(SocketsSendEvents.StartTimer, mockData);
        });

        it('startTimer should not send a request to start the timer if playerName is not undefined', () => {
            spyJoinMatchService.playerName = 'Test';
            service.startTimer(mockStartValue, mockMatchAccessCode, actionSpy);
            expect(spySocketService.send).not.toHaveBeenCalled();
        });

        it('startTimer should add an event listener to update the counter', () => {
            service.startTimer(mockStartValue, mockMatchAccessCode, actionSpy);
            expect(spySocketService.on).toHaveBeenCalledWith(SocketsOnEvents.NewTime, jasmine.any(Function));

            const newTimeCallback = spySocketService.on.calls.argsFor(0)[1];
            newTimeCallback(mockTimerRequest);
            expect(service.timer).toEqual(mockTimerRequest.timer);
        });

        it('startTimer should call removeListener if timer counter is less than 1', () => {
            service.startTimer(mockStartValue, mockMatchAccessCode, actionSpy);

            const newTimeCallback = spySocketService.on.calls.argsFor(0)[1];
            newTimeCallback({
                roomId: mockMatchAccessCode,
                timer: 0,
            });
            expect(service.timer).toEqual(0);
            expect(spySocketService.removeListener).toHaveBeenCalled();
            expect(actionSpy).toHaveBeenCalled();
        });

        it('startTimer should not call removeListener if timer counter is greater or equal to 1', () => {
            service.startTimer(mockStartValue, mockMatchAccessCode, actionSpy);

            const newTimeCallback = spySocketService.on.calls.argsFor(0)[1];
            newTimeCallback(mockTimerRequest);
            expect(service.timer).toEqual(mockTimerRequest.timer);
            expect(spySocketService.removeListener).not.toHaveBeenCalled();
        });
    });

    describe('startHistogramTimer', () => {
        const mockTimerRequest: TimerRequest = {
            roomId: mockMatchAccessCode,
            timer: 0,
            timeInterval: DURATIONS.timerInterval,
        };
        const actionSpy = jasmine.createSpy('actionSpy');
        it('should send a request to start histogram timer', () => {
            service.startHistogramTimer(mockMatchAccessCode, actionSpy);
            expect(spySocketService.send).toHaveBeenCalledWith(SocketsSendEvents.HistogramTime, mockTimerRequest);
        });

        it('startTimer should add an event listener to update the qrl histogram counter', () => {
            service.startHistogramTimer(mockMatchAccessCode, actionSpy);
            expect(spySocketService.on).toHaveBeenCalledWith(SocketsOnEvents.HistogramTime, jasmine.any(Function));

            const newTimeCallback = spySocketService.on.calls.argsFor(0)[1];
            newTimeCallback(mockTimerRequest);
            expect(service.timer).toEqual(mockTimerRequest.timer);
        });

        it('startTimer should call the callback action if timer counter is equal to 5', () => {
            service.startHistogramTimer(mockMatchAccessCode, actionSpy);

            const newTimeCallback = spySocketService.on.calls.argsFor(0)[1];
            newTimeCallback({
                roomId: mockMatchAccessCode,
                timer: 5,
            });
            expect(actionSpy).toHaveBeenCalled();
        });
    });

    describe('stopServerTimer', () => {
        it('stopServerTimer should send a request to stop the timer', () => {
            const mockData: StopServerTimerRequest = {
                roomId: mockMatchAccessCode,
                isHistogramTimer: false,
            };
            service.stopServerTimer(mockMatchAccessCode);
            expect(spySocketService.send).toHaveBeenCalledWith(SocketsSendEvents.StopTimer, mockData);
        });
    });

    describe('stopTimer', () => {
        it('stopTimer should call removeListener', () => {
            service.stopTimer();
            expect(spySocketService.removeListener).toHaveBeenCalledWith(SocketsOnEvents.NewTime);
        });
    });

    describe('startPanicModeTimer', () => {
        const mockStartValue = 0;
        const mockData: TimerRequest = {
            roomId: mockMatchAccessCode,
            timer: mockStartValue,
            timeInterval: DURATIONS.panicModeInterval,
        };
        it('should launch timer with good interval', () => {
            service.joinMatchService.playerName = '';
            service.startPanicModeTimer(mockMatchAccessCode);
            expect(spySocketService.send).toHaveBeenCalledWith(SocketsSendEvents.StartTimer, mockData);
        });
    });

    describe('getCurrentTime', () => {
        it('getTime should return the time in the format xx:xx', () => {
            const time = service.getCurrentTime();
            const arrayTime = time.split(':');
            expect(arrayTime[0].length).toEqual(2);
            expect(arrayTime[1].length).toEqual(2);
        });
    });
});
