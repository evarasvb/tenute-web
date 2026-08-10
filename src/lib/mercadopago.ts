import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

/**
 * Integración con MercadoPago Checkout Pro (SDK v2).
 * Sigue el mismo patrón que src/lib/flow.ts: helpers de configuración por
 * variables de entorno, un flag de habilitación y funciones de alto nivel.
 */

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN is not set');
  return token;
}

function getClient(): MercadoPagoConfig {
  return new MercadoPagoConfig({ accessToken: getAccessToken() });
}

export function isMercadoPagoEnabled(): boolean {
  return !!process.env.MERCADOPAGO_ACCESS_TOKEN;
}

export interface MercadoPagoItem {
  id?: string;
  title: string;
  quantity: number;
  unit_price: number;
  description?: string;
  picture_url?: string;
  currency_id?: string;
}

/**
 * Crea una preferencia de pago de Checkout Pro.
 * Devuelve el preferenceId y los init_point (producción / sandbox).
 */
export async function createMercadoPagoPreference(opts: {
  items: MercadoPagoItem[];
  externalReference: string;
  backUrls: { success: string; failure: string; pending: string };
  notificationUrl: string;
  payerEmail?: string;
}): Promise<{ id: string; initPoint: string; sandboxInitPoint: string }> {
  const client = getClient();
  const preference = new Preference(client);

  const result = await preference.create({
    body: {
      items: opts.items.map((item, index) => ({
        id: item.id ?? String(index),
        title: item.title,
        quantity: Math.max(1, Math.round(item.quantity)),
        unit_price: Math.round(item.unit_price),
        description: item.description,
        picture_url: item.picture_url,
        currency_id: item.currency_id ?? 'CLP',
      })),
      external_reference: opts.externalReference,
      back_urls: {
        success: opts.backUrls.success,
        failure: opts.backUrls.failure,
        pending: opts.backUrls.pending,
      },
      auto_return: 'approved',
      notification_url: opts.notificationUrl,
      ...(opts.payerEmail ? { payer: { email: opts.payerEmail } } : {}),
    },
  });

  return {
    id: result.id ?? '',
    initPoint: result.init_point ?? '',
    sandboxInitPoint: result.sandbox_init_point ?? '',
  };
}

/**
 * Obtiene el detalle de un pago de MercadoPago por su id.
 * Usado por el webhook de notificaciones.
 */
export async function getMercadoPagoPayment(paymentId: string): Promise<{
  id?: number;
  status?: string;
  external_reference?: string;
}> {
  const client = getClient();
  const payment = new Payment(client);
  const result = await payment.get({ id: paymentId });
  return {
    id: result.id,
    status: result.status,
    external_reference: result.external_reference,
  };
}
