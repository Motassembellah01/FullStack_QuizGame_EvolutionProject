import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { expressjwt } from 'express-jwt';
import { expressJwtSecret } from 'jwks-rsa';

@Injectable()
export class AuthorizationGuard implements CanActivate {
    private AUTH0_AUDIENCE: string;
    private AUTH0_DOMAIN: string;

    constructor(
        private configService: ConfigService,
        private logger: Logger,
    ) {
        this.AUTH0_AUDIENCE = this.configService.get<string>('AUTH0_AUDIENCE');
        this.AUTH0_DOMAIN = this.configService.get<string>('AUTH0_DOMAIN');
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();

        return new Promise((resolve, reject) => {
            expressjwt({
                secret: expressJwtSecret({
                    cache: true,
                    rateLimit: true,
                    jwksRequestsPerMinute: 5,
                    jwksUri: `${this.AUTH0_DOMAIN}.well-known/jwks.json`,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                }) as any, // Cast to 'any' to avoid TypeScript issues -- ABC
                audience: this.AUTH0_AUDIENCE,
                issuer: this.AUTH0_DOMAIN,
                algorithms: ['RS256'],
            })(req, res, (err) => {
                if (err) {
                    reject(new UnauthorizedException(err.message));
                } else {
                    resolve(true);
                }
            });
        });
    }
}
