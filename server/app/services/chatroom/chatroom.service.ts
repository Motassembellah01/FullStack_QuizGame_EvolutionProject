import { ChatRoom } from '@app/interfaces/chat-interfaces/chatroom';
import { ChatRoomMessage } from '@app/interfaces/chat-interfaces/chatroom-message';
import { ChatRoomDocument } from '@app/model/database/chatroom';
import { ChatRoomDto } from '@app/model/dto/chatroom/chatroom';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ChatRoomService {
    constructor(@InjectModel('Chatroom') private chatRoomModel: Model<ChatRoomDocument>) {}

    // 1. Add a new chat room
    async create(chatRoomDto: ChatRoomDto): Promise<ChatRoom> {
        const newChatRoom = new this.chatRoomModel(chatRoomDto);
        const result = await newChatRoom.save();
        return result;
    }

    // 2. Remove a chat room by chatRoomName
    async delete(chatRoomName: string): Promise<ChatRoom | null> {
        return await this.chatRoomModel.findOneAndRemove({ chatRoomName }).exec();
    }

    // 3. Find a chatroom by its name
    async findByRoomName(chatRoomName: string): Promise<ChatRoom | null> {
        const result = await this.chatRoomModel
            .findOne({ chatRoomName })
            .select({
                _id: 0,
                chatRoomName: 1,
                chatRoomType: 1,
                owner: 1,
                players: 1,
                messages: 1, // Limit messages to the first 10
            })
            .exec();
        return result;
    }

    // 4. Find all chat rooms matching an owner pattern
    async findByOwnerPattern(ownerPattern: string): Promise<ChatRoom[]> {
        return await this.chatRoomModel.find({ owner: { $regex: ownerPattern, $options: 'i' } }).exec();
    }

    // 5. Modify a chat room by chatRoomName
    async update(chatRoomName: string, modifications: Partial<ChatRoomDto>, oldChatRoom: ChatRoomDto): Promise<ChatRoom | null> {
        const updateData: any = {};

        if (modifications.players && JSON.stringify(oldChatRoom.players) !== JSON.stringify(modifications.players)) {
            updateData.players = modifications.players;
        }

        if (modifications.owner && modifications.owner !== oldChatRoom.owner) {
            updateData.owner = modifications.owner;
        }

        if (Object.keys(updateData).length > 0) {
            return await this.chatRoomModel.findOneAndUpdate({ chatRoomName }, { $set: updateData }, { new: true }).exec();
        }

        return null;
    }

    // 6. Get only the names of all chat rooms
    async findAllRoomNames(): Promise<{ chatRoomName: string }[]> {
        return await this.chatRoomModel.find().select('chatRoomName -_id').exec();
    }

    async findAllRoom(): Promise<ChatRoom[]> {
        return await this.chatRoomModel
            .find()
            .select({
                chatRoomName: 1,
                chatRoomType: 1,
                owner: 1,
                players: 1,
                messages: 1
            })
            .exec();
    }

    async addMessage(chatRoomName: string, message: ChatRoomMessage): Promise<ChatRoom | null> {
        return await this.chatRoomModel
            .findOneAndUpdate(
                { chatRoomName },
                { $push: { messages: message } }, // Push the new message onto the messages array
                { new: true }, // Return the updated document
            )
            .exec();
    }
}
