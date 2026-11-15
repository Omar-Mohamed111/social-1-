import { Request, Response, NextFunction } from "express";
import { cacheProvider } from "./init";

// Create a cache middleware
// TTL = Time To Live (in seconds)
// Default value: 3600 seconds = 1 hour

const withCache = (ttl: number = 3600) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> => {
    // Create a unique key for each request
    const key = `${req.method}:${req.originalUrl}`;

    try {
      // Check if requested data exists in Redis
      const cached = await cacheProvider.get(key);

      if (cached) {
        res.setHeader("X-Cache", "HIT");

        return res.json(JSON.parse(cached));
      }

      // Save the original Express json method
      const originalJson = res.json.bind(res);

      // Override res.json to intercept the response
      res.json = (body: unknown) => {
        // Cache only successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheProvider
            .set(key, JSON.stringify(body), ttl)
            .catch((err: Error) => {
              console.error("Cache set failed:", err.message);
            });
        }

        res.setHeader("X-Cache", "MISS");

        return originalJson(body);
      };

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default withCache;
