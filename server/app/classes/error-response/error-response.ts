import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponse {
    @ApiProperty({
        description: 'Error messages in both French and English',
        example: {
            fr: 'Code d’accès invalide ou la partie a été annulée par l’organisateur',
            en: 'Invalid access code or the match has been cancelled by the organizer',
        },
    })
    error: {
        fr: string;
        en: string;
    };
}
