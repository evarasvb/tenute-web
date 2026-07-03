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
    default: 'Tenute | Artículos de Oficina, Insumos Desechables | Mayorista Chile',
    template: '%s | Tenute',
  },
  description:
'Compra artículos de oficina, insumos desechables y mobiliario baratos. Mayorista y retail. 666+ productos. Envío a todo Chile desde Hijuelas.',
  openGraph: {
    title: 'Tenute',
    description: 'Artículos de oficina, insumos desechables y varios.',
    locale: 'es_CL',
        keywords: 'artículos de oficina, insumos desechables, mobiliario, mayorista, compra online',
    type: 'website',
  },
      other: {
      'google-site-verification': 'jc7KIfL9J-fpJ9VJmR7G1G59g2UxZHNxFBgG2AFlf7k',
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
