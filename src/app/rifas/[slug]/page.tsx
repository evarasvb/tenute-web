'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface RaffleDetail {
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

interface TicketOption {
  number: number;
  label: string;
  available: boolean;
}

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function formatRemainingTime(drawDate: string | null) {
  if (!drawDate) return 'Fecha de sorteo por confirmar';
  const target = new Date(drawDate).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return 'Sorteo en curso o finalizado';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return `${days}d ${hours}h ${minutes}m`;
}

function parseSlugFromPathname() {
  if (typeof window === 'undefined') return '';
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[1] || '';
}

export default function RaffleDetailPage() {
  const [slug, setSlug] = useState('');
  const [raffle, setRaffle] = useState<RaffleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [buying, setBuying] = useState(false);
  const [buyMessage, setBuyMessage] = useState('');
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    setSlug(parseSlugFromPathname());
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/rifas/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data?.data) {
          setError('No se encontró la rifa');
          return;
        }
        setRaffle(data.data);
        setRemaining(formatRemainingTime(data.data.draw_date || null));
      })
      .catch(() => setError('No se pudo cargar la rifa'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!raffle?.draw_date) return;
    const timer = setInterval(() => setRemaining(formatRemainingTime(raffle.draw_date || null)), 30000);
    return () => clearInterval(timer);
  }, [raffle?.draw_date]);

  const ticketOptions = useMemo<TicketOption[]>(() => {
    if (!raffle) return [];
    const sold = Math.max(0, raffle.total_numbers - raffle.available_numbers);
    const soldCount = Math.min(sold, raffle.total_numbers);
    return Array.from({ length: raffle.total_numbers }).map((_, idx) => {
      const num = idx + 1;
      return {
        number: num,
        label: String(num).padStart(3, '0'),
        available: num > soldCount,
      };
    });
  }, [raffle]);

  async function handleBuy() {
    if (!raffle) return;
    if (!selectedNumber) {
      setBuyMessage('Selecciona un número para continuar');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setBuyMessage('Ingresa nombre y teléfono');
      return;
    }
    setBuying(true);
    setBuyMessage('');
    try {
      const res = await fetch(`/api/rifas/${raffle.slug}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedNumber,
          customerName,
          customerPhone,
          customerEmail: customerEmail || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBuyMessage(data.error || 'No se pudo generar el pago');
        return;
      }
      window.location.href = data.paymentUrl;
    } catch {
      setBuyMessage('Error de conexión al crear el pago');
    } finally {
      setBuying(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="bg-gray-50 min-h-screen">
        <section className="max-w-6xl mx-auto px-4 py-8">
          {loading ? (
            <div className="rounded-2xl bg-white border border-gray-200 p-8 animate-pulse">
              <div className="h-7 w-72 bg-gray-200 rounded" />
              <div className="h-4 w-56 bg-gray-200 rounded mt-3" />
            </div>
          ) : error || !raffle ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || 'Rifa no disponible'}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <article className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white overflow-hidden">
                {raffle.hero_image_url ? (
                  <img src={raffle.hero_image_url} alt={raffle.title} className="w-full h-64 object-cover" />
                ) : (
                  <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-500 text-sm">Sin imagen de portada</div>
                )}
                <div className="p-6">
                  <p className="text-xs text-pink-600 font-semibold uppercase tracking-wide">Rifa activa</p>
                  <h1 className="text-2xl font-black text-gray-900 mt-1">{raffle.title}</h1>
                  {raffle.description && <p className="text-sm text-gray-600 mt-3">{raffle.description}</p>}

                  <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-gray-500">Precio número</p>
                      <p className="font-semibold text-gray-900">{formatCLP(raffle.number_price)}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-gray-500">Disponibles</p>
                      <p className="font-semibold text-gray-900">{raffle.available_numbers}/{raffle.total_numbers}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-gray-500">Lugar</p>
                      <p className="font-semibold text-gray-900">{raffle.draw_place || 'Por definir'}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-gray-500">Cuenta regresiva</p>
                      <p className="font-semibold text-gray-900">{remaining}</p>
                    </div>
                  </div>

                  {!!raffle.featured_products?.length && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Premios de la rifa</p>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        {raffle.featured_products.map((item, idx) => (
                          <li key={`${raffle.id}-feature-${idx}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-5 flex items-center gap-3 text-xs">
                    <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full bg-pink-100 text-pink-700 font-semibold">Instagram</a>
                    <a href="https://wa.me/56987299147" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-semibold">WhatsApp</a>
                    <span className="text-gray-500">{raffle.social_hashtag || '#rifaTenute'}</span>
                  </div>
                </div>
              </article>

              <aside className="rounded-2xl border border-gray-200 bg-white p-5 h-fit">
                <h2 className="text-lg font-bold text-gray-900">Compra tu número</h2>
                <p className="text-xs text-gray-500 mt-1">Pago inmediato con tarjeta (Flow).</p>

                <div className="mt-4 max-h-52 overflow-y-auto border border-gray-200 rounded-lg p-2 grid grid-cols-5 gap-1">
                  {ticketOptions.map((ticket) => (
                    <button
                      key={ticket.number}
                      type="button"
                      disabled={!ticket.available}
                      onClick={() => setSelectedNumber(ticket.number)}
                      className={`px-1 py-1.5 rounded text-xs font-medium border ${
                        !ticket.available
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : selectedNumber === ticket.number
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {ticket.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre y apellido"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Teléfono / WhatsApp"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email (opcional)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={buying}
                  className="mt-4 w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {buying ? 'Generando pago...' : `Pagar ${formatCLP(raffle.number_price)}`}
                </button>

                {buyMessage && (
                  <p className="mt-2 text-xs text-red-600">{buyMessage}</p>
                )}

                <Link href="/rifas" className="mt-3 inline-block text-xs text-blue-700 hover:underline">
                  Volver a todas las rifas
                </Link>
              </aside>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
