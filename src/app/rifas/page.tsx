'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface Prize {
  id: string;
  title: string;
  image_url: string | null;
  position: number;
}

interface Rifa {
  id: string;
  title: string;
  description: string | null;
  total_tickets: number;
  ticket_price: number;
  draw_date: string | null;
  creator_name: string | null;
  rifa_prizes: Prize[];
}

export default function RifasPublicPage() {
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rifas')
      .then((r) => r.json())
      .then((d) => { setRifas(d.rifas || []); setLoading(false); });
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Hero */}
        <div className="bg-blue-600 text-white py-12 px-4 text-center">
          <div className="text-4xl mb-3">🎟️</div>
          <h1 className="text-3xl font-bold mb-2">Rifas de la comunidad</h1>
          <p className="text-blue-100 max-w-lg mx-auto text-sm mb-6">
            Gratis para todos. Crea tu rifa, compártela por WhatsApp y recibe las reservas al instante.
          </p>
          <Link href="/rifas/nueva"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-md">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Crear mi rifa gratis
          </Link>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10">
          {loading ? (
            <div className="text-center text-gray-400 py-16">Cargando rifas...</div>
          ) : rifas.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🎁</div>
              <p className="text-gray-500 mb-4">Aún no hay rifas activas.</p>
              <Link href="/rifas/nueva" className="text-blue-600 hover:underline font-medium">
                ¡Sé el primero en crear una →
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {rifas.map((rifa) => {
                const topPrize = rifa.rifa_prizes.sort((a, b) => a.position - b.position)[0];
                return (
                  <div key={rifa.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    {topPrize?.image_url ? (
                      <img src={topPrize.image_url} alt={topPrize.title} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-4xl">🏆</div>
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      <h2 className="font-bold text-gray-900 text-lg leading-tight mb-1">{rifa.title}</h2>
                      {rifa.description && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{rifa.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                        <span>🎟️ {rifa.total_tickets} números · <strong className="text-gray-700">${(rifa.ticket_price || 0).toLocaleString('es-CL')}</strong> c/u</span>
                        {rifa.draw_date && (
                          <span>📅 {new Date(rifa.draw_date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}</span>
                        )}
                        {rifa.rifa_prizes.length > 0 && <span>🏆 {rifa.rifa_prizes.length} premios</span>}
                      </div>
                      {rifa.creator_name && (
                        <p className="text-xs text-gray-400 mb-3">por {rifa.creator_name}</p>
                      )}
                      <div className="mt-auto">
                        <Link href={`/rifas/${rifa.id}`}
                          className="block w-full text-center py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
                          Ver rifa
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* How it works */}
          <div className="mt-16 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 text-lg text-center mb-6">¿Cómo funciona?</h2>
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              {[
                { emoji: '✏️', step: '1. Crea', text: 'Llena el formulario con el nombre, premios y precio del número. Gratis, sin registro.' },
                { emoji: '🔗', step: '2. Comparte', text: 'Copia el link de tu rifa y compártelo por WhatsApp, Instagram o donde quieras.' },
                { emoji: '✅', step: '3. Confirma', text: 'Recibe las reservas. Cuando alguien transfiere, confirmas el pago desde tu panel.' },
              ].map(({ emoji, step, text }) => (
                <div key={step}>
                  <div className="text-3xl mb-2">{emoji}</div>
                  <p className="font-semibold text-gray-900 mb-1">{step}</p>
                  <p className="text-sm text-gray-500">{text}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link href="/rifas/nueva"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
                Crear mi rifa gratis →
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
