import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CheckoutClient from './CheckoutClient';

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <CheckoutClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
