/**
 * Google Analytics Events for Tenute.cl
 * Tracks purchase conversions and ecommerce data
 */

interface OrderItem {
    product_id: string;
    product_name: string;
    product_sku?: string;
    quantity: number;
    unit_price: number;
}

interface PurchaseEventData {
    order_id: string;
    value: number;
    currency: string;
    items: OrderItem[];
    customer_email?: string;
    shipping_cost?: number;
}

/**
 * Fire purchase event to Google Analytics
 * Call this when an order is successfully created via Flow payment
 */
export function trackPurchaseEvent(data: PurchaseEventData) {
    if (typeof window === 'undefined' || !window.gtag) {
          console.log('GA not available, skipping purchase event');
          return;
    }

  const items = data.items.map(item => ({
        item_id: item.product_id,
        item_name: item.product_name,
        item_sku: item.product_sku,
        quantity: item.quantity,
        price: item.unit_price,
  }));

  window.gtag('event', 'purchase', {
        transaction_id: data.order_id,
        value: data.value,
        currency: data.currency,
        items: items,
        shipping_tier: data.shipping_cost ? 'paid' : 'included',
  });

  // Also send to GTM for additional tracking
  if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
                event: 'purchase',
                ecommerce: {
                          transaction_id: data.order_id,
                          value: data.value,
                          currency: data.currency,
                          shipping: data.shipping_cost || 0,
                          items: items,
                },
        });
  }
}

/**
 * Fire add_to_cart event for checkout initiation
 */
export function trackAddToCart(items: OrderItem[], cartValue: number) {
    if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'add_to_cart', {
        value: cartValue,
        currency: 'CLP',
        items: items.map(item => ({
                item_id: item.product_id,
                item_name: item.product_name,
                quantity: item.quantity,
                price: item.unit_price,
        })),
  });
}

/**
 * Fire begin_checkout event
 */
export function trackBeginCheckout(items: OrderItem[], cartValue: number) {
    if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'begin_checkout', {
        value: cartValue,
        currency: 'CLP',
        items: items.map(item => ({
                item_id: item.product_id,
                item_name: item.product_name,
                quantity: item.quantity,
                price: item.unit_price,
        })),
  });
}

/**
 * Fire page_view with UTM parameters for multicanal tracking
 */
export function trackPageView(
    pagePath: string,
    pageTitle: string,
    channel: 'organic' | 'direct' | 'facebook' | 'mercadolibre' = 'direct'
  ) {
    if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', 'G-VXRMWZ471Q', {
        page_path: pagePath,
        page_title: pageTitle,
        custom_channel: channel,
  });
}

declare global {
    interface Window {
          gtag?: (...args: any[]) => void;
          dataLayer?: any[];
    }
}
