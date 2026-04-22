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
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'preparing'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

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
  total_price?: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_rut?: string | null;
  shipping_method?: 'pickup' | 'local_delivery' | 'starken' | string;
  shipping_address?: string | null;
  shipping_commune?: string | null;
  shipping_city?: string | null;
  shipping_region?: string | null;
  shipping_cost?: number;
  payment_method?: string | null;
  payment_id?: string | null;
  payment_status?: string;
  status: OrderStatus | string;
  subtotal: number;
  discount?: number;
  total: number;
  tracking_number?: string | null;
  notes?: string | null;
  admin_notes?: string | null;
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
