import { Language, ThemeVisual } from '@app/constants/constants';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { FriendRequestDto } from '../dto/friend-request/friend-request-dto';

export type AccountDocument = Account & Document;

@Schema({ collection: 'account' })
export class Account {
    @ApiProperty()
    @Prop({ required: true })
    userId: string;

    @ApiProperty()
    @Prop({ required: true })
    pseudonym: string;

    @ApiProperty()
    @Prop({ required: true })
    email: string;

    @ApiProperty()
    @Prop({ default: null })
    avatarUrl?: string | null;

    @ApiProperty({ enum: ThemeVisual, description: 'User visual theme (dark or light)' })
    @Prop({ required: true, enum: ThemeVisual, default: ThemeVisual.LIGHT })
    themeVisual: ThemeVisual;

    @ApiProperty({ enum: Language, description: 'User language (en or fr)' })
    @Prop({ required: true, enum: Language, default: Language.FR })
    lang: Language;

    @ApiProperty({ description: 'Number of games played by the user' })
    @Prop({ required: true, default: 0 })
    gamesPlayed: number;

    @ApiProperty({ description: 'Number of games won by the user' })
    @Prop({ required: true, default: 0 })
    gamesWon: number;

    @ApiProperty({ description: 'Average number of correct answers per game' })
    @Prop({ required: true, default: 0 })
    avgQuestionsCorrect: number;

    @ApiProperty({ description: 'Average time spent per game in seconds' })
    @Prop({ required: true, default: 0 })
    avgTimePerGame: number;

    @ApiProperty({ description: 'Friend list' })
    @Prop({ required: true, default: [] })
    friends: string[];

    @ApiProperty({ description: 'List of friend requests' })
    @Prop({ required: true, default: [] })
    friendRequests: FriendRequestDto[];

    @ApiProperty({ description: 'History of matches played by the user' })
    @Prop({
        type: [
            {
                gameName: { type: String, required: true },
                datePlayed: { type: String, required: true },
                won: { type: Boolean, required: true },
            },
        ],
        default: [],
    })
    matchHistory: {
        gameName: string;
        datePlayed: string;
        won: boolean;
    }[];

    @ApiProperty({ description: 'Money earned by the user' })
    @Prop({ required: true, default: 0 })
    money: number;

    @ApiProperty({ description: 'Owned themes by the user' })
    @Prop({
        default: [],
    })
    visualThemesOwned: { ThemeVisual: ThemeVisual }[];

    @ApiProperty({ description: 'Owned avatar URL by the user' })
    @Prop({
        default: [],
    })
    avatarsUrlOwned: { AvatarsUrl: string }[];

    @ApiProperty({ description: 'List of friend requests sent by the user' })
    @Prop({ required: true, default: [] })
    friendsThatUserRequested: string[];

    @ApiProperty({ description: 'List of blocked people' })
    @Prop({ required: true, default: [] })
    blocked: string[];

    @ApiProperty({ description: 'User I blocked' })
    @Prop({ required: true, default: [] })
    UsersBlocked: string[];

    @ApiProperty({ description: 'User I was blocked by' })
    @Prop({ required: true, default: [] })
    UsersBlockingMe: string[];

    @ApiProperty()
    _id?: string;
}

export const accountSchema = SchemaFactory.createForClass(Account);
