'use client';

import { useEffect, useState } from 'react';

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    parent_id: string | null;
    product_count: number;
    children: Category[];
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editParentId, setEditParentId] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newParentId, setNewParentId] = useState('');
    const [creating, setCreating] = useState(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    async function fetchCategories() {
          setLoading(true);
          const res = await fetch('/api/admin/categories');
          const data = await res.json();
          setCategories(data);
          setLoading(false);
    }

    useEffect(() => { fetchCategories(); }, []);

    // Obtener lista plana de todas las categorías para el selector de padre
    function flatList(cats: Category[], depth = 0): { id: string; name: string; depth: number }[] {
          const result: { id: string; name: string; depth: number }[] = [];
          cats.forEach((c) => {
                  result.push({ id: c.id, name: c.name, depth });
                  if (c.children?.length) result.push(...flatList(c.children, depth + 1));
          });
          return result;
    }

    function startEdit(cat: Category) {
          setEditingId(cat.id);
          setEditName(cat.name);
          setEditDescription(cat.description || '');
          setEditParentId(cat.parent_id || '');
    }

    async function handleSave(id: string) {
          setSaving(true);
          await fetch(`/api/admin/categories/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: editName, description: editDescription, parent_id: editParentId || null }),
          });
          setEditingId(null);
          setSaving(false);
          fetchCategories();
    }

    async function handleDelete(id: string, name: string) {
          if (!confirm(`¿Eliminar la categoría "${name}"? Las subcategorías quedarán sin padre.`)) return;
          setDeleting(id);
          await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
          setDeleting(null);
          fetchCategories();
    }

    async function handleCreate() {
          if (!newName.trim()) return;
          setCreating(true);
          await fetch('/api/admin/categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: newName.trim(), description: newDescription.trim(), parent_id: newParentId || null }),
          });
          setNewName(''); setNewDescription(''); setNewParentId(''); setShowForm(false);
          setCreating(false);
          fetchCategories();
    }

    const allFlat = flatList(categories);
    const totalCount = allFlat.length;

    function renderRow(cat: Category, depth = 0): React.ReactNode {
          const isExpanded = expanded[cat.id] ?? true;
          const hasChildren = cat.children?.length > 0;
          return (
                  <>
                          <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                                <div className="flex items-center gap-1" style={{ paddingLeft: depth * 20 }}>
                                                  {hasChildren && (
                                    <button onClick={() => setExpanded(prev => ({ ...prev, [cat.id]: !isExpanded }))}
                                                        className="text-gray-400 hover:text-gray-600 w-4 h-4 flex items-center justify-center">
                                      {isExpanded ? '▾' : '▸'}
                                    </button>
                                                              )}
                                                  {!hasChildren && <span className="w-4 h-4" />}
                                                  {depth > 0 && <span className="text-gray-300 text-xs mr-1">└</span>}
                                                  {editingId === cat.id ? (
                                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
                                  ) : (
                                    <span className={`font-medium text-gray-900 ${depth > 0 ? 'text-sm' : ''}`}>{cat.name}</span>
                                                              )}
                                                </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden md:table-cell">{cat.slug}</td>
                                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                                      {editingId === cat.id ? (
                                  <div className="flex flex-col gap-1">
                                                  <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                                                                      placeholder="Descripción" className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                  <select value={editParentId} onChange={(e) => setEditParentId(e.target.value)}
                                                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                                    <option value="">Sin categoría padre</option>
                                                    {allFlat.filter(f => f.id !== cat.id).map(f => (
                                                                                            <option key={f.id} value={f.id}>{'\u00a0'.repeat(f.depth * 2)}{f.name}</option>
                                                                                          ))}
                                                  </select>
                                  </div>
                                ) : (
                                  <span className="line-clamp-1">{cat.description || '-'}</span>
                                                )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{cat.product_count}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      {editingId === cat.id ? (
                                  <div className="flex items-center justify-end gap-1">
                                                  <button onClick={() => handleSave(cat.id)} disabled={saving}
                                                                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                                                    {saving ? '...' : 'Guardar'}
                                                  </button>
                                                  <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">Cancelar</button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-1">
                                                  <button onClick={() => startEdit(cat)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="Editar">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                  </button>
                                                  <button onClick={() => handleDelete(cat.id, cat.name)} disabled={deleting === cat.id}
                                                                      className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors" title="Eliminar">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                  </button>
                                  </div>
                                                )}
                                    </td>
                          </tr>
                    {hasChildren && isExpanded && cat.children.map(child => renderRow(child, depth + 1))}
                  </>
                );
    }

    return (
          <div className="space-y-4">
                <div className="flex items-center justify-between">
                        <div>
                                  <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
                                  <p className="text-sm text-gray-500 mt-1">{totalCount} categorías registradas</p>
                        </div>
                        <button onClick={() => setShowForm(!showForm)}
                                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                  + Nueva categoría
                        </button>
                </div>
          
            {showForm && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                              <h3 className="font-semibold text-gray-800">Nueva categoría</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <input type="text" placeholder="Nombre *" value={newName} onChange={e => setNewName(e.target.value)}
                                                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                          <input type="text" placeholder="Descripción" value={newDescription} onChange={e => setNewDescription(e.target.value)}
                                                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                          <select value={newParentId} onChange={e => setNewParentId(e.target.value)}
                                                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                        <option value="">Sin categoría padre (categoría raíz)</option>
                                            {allFlat.map(f => (
                                                                            <option key={f.id} value={f.id}>{'\u00a0'.repeat(f.depth * 2)}{f.name}</option>
                                                                          ))}
                                          </select>
                              </div>
                              <div className="flex gap-2">
                                          <button onClick={handleCreate} disabled={creating || !newName.trim()}
                                                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                            {creating ? 'Creando...' : 'Crear categoría'}
                                          </button>
                                          <button onClick={() => setShowForm(false)}
                                                          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                                        Cancelar
                                          </button>
                              </div>
                    </div>
                )}
          
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                                  <thead>
                                              <tr className="bg-gray-50 border-b border-gray-200">
                                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Nombre</th>
                                                            <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Slug</th>
                                                            <th className="px-4 py-3 text-left font-medium text-gray-500 hidden lg:table-cell">Descripción / Padre</th>
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
                          categories.map(cat => renderRow(cat))
                        )}
                                  </tbody>
                        </table>
                </div>
          </div>
        );
}
}
