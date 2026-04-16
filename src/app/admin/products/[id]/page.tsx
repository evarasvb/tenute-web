'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getWarehouseStock, getAdditionalImages, getVideoUrl } from '@/lib/product-metadata';

interface Category {
  id: string;
  name: string;
}

const EMPTY_PRODUCT = {
  name: '',
  slug: '',
  description: '',
  price: 0,
  compare_price: 0,
  stock: 0,
  stock_ocoa: 0,
  stock_local21: 0,
  brand: '',
  category_id: '',
  condition: 'new',
  sku: '',
  unit: 'UN',
  format: '',
  content_info: '',
  cost_price: 0,
  is_featured: false,
  is_offer: false,
  is_auction: false,
  active: true,
  image_url: '',
  additional_images: [] as string[],
  video_url: '',
};

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function ProductEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [product, setProduct] = useState(EMPTY_PRODUCT);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [publishingIG, setPublishingIG] = useState(false);
  const [igResult, setIgResult] = useState<{ success?: boolean; error?: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/categories').then(r => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/products/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError('Producto no encontrado');
        } else {
          const ws = getWarehouseStock(data);
          const addlImages = getAdditionalImages(data);
          const videoUrl = getVideoUrl(data);
          setProduct({
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            price: data.price || 0,
            compare_price: data.compare_price || 0,
            stock: data.stock || 0,
            stock_ocoa: ws.ocoa,
            stock_local21: ws.local21,
            brand: data.brand || '',
            category_id: data.category_id || '',
            condition: data.condition || 'new',
            sku: data.sku || '',
            unit: data.unit || 'UN',
            format: data.format || '',
            content_info: data.content_info || '',
            cost_price: data.cost_price || 0,
            is_featured: data.is_featured || false,
            is_offer: data.is_offer || false,
            is_auction: data.is_auction || false,
            active: data.active !== false,
            image_url: data.image_url || '',
            additional_images: addlImages,
            video_url: videoUrl || '',
          });
        }
        setLoading(false);
      })
      .catch(() => { setError('Error cargando producto'); setLoading(false); });
  }, [id, isNew]);

  function handleChange(field: string, value: string | number | boolean | string[]) {
    setProduct(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  const totalStock = Number(product.stock_ocoa) + Number(product.stock_local21);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');

    const metadata = {
      additional_images: product.additional_images.filter(Boolean),
      video_url: product.video_url || undefined,
      warehouse_stock: {
        ocoa: Number(product.stock_ocoa) || 0,
        local21: Number(product.stock_local21) || 0,
      },
    };

    const payload: Record<string, unknown> = {
      name: product.name,
      slug: product.slug || generateSlug(product.name),
      description: product.description || null,
      price: Number(product.price),
      compare_price: Number(product.compare_price) || null,
      stock: totalStock,
      brand: product.brand || null,
      category_id: product.category_id || null,
      condition: product.condition,
      sku: product.sku || null,
      unit: product.unit || 'UN',
      format: product.format || null,
      content_info: product.content_info || null,
      cost_price: Number(product.cost_price) || null,
      is_featured: product.is_featured,
      is_offer: product.is_offer,
      is_auction: product.is_auction,
      active: product.active,
      image_url: product.image_url || null,
      metadata,
    };

    payload.stock_ocoa = Number(product.stock_ocoa) || 0;
    payload.stock_local21 = Number(product.stock_local21) || 0;
    if (product.video_url) payload.video_url = product.video_url;

    try {
      let res;
      if (isNew) {
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        if (data.error && (data.error.includes('stock_ocoa') || data.error.includes('stock_local21') || data.error.includes('video_url') || data.error.includes('metadata'))) {
          delete payload.stock_ocoa;
          delete payload.stock_local21;
          delete payload.video_url;
          delete payload.metadata;

          const retryRes = await fetch(isNew ? '/api/admin/products' : `/api/admin/products/${id}`, {
            method: isNew ? 'POST' : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const retryData = await retryRes.json();
          if (!retryRes.ok) {
            setError(retryData.error || 'Error guardando');
          } else {
            setSuccess('Producto guardado (sin columnas extendidas)');
            if (isNew) router.push(`/admin/products/${retryData.id}`);
          }
        } else {
          setError(data.error || 'Error guardando');
        }
      } else {
        setSuccess('Producto guardado correctamente');
        if (isNew) {
          router.push(`/admin/products/${data.id}`);
        }
      }
    } catch {
      setError('Error de conexión');
    }
    setSaving(false);
  }

  async function handlePublishInstagram() {
    if (!id || isNew) return;
    setPublishingIG(true);
    setIgResult(null);
    try {
      const res = await fetch('/api/admin/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIgResult({ error: data.error || 'Error publicando en Instagram' });
      } else {
        setIgResult({ success: true });
        setTimeout(() => setIgResult(null), 6000);
      }
    } catch {
      setIgResult({ error: 'Error de conexión' });
    }
    setPublishingIG(false);
  }

  async function handleDelete() {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/admin/products');
    } else {
      setError('Error eliminando producto');
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, isAdditional = false) {
    const file = e.target.files?.[0];
    if (!file) return;

    const sku = product.sku || `temp-${Date.now()}`;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sku', isAdditional ? `${sku}-${Date.now()}` : sku);

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        if (isAdditional) {
          handleChange('additional_images', [...product.additional_images, data.url]);
        } else {
          handleChange('image_url', data.url);
        }
      } else {
        setError(data.error || 'Error subiendo imagen');
      }
    } catch {
      setError('Error subiendo imagen');
    }
    setUploading(false);
    e.target.value = '';
  }

  function removeAdditionalImage(index: number) {
    const newImages = product.additional_images.filter((_, i) => i !== index);
    handleChange('additional_images', newImages);
  }

  function moveImage(index: number, direction: 'up' | 'down') {
    const arr = [...product.additional_images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= arr.length) return;
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    handleChange('additional_images', arr);
  }

  const margin = product.cost_price > 0
    ? ((Number(product.price) - Number(product.cost_price)) / Number(product.cost_price) * 100).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando producto...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {isNew ? 'Nuevo producto' : 'Editar producto'}
          </h2>
          {!isNew && <p className="text-sm text-gray-500">ID: {id}</p>}
        </div>
        {!isNew && (
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${product.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {product.active ? 'Activo' : 'Inactivo'}
            </span>
            {product.image_url && (
              <button
                onClick={handlePublishInstagram}
                disabled={publishingIG}
                title="Publicar en Instagram"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-xs font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                {publishingIG ? 'Publicando...' : 'Instagram'}
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
      )}
      {igResult?.success && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          ¡Publicado en Instagram exitosamente!
        </div>
      )}
      {igResult?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          Instagram: {igResult.error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Imagen principal</label>
          <div className="flex items-start gap-4">
            {product.image_url ? (
              <img src={product.image_url} alt="" className="w-32 h-32 rounded-lg object-cover border border-gray-200" />
            ) : (
              <div className="w-32 h-32 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-sm">
                Sin imagen
              </div>
            )}
            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {uploading ? 'Subiendo...' : 'Subir imagen'}
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="hidden" disabled={uploading} />
              </label>
              <input
                type="text"
                value={product.image_url}
                onChange={(e) => handleChange('image_url', e.target.value)}
                placeholder="O pegar URL de imagen..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imágenes adicionales <span className="text-gray-400 font-normal">(hasta 5)</span>
          </label>
          <div className="flex flex-wrap gap-3 mb-3">
            {product.additional_images.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt="" className="w-24 h-24 rounded-lg object-cover border border-gray-200" />
                <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  {i > 0 && (
                    <button onClick={() => moveImage(i, 'up')} className="p-1 bg-white rounded text-gray-700 text-xs" title="Mover izquierda">&#8592;</button>
                  )}
                  <button onClick={() => removeAdditionalImage(i)} className="p-1 bg-red-500 rounded text-white text-xs" title="Eliminar">&#10005;</button>
                  {i < product.additional_images.length - 1 && (
                    <button onClick={() => moveImage(i, 'down')} className="p-1 bg-white rounded text-gray-700 text-xs" title="Mover derecha">&#8594;</button>
                  )}
                </div>
              </div>
            ))}
            {product.additional_images.length < 5 && (
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL de video <span className="text-gray-400 font-normal">(YouTube o enlace directo)</span>
          </label>
          <input
            type="text"
            value={product.video_url}
            onChange={(e) => handleChange('video_url', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={product.name}
              onChange={(e) => {
                handleChange('name', e.target.value);
                if (isNew) handleChange('slug', generateSlug(e.target.value));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={product.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input
              type="text"
              value={product.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
            <input
              type="text"
              value={product.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={product.category_id}
              onChange={(e) => handleChange('category_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={product.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Precios</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio (CLP) *</label>
              <input type="number" value={product.price} onChange={(e) => handleChange('price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio comparación</label>
              <input type="number" value={product.compare_price} onChange={(e) => handleChange('compare_price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo</label>
              <input type="number" value={product.cost_price} onChange={(e) => handleChange('cost_price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {margin !== null && (
            <p className="text-sm mt-2">
              <span className="text-gray-500">Margen: </span>
              <span className={`font-bold ${Number(margin) < 20 ? 'text-red-600' : Number(margin) < 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                {margin}%
              </span>
            </p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Stock por bodega</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Bodega Ocoa</label>
              <input type="number" value={product.stock_ocoa} onChange={(e) => handleChange('stock_ocoa', e.target.value)} min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Bodega Local 21</label>
              <input type="number" value={product.stock_local21} onChange={(e) => handleChange('stock_local21', e.target.value)} min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Total</label>
              <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 font-bold text-gray-700">{totalStock}</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Detalles adicionales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condición</label>
              <select value={product.condition} onChange={(e) => handleChange('condition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="new">Nuevo</option>
                <option value="used">Usado</option>
                <option value="refurbished">Reacondicionado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <input type="text" value={product.unit} onChange={(e) => handleChange('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
              <input type="text" value={product.format} onChange={(e) => handleChange('format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Info contenido</label>
              <input type="text" value={product.content_info} onChange={(e) => handleChange('content_info', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Opciones</h3>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={product.active} onChange={(e) => handleChange('active', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
              Activo (visible en catálogo)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={product.is_featured} onChange={(e) => handleChange('is_featured', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              Destacado
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={product.is_offer} onChange={(e) => handleChange('is_offer', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              En oferta
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={product.is_auction} onChange={(e) => handleChange('is_auction', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              Remate
            </label>
          </div>
        </div>

        {product.price > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <span className="text-gray-500">Vista previa precio: </span>
            <span className="font-bold text-lg text-gray-900">{formatCLP(Number(product.price))}</span>
            {Number(product.compare_price) > 0 && (
              <span className="text-gray-400 line-through ml-2">{formatCLP(Number(product.compare_price))}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          {!isNew && (
            <button onClick={() => setShowDelete(true)}
              className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
              Eliminar producto
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar producto</h3>
            <p className="text-sm text-gray-500 mb-4">¿Estás seguro? Esta acción no se puede deshacer.</p>
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setShowDelete(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
      }
