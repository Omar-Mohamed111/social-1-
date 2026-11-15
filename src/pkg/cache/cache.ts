import { Redis } from "ioredis";
import { ICacheProvider } from "./cache.interdace";

interface IRedisConfig {
  host: string;
  port: number;
  password?: string;
}

class RedisCacheProvider implements ICacheProvider {
  private client: Redis;

  constructor(config: IRedisConfig) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      lazyConnect: true,
      maxLoadingRetryTime: 3,
    });

    this.client.on("error", (err: Error) =>
      console.log("redis server error", err.message),
    );

    this.client
      .connect()
      .catch((err: Error) =>
        console.log("fail to connect to redis", err.message),
      );
  }

  async set(key: string, value: string, ttl: number): Promise<"OK" | null> {
    return await this.client.set(key, value, "EX", ttl, "NX");
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }
}

export default RedisCacheProvider;
