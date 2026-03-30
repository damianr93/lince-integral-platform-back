import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ─── Tipo raw que devuelve la API de YCloud ───────────────────────────────────
interface YCloudRawTemplate {
  officialTemplateId: string;
  wabaId: string;
  name: string;
  language: string;
  category: string;
  status: string;
  qualityRating?: string;
  messageSendTtlSeconds?: number;
  components?: {
    type: string;
    text?: string;
    format?: string;
    buttons?: { type: string; text: string }[];
  }[];
}

// ─── Tipo normalizado que expone el service ───────────────────────────────────
export interface YCloudTemplate {
  id: string;           // officialTemplateId
  wabaId: string;
  name: string;
  language: string;
  status: string;
  category: string;
  content: string;      // texto del componente BODY
  headerFormat?: string;
  headerExample?: string; // URL de imagen del header (para templates IMAGE)
  footerText?: string;
  buttons?: { type: string; text: string }[];
}

export interface YCloudSendResult {
  id: string;
  status: string;
  whatsappMessageId?: string;
}

export interface YCloudError {
  code: string;
  message: string;
  status: number;
  isTransient: boolean;
}

const YCLOUD_BASE = 'https://api.ycloud.com/v2';
const TRANSIENT_HTTP_STATUSES = new Set([429, 500, 502, 503, 504]);

@Injectable()
export class YCloudClient {
  private readonly logger = new Logger(YCloudClient.name);

  constructor(private readonly config: ConfigService) {}

  private get apiKey(): string {
    return this.config.getOrThrow<string>('YCLOUD_API_KEY');
  }

  private headers(): Record<string, string> {
    return {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  private normalizeTemplate(raw: YCloudRawTemplate): YCloudTemplate {
    const body = raw.components?.find((c) => c.type === 'BODY');
    const header = raw.components?.find((c) => c.type === 'HEADER');
    const footer = raw.components?.find((c) => c.type === 'FOOTER');
    const buttonsComp = raw.components?.find((c) => c.type === 'BUTTONS');

    const headerExample = header?.format === 'IMAGE'
      ? (header as any)?.example?.header_url?.[0] as string | undefined
      : undefined;

    return {
      id: raw.officialTemplateId,
      wabaId: raw.wabaId,
      name: raw.name,
      language: raw.language,
      status: raw.status,
      category: raw.category,
      content: body?.text ?? '',
      headerFormat: header?.format,
      headerExample,
      footerText: footer?.text,
      buttons: buttonsComp?.buttons,
    };
  }

  async listApprovedTemplates(): Promise<YCloudTemplate[]> {
    const results: YCloudTemplate[] = [];
    let page = 1;
    const limit = 100;

    while (true) {
      const url = `${YCLOUD_BASE}/whatsapp/templates?page=${page}&limit=${limit}&includeTotal=false`;
      const res = await fetch(url, { headers: this.headers() });

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`YCloud templates fetch failed: ${res.status} ${body}`);
        throw this.buildError(res.status, body);
      }

      const data = (await res.json()) as { items: YCloudRawTemplate[] };


      const approved = data.items
        .filter((t) => t.status === 'APPROVED')
        .map((t) => this.normalizeTemplate(t));

      results.push(...approved);

      if (data.items.length < limit) break;
      page++;
    }

    return results;
  }

  async sendTemplateMessage(params: {
    to: string;
    phoneNumberId: string;
    templateName: string;
    templateLanguage: string;
    headerImageUrl?: string;
    externalId?: string;
  }): Promise<YCloudSendResult> {
    const components: Record<string, any>[] = [];
    if (params.headerImageUrl) {
      components.push({
        type: 'header',
        parameters: [{ type: 'image', image: { link: params.headerImageUrl } }],
      });
    }

    const body = {
      from: params.phoneNumberId,
      to: params.to,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.templateLanguage },
        ...(components.length > 0 ? { components } : {}),
      },
      ...(params.externalId ? { externalId: params.externalId } : {}),
    };

    const res = await fetch(`${YCLOUD_BASE}/whatsapp/messages/sendDirectly`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const raw = await res.text();
      this.logger.warn(`YCloud send failed [${res.status}]: ${raw}`);
      throw this.buildError(res.status, raw);
    }

    return res.json() as Promise<YCloudSendResult>;
  }

  async verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string,
  ): Promise<boolean> {
    const secret = this.config.get<string>('YCLOUD_WEBHOOK_SECRET', '');
    if (!secret) {
      this.logger.warn('YCLOUD_WEBHOOK_SECRET not configured — skipping signature validation');
      return true;
    }

    const parts = Object.fromEntries(
      signatureHeader.split(',').map((p) => p.split('=')),
    );
    const timestamp = parts['t'];
    const signature = parts['s'];

    if (!timestamp || !signature) return false;

    const payload = `${timestamp}.${rawBody}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, messageData);
    const computed = Buffer.from(sig).toString('hex');

    return computed.length === signature.length &&
      computed.split('').every((c, i) => c === signature[i]);
  }

  private buildError(status: number, body: string): YCloudError {
    let parsed: Record<string, any> = {};
    try { parsed = JSON.parse(body); } catch { /* ok */ }

    return {
      code: parsed['code'] ?? 'UNKNOWN',
      message: parsed['message'] ?? body,
      status,
      isTransient: TRANSIENT_HTTP_STATUSES.has(status),
    };
  }
}
