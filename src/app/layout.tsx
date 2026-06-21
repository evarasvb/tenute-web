import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/contexts/CartContext';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import FloatingCartButton from '@/components/cart/FloatingCartButton';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.tenute.cl'),
  title: {
    default: 'Tenute — Artículos de oficina, insumos desechables y más',
    template: '%s | Tenute',
  },
  description:
    'Tenute ofrece artículos de oficina, insumos desechables, mobiliario y más. Venta al por menor y mayorista, despacho a todo Chile.',
  openGraph: {
    title: 'Tenute',
    description: 'Artículos de oficina, insumos desechables y varios.',
    locale: 'es_CL',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        <CartProvider>
          {children}
          <FloatingCartButton />
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}
