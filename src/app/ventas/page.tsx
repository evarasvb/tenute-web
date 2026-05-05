'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VentasShortcutPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/login?role=seller&redirect=/admin/ventas');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm text-center">
        <h1 className="text-xl font-bold text-gray-900">Acceso de ventas</h1>
        <p className="text-sm text-gray-500 mt-2">
          Redirigiendo al inicio de sesión de vendedora...
        </p>
      </div>
    </div>
  );
}
