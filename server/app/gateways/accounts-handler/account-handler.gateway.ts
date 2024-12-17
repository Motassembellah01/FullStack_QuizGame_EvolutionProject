import { Account } from "@app/model/database/account";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";


@WebSocketGateway()
export class AccountHandlerGateway {
    @WebSocketServer()
    server: Server;
    
    
    async createAccountEmit(accounts: Partial<Account>[]): Promise<void>
    {
        this.server.emit('accountCreated', accounts);
        console.log('Account created Server');
    }
}