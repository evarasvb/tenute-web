export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  wholesale_price?: number;
  minimum_wholesale_qty?: number;
  stock: number;
  image_url?: string;
  category_id: number;
  category?: Category;
  featured: boolean;
  active: boolean;
  created_at: string;
}

export interface Customer {
  id: number;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  is_wholesale: boolean;
  created_at: string;
}

export interface Order {
  id: number;
  customer_id: number;
  customer?: Customer;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  notes?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
}
