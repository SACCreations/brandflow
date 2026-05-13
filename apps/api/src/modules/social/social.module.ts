import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { PublishService } from './publish.service';

@Module({
  imports: [AuthModule],
  controllers: [SocialController],
  providers: [SocialService, PublishService],
  exports: [SocialService, PublishService],
})
export class SocialModule {}
