import type { Metadata } from 'next';
import Hero from '@/components/home/Hero';
import FeriaBanner from '@/components/home/FeriaBanner';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import Categories from '@/components/home/Categories';
import WholesaleBlock from '@/components/home/WholesaleBlock';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const BASE_URL = 'https://www.tenute.cl';

export const metadata: Metadata = {
  title: 'Tenute — Artículos de oficina, insumos desechables y más | Chile',
  description:
    'Compra artículos de oficina, insumos desechables, mobiliario y varios en Tenute. Envío a todo Chile. Stock disponible.',
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: 'Tenute — Artículos de oficina, insumos desechables y más',
    description:
      'Compra artículos de oficina, insumos desechables, mobiliario y varios en Tenute. Envío a todo Chile.',
    url: BASE_URL,
    siteName: 'Tenute',
    locale: 'es_CL',
    type: 'website',
    images: [
      {
        url: `${BASE_URL}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: 'Tenute — Tienda online Chile',
      },
    ],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Tenute',
  url: BASE_URL,
  description:
    'Artículos de oficina, insumos desechables, mobiliario y varios. Envío a todo Chile.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/catalogo?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        <Hero />
        <FeriaBanner />
        <Categories />
        <FeaturedProducts />
        <WholesaleBlock />
      </main>
      <Footer />
    </>
  );
}
