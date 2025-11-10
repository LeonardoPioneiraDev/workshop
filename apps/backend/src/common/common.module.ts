import { Module } from '@nestjs/common';
import { DepartmentService } from './services/department.service';
import { EmailService } from './services/email.service';
import { EmailController } from './controllers/email.controller';

@Module({
  controllers: [EmailController],
  providers: [DepartmentService,EmailService,EmailController],
  exports: [DepartmentService, EmailService,EmailController],
})
export class CommonModule {}
