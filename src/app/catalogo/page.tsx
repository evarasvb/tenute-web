import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CatalogClient from '@/components/catalog/CatalogClient';

async function getCategories() {
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name');
  return data || [];
}

async function getBrands() {
  const { data } = await supabase
    .from('products')
    .select('brand')
    .not('brand', 'is', null)
    .neq('brand', '');

  const brands = Array.from(new Set(data?.map((d) => d.brand).filter(Boolean))).sort();
  return brands as string[];
}

export default async function CatalogoPage() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo</h1>
          <p className="text-gray-500 mb-6">Explora todos nuestros productos.</p>
          <Suspense fallback={<div className="text-center py-12 text-gray-400">Cargando productos...</div>}>
            <CatalogClient categories={categories} brands={brands} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
