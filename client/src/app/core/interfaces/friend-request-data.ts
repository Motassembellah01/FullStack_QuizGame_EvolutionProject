import { Account } from "./account/account";

export interface FriendRequestData {
    requestId: string;
    senderBasicInfo: Partial<Account>;
}
