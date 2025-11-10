// apps/backend/src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { LoginLogService } from './services/login-log.service'; // ✅ ADICIONAR
import { User } from './entities/user.entity';
import { LoginLog } from './entities/login-log.entity'; // ✅ ADICIONAR
import { DepartmentService } from '../common/services/department.service';
import { EmailService } from '../email/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, LoginLog])], // ✅ ADICIONAR LoginLog
  controllers: [UsersController],
  providers: [
    UsersService, 
    LoginLogService, // ✅ ADICIONAR
    DepartmentService, 
    EmailService
  ],
  exports: [
    UsersService, 
    LoginLogService, // ✅ ADICIONAR
    DepartmentService
  ],
})
export class UsersModule {}