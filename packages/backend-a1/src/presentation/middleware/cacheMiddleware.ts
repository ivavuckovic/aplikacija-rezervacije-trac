import { Request, Response, NextFunction } from 'express';
import { redisClient }                     from '../../infrastructure/cache/redisClient';

export function cacheMiddleware(key: string, ttlSeconds: number) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const cacheKey = typeof key === 'function'
      ? (key as (req: Request) => string)(req)
      : key;

    try {
      const cached = await redisClient.get<unknown>(cacheKey);

      if (cached !== null) {
        res.setHeader('X-Cache', 'HIT');
        res.json(cached);
        return;
      }

      res.setHeader('X-Cache', 'MISS');

      const originalJson = res.json.bind(res);

      res.json = (body: unknown) => {
        if (res.statusCode === 200) {
          redisClient.set(cacheKey, body, ttlSeconds).catch(console.error);
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('❌ Cache middleware error:', error);
      next();
    }
  };
}
