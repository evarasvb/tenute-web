'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import Link from 'next/link';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  slug: string;
  quantity: number;
  stock: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = 'tenute_cart';

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // localStorage not available
  }
}

interface Toast {
  key: number;
  name: string;
  image_url: string | null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(loadCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      saveCart(items);
    }
  }, [items, loaded]);

  const showToast = useCallback((name: string, image_url: string | null) => {
    setToast({ key: Date.now(), name, image_url });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const addItem = useCallback((product: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock || 999) }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    showToast(product.name, product.image_url);
  }, [showToast]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(item => item.id !== id));
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: Math.min(quantity, item.stock || 999) } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}

      {/* Confirmación global al agregar al carro */}
      {toast && (
        <div
          key={toast.key}
          className="fixed z-[60] left-1/2 -translate-x-1/2 bottom-24 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0 w-[calc(100%-1.5rem)] sm:w-auto sm:max-w-sm animate-[cartToastIn_0.25s_ease-out]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 px-3 py-2.5">
            <div className="w-11 h-11 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
              {toast.image_url ? (
                <img src={toast.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl text-gray-300">📦</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-green-600 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Agregado al carro
              </p>
              <p className="text-sm text-gray-800 truncate">{toast.name}</p>
            </div>
            <Link
              href="/carro"
              onClick={() => setToast(null)}
              className="flex-shrink-0 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-2 transition-colors"
            >
              Ver carro
            </Link>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export { formatCLP };
