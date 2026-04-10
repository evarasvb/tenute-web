import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartClient from '@/components/cart/CartClient';

export default function CartPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Carro de compras</h1>
          <CartClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
