'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { getAdditionalImages, getVideoUrl, getYouTubeEmbedUrl } from '@/lib/product-metadata';
import { getAvailability } from '@/lib/availability';

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    compare_price: number | null;
    stock: number;
    image_url: string | null;
    categories: any;
    sku: string | null;
    unit: string | null;
    format: string | null;
    content_info: string | null;
    metadata?: unknown;
    video_url?: string | null;
  };
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const availability = getAvailability(product);
  const inStock = availability.state === 'in_stock';
  const buyable = availability.buyable;
  const bajoPedido = availability.state === 'bajo_pedido';
  const maxQty = bajoPedido ? 99 : product.stock;

  // Collect all images
  const additionalImages = getAdditionalImages(product as unknown as Record<string, unknown>);
  const allImages: string[] = [];
  if (product.image_url) allImages.push(product.image_url);
  allImages.push(...additionalImages);

  const [selectedImage, setSelectedImage] = useState(0);

  // Video
  const videoUrl = getVideoUrl(product as unknown as Record<string, unknown>);
  const youtubeEmbed = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;

  function handleAdd() {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      slug: product.slug,
      stock: bajoPedido ? 999 : product.stock,
    }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/catalogo" className="hover:text-blue-600">Catálogo</Link>
        {product.categories && (
          <>
            <span className="mx-2">/</span>
            <span>{(product.categories as any).name}</span>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-800">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <div className="aspect-square bg-white rounded-xl border border-gray-100 overflow-hidden flex items-center justify-center">
            {allImages.length > 0 ? (
              <img
                src={allImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-6xl text-gray-300">📦</span>
            )}
          </div>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {allImages.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${
                    selectedImage === i ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Video */}
          {youtubeEmbed && (
            <div className="mt-4">
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <iframe
                  src={youtubeEmbed}
                  title={`Video de ${product.name}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
          {videoUrl && !youtubeEmbed && (
            <div className="mt-4">
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          {product.categories && (
            <span className="text-sm text-blue-600 font-medium">{(product.categories as any).name}</span>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">{formatCLP(product.price)}</span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-lg text-gray-400 line-through">{formatCLP(product.compare_price)}</span>
            )}
          </div>

          {/* Disponibilidad */}
          {inStock ? (
            <span className="text-sm text-green-600 font-medium">En stock ({product.stock} disponibles)</span>
          ) : bajoPedido ? (
            <span className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {availability.label} · lo pedimos a nuestro proveedor
            </span>
          ) : (
            <span className="text-sm text-red-500 font-medium">Agotado</span>
          )}

          {/* Details */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
            {product.sku && <span>SKU: {product.sku}</span>}
            {product.unit && <span>Unidad: {product.unit}</span>}
            {product.format && <span>Formato: {product.format}</span>}
            {product.content_info && <span>Contenido: {product.content_info}</span>}
          </div>

          {product.description && (
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          )}

          {/* Add to cart */}
          {buyable && (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAdd}
                className={`btn-primary flex-1 ${added ? 'bg-green-600 hover:bg-green-600' : ''}`}
              >
                {added ? 'Agregado al carro' : bajoPedido ? 'Pedir ahora' : 'Agregar al carro'}
              </button>
            </div>
          )}

          {buyable && (
            <a
              href={`https://wa.me/56994259157?text=${encodeURIComponent(`Hola Tenute 👋 Quiero "${product.name}" - ${formatCLP(product.price)}. ¿Está disponible?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              Comprar por WhatsApp
            </a>
          )}

          {!buyable && (
            <a
              href={`https://wa.me/56994259157?text=${encodeURIComponent(`Hola, me interesa el producto "${product.name}" (${product.sku || 'sin SKU'}) que está agotado. ¿Cuándo tendrán stock?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary mt-2 text-center"
            >
              Consultar disponibilidad por WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Barra fija de compra en celular */}
      {buyable && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] text-gray-500">{bajoPedido ? availability.label : 'Precio'}</span>
            <span className="text-lg font-bold text-gray-900">{formatCLP(product.price)}</span>
          </div>
          <button
            onClick={handleAdd}
            className={`flex-1 py-3 rounded-lg font-semibold text-sm text-white transition-colors ${
              added ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {added ? '✓ Agregado' : bajoPedido ? 'Pedir ahora' : 'Agregar al carro'}
          </button>
        </div>
      )}
    </div>
  );
}
