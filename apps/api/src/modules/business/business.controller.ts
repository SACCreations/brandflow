import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { updateBusinessSchema, type UpdateBusinessDto, type JwtPayload } from '@brandflow/shared';

@ApiTags('business')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  @ApiOperation({ summary: 'Get current workspace details' })
  get(@CurrentUser() user: JwtPayload) {
    return this.businessService.findById(user.businessId);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get workspace dashboard summary' })
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.businessService.getDashboardSummary(user.businessId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update workspace settings' })
  update(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(updateBusinessSchema)) dto: UpdateBusinessDto,
  ) {
    return this.businessService.update(user.businessId, dto);
  }

  @Get('members')
  @ApiOperation({ summary: 'List workspace members' })
  getMembers(@CurrentUser() user: JwtPayload) {
    return this.businessService.getMembers(user.businessId);
  }

  @Delete('members/:userId')
  @ApiOperation({ summary: 'Remove a member from the workspace' })
  removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.businessService.removeMember(user.businessId, userId);
  }

  @Patch('members/invite')
  @ApiOperation({ summary: 'Invite a member to the workspace' })
  inviteMember(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { email: string; role: string },
  ) {
    return this.businessService.inviteMember(user.businessId, dto.email, dto.role);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get workspace health score' })
  getHealth(@CurrentUser() user: JwtPayload) {
    return this.businessService.getHealthScore(user.businessId);
  }
}
