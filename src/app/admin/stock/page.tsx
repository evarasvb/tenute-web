'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StockPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/products?tab=stock');
  }, [router]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">Redirigiendo a productos e inventario</h1>
        <p className="text-sm text-gray-500 mt-2">
          Ahora productos y stock están fusionados en una sola pestaña.
        </p>
      </div>
    </div>
  );
}
