import { Controller, Get, Query, Res, SetMetadata, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard, ModuleGuard, RequireModule } from '@lince/auth';
import { ModuleKey } from '@lince/types';
import { AnalyticsService } from './analytics.service';

export const IS_PUBLIC_KEY = 'IS_PUBLIC_KEY';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

type LocationFilters = {
  year?: number;
  startDate?: string;
  endDate?: string;
  provincias?: string[];
  paises?: string[];
  zonas?: string[];
};

@Controller('crm/analytics')
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule(ModuleKey.CRM)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('totales')
  totales(@Query('year') year?: string) {
    return this.analyticsService.totales(this.parseYear(year));
  }

  @Get('evolucion')
  evolution(@Query('year') year?: string) {
    return this.analyticsService.evolution(this.parseYear(year));
  }

  @Get('yearly-comparison')
  yearlyComparison(@Query('years') years?: string) {
    return this.analyticsService.yearlyComparison(this.parseYears(years));
  }

  @Get('demand-of-product')
  demandOfProduct(@Query('year') year?: string) {
    return this.analyticsService.demandOfProduct(this.parseYear(year));
  }

  @Get('status')
  purchaseStatus(@Query('year') year?: string) {
    return this.analyticsService.purchaseStatus(this.parseYear(year));
  }

  @Get('follow-up-events')
  followUpEvents(
    @Query('assignedTo') assignedTo?: string,
    @Query('status') status?: string,
  ) {
    return this.analyticsService.followUpEvents(assignedTo, status);
  }

  @Get('location-summary')
  locationSummary(@Query() query: Record<string, string>) {
    return this.analyticsService.locationSummary(this.normalizeLocationFilters(query));
  }

  @Get('location-heatmap')
  locationHeatmap(@Query() query: Record<string, string>) {
    return this.analyticsService.locationHeatmap(this.normalizeLocationFilters(query));
  }

  @Get('location-debug')
  locationDebug(@Query() query: Record<string, string>) {
    return this.analyticsService.locationDebug(this.normalizeLocationFilters(query));
  }

  @Public()
  @Get('location-map')
  async locationMap(@Res() res: Response, @Query() query: Record<string, string>) {
    const result = await this.analyticsService.locationMapImage(
      this.normalizeLocationFilters(query),
    );
    if (!result) {
      return res.status(204).send();
    }
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(result.buffer);
  }

  @Public()
  @Get('location-map-base64')
  async locationMapBase64(@Query() query: Record<string, string>) {
    const result = await this.analyticsService.locationMapImage(
      this.normalizeLocationFilters(query),
    );
    if (!result) {
      return { data: null, contentType: null };
    }
    return { data: result.buffer.toString('base64'), contentType: result.contentType };
  }

  @Get('location-report/pdf')
  async locationReportPdf(@Res() res: Response, @Query() query: Record<string, string>) {
    const buffer = await this.analyticsService.locationReportPdf(
      this.normalizeLocationFilters(query),
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_ubicacion.pdf"');
    res.send(buffer);
  }

  private normalizeLocationFilters(query: Record<string, string>): LocationFilters {
    const parseList = (value?: string) => {
      if (!value) return undefined;
      const parsed = value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      return parsed.length > 0 ? parsed : undefined;
    };

    return {
      year: this.parseYear(query.year),
      startDate: query.startDate,
      endDate: query.endDate,
      provincias: parseList(query.provincias),
      paises: parseList(query.paises),
      zonas: parseList(query.zonas),
    };
  }

  private parseYear(value?: string): number | undefined {
    if (!value) return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 2100) {
      return undefined;
    }
    return parsed;
  }

  private parseYears(value?: string): number[] {
    if (!value) {
      const currentYear = new Date().getFullYear();
      return [currentYear - 1, currentYear];
    }
    const years = value
      .split(',')
      .map((item) => this.parseYear(item.trim()))
      .filter((year): year is number => year !== undefined);

    if (years.length === 0) {
      const currentYear = new Date().getFullYear();
      return [currentYear - 1, currentYear];
    }
    return Array.from(new Set(years)).sort((a, b) => a - b);
  }
}
