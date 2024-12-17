import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Friend, FriendDocument } from '../../model/database/friend';
import { AccountService } from '../account/account.service';

@Injectable()
export class FriendService {
    constructor(
        @InjectModel(Friend.name) private friendModel: Model<FriendDocument>,
        private readonly accountService: AccountService
    ){}

    async sendFriendRequest(senderId: string, receiverId: string): Promise<void> {
        if (senderId === receiverId){
            throw new BadRequestException("Friend request to self is not allowed.");
        }

        const request = await this.friendModel.findOne({
            $or: [
            { senderId: senderId, receiverId: receiverId, status: 'pending' },
            { senderId: receiverId, receiverId: senderId, status: 'pending' },
            ],
        });

        if (request) {
            throw new BadRequestException('Friend request already exists.');
        }

        const newRequest = new this.friendModel({
            senderId: senderId,
            receiverId: receiverId,
            status: 'pending',
            createdAt: new Date()
        });

        await newRequest.save()
        
        // You want to know the "userId pseudonym avatarUrl" of the sender for display purposes
        const senderBasicInfo = await this.accountService.findBasicInfoByUserId(senderId);

        await this.accountService.addFriendRequest(receiverId, senderBasicInfo, newRequest.requestId);
    }

    async acceptFriendRequest(requestId: string): Promise<void> {
        const request = await this.friendModel.findOne({ requestId: requestId });
        
        if (!request) {
            throw new BadRequestException("Friend request not found.");
        }

        if (request.status !== 'pending') {
            throw new BadRequestException("This friend request has already been processed.");
        }

        request.status = 'accepted';
        await request.save();

        await this.accountService.addFriend(request);
    }

    async rejectFriendRequest(requestId: string): Promise<void> {
        const request = await this.friendModel.findOne({ requestId: requestId });

        if (!request) {
            throw new BadRequestException("Friend request not found.");
        }

        if (request.status !== 'pending') {
            throw new BadRequestException("This friend request has already been processed.");
        }

        await this.accountService.removeFriendRequestFromAccount(request);
        await request.deleteOne();
    }

    async removeFriend(userId: string, friendId: string): Promise<void> {
        const request = await this.friendModel.findOne({
            $or: [
            { senderId: userId, receiverId: friendId, status: 'accepted' },
            { senderId: friendId, receiverId: userId, status: 'accepted' },
            ],
        });

        if (!request) {
            throw new BadRequestException('Amitié pas trouvé.');
        }

        await this.accountService.removeFriendRequestFromAccount(request);
        await this.accountService.removeFriend(request);

        await request.deleteOne();
    }

    async blockFriend(userId: string, friendId: string): Promise<void> {
        await this.accountService.addToBlockList(userId, friendId);
        await this.removeFriend(userId, friendId);
    }

    async blockNormalUser(userId: string, otherUserId: string): Promise<void> {
        await this.accountService.addToBlockList(userId, otherUserId);
    }

    async blockUserWithPendingRequest(userId: string, otherUserId: string): Promise<void> {
        const request = await this.friendModel.findOne({
            $or: [
            { senderId: userId, receiverId: otherUserId, status: 'pending' },
            { senderId: otherUserId, receiverId: userId, status: 'pending' },
            ],
        });

        await this.rejectFriendRequest(request.requestId);
        await this.blockNormalUser(userId, otherUserId);
    }


}
