import { Controller, Post, Param, Body, Delete, Get } from '@nestjs/common';
import { FriendService } from '@app/services/friend/friend.service';

@Controller('friends')
export class FriendController {
    constructor(private readonly friendService: FriendService) {}

    @Post('send/:senderId/:receiverId')
    async sendFriendRequest(
        @Param('senderId') senderId: string,
        @Param('receiverId') receiverId: string,
    ): Promise<void> {
        await this.friendService.sendFriendRequest(senderId, receiverId);
    }

    @Post('accept/:requestId')
    async acceptFriendRequest(@Param('requestId') requestId: string): Promise<void> {
        await this.friendService.acceptFriendRequest(requestId);
    }

    @Post('reject/:requestId')
    async rejectFriendRequest(@Param('requestId') requestId: string): Promise<void> {
        await this.friendService.rejectFriendRequest(requestId);
    }

    @Delete('remove/:userId/:friendId')
    async removeFriend(
        @Param('userId') userId: string,
        @Param('friendId') friendId: string,
    ): Promise<void> {
        await this.friendService.removeFriend(userId, friendId);
    }

    @Post('block/:userId/:blockedUserId')
    async blockNormalUser(
        @Param('userId') userId: string,
        @Param('blockedUserId') blockedUserId: string,
    ): Promise<void> {
        await this.friendService.blockNormalUser(userId, blockedUserId);
    }

    @Post('blockFriend/:userId/:blockedFriendId')
    async blockFriend(
        @Param('userId') userId: string,
        @Param('blockedFriendId') blockedFriendId: string,
    ): Promise<void> {
        await this.friendService.blockFriend(userId, blockedFriendId);
    }

    @Post('blockUserWithPendingRequest/:userId/:otherUserId')
    async blockUserWithPendingRequest(
        @Param('userId') userId: string,
        @Param('otherUserId') otherUserId: string,
    ): Promise<void> {
        await this.friendService.blockUserWithPendingRequest(userId, otherUserId);
    }
}
