import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthorizationGuard } from './authorization.guard';

@Module({
    imports: [ConfigModule],
    providers: [AuthorizationGuard, Logger],
    exports: [AuthorizationGuard],
})
export class AuthorizationModule {}
