'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface PublicRaffle {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
  social_hashtag: string | null;
  draw_place: string | null;
  draw_date: string | null;
  number_price: number;
  total_numbers: number;
  available_numbers: number;
  featured_products: string[] | null;
}

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function RifasPage() {
  const [raffles, setRaffles] = useState<PublicRaffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/rifas')
      .then((res) => res.json())
      .then((data) => setRaffles(data.data || []))
      .catch(() => setError('No se pudieron cargar las rifas'))
      .finally(() => setLoading(false));
  }, []);

  const topRaffle = useMemo(() => raffles[0] || null, [raffles]);

  return (
    <>
      <Navbar />
      <main className="bg-gradient-to-b from-pink-50 via-white to-blue-50 min-h-screen">
        <section className="max-w-6xl mx-auto px-4 pt-10 pb-8">
          <div className="rounded-3xl border border-pink-200 bg-white shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 md:p-10">
                <span className="inline-flex px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold uppercase tracking-wide">
                  Rifa online
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 leading-tight">
                  Compra tu número y participa por premios increíbles
                </h1>
                <p className="text-gray-600 mt-3 text-sm md:text-base">
                  Comparte tu participación en Instagram, TikTok y WhatsApp. Más visibilidad, más emoción y más ventas.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">#rifaonline</span>
                  <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">#compraTuNumero</span>
                  <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">#tenute</span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold">
                    Promocionar en Instagram
                  </a>
                  <a href="https://wa.me/56987299147" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold">
                    Compartir por WhatsApp
                  </a>
                </div>
              </div>
              <div className="relative bg-gray-100 min-h-[280px]">
                {topRaffle?.hero_image_url ? (
                  <img src={topRaffle.hero_image_url} alt={topRaffle.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                    Sube imagen principal de la rifa desde Admin
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Rifas disponibles</h2>
            <Link href="/catalogo" className="text-sm text-blue-700 font-medium hover:underline">Ver catálogo</Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
                  <div className="h-5 w-56 bg-gray-200 rounded" />
                  <div className="h-4 w-40 bg-gray-200 rounded mt-3" />
                  <div className="h-4 w-44 bg-gray-200 rounded mt-2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">{error}</div>
          ) : raffles.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 text-sm">
              No hay rifas publicadas todavía.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {raffles.map((raffle) => {
                const sold = Math.max(0, raffle.total_numbers - raffle.available_numbers);
                const soldPercent = raffle.total_numbers > 0 ? Math.round((sold / raffle.total_numbers) * 100) : 0;
                return (
                  <article key={raffle.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                    {raffle.hero_image_url && (
                      <img src={raffle.hero_image_url} alt={raffle.title} className="w-full h-44 object-cover" />
                    )}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900">{raffle.title}</h3>
                      {raffle.description && <p className="text-sm text-gray-600 mt-2">{raffle.description}</p>}

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-gray-50 p-2">
                          <p className="text-gray-500">Precio número</p>
                          <p className="font-semibold text-gray-900">{formatCLP(raffle.number_price || 0)}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2">
                          <p className="text-gray-500">Lugar sorteo</p>
                          <p className="font-semibold text-gray-900">{raffle.draw_place || 'Por definir'}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Números vendidos: {sold}</span>
                          <span>{soldPercent}%</span>
                        </div>
                        <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${Math.min(100, soldPercent)}%` }} />
                        </div>
                      </div>

                      {Array.isArray(raffle.featured_products) && raffle.featured_products.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Premios</p>
                          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                            {raffle.featured_products.slice(0, 4).map((item, idx) => (
                              <li key={`${raffle.id}-prize-${idx}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-5 flex items-center justify-between gap-3">
                        <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
                          Comprar tu número
                        </button>
                        <span className="text-xs text-gray-500">{raffle.social_hashtag || '#rifaTenute'}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
