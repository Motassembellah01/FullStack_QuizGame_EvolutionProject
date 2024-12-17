import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSessionDto {
    @ApiProperty()
    @IsString()
    userId: string;
}
