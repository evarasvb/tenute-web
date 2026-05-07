if (typeof (globalThis as { File?: unknown }).File === 'undefined') {
  class PolyfillFile {
    name: string;
    type: string;
    size: number;
    lastModified: number;

    constructor(
      _chunks: unknown[] = [],
      name = 'polyfill-file',
      options: { type?: string; lastModified?: number } = {}
    ) {
      this.name = name;
      this.type = options.type || '';
      this.lastModified = options.lastModified || Date.now();
      this.size = 0;
    }
  }

  (globalThis as { File?: unknown }).File = PolyfillFile;
}
