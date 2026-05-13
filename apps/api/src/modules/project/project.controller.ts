import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectDto,
  type JwtPayload,
  type UpdateProjectDto,
} from '@brandflow/shared';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.projectService.findAll(user.businessId, { status, search, customerId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project details' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projectService.findOne(id, user.businessId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createProjectSchema)) data: CreateProjectDto,
  ) {
    return this.projectService.create(user.businessId, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project details' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateProjectSchema)) data: UpdateProjectDto,
  ) {
    return this.projectService.update(id, user.businessId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a project' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projectService.remove(id, user.businessId);
  }
}
