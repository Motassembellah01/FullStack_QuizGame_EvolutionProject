import { Account } from "@app/model/database/account";

export class FriendRequestDto {
    requestId: string;
    senderBasicInfo: Partial<Account>;
}