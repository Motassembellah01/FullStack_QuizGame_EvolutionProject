import { ApiProperty } from "@nestjs/swagger";


export class JoinMatchDto {
    @ApiProperty({
        description: 'The access code for the match',
        example: '1234',
    })
    accessCode: string;

    @ApiProperty({
        description: 'The player name',
        example: 'player1',
    })
    playerName: string;
}
