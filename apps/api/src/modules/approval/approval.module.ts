import { Module } from '@nestjs/common';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';

import { BullModule } from '@nestjs/bullmq';
import { SlaProcessor } from './sla.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'sla-monitor' }),
  ],
  controllers: [ApprovalController],
  providers: [ApprovalService, SlaProcessor],
  exports: [ApprovalService],
})
export class ApprovalModule {}
