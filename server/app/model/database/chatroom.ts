import { ChatRoomType } from '@app/constants/constants';
import { ChatRoomMessage } from '@app/interfaces/chat-interfaces/chatroom-message';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type ChatRoomDocument = Chatroom & Document;

@Schema({ collection: 'chatrooms' })
export class Chatroom {
    @ApiProperty({ description: 'Name of the chat room' })
    @Prop({ required: true, unique: true })
    chatRoomName: string; // Adding name as a unique key

    @ApiProperty({ enum: ChatRoomType })
    @Prop({ required: true, enum: ChatRoomType })
    chatRoomType: ChatRoomType;

    @ApiProperty({ description: "Owner of the chat room, defaults to 'general'" })
    @Prop({ required: true, default: 'general' })
    owner: string;

    @ApiProperty({ type: [Object], description: 'Array of chat room messages' })
    @Prop({ type: [Object], required: true })
    messages: ChatRoomMessage[];

    @ApiProperty({ type: [String], description: 'Array of player IDs' })
    @Prop({ type: [String], required: true })
    players: string[];
}

export const chatRoomSchema = SchemaFactory.createForClass(Chatroom);
