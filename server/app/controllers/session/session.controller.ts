import { Session } from '@app/model/database/session';
import { SessionService } from '@app/services/session/session.service';
import { Controller, Delete, Get, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('sessions')
export class SessionController {
    constructor(private readonly sessionService: SessionService) {}

    @Delete(':userId')
    async deleteSession(@Param('userId') userId: string): Promise<Session> {
        return this.sessionService.logoutSession(userId);
    }

    @Get('history/:userId')
    async getSessionHistory(@Param('userId') userId: string) {
        return this.sessionService.getSessionHistory(userId);
    }

    @Post('/create/:userId')
    async createSession(@Param('userId') userId: string, @Res() res: Response): Promise<void> {
        try {
            const newSession = await this.sessionService.createSession(userId);
            res.status(HttpStatus.CREATED).json(newSession);
        } catch (error) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }
}
