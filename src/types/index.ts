export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

export interface ProductMetadata {
  additional_images?: string[];
  video_url?: string;
  warehouse_stock?: {
    ocoa: number;
    local21: number;
  };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_price?: number;
  stock: number;
  stock_ocoa?: number;
  stock_local21?: number;
  stock_local?: number;
  condition: string;
  image_url?: string;
  images?: string[];
  tags?: string[];
  metadata?: ProductMetadata;
  video_url?: string;
  category_id: string;
  category?: Category;
  is_featured: boolean;
  is_offer: boolean;
  is_auction: boolean;
  active: boolean;
  sku?: string;
  barcode?: string;
  brand?: string;
  unit: string;
  format?: string;
  content_info?: string;
  cost_price?: number;
  margin?: number;
  created_at: string;
  updated_at?: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  rut?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  condiciones_pago: string;
  notas?: string;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

// ─────────────────────────────────────────────
// Order types
// ─────────────────────────────────────────────
export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_name: string;
  product_sku?: string | null;
  product_image_url?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_rut?: string;
  shipping_address?: string;
  shipping_commune?: string;
  shipping_city?: string;
  shipping_region?: string;
  shipping_method?: string;
  shipping_cost: number;
  subtotal: number;
  discount?: number;
  total: number;
  status: OrderStatus;
  payment_method?: string;
  payment_id?: string;
  payment_status?: string;
  notes?: string;
  admin_notes?: string;
  tracking_number?: string;
  items?: OrderItem[];
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

// ─────────────────────────────────────────────
// Shipping types
// ─────────────────────────────────────────────
export type ShippingZoneType = 'free' | 'local' | 'starken';

export interface ShippingZone {
  id: string;
  zone_type: ShippingZoneType;
  commune_name: string;
  delivery_cost: number;
  estimated_days?: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Raffle {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  hero_image_url?: string | null;
  social_hashtag?: string | null;
  draw_place?: string | null;
  draw_date?: string | null;
  number_price: number;
  total_numbers: number;
  available_numbers: number;
  status: 'draft' | 'published';
  featured_products?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface RafflePurchase {
  id: string;
  raffle_id: string;
  raffle_slug: string;
  raffle_title: string;
  raffle_number: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  payment_method: 'flow' | 'transfer' | 'whatsapp' | string;
  payment_id?: string | null;
  order_number: string;
  created_at?: string;
  updated_at?: string;
}
