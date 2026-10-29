import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AnnotationResult } from "@mabarint/types";

export function cacheKey(parts: Record<string, string>): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

/** In-memory LRU-ish cache with an optional JSON file per entry on disk. */
export class AnnotationCache {
  private mem = new Map<string, AnnotationResult>();

  constructor(private dir?: string, private maxEntries = 500) {}

  async get(key: string): Promise<AnnotationResult | undefined> {
    const hit = this.mem.get(key);
    if (hit) return hit;
    if (!this.dir) return undefined;
    try {
      const value = JSON.parse(await readFile(join(this.dir, `${key}.json`), "utf8")) as AnnotationResult;
      this.remember(key, value);
      return value;
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: AnnotationResult): Promise<void> {
    this.remember(key, value);
    if (!this.dir) return;
    try {
      await mkdir(this.dir, { recursive: true });
      await writeFile(join(this.dir, `${key}.json`), JSON.stringify(value));
    } catch {
      // A read-only or full disk only costs us the persistent copy.
    }
  }

  private remember(key: string, value: AnnotationResult) {
    this.mem.delete(key);
    this.mem.set(key, value);
    if (this.mem.size > this.maxEntries) this.mem.delete(this.mem.keys().next().value!);
  }
}
