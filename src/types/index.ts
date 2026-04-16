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

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  is_wholesale: boolean;
  created_at: string;
}

export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
export type ShippingMethod = 'pickup' | 'local_delivery' | 'starken';
export type PaymentMethod = 'mercadopago' | 'transfer' | 'whatsapp' | 'flow';

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_rut?: string;
  shipping_address?: string;
  shipping_commune?: string;
  shipping_city?: string;
  shipping_region?: string;
  shipping_method: ShippingMethod;
  shipping_cost: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_id?: string;
  mercadopago_preference_id?: string;
  tracking_number?: string;
  admin_notes?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku?: string;
  product_image_url?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at?: string;
}

export interface ShippingZone {
  id: string;
  commune_name: string;
  zone_type: 'local' | 'starken';
  delivery_cost: number;
  estimated_days: string;
  is_active: boolean;
}
