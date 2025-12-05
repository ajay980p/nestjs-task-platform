import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // 1. Cookie se Token nikaalo (ya Header se fallback)
        const token = request.cookies['Authentication'] || request.headers.authorization?.split(' ')[1];

        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        try {
            const user = await lastValueFrom(
                this.authClient.send({ cmd: 'verify_token' }, { token })
            );

            request.user = user;
            return true;
        } catch (e) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}