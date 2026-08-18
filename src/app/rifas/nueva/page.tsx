'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface Prize {
  title: string;
  description: string;
  image_url: string;
}

export default function NuevaRifaPublicaPage() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Result
  const [rifaId, setRifaId] = useState('');
  const [ownerToken, setOwnerToken] = useState('');
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  // Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalTickets, setTotalTickets] = useState('100');
  const [ticketPrice, setTicketPrice] = useState('');
  const [maxPerPerson, setMaxPerPerson] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [drawDate, setDrawDate] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [creatorPhone, setCreatorPhone] = useState('');
  const [prizes, setPrizes] = useState<Prize[]>([{ title: '', description: '', image_url: '' }]);

  function addPrize() {
    if (prizes.length >= 5) return;
    setPrizes((p) => [...p, { title: '', description: '', image_url: '' }]);
  }

  function removePrize(i: number) {
    setPrizes((p) => p.filter((_, idx) => idx !== i));
  }

  function updatePrize(i: number, field: keyof Prize, value: string) {
    setPrizes((p) => p.map((pr, idx) => idx === i ? { ...pr, [field]: value } : pr));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('El título es requerido'); return; }
    if (!whatsapp.trim()) { setError('El número de WhatsApp es requerido'); return; }
    setSaving(true);

    const res = await fetch('/api/rifas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, description, total_tickets: totalTickets, ticket_price: ticketPrice,
        max_per_person: maxPerPerson || null, whatsapp_number: whatsapp,
        bank_info: bankInfo, draw_date: drawDate || null,
        creator_name: creatorName, creator_phone: creatorPhone,
        prizes: prizes.filter((p) => p.title.trim()),
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Error al crear'); setSaving(false); return; }

    setRifaId(data.rifa_id);
    setOwnerToken(data.owner_token);
    setStep('success');
    setSaving(false);
  }

  function copy(text: string, setCopied: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/rifas/${rifaId}` : '';
  const adminUrl = typeof window !== 'undefined' ? `${window.location.origin}/rifas/${rifaId}/gestionar?token=${ownerToken}` : '';

  if (step === 'success') {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-8 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Rifa creada!</h1>
              <p className="text-gray-500 text-sm mb-8">Guarda estos dos links. El link secreto es tu acceso para gestionar la rifa.</p>

              <div className="space-y-4 text-left">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-1">🔗 Link público — comparte este por WhatsApp</p>
                  <p className="text-sm text-blue-900 break-all font-mono mb-2">{publicUrl}</p>
                  <button onClick={() => copy(publicUrl, setCopiedPublic)}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    {copiedPublic ? '✓ Copiado' : 'Copiar link'}
                  </button>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-orange-700 mb-1">🔐 Link secreto — solo tú lo tienes</p>
                  <p className="text-xs text-orange-600 mb-1">Con este link confirmas pagos y ves las reservas. ¡No lo compartas!</p>
                  <p className="text-sm text-orange-900 break-all font-mono mb-2">{adminUrl}</p>
                  <button onClick={() => copy(adminUrl, setCopiedAdmin)}
                    className="text-xs px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                    {copiedAdmin ? '✓ Copiado' : 'Copiar link secreto'}
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <a href={adminUrl}
                  className="block py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
                  Ir a gestionar mi rifa →
                </a>
                <Link href="/rifas" className="text-sm text-gray-500 hover:text-gray-700">
                  Ver todas las rifas
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 text-center">
            <Link href="/rifas" className="text-sm text-gray-400 hover:text-gray-600">← Volver a rifas</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Crear rifa gratis</h1>
            <p className="text-gray-500 text-sm mt-1">Sin registro. Sin costos. Tus participantes reservan por WhatsApp.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Rifa info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Tu rifa</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la rifa *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Gran Rifa de Verano"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                  placeholder="¿De qué se trata la rifa?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de números</label>
                  <select value={totalTickets} onChange={(e) => setTotalTickets(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {[50, 100, 150, 200, 300, 500].map((n) => (
                      <option key={n} value={n}>{n} números</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio por número ($)</label>
                  <input type="number" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)}
                    min="0" placeholder="Ej: 2000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máx. por persona</label>
                  <input type="number" value={maxPerPerson} onChange={(e) => setMaxPerPerson(e.target.value)}
                    min="1" placeholder="Sin límite"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del sorteo</label>
                  <input type="date" value={drawDate} onChange={(e) => setDrawDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            {/* Prizes */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Premios</h2>
                {prizes.length < 5 && (
                  <button type="button" onClick={addPrize}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium">+ Agregar premio</button>
                )}
              </div>
              {prizes.map((prize, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">{i + 1}° Premio</span>
                    {prizes.length > 1 && (
                      <button type="button" onClick={() => removePrize(i)} className="text-xs text-red-400 hover:text-red-600">Quitar</button>
                    )}
                  </div>
                  <input value={prize.title} onChange={(e) => updatePrize(i, 'title', e.target.value)}
                    placeholder="Nombre del premio *"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={prize.description} onChange={(e) => updatePrize(i, 'description', e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={prize.image_url} onChange={(e) => updatePrize(i, 'image_url', e.target.value)}
                    placeholder="URL de la foto (opcional)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Contacto y pago</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tu WhatsApp *</label>
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="56912345678 (sin + ni espacios)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Datos para transferencia</label>
                <textarea value={bankInfo} onChange={(e) => setBankInfo(e.target.value)} rows={3}
                  placeholder={'Banco: BancoEstado\nCuenta: 123456789\nRUT: 12.345.678-9\nNombre: Tu Nombre'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Creator */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Tus datos (opcional)</h2>
              <p className="text-xs text-gray-400">Se muestran en el directorio como "por [nombre]".</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre</label>
                  <input value={creatorName} onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tu teléfono</label>
                  <input value={creatorPhone} onChange={(e) => setCreatorPhone(e.target.value)}
                    placeholder="+56 9 ..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

            <button type="submit" disabled={saving}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Creando rifa...' : '🎟️ Crear mi rifa gratis'}
            </button>
            <p className="text-center text-xs text-gray-400 pb-8">
              Al crear la rifa aceptas que es un servicio gratuito de la comunidad Tenute.
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
