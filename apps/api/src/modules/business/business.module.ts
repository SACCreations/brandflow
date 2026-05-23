import { Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { AuditService } from './audit.service';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService, AuditService],
  exports: [BusinessService, AuditService],
})
export class BusinessModule {}
