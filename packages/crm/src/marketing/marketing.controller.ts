import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard, ModuleGuard, RequireModule, CurrentUser } from '@lince/auth';
import { AuthUser, ModuleKey } from '@lince/types';
import { MarketingService } from './marketing.service';
import { YCloudClient } from './ycloud.client';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly marketingService: MarketingService,
    private readonly ycloud: YCloudClient,
  ) {}

  // ─── Templates ─────────────────────────────────────────────────────────────

  @Get('templates')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  getTemplates() {
    return this.marketingService.getTemplates();
  }

  // ─── Campañas ───────────────────────────────────────────────────────────────

  @Get('campaigns')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  findAll() {
    return this.marketingService.findAll();
  }

  @Get('campaigns/:id')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  findOne(@Param('id') id: string) {
    return this.marketingService.findById(id);
  }

  @Post('campaigns')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  create(@Body() dto: CreateCampaignDto, @CurrentUser() user: AuthUser) {
    return this.marketingService.create(dto, user.id);
  }

  @Post('campaigns/:id/execute')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  execute(@Param('id') id: string) {
    return this.marketingService.execute(id);
  }

  @Delete('campaigns/:id')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.marketingService.remove(id);
  }

  @Get('campaigns/:id/recipients')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  getRecipients(@Param('id') id: string) {
    return this.marketingService.getRecipients(id);
  }

  // ─── Webhook (sin auth JWT — validado por firma HMAC) ──────────────────────

  @Post('webhooks/ycloud')
  async ycloudWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('ycloud-signature') signature: string,
    @Body() payload: Record<string, any>,
  ) {
    const rawBody = req.rawBody?.toString('utf-8') ?? JSON.stringify(payload);
    const valid = await this.ycloud.verifyWebhookSignature(rawBody, signature ?? '');
    if (!valid) {
      return { ok: false };
    }
    await this.marketingService.handleWebhook(payload);
    return { ok: true };
  }
}
