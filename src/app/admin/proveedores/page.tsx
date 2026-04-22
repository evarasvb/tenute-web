'use client';

import { useEffect, useState, useCallback } from 'react';

interface Proveedor {
  id: string;
  nombre: string;
  rut: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  condiciones_pago: string;
  notas: string | null;
  activo: boolean;
  created_at: string;
}

const CONDICIONES = [
  { value: 'contado', label: 'Contado' },
  { value: '7', label: '7 dias' },
  { value: '15', label: '15 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
  { value: '90', label: '90 dias' },
];

const EMPTY: Omit<Proveedor, 'id' | 'created_at'> = {
  nombre: '', rut: '', contacto: '', telefono: '', email: '', direccion: '',
  condiciones_pago: 'contado', notas: '', activo: true,
};

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/proveedores?search=${search}`);
      const data = await res.json();
      setProveedores(data.proveedores || []);
    } catch { setError('Error cargando proveedores'); }
    setLoading(false);
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
    setError('');
  }

  function openEdit(p: Proveedor) {
    setEditing(p);
    setForm({
      nombre: p.nombre, rut: p.rut || '', contacto: p.contacto || '',
      telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '',
      condiciones_pago: p.condiciones_pago, notas: p.notas || '', activo: p.activo,
    });
    setShowForm(true);
    setError('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true); setError('');
    try {
      const method = editing ? 'PATCH' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch('/api/admin/proveedores', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSuccess(editing ? 'Proveedor actualizado' : 'Proveedor creado');
      setShowForm(false); loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error guardando');
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este proveedor?')) return;
    const res = await fetch(`/api/admin/proveedores?id=${id}`, { method: 'DELETE' });
    if (res.ok) { loadData(); setSuccess('Proveedor eliminado'); setTimeout(() => setSuccess(''), 4000); }
    else setError('Error eliminando');
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Proveedores</h2>
          <p className="text-sm text-gray-500">Gestiona tus proveedores y sus condiciones de pago</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Nuevo Proveedor
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      {showForm && (
        <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
              <input value={form.rut || ''} onChange={e => setForm(f => ({...f, rut: e.target.value}))} placeholder="12.345.678-9" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
              <input value={form.contacto || ''} onChange={e => setForm(f => ({...f, contacto: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input value={form.telefono || ''} onChange={e => setForm(f => ({...f, telefono: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email || ''} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condiciones de pago</label>
              <select value={form.condiciones_pago} onChange={e => setForm(f => ({...f, condiciones_pago: e.target.value}))} className={inputCls + ' bg-white'}>
                {CONDICIONES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
              <input value={form.direccion || ''} onChange={e => setForm(f => ({...f, direccion: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input value={form.notas || ''} onChange={e => setForm(f => ({...f, notas: e.target.value}))} className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.activo} onChange={e => setForm(f => ({...f, activo: e.target.checked}))} className="w-4 h-4" />
              Activo
            </label>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear Proveedor'}
            </button>
          </div>
        </form>
      )}

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, RUT o email..." className={inputCls} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : proveedores.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No hay proveedores registrados</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">RUT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Contacto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Telefono</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Pago</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {proveedores.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.rut || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.contacto || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.telefono || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {CONDICIONES.find(c => c.value === p.condiciones_pago)?.label || p.condiciones_pago}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 mr-3">Editar</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
