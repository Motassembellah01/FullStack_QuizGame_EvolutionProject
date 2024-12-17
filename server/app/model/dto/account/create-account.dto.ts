import { Language, ThemeVisual } from '@app/constants/constants';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { FriendRequestDto } from '../friend-request/friend-request-dto';

export class CreateAccountDTO {
    @ApiProperty({
        description: 'User ID',
        example: '12345',
    })
    @IsString()
    userId: string;

    @ApiProperty({
        description: 'User pseudonym',
        example: 'Gamer123',
    })
    @IsString()
    pseudonym: string;

    @ApiProperty({
        description: 'User email',
        example: 'Gamer123@test.com',
    })
    @IsString()
    email: string;

    @ApiProperty({
        description: 'Avatar URL (optional)',
        example: 'https://example.com/avatar.png',
        required: false,
        default: null,
    })
    @IsOptional()
    avatarUrl?: string | null = null;

    @ApiProperty({
        enum: ThemeVisual,
        description: 'User visual theme (dark or light)',
        example: ThemeVisual.LIGHT,
        default: ThemeVisual.LIGHT,
    })
    @IsEnum(ThemeVisual)
    themeVisual: ThemeVisual = ThemeVisual.LIGHT;

    @ApiProperty({
        enum: Language,
        description: 'User language (en or fr)',
        example: Language.FR,
        default: Language.FR,
    })
    @IsEnum(Language)
    lang: Language = Language.FR;

    @ApiProperty({
        description: 'Number of games played by the user',
        example: 10,
        default: 0,
    })
    @IsNumber()
    @Min(0)
    gamesPlayed: number = 0;

    @ApiProperty({
        description: 'Number of games won by the user',
        example: 5,
        default: 0,
    })
    @IsNumber()
    @Min(0)
    gamesWon: number = 0;

    @ApiProperty({
        description: 'Average number of questions answered correctly per game',
        example: 8.5,
        default: 0,
    })
    @IsNumber()
    @Min(0)
    avgQuestionsCorrect: number = 0;

    @ApiProperty({
        description: 'Average time spent per game in seconds',
        example: 300,
        default: 0,
    })
    @IsNumber()
    @Min(0)
    avgTimePerGame: number = 0;

    @ApiProperty({
        description: 'Money earned by the user',
        example: 50,
        default: 0,
    })
    @IsNumber()
    @Min(0)
    money: number = 0;

    @ApiProperty({
        description: 'Owned themes by the user',
        example: [ThemeVisual.DARK, ThemeVisual.LIGHT],
        isArray: true,
        default: [],
    })
    @IsArray()
    @IsEnum(ThemeVisual, { each: true })
    ownedThemes: ThemeVisual[] = [];

    @ApiProperty({
        description: 'Owned avatar URLs by the user',
        example: ['avatar1.png', 'avatar2.png'],
        isArray: true,
        default: [],
    })
    @IsArray()
    @IsString({ each: true })
    ownedAvatars: string[] = [];
    @ApiProperty({
        description: 'List of friends',
        example: ['12345', '24680'],
        default: [],
    })
    @IsString({ each: true })
    friends: string[] = [];

    @ApiProperty({
        description: 'List of friend requests',
        example: [{ senderBasicInfo: { userId: '67890', pseudonym: 'Friend1', avatarUrl: 'https://example.com/avatar1.png' } }],
        default: [],
    })
    friendRequests: FriendRequestDto[];

    @ApiProperty({
        description: 'List of friends that the user has requested',
        example: ['67890'],
        default: [],
    })
    @IsString({ each: true })
    friendsThatUserRequested: string[] = [];

    @ApiProperty({
        description: 'List of blocked people',
        example: ['13579'],
        default: [],
    })
    @IsString({ each: true })
    blocked: string[] = [];

    @ApiProperty({
        description: 'List of users I blocked',
        example: ['13579'],
        default: [],
    })
    @IsString({ each: true })
    UsersBlocked: string[] = [];

    @ApiProperty({
        description: 'List of users that blocked me',
        example: ['13579'],
        default: [],
    })
    @IsString({ each: true })
    UsersBlockingMe: string[] = [];
}
