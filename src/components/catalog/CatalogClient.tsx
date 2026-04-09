'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number;
  image_url: string;
  brand: string;
  stock: number;
  categories: any;
}

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function CatalogClient({
  categories,
  brands,
}: {
  categories: Category[];
  brands: string[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 24;

  const search = searchParams.get('buscar') || '';
  const categorySlug = searchParams.get('categoria') || '';
  const brand = searchParams.get('marca') || '';

  const categoryId = categories.find((c) => c.slug === categorySlug)?.id || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('products')
      .select('id, name, slug, price, compare_price, image_url, brand, stock, categories(name)', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (brand) {
      query = query.eq('brand', brand);
    }

    query = query.order('name').range(from, to);

    const { data, count } = await query;
    setProducts(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, search, categoryId, brand]);

  useEffect(() => {
    setPage(1);
  }, [search, categorySlug, brand]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/catalogo?${params.toString()}`);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar productos..."
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateParam('buscar', (e.target as HTMLInputElement).value);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <select
          value={categorySlug}
          onChange={(e) => updateParam('categoria', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select
          value={brand}
          onChange={(e) => updateParam('marca', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todas las marcas</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <div className="text-sm text-gray-500 flex items-center">
          {total} productos encontrados
        </div>
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-5 bg-gray-200 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No se encontraron productos</p>
          <p className="text-gray-400 text-sm mt-1">Intenta con otros filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className="card flex flex-col group hover:shadow-md transition-shadow">
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
              <div className="p-3 flex flex-col gap-1 flex-1">
                <span className="text-xs text-blue-600 font-medium">
                  {(p.categories as any)?.name || p.brand || ''}
                </span>
                <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{p.name}</p>
                {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                <div className="mt-auto pt-1">
                  {p.compare_price && p.compare_price > p.price ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-gray-900">{formatCLP(p.price)}</span>
                      <span className="text-xs text-gray-400 line-through">{formatCLP(p.compare_price)}</span>
                    </div>
                  ) : (
                    <p className="text-base font-bold text-gray-900">{formatCLP(p.price)}</p>
                  )}
                </div>
                {p.stock <= 0 && (
                  <span className="text-xs text-red-500 font-medium">Agotado</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500 px-3">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
