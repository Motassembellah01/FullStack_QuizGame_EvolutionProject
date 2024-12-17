import { ChatRoomType } from '@app/constants/constants';
import { ChatRoomMessage } from '@app/interfaces/chat-interfaces/chatroom-message';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class ChatRoomDto {
    @ApiProperty({ description: 'Unique name of the chat room' })
    @IsOptional() // Make this optional for updates
    @IsString()
    chatRoomName?: string;

    @ApiProperty({ enum: ChatRoomType })
    @IsOptional()
    @IsEnum(ChatRoomType)
    chatRoomType?: ChatRoomType;

    @ApiProperty({ description: "Owner of the chat room, defaults to 'general'" })
    @IsOptional()
    @IsString()
    owner?: string;

    @ApiProperty({ type: [Object], description: 'Array of chat room messages' })
    @IsOptional()
    @IsArray()
    messages?: ChatRoomMessage[];

    @ApiProperty({ type: [String], description: 'Array of player IDs' })
    @IsOptional()
    @IsArray()
    players?: string[];
}
