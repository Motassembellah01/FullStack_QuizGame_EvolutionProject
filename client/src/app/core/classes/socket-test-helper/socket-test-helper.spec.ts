import { SocketTestHelper } from './socket-test-helper';

describe('SocketTestHelper', () => {
    let socketTestHelper: SocketTestHelper;

    beforeEach(() => {
        socketTestHelper = new SocketTestHelper();
    });

    describe('general tests and add callback to event', () => {
        it('should create an instance', () => {
            expect(new SocketTestHelper()).toBeTruthy();
        });

        it('should add a callback to the event', () => {
            const event = 'event';
            const callback = jasmine.createSpy('callback');
            socketTestHelper.on(event, callback);

            expect(socketTestHelper['callbacks'].get(event)).toContain(callback);
        });

        it('should disconnect', () => {
            socketTestHelper.disconnect();

            expect().nothing();
        });
    });

    describe('test emit events', () => {
        it('should emit an event', () => {
            const eventName = 'event';
            const eventData = { key: 'value' };

            socketTestHelper.emit(eventName, eventData);

            expect().nothing();
        });

        it('should emit an event with callbacks', () => {
            const event = 'event';
            const callback1 = jasmine.createSpy('callback1');
            const callback2 = jasmine.createSpy('callback2');
            socketTestHelper.on(event, callback1);
            socketTestHelper.on(event, callback2);

            socketTestHelper.peerSideEmit(event, 'data');

            expect(callback1).toHaveBeenCalledWith('data');
            expect(callback2).toHaveBeenCalledWith('data');
        });

        it('should emit an event without callbacks', () => {
            const event = 'event';

            socketTestHelper.peerSideEmit(event, 'data');

            // should expect nothing because there are no callbacks
            expect().nothing();
        });
    });

    describe('test remove events', () => {
        it('should remove an event and its callbacks', () => {
            const event = 'testEvent';
            const callback = jasmine.createSpy('callback');
            socketTestHelper.on(event, callback);

            socketTestHelper.removeListener(event);

            expect(socketTestHelper['callbacks'].has(event)).toBe(false);
        });

        it('should remove all events and their callbacks', () => {
            const event1 = 'event1';
            const event2 = 'event2';
            const callback1 = jasmine.createSpy('callback1');
            const callback2 = jasmine.createSpy('callback2');
            socketTestHelper.on(event1, callback1);
            socketTestHelper.on(event2, callback2);

            socketTestHelper.removeListener();
            socketTestHelper.removeListener(event1);

            expect(socketTestHelper['callbacks'].size).toBe(0);
            expect(socketTestHelper['callbacks'].has(event1)).toBe(false);
        });
    });
});
