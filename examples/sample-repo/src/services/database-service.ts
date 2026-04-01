import { createLogger } from '../utils/logger';
import { CacheService } from './cache-service';

export class DatabaseService {
  private logger = createLogger('DatabaseService');
  private cache: CacheService;
  private data: Map<string, Map<string, any>>;

  constructor(cache: CacheService) {
    this.cache = cache;
    this.data = new Map();
  }

  async save(collection: string, id: string, value: any): Promise<void> {
    this.logger.log(`Saving to ${collection}: ${id}`);
    
    if (!this.data.has(collection)) {
      this.data.set(collection, new Map());
    }

    this.data.get(collection)!.set(id, value);
    this.cache.set(`${collection}:${id}`, value);
  }

  async get(collection: string, id: string): Promise<any> {
    const cacheKey = `${collection}:${id}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    this.logger.log(`Fetching from ${collection}: ${id}`);
    const collectionData = this.data.get(collection);
    
    if (!collectionData) {
      return null;
    }

    const value = collectionData.get(id);
    
    if (value) {
      this.cache.set(cacheKey, value);
    }

    return value || null;
  }

  async delete(collection: string, id: string): Promise<void> {
    this.logger.log(`Deleting from ${collection}: ${id}`);
    this.data.get(collection)?.delete(id);
    this.cache.delete(`${collection}:${id}`);
  }
}
