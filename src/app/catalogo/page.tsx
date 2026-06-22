import type { Metadata } from 'next';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CatalogClient from '@/components/catalog/CatalogClient';

const BASE_URL = 'https://www.tenute.cl';

export const metadata: Metadata = {
  title: 'Catálogo de productos | Tenute Chile',
  description:
    'Explora todo el catálogo de Tenute: artículos de oficina, insumos desechables, mobiliario, tecnología y más. Despacho a todo Chile.',
  alternates: {
    canonical: `${BASE_URL}/catalogo`,
  },
  openGraph: {
    title: 'Catálogo completo | Tenute Chile',
    description:
      'Todos los productos Tenute en un solo lugar. Artículos de oficina, insumos desechables, mobiliario y varios.',
    url: `${BASE_URL}/catalogo`,
    siteName: 'Tenute',
    locale: 'es_CL',
    type: 'website',
    images: [
      {
        url: `${BASE_URL}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: 'Catálogo Tenute',
      },
    ],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Catálogo de productos Tenute',
  description:
    'Artículos de oficina, insumos desechables, mobiliario y varios con despacho a todo Chile.',
  url: `${BASE_URL}/catalogo`,
  isPartOf: {
    '@type': 'WebSite',
    name: 'Tenute',
    url: BASE_URL,
  },
};

async function getCategories() {
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name');
  return data || [];
}

export default async function CatalogoPage() {
  const categories = await getCategories();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo</h1>
          <p className="text-gray-500 mb-6">Explora todos nuestros productos.</p>
          <Suspense fallback={<div className="text-center py-12 text-gray-400">Cargando productos...</div>}>
            <CatalogClient categories={categories} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
