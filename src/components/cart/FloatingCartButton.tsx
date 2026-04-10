'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

export default function FloatingCartButton() {
  const { totalItems, totalPrice } = useCart();

  if (totalItems === 0) return null;

  function formatCLP(n: number) {
    return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  }

  return (
    <Link
      href="/carro"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-blue-600 text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:bg-blue-700 hover:scale-105 transition-all duration-200"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <span className="text-sm font-semibold">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
      <span className="text-sm font-bold">{formatCLP(totalPrice)}</span>
    </Link>
  );
}
