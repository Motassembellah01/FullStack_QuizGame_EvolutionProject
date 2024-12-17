/**
 * Interface to represent the timer
 * in a room and the time interval.
 */
export class TimerRequest {
    roomId: string;
    timer: number;
    timeInterval?: number;
    isHistogramTimer?: boolean;
}
