import { Language, ThemeVisual } from '@app/constants/constants';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FriendDocument = Friend & Document;

@Schema({collection: 'friend'})
export class Friend {

    @Prop({required: true, default: () => new Types.ObjectId().toString(), unique: true })
    requestId: string;

    @Prop({required: true, ref: 'account'})
    senderId: string;

    @Prop({required: true, ref: 'account'})
    receiverId: string;

    @Prop({required: true, enum: ['pending', 'accepted', 'rejected'], default: 'pending'})
    status: 'pending' | 'accepted' | 'rejected';

    @Prop({required: true, default: Date.now()})
    createdAt: Date;

}

export const friendSchema = SchemaFactory.createForClass(Friend);

