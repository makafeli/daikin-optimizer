/**
 * Local storage cache implementation
 */
export class LocalStorageCache {
  private prefix: string

  constructor(prefix = 'daikin_') {
    this.prefix = prefix
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const item = {
      value,
      timestamp: Date.now(),
      expiry: ttl ? Date.now() + ttl : undefined
    }

    try {
      localStorage.setItem(
        this.getKey(key),
        JSON.stringify(item)
      )
    } catch (error) {
      console.error('Cache write error:', error)
      throw new Error('Failed to write to cache')
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = localStorage.getItem(this.getKey(key))
      if (!data) return null

      const item = JSON.parse(data)
      
      // Check expiry
      if (item.expiry && item.expiry < Date.now()) {
        await this.delete(key)
        return null
      }

      return item.value as T
    } catch (error) {
      console.error('Cache read error:', error)
      return null
    }
  }

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(this.getKey(key)) !== null
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.getKey(key))
  }

  async clear(): Promise<void> {
    const keys = this.getAllKeys()
    keys.forEach(key => localStorage.removeItem(key))
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  private getAllKeys(): string[] {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.prefix)) {
        keys.push(key)
      }
    }
    return keys
  }
}