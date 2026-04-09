export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_price?: number;
  stock: number;
  condition: string;
  image_url?: string;
  images?: string[];
  tags?: string[];
  category_id: string;
  category?: Category;
  is_featured: boolean;
  is_offer: boolean;
  is_auction: boolean;
  sku?: string;
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

export interface Order {
  id: string;
  customer_id: string;
  customer?: Customer;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  notes?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
}
