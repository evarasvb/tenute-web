import type { Metadata } from 'next';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@components/layout/Navbar';
import Footer from '@components/layout/Footer';
import CatalogClient from '@components/catalog/CatalogClient';

const BASE_URL = 'https://www.tenute.cl';

type Props = {
  searchParams: Promise<{ categoria?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { categoria } = await searchParams;

  if (categoria) {
    // Fetch category details for per-category metadata
    const { data: cat } = await supabase
      .from('categories')
      .select('name, seo_title, seo_description')
      .eq('slug', categoria.toLowerCase())
      .single();

    const catName = cat?.name ?? categoria.replace(/-/g, ' ');
    const title = cat?.seo_title ?? `${catName} | Tenute Chile`;
    const description =
      cat?.seo_description ??
      `Compra ${catName} en Tenute. Precios mayoristas y al detalle. Despacho a todo Chile.`;
    const canonicalUrl = `${BASE_URL}/catalogo?categoria=${categoria.toLowerCase()}`;

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'Tenute',
        locale: 'es_CL',
        type: 'website',
        images: [{ url: `${BASE_URL}/og-default.jpg`, width: 1200, height: 630, alt: catName }],
      },
    };
  }

  // Default catalog metadata (no category filter)
  return {
    title: 'Catálogo de productos | Tenute Chile',
    description:
      'Explora todo el catálogo de Tenute: artículos de oficina, insumos desechables, mobiliario, tecnología y más. Despacho a todo Chile.',
    alternates: { canonical: `${BASE_URL}/catalogo` },
    openGraph: {
      title: 'Catálogo completo | Tenute Chile',
      description:
        'Todos los productos Tenute en un solo lugar. Artículos de oficina, insumos desechables, mobiliario y varios.',
      url: `${BASE_URL}/catalogo`,
      siteName: 'Tenute',
      locale: 'es_CL',
      type: 'website',
      images: [
        { url: `${BASE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'Catálogo Tenute' },
      ],
    },
  };
}

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
  return data ?? [];
}

export default async function CatalogoPage({ searchParams }: Props) {
  const categories = await getCategories();
  const { categoria } = await searchParams;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center">Cargando catálogo...</div>}>
        <CatalogClient categories={categories} />
      </Suspense>
      <Footer />
    </>
  );
}
