'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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
  image_url: '',
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
          setProduct({
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            price: data.price || 0,
            compare_price: data.compare_price || 0,
            stock: data.stock || 0,
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
            image_url: data.image_url || '',
          });
        }
        setLoading(false);
      })
      .catch(() => { setError('Error cargando producto'); setLoading(false); });
  }, [id, isNew]);

  function handleChange(field: string, value: string | number | boolean) {
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

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      ...product,
      price: Number(product.price),
      compare_price: Number(product.compare_price) || null,
      stock: Number(product.stock),
      cost_price: Number(product.cost_price) || null,
      slug: product.slug || generateSlug(product.name),
      category_id: product.category_id || null,
      image_url: product.image_url || null,
    };

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
        setError(data.error || 'Error guardando');
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

  async function handleDelete() {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/admin/products');
    } else {
      setError('Error eliminando producto');
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const sku = product.sku || `temp-${Date.now()}`;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sku', sku);

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        handleChange('image_url', data.url);
      } else {
        setError(data.error || 'Error subiendo imagen');
      }
    } catch {
      setError('Error subiendo imagen');
    }
    setUploading(false);
  }

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
        <Link
          href="/admin/products"
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isNew ? 'Nuevo producto' : 'Editar producto'}
          </h2>
          {!isNew && <p className="text-sm text-gray-500">ID: {id}</p>}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Imagen</label>
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
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
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

        {/* Basic info */}
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

        {/* Pricing */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Precios y stock</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio (CLP) *</label>
              <input
                type="number"
                value={product.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio comparación</label>
              <input
                type="number"
                value={product.compare_price}
                onChange={(e) => handleChange('compare_price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo</label>
              <input
                type="number"
                value={product.cost_price}
                onChange={(e) => handleChange('cost_price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input
                type="number"
                value={product.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Extra fields */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Detalles adicionales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condición</label>
              <select
                value={product.condition}
                onChange={(e) => handleChange('condition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="new">Nuevo</option>
                <option value="used">Usado</option>
                <option value="refurbished">Reacondicionado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <input
                type="text"
                value={product.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
              <input
                type="text"
                value={product.format}
                onChange={(e) => handleChange('format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Info contenido</label>
              <input
                type="text"
                value={product.content_info}
                onChange={(e) => handleChange('content_info', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Flags */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Opciones</h3>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={product.is_featured}
                onChange={(e) => handleChange('is_featured', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Destacado
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={product.is_offer}
                onChange={(e) => handleChange('is_offer', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              En oferta
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={product.is_auction}
                onChange={(e) => handleChange('is_auction', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Remate
            </label>
          </div>
        </div>

        {/* Price preview */}
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

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {!isNew && (
            <button
              onClick={() => setShowDelete(true)}
              className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              Eliminar producto
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar producto</h3>
            <p className="text-sm text-gray-500 mb-4">
              ¿Estás seguro? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowDelete(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
