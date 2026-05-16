import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { PublishService } from './publish.service';
import { SocialCronService } from './social-cron.service';
import { RedisModule } from '../common/redis/redis.module';

@Module({
  imports: [AuthModule, RedisModule],
  controllers: [SocialController],
  providers: [SocialService, PublishService, SocialCronService],
  exports: [SocialService, PublishService],
})
export class SocialModule {}
