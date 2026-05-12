import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '@brandflow/shared';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @ApiOperation({ summary: 'List all customers' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.customerService.findAll(user.businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customerService.findOne(id, user.businessId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  create(@CurrentUser() user: JwtPayload, @Body() data: any) {
    return this.customerService.create(user.businessId, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer details' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: any,
  ) {
    return this.customerService.update(id, user.businessId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a customer' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customerService.remove(id, user.businessId);
  }
}
