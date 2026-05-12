import { Module } from '@nestjs/common';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { PublishService } from './publish.service';

@Module({
  controllers: [SocialController],
  providers: [SocialService, PublishService],
  exports: [SocialService, PublishService],
})
export class SocialModule {}
