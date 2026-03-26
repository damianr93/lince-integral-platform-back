import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ExternalTokenGuard } from '../guards/external-token.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller('crm')
@UseGuards(ExternalTokenGuard)
export class WebhooksController {
  constructor(private readonly customersService: CustomersService) {}

  @Post('contacts/manychat')
  createFromManychat(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Post('contacts/webchat')
  createFromWebchat(@Body() dto: CreateCustomerDto) {
    return this.customersService.create({ ...dto, medioAdquisicion: 'WEB' });
  }
}
