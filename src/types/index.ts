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
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  product_sku?: string;
  product_image_url?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
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
  shipping_region?: string;
  shipping_cost?: number;
  subtotal: number;
  discount?: number;
  total: number;
  status: OrderStatus;
  payment_method?: string;
  payment_status?: string;
  notes?: string;
  items?: OrderItem[];
  created_at: string;
  updated_at?: string;
}

// ─────────────────────────────────────────────
// Shipping types
// ─────────────────────────────────────────────
export type ShippingZoneType = 'free' | 'local' | 'starken';

export interface ShippingZone {
  id: string;
  commune_name: string;
  zone_type: ShippingZoneType;
  delivery_cost: number;
  estimated_days?: string;
}
