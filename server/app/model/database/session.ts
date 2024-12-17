import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ collection: 'session' })
export class Session {
    @ApiProperty()
    @Prop({ required: true })
    userId: string;

    @ApiProperty()
    @Prop({ required: true })
    loginAt: string;

    @ApiProperty()
    @Prop()
    logoutAt?: string;

    @ApiProperty()
    _id?: string;
}

export const sessionSchema = SchemaFactory.createForClass(Session);
