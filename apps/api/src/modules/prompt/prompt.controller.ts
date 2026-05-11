import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PromptService } from './prompt.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createPromptSchema, type CreatePromptDto, type JwtPayload } from '@brandflow/shared';

@ApiTags('prompt')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prompts')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Get()
  @ApiOperation({ summary: 'List prompts (platform + workspace)' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('module') module?: string,
  ) {
    return this.promptService.findAll(user.businessId, module);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a prompt by ID' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.promptService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new prompt version' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createPromptSchema)) dto: CreatePromptDto,
  ) {
    return this.promptService.create(user.businessId, dto);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a prompt version' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.promptService.deactivate(id, user.businessId);
  }

  @Get('resolve/:module')
  @ApiOperation({ summary: 'Resolve effective prompt for a module' })
  resolve(
    @Param('module') module: string,
    @CurrentUser() user: JwtPayload,
    @Query('brandId') brandId?: string,
  ) {
    return this.promptService.resolveForModule(module, user.businessId, brandId);
  }
}
