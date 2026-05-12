import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BrandAnalyserService } from './brand-analyser.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@brandflow/shared';

@ApiTags('intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('brands/analyse')
export class BrandAnalyserController {
  constructor(private readonly brandAnalyserService: BrandAnalyserService) {}

  @Post()
  @ApiOperation({ summary: 'Analyse multiple knowledge sources to extract brand identity' })
  analyse(
    @CurrentUser() user: JwtPayload,
    @Body('sourceIds') sourceIds: string[],
  ) {
    return this.brandAnalyserService.analyse(user.businessId, sourceIds);
  }
}
