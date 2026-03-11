import axios, { AxiosError } from 'axios';
import { redisClient }       from '../../infrastructure/cache/redisClient';
import { ExchangeRateResult } from '../../domain/types';

interface ExchangeRateApiResponse {
  result:            string;
  base_code:         string;
  conversion_rates:  Record<string, number>;
}

export class ExchangeRateService {
  private readonly apiKey:  string;
  private readonly baseUrl: string;
  private readonly ttl:     number;

  constructor() {
    this.apiKey  = process.env.EXCHANGE_RATE_KEY     ?? '';
    this.baseUrl = process.env.EXCHANGE_RATE_BASE_URL ?? 'https://v6.exchangerate-api.com/v6';
    this.ttl     = parseInt(process.env.EXCHANGE_RATE_CACHE_TTL ?? '3600', 10);
  }

  async getRate(
    base:   string = 'RSD',
    target: string,
  ): Promise<ExchangeRateResult> {
    const normalizedBase   = base.toUpperCase();
    const normalizedTarget = target.toUpperCase();

    if (normalizedBase === normalizedTarget) {
      return {
        base:      normalizedBase,
        target:    normalizedTarget,
        rate:      1,
        isStale:   false,
        fetchedAt: new Date().toISOString(),
      };
    }

    const cacheKey = `exchange:${normalizedBase}:${normalizedTarget}`;

    const cached = await redisClient.getStale<number>(cacheKey);
    if (cached !== null) {
      return {
        base:      normalizedBase,
        target:    normalizedTarget,
        rate:      cached.data,
        isStale:   cached.isStale,
        fetchedAt: new Date().toISOString(),
      };
    }

    try {
      const rate = await this.fetchFromApi(normalizedBase, normalizedTarget);

      await redisClient.setWithStale(cacheKey, rate, this.ttl);

      return {
        base:      normalizedBase,
        target:    normalizedTarget,
        rate,
        isStale:   false,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      const stale = await redisClient.getStale<number>(cacheKey);
      if (stale !== null) {
        console.warn(`⚠  ExchangeRate API unavailable. Using stale rate for ${normalizedBase}→${normalizedTarget}`);
        return {
          base:      normalizedBase,
          target:    normalizedTarget,
          rate:      stale.data,
          isStale:   true,
          fetchedAt: new Date().toISOString(),
        };
      }

      const errMsg = error instanceof AxiosError
        ? error.message
        : 'Unknown error';
      throw new Error(`Exchange rate unavailable for ${normalizedBase}→${normalizedTarget}: ${errMsg}`);
    }
  }

  private async fetchFromApi(base: string, target: string): Promise<number> {
    const url = `${this.baseUrl}/${this.apiKey}/latest/${base}`;

    const response = await axios.get<ExchangeRateApiResponse>(url, {
      timeout: 5000,
    });

    if (response.data.result !== 'success') {
      throw new Error(`ExchangeRate API error: ${response.data.result}`);
    }

    const rate = response.data.conversion_rates[target];
    if (rate === undefined) {
      throw new Error(`Currency ${target} not found in API response`);
    }

    return rate;
  }

  async getAllRates(base: string = 'RSD'): Promise<Record<string, number>> {
    const url = `${this.baseUrl}/${this.apiKey}/latest/${base.toUpperCase()}`;

    const response = await axios.get<ExchangeRateApiResponse>(url, {
      timeout: 5000,
    });

    if (response.data.result !== 'success') {
      throw new Error(`ExchangeRate API error`);
    }

    return response.data.conversion_rates;
  }
}

export const exchangeRateService = new ExchangeRateService();
