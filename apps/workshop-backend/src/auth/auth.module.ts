// apps/backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module'; // ✅ Adicionado
import { User } from '../users/entities/user.entity';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ConfigModule,
    EmailModule,  // ✅ Para envio de emails de recuperação
    UsersModule,  // ✅ Para gestão de usuários
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '24h'),
          issuer: configService.get('JWT_ISSUER', 'workshop-backend'),
          audience: configService.get('JWT_AUDIENCE', 'workshop-users'),
          algorithm: 'HS256',
        },
        verifyOptions: {
          issuer: configService.get('JWT_ISSUER', 'workshop-backend'),
          audience: configService.get('JWT_AUDIENCE', 'workshop-users'),
          algorithms: ['HS256'],
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService, 
    JwtStrategy, 
    LocalStrategy,
    JwtAuthGuard,
    RolesGuard,
    
    // ==========================================
    // 🔐 PROVIDER DE CONFIGURAÇÃO DE AUTH
    // ==========================================
    {
      provide: 'AUTH_CONFIG',
      useFactory: (configService: ConfigService) => ({
        maxLoginAttempts: configService.get<number>('AUTH_MAX_LOGIN_ATTEMPTS', 5),
        lockTimeMinutes: configService.get<number>('AUTH_LOCK_TIME_MINUTES', 15),
        passwordPolicy: {
          minLength: configService.get<number>('PASSWORD_MIN_LENGTH', 8),
          requireUppercase: configService.get<boolean>('PASSWORD_REQUIRE_UPPERCASE', true),
          requireLowercase: configService.get<boolean>('PASSWORD_REQUIRE_LOWERCASE', true),
          requireNumbers: configService.get<boolean>('PASSWORD_REQUIRE_NUMBERS', true),
          requireSymbols: configService.get<boolean>('PASSWORD_REQUIRE_SYMBOLS', true),
        },
        jwt: {
          secret: configService.get('JWT_SECRET'),
          expiresIn: configService.get('JWT_EXPIRES_IN', '24h'),
          refreshSecret: configService.get('JWT_REFRESH_SECRET'),
          refreshExpiresIn: configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    },
  ],
  controllers: [AuthController],
  exports: [
    AuthService, 
    JwtModule, 
    PassportModule,
    JwtAuthGuard,
    RolesGuard
  ],
})
export class AuthModule {}