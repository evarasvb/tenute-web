import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createAdminClient } from '@/lib/supabase';

interface RafflePrize {
  id: string;
  position: number;
  title: string;
  description: string | null;
  declared_value: number | null;
  quantity: number;
}

interface RaffleMedia {
  id: string;
  kind: 'image' | 'video';
  url: string;
  alt: string | null;
  sort_order: number;
}

interface PublicRaffleDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
  promo_headline: string | null;
  hashtag: string | null;
  draw_date: string | null;
  draw_place: string | null;
  terms_md: string | null;
  status: 'draft' | 'published' | 'closed';
  raffle_prizes: RafflePrize[] | null;
  raffle_media: RaffleMedia[] | null;
}

function formatDate(value: string | null) {
  if (!value) return 'Fecha por confirmar';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Fecha por confirmar';
  return parsed.toLocaleString('es-CL', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

function formatCLP(value: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return value.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });
}

function renderMarkdown(text: string) {
  const lines = text.split(/\r?\n/);
  const nodes: JSX.Element[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={`list-${nodes.length}`} className="list-disc pl-5 space-y-1 mb-3">
        {listItems.map((item, idx) => (
          <li key={`li-${nodes.length}-${idx}`}>{item}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2).trim());
      return;
    }
    flushList();
    if (line.startsWith('### ')) {
      nodes.push(
        <h3 key={`h3-${nodes.length}`} className="text-lg font-semibold text-gray-900 mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
      return;
    }
    if (line.startsWith('## ')) {
      nodes.push(
        <h2 key={`h2-${nodes.length}`} className="text-xl font-bold text-gray-900 mt-5 mb-2">
          {line.slice(3)}
        </h2>
      );
      return;
    }
    if (line.startsWith('# ')) {
      nodes.push(
        <h1 key={`h1-${nodes.length}`} className="text-2xl font-black text-gray-900 mt-6 mb-2">
          {line.slice(2)}
        </h1>
      );
      return;
    }
    nodes.push(
      <p key={`p-${nodes.length}`} className="mb-3 leading-7 text-gray-700">
        {line}
      </p>
    );
  });

  flushList();
  return nodes;
}

export default async function RifaPublicDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('raffles')
    .select(
      `
      id,
      title,
      slug,
      description,
      hero_image_url,
      promo_headline,
      hashtag,
      draw_date,
      draw_place,
      terms_md,
      status,
      raffle_prizes(
        id,
        position,
        title,
        description,
        declared_value,
        quantity
      ),
      raffle_media(
        id,
        kind,
        url,
        alt,
        sort_order
      )
    `
    )
    .eq('slug', params.slug)
    .single();

  if (error || !data || data.status !== 'published') {
    notFound();
  }

  const raffle = data as PublicRaffleDetail;
  const media = [...(raffle.raffle_media || [])].sort((a, b) => a.sort_order - b.sort_order);
  const prizes = [...(raffle.raffle_prizes || [])].sort((a, b) => a.position - b.position);

  return (
    <>
      <Navbar />
      <main className="bg-gray-50 min-h-screen">
        <section className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {raffle.hero_image_url ? (
              <img src={raffle.hero_image_url} alt={raffle.title} className="w-full h-72 object-cover" />
            ) : (
              <div className="h-72 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                Sin imagen de portada
              </div>
            )}
            <div className="p-6">
              <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">Rifa publicada</p>
              <h1 className="text-3xl font-black text-gray-900 mt-1">{raffle.title}</h1>
              {raffle.promo_headline && <p className="mt-2 text-indigo-700 font-medium">{raffle.promo_headline}</p>}
              {raffle.description && <p className="mt-3 text-sm text-gray-600">{raffle.description}</p>}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-gray-500 text-xs">Fecha del sorteo</p>
                  <p className="font-semibold text-gray-900">{formatDate(raffle.draw_date)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-gray-500 text-xs">Lugar del sorteo</p>
                  <p className="font-semibold text-gray-900">{raffle.draw_place || 'Por confirmar'}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <Link
                  href={`/checkout?raffle=${raffle.slug}`}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                >
                  Participar ahora
                </Link>
                {raffle.hashtag && <span className="text-sm text-gray-500">{raffle.hashtag}</span>}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900">Premios</h2>
            {prizes.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">Aún no hay premios publicados.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {prizes.map((prize) => (
                  <article key={prize.id} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                    <p className="text-xs text-gray-500">Posición #{prize.position}</p>
                    <h3 className="text-base font-semibold text-gray-900 mt-1">{prize.title}</h3>
                    {prize.description && <p className="text-sm text-gray-600 mt-2">{prize.description}</p>}
                    <div className="mt-2 text-xs text-gray-500 flex gap-3">
                      <span>Cantidad: {prize.quantity}</span>
                      {formatCLP(prize.declared_value) && <span>Valor: {formatCLP(prize.declared_value)}</span>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900">Galería</h2>
            {media.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">Sin contenido multimedia por ahora.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {media.map((item) =>
                  item.kind === 'video' ? (
                    <video key={item.id} src={item.url} controls className="w-full rounded-lg border border-gray-200 bg-black" />
                  ) : (
                    <img
                      key={item.id}
                      src={item.url}
                      alt={item.alt || raffle.title}
                      className="w-full h-56 object-cover rounded-lg border border-gray-200"
                    />
                  )
                )}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900">Bases y condiciones</h2>
            {raffle.terms_md ? (
              <div className="mt-3 text-sm">{renderMarkdown(raffle.terms_md)}</div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">Bases no publicadas aún.</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
