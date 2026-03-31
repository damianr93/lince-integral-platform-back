import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
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
import { SendSingleDto } from './dto/send-single.dto';

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

  // ─── Envío puntual ─────────────────────────────────────────────────────────

  @Post('send-single')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  sendSingle(@Body() dto: SendSingleDto, @CurrentUser() user: AuthUser) {
    return this.marketingService.sendSingle(dto, user.id);
  }

  @Get('direct-messages')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  getDirectMessages() {
    return this.marketingService.getDirectMessages();
  }

  @Get('filter-options')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  getFilterOptions() {
    return this.marketingService.getFilterOptions();
  }

  // ─── Campañas ───────────────────────────────────────────────────────────────

  @Get('campaigns')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  findAll() {
    return this.marketingService.findAll();
  }

  @Post('campaigns/preview')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  previewByFilter(@Body() body: { siguiendo?: string[]; estado?: string[]; producto?: string[] }) {
    return this.marketingService.previewByFilter(body);
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

  @Get('campaigns/:id/preview')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  previewCampaign(@Param('id') id: string) {
    return this.marketingService.previewCampaign(id);
  }

  @Get('campaigns/:id/recipients')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  getRecipients(@Param('id') id: string) {
    return this.marketingService.getRecipients(id);
  }

  @Post('campaigns/:id/waves')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  configureWaves(
    @Param('id') id: string,
    @Body() body: { waves: { scheduledAt: string; recipientCount: number }[] },
  ) {
    return this.marketingService.configureWaves(
      id,
      body.waves.map((w) => ({ ...w, scheduledAt: new Date(w.scheduledAt) })),
    );
  }

  @Get('campaigns/:id/waves')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  async getWaves(@Param('id') id: string) {
    const campaign = await this.marketingService.findById(id);
    return campaign.waves ?? [];
  }

  @Patch('campaigns/:id/waves/:waveNumber/reschedule')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  rescheduleWave(
    @Param('id') id: string,
    @Param('waveNumber', ParseIntPipe) waveNumber: number,
    @Body() body: { scheduledAt: string },
  ) {
    return this.marketingService.rescheduleWave(id, waveNumber, new Date(body.scheduledAt));
  }

  @Get('campaigns/:id/logs')
  @UseGuards(JwtAuthGuard, ModuleGuard)
  @RequireModule(ModuleKey.MARKETING)
  getLogs(@Param('id') id: string) {
    return this.marketingService.getLogs(id);
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
