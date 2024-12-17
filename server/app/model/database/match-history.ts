import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type MatchHistoryDocument = MatchHistory & Document;

@Schema({ collection: 'matchHistory' })
export class MatchHistory {
    @ApiProperty()
    @Prop({ required: true })
    matchAccessCode: string;

    @ApiProperty()
    @Prop({ required: true })
    bestScore: number;

    @ApiProperty()
    @Prop({ required: true })
    startTime: string;

    @ApiProperty()
    @Prop({ required: true })
    nStartPlayers: number;

    @ApiProperty()
    @Prop({ required: true })
    gameName: string;
}

export const matchHistorySchema = SchemaFactory.createForClass(MatchHistory);
