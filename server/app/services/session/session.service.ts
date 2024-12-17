import { Session, SessionDocument } from '@app/model/database/session';
import { SessionHistoryDto } from '@app/model/dto/session/session-history.dto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Utils } from 'utils/utils';

@Injectable()
export class SessionService {
    constructor(
        @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
        private readonly logger: Logger,
    ) {}

    async getSessionHistory(userId: string): Promise<SessionHistoryDto[]> {
        this.logger.log(`Getting session history for ${userId}`);

        const sessions = await this.sessionModel.find({ userId }).sort({ loginAt: -1 }).exec();
        const formattedSessions = sessions.map((session) => ({
            loginAt: session.loginAt,
            logoutAt: session.logoutAt,
        }));

        return formattedSessions.sort((a, b) => {
            const dateA = new Date(a.loginAt).getTime();
            const dateB = new Date(b.loginAt).getTime();
            return dateB - dateA;
        });
    }

    async logoutSession(userId: string): Promise<Session | null> {
        this.logger.log(`${userId} is logging out`);
        return this.sessionModel.findOneAndUpdate({ userId, logoutAt: null }, { logoutAt: Utils.formatDateToReadable() }, { new: true }).exec();
    }

    async createSession(userId: string): Promise<Session> {
        this.logger.log(`Creating a new session for userId: ${userId}`);

        const newSession = new this.sessionModel({
            userId,
            loginAt: Utils.formatDateToReadable(),
            logoutAt: null,
        });
        return await newSession.save();
    }
}
