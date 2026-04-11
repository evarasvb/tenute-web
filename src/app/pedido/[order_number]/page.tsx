import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import OrderDetailClient from './OrderDetailClient';

export default function OrderPage({ params }: { params: { order_number: string } }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <OrderDetailClient orderNumber={params.order_number} />
        </div>
      </main>
      <Footer />
    </>
  );
}
