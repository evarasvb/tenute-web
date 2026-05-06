'use client';

import { useEffect, useState } from 'react';

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  product_count: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchCategories() {
    setLoading(true);
    const res = await fetch('/api/admin/categories');
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  }

  useEffect(() => { fetchCategories(); }, []);

  function startEdit(cat: CategoryWithCount) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || '');
  }

  async function handleSave(id: string) {
    setSaving(true);
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, description: editDescription }),
    });
    if (res.ok) {
      setEditingId(null);
      fetchCategories();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
        <p className="text-sm text-gray-500 mt-1">{categories.length} categorías registradas</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Slug</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 hidden lg:table-cell">Descripción</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Productos</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 w-24">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-10 ml-auto" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
                </tr>
              ))
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{cat.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden md:table-cell">{cat.slug}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="line-clamp-1">{cat.description || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {cat.product_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === cat.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleSave(cat.id)}
                          disabled={saving}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {saving ? '...' : 'Guardar'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
