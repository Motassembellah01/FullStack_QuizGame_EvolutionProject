import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorizationModule } from './authorization/authorization.module';
import { AccountController } from './controllers/account/account.controller';
import { GameController } from './controllers/game/game.controller';
import { MatchController } from './controllers/match/match.controller';
import { ChatSocketHandler } from './gateways/chat-socket-handler/chat-socket-handler.gateway';
import { SocketHandlerGateway } from './gateways/socket-handler/socket-handler.gateway';
import { Account, accountSchema } from './model/database/account';
import { Game, gameSchema } from './model/database/game';
import { Friend, friendSchema} from './model/database/friend';
import { MatchHistory, matchHistorySchema } from './model/database/match-history';
import { AccountService } from './services/account/account.service';
import { GameService } from './services/game/game.service';
import { MatchService } from './services/match/match.service';

// Import session-related files
import { RedisClient } from './classes/redis-client/redis-client';
import { SessionController } from './controllers/session/session.controller';
import { Chatroom, chatRoomSchema } from './model/database/chatroom';
import { Session, sessionSchema } from './model/database/session';
import { ChatRoomService } from './services/chatroom/chatroom.service';
import { SessionService } from './services/session/session.service';
import { FriendService } from './services/friend/friend.service';
import { AccountHandlerGateway } from './gateways/accounts-handler/account-handler.gateway';
import { FriendController } from './controllers/friend/friend.controller';
import { FriendHandlerGateway } from './gateways/friend-handler/friend-handler';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'), // Loaded from .env
            }),
        }),
        MongooseModule.forFeature([
            { name: Game.name, schema: gameSchema },
            { name: MatchHistory.name, schema: matchHistorySchema },
            { name: Account.name, schema: accountSchema },
            { name: Session.name, schema: sessionSchema },
            { name: Chatroom.name, schema: chatRoomSchema },
            { name: Friend.name, schema: friendSchema},
        ]),
        AuthorizationModule,
    ],
    controllers: [GameController, MatchController, AccountController, SessionController, FriendController],
    providers: [
        GameService,
        Logger,
        MatchService,
        SocketHandlerGateway,
        AccountHandlerGateway,
        AccountService,
        SessionService,
        ChatSocketHandler,
        RedisClient,
        ChatRoomService,
        FriendService,
        FriendHandlerGateway,
    ],
})
export class AppModule {}
