// Detector de códigos de barra con doble estrategia:
//   1) API nativa BarcodeDetector (Chrome/Android/Edge) — la más rápida.
//   2) Fallback a @zxing/browser (iOS Safari, Firefox, etc.) donde la nativa
//      no existe. Antes el escáner simplemente "no funcionaba" en esos navegadores.
//
// Ambas exponen la misma interfaz `detect(video) -> [{ rawValue }]` que usa la
// página de ventas, así que el resto del código no cambia.

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorCtor = {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
};

const SUPPORTED_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'codabar', 'qr_code'];

// Throttle del fallback zxing: decodificar en cada frame (60fps) satura la CPU.
const ZXING_MIN_INTERVAL_MS = 180;

async function tryNativeDetector(): Promise<BarcodeDetectorLike | null> {
  if (typeof window === 'undefined') return null;
  const win = window as Window & { BarcodeDetector?: BarcodeDetectorCtor };
  const Native = win.BarcodeDetector;
  if (!Native) return null;
  try {
    const formats = (await Native.getSupportedFormats?.()) || [];
    // Algunos navegadores exponen BarcodeDetector pero sin formatos 1D útiles.
    if (formats.length && !formats.some((f) => f.startsWith('ean') || f.startsWith('upc') || f.startsWith('code'))) {
      return null;
    }
    try {
      return new Native({ formats: SUPPORTED_FORMATS });
    } catch {
      return new Native();
    }
  } catch {
    return null;
  }
}

async function createZxingDetector(): Promise<BarcodeDetectorLike> {
  const { BrowserMultiFormatReader } = await import('@zxing/browser');
  const reader = new BrowserMultiFormatReader();
  let canvas: HTMLCanvasElement | null = null;
  let lastAttempt = 0;

  return {
    async detect(source) {
      const now = Date.now();
      if (now - lastAttempt < ZXING_MIN_INTERVAL_MS) return [];
      lastAttempt = now;

      const video = source as HTMLVideoElement;
      const width = video?.videoWidth || 0;
      const height = video?.videoHeight || 0;
      if (!width || !height) return [];

      if (!canvas) canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return [];
      ctx.drawImage(video, 0, 0, width, height);

      try {
        const result = reader.decodeFromCanvas(canvas) as { getText?: () => string } | null;
        const text = result?.getText?.();
        return text ? [{ rawValue: text }] : [];
      } catch {
        // NotFoundException u otras: sin código en este frame.
        return [];
      }
    },
  };
}

export async function createBarcodeDetector(): Promise<BarcodeDetectorLike> {
  const native = await tryNativeDetector();
  if (native) return native;
  return createZxingDetector();
}
