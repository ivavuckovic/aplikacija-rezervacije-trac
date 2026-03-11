import Redis from 'ioredis';

class RedisClient {
  private client: Redis;
  private isConnected = false;
  private readonly PREFIX = 'trac:';

  constructor() {
    this.client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect:          true,
      retryStrategy: (times: number) => {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
    });

    this.client.on('error',   (err) => console.error('❌ Redis error:', err));
    this.client.on('connect', ()    => console.log('✅ Redis connected'));
    this.client.on('close',   ()    => { this.isConnected = false; });
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    this.isConnected = false;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;
    try {
      const value = await this.client.get(this.PREFIX + key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.set(
        this.PREFIX + key,
        JSON.stringify(value),
        'EX',
        ttlSeconds,
      );
    } catch (err) {
      console.error('❌ Redis SET error:', err);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.del(this.PREFIX + key);
    } catch (err) {
      console.error('❌ Redis DEL error:', err);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      const keys = await this.client.keys(this.PREFIX + pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (err) {
      console.error('❌ Redis DEL pattern error:', err);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      return (await this.client.exists(this.PREFIX + key)) === 1;
    } catch {
      return false;
    }
  }

  async setWithStale<T>(
    key:        string,
    value:      T,
    ttlSeconds: number,
  ): Promise<void> {
    if (!this.isConnected) return;
    try {
      const payload = {
        data:      value,
        cachedAt:  Date.now(),
        expiresAt: Date.now() + ttlSeconds * 1000,
      };
      await this.client.set(
        this.PREFIX + 'stale:' + key,
        JSON.stringify(payload),
        'EX',
        ttlSeconds * 2,
      );
      await this.set(key, value, ttlSeconds);
    } catch (err) {
      console.error('❌ Redis setWithStale error:', err);
    }
  }

  async getStale<T>(key: string): Promise<{ data: T; isStale: boolean } | null> {
    if (!this.isConnected) return null;
    try {
      const fresh = await this.get<T>(key);
      if (fresh !== null) return { data: fresh, isStale: false };

      const staleRaw = await this.client.get(this.PREFIX + 'stale:' + key);
      if (!staleRaw) return null;

      const payload = JSON.parse(staleRaw) as {
        data:      T;
        cachedAt:  number;
        expiresAt: number;
      };
      return { data: payload.data, isStale: true };
    } catch {
      return null;
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

export const redisClient = new RedisClient();
