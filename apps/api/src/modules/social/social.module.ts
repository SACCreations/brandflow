import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { PublishService } from './publish.service';
import { SocialCronService } from './social-cron.service';
import { RedisModule } from '../../common/redis/redis.module';

import { PublishJobController } from './publish-job.controller';
import { ResilientPublishService } from './resilient-publish.service';

@Module({
  imports: [AuthModule, RedisModule],
  controllers: [SocialController, PublishJobController],
  providers: [SocialService, PublishService, SocialCronService, ResilientPublishService],
  exports: [SocialService, PublishService, ResilientPublishService],
})
export class SocialModule {}
