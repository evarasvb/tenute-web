import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import OrderDetailClient from './OrderDetailClient';

export default function OrderPage({ params, searchParams }: {
  params: { order_number: string };
  searchParams: { t?: string | string[] };
}) {
  const token = typeof searchParams.t === 'string' ? searchParams.t : undefined;
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <OrderDetailClient orderNumber={params.order_number} token={token} />
        </div>
      </main>
      <Footer />
    </>
  );
}
