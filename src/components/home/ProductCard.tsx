'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_price?: number | null;
    image_url?: string | null;
    stock?: number;
    categories?: { name: string } | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const p = product;
  const stock = p.stock ?? 0;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: p.id,
      name: p.name,
      price: p.price,
      image_url: p.image_url || null,
      slug: p.slug,
      stock: stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="card flex flex-col group hover:shadow-md transition-shadow">
      <Link href={`/producto/${p.slug}`} className="block">
        <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <span className="text-4xl text-gray-300">📦</span>
          )}
        </div>
      </Link>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <span className="text-xs text-blue-600 font-medium">
          {(p.categories as any)?.name || ''}
        </span>
        <Link href={`/producto/${p.slug}`} className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 hover:text-blue-600">
          {p.name}
        </Link>
        <div className="mt-auto">
          {p.compare_price && p.compare_price > p.price ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-gray-900">{formatCLP(p.price)}</span>
              <span className="text-xs text-gray-400 line-through">{formatCLP(p.compare_price)}</span>
            </div>
          ) : (
            <p className="text-base font-bold text-gray-900">{formatCLP(p.price)}</p>
          )}
        </div>
        {stock <= 0 ? (
          <span className="text-xs text-red-500 font-medium">Agotado</span>
        ) : (
          <button
            onClick={handleAdd}
            className={`mt-1 w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${
              added
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            {added ? 'Agregado' : 'Agregar al carro'}
          </button>
        )}
      </div>
    </div>
  );
}
