/** Interface to represent a message in the chat during a match
 * matchAccessCode is also used as the room id. */
export interface Message {
    playerName: string;
    matchAccessCode: string;
    time: string;
    data: string;
}
