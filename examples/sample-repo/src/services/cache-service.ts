import { createLogger } from '../utils/logger';
import { DatabaseService } from './database-service';

export class CacheService {
  private logger = createLogger('CacheService');
  private cache: Map<string, any>;
  private ttl: number;

  constructor(ttl: number = 3600) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key: string, value: any): void {
    this.logger.log(`Setting cache: ${key}`);
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key: string): any {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.timestamp;
    
    if (age > this.ttl * 1000) {
      this.logger.warn(`Cache expired: ${key}`);
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  delete(key: string): void {
    this.logger.log(`Deleting cache: ${key}`);
    this.cache.delete(key);
  }

  clear(): void {
    this.logger.log('Clearing all cache');
    this.cache.clear();
  }
}
