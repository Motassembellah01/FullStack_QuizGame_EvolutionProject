import { Account } from "./account";

export interface AccountFriend extends Pick<Account, 'userId' | 'pseudonym' | 'avatarUrl'>{
    isFriend: boolean;
    isRequestReceived: boolean;
    isRequestSent: boolean;
    isBlocked: boolean;
    isBlockingMe: boolean;
}
