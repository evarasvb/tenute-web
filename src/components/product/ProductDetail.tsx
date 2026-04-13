'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { getAdditionalImages, getVideoUrl, getYouTubeEmbedUrl } from '@/lib/product-metadata';

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

  const inStock = product.stock > 0;

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
      stock: product.stock,
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

          {/* Stock */}
          {inStock ? (
            <span className="text-sm text-green-600 font-medium">En stock ({product.stock} disponibles)</span>
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
          {inStock && (
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
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAdd}
                className={`btn-primary flex-1 ${added ? 'bg-green-600 hover:bg-green-600' : ''}`}
              >
                {added ? 'Agregado al carro' : 'Agregar al carro'}
              </button>
            </div>
          )}

          {!inStock && (
            <a
              href={`https://wa.me/56987299147?text=${encodeURIComponent(`Hola, me interesa el producto "${product.name}" (${product.sku || 'sin SKU'}) que está agotado. ¿Cuándo tendrán stock?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary mt-2 text-center"
            >
              Consultar disponibilidad por WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
