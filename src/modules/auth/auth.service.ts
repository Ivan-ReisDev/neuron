import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AUTH_MESSAGES } from '../../shared/constants/exception-messages';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './types/auth-response';
import { JwtPayload } from './types/jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: LoginDto): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(data.email);

    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.UNAUTHORIZED);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(AUTH_MESSAGES.UNAUTHORIZED);
    }

    const permissions = user.role.permissions.map(
      (permission) => `${permission.resource}:${permission.action}`,
    );

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }
}
