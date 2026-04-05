import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';

interface JwtPayload {
  userId: string;
}

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

      request.user = decoded;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
