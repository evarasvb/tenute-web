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
