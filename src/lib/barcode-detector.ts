type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorCtor = {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
};

const SUPPORTED_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'codabar', 'qr_code'];

export async function ensureBarcodeDetector(): Promise<BarcodeDetectorCtor> {
  const win = window as Window & { BarcodeDetector?: BarcodeDetectorCtor };
  const Native = win.BarcodeDetector;

  if (Native) {
    try {
      await Native.getSupportedFormats?.();
      return Native;
    } catch {
      // If native detector is partially broken, continue to polyfill.
    }
  }

  throw new Error('BarcodeDetector no soportado en este navegador');
}

export async function createBarcodeDetector(): Promise<BarcodeDetectorLike> {
  const Detector = await ensureBarcodeDetector();
  try {
    return new Detector({ formats: SUPPORTED_FORMATS });
  } catch {
    return new Detector();
  }
}
