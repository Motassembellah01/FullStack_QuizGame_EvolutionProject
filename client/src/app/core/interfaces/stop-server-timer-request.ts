/**
 * Interface to represent the send of a request
 * to stop server timer request
 */
export interface StopServerTimerRequest {
    roomId: string;
    isHistogramTimer: boolean;
}
