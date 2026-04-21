'use client';
import { useEffect, useState, useCallback, useRef } from 'react';

interface Product { id: string; name: string; sku: string|null; barcode: string|null; cost_price: number|null; image_url: string|null; stock_ocoa: number; stock_local: number; }
interface PurchaseItem { product_id: string; product_name: string; product_sku: string; quantity: number; unit_cost: number; warehouse: 'ocoa'|'local'; }
interface Purchase { id: string; purchase_number: string; supplier_name: string; supplier_rut: string|null; invoice_number: string|null; purchase_date: string; total_amount: number; notes: string|null; status: string; created_at: string; items: Array<{ id: string; product_name: string; product_sku: string|null; quantity: number; unit_cost: number; warehouse: string; }>; }

function formatCLP(n: number) { return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }); }
const EMPTY: PurchaseItem = { product_id: '', product_name: '', product_sku: '', quantity: 1, unit_cost: 0, warehouse: 'ocoa' };

export default function ComprasPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierRut, setSupplierRut] = useState('');
      const [proveedorResults, setProveedorResults] = useState<{id:string;nombre:string;rut:string}[]>([]);
      const [showProveedorDropdown, setShowProveedorDropdown] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState('');
    const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([{ ...EMPTY }]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, prod] = await Promise.all([fetch(`/api/admin/compras?search=${search}`), fetch('/api/admin/products?limit=9999&page=1')]);
      setPurchases((await pr.json()).purchases || []);
      setProducts((await prod.json()).products || []);
    } catch { setError('Error cargando datos'); }
    setLoading(false);
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

    // Buscar proveedores cuando se escribe el nombre del proveedor
    useEffect(() => {
          if (supplierName.length < 2) { setProveedorResults([]); setShowProveedorDropdown(false); return; }
          const timer = setTimeout(async () => {
                  try {
                            const res = await fetch(`/api/admin/proveedores?search=${supplierName}`);
                            const data = await res.json();
                            setProveedorResults((data.proveedores || []).map((p: {id:string;nombre:string;rut:string|null}) => ({ id: p.id, nombre: p.nombre, rut: p.rut || '' })));
                            setShowProveedorDropdown(true);
                          } catch {} }, 300);
          return () => clearTimeout(timer);
        }, [supplierName]);

  const filteredProducts = products
    .filter((p) => {
      if (!productSearch) return true;
      const q = productSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q)
      );
    })
    .slice(0, 8);
  const totalAmount = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

  const resetForm = () => {
    setSupplierName(''); setSupplierRut(''); setInvoiceNumber(''); setProveedorResults([]); setShowProveedorDropdown(false); setScannerActive(false); setBarcodeInput('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setNotes(''); setItems([{ ...EMPTY }]); setShowForm(false);
  };

    function handleBarcodeScan(code: string) { if (!code.trim()) return; const found = products.find((p: Product) => p.barcode === code || p.sku === code); if (found) { const ei = items.findIndex(i => !i.product_id); const newItem = { product_id: found.id, product_name: found.name, product_sku: found.sku||'', quantity: 1, unit_cost: found.cost_price||0, warehouse: 'ocoa' as const }; if (ei >= 0) { setItems(prev => prev.map((item,i) => i===ei ? newItem : item)); } else { setItems(prev => [...prev, newItem]); } setSuccess(`Producto agregado: ${found.name}`); setTimeout(() => setSuccess(''), 3000); } else { setError(`No se encontro producto con codigo: ${code}`); setTimeout(() => setError(''), 3000); } setBarcodeInput(''); }

    function toggleScanner() { setScannerActive(!scannerActive); if (!scannerActive) { setTimeout(() => barcodeInputRef.current?.focus(), 100); } }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) { setError('Ingresa el proveedor'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/compras', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier_name: supplierName, supplier_rut: supplierRut, invoice_number: invoiceNumber, purchase_date: purchaseDate, notes, items }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setSuccess(`Compra ${data.purchase.purchase_number} registrada. Stock actualizado.`);
      resetForm(); loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); }
    setSaving(false);
  };

  const totalBought = purchases.filter(p => p.status !== 'cancelled').reduce((s, p) => s + (p.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Compras</h2><p className="text-sm text-gray-500 mt-1">Registro de compras a proveedores y actualizacion de stock</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Nueva Compra
        </button>
      </div>
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between"><span>{error}</span><button onClick={() => setError('')}>x</button></div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5"><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total compras</p><p className="text-2xl font-bold text-gray-900 mt-1">{purchases.length}</p></div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5"><p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Monto total</p><p className="text-2xl font-bold text-blue-700 mt-1">{formatCLP(totalBought)}</p></div>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-blue-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg">Registrar Nueva Compra</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Proveedor *</label>
                            <div className="relative">
              <input value={supplierName} onChange={e => setSupplierName(e.target.value)} onFocus={() => supplierName.length >= 2 && setShowProveedorDropdown(true)} onBlur={() => setTimeout(() => setShowProveedorDropdown(false), 200)} autoComplete="off" placeholder="Nombre del proveedor" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                                            {showProveedorDropdown && proveedorResults.length > 0 && (<div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">{proveedorResults.map(p => (<button key={p.id} type="button" onMouseDown={(e) => { e.preventDefault(); setSupplierName(p.nombre); setSupplierRut(p.rut); setShowProveedorDropdown(false); setProveedorResults([]); }} className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0"><span className="font-medium">{p.nombre}</span>{p.rut && <span className="ml-2 text-gray-400 text-xs">{p.rut}</span>}</button>))}</div>)}
                                            </div></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">RUT</label>
              <input value={supplierRut} onChange={e => setSupplierRut(e.target.value)} placeholder="12.345.678-9" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">N Factura</label>
              <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="FAC-001234" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
              <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800 text-sm">Productos</h4><button type="button" onClick={toggleScanner} className={`px-3 py-1 text-xs rounded-lg ${scannerActive?'bg-red-600 text-white':'bg-blue-600 text-white'}`}>{scannerActive?'Detener':'Escanear Código'}</button>
              <div className="relative">
                <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Buscar producto..." className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"/>
                {productSearch && filteredProducts.length > 0 && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-72">
                    {filteredProducts.map(p => (
                      <button key={p.id} type="button" onClick={() => {
                        const ei = items.findIndex(i => !i.product_id);
                        const newItem = { product_id: p.id, product_name: p.name, product_sku: p.sku||'', quantity: 1, unit_cost: p.cost_price||0, warehouse: 'ocoa' as const };
                        if (ei >= 0) { setItems(prev => prev.map((item,i) => i===ei ? newItem : item)); }
                        else { setItems(prev => [...prev, newItem]); }
                        setProductSearch('');
                      }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm">
                        {p.image_url && <img src={p.image_url} alt="" className="w-7 h-7 object-cover rounded"/>}
                        <div><p className="font-medium text-gray-800 truncate max-w-[180px]">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.sku}{p.cost_price ? ` · ${formatCLP(p.cost_price)}`:''}</p></div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2">
                  <div className="col-span-4"><input value={item.product_name} onChange={e => setItems(p => p.map((it,i) => i===idx ? {...it,product_name:e.target.value}:it))} placeholder="Producto" className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"/></div>
                  <div className="col-span-1"><input type="number" min="1" value={item.quantity} onChange={e => setItems(p => p.map((it,i) => i===idx ? {...it,quantity:parseInt(e.target.value)||1}:it))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right"/></div>
                  <div className="col-span-3"><input type="number" min="0" value={item.unit_cost} onChange={e => setItems(p => p.map((it,i) => i===idx ? {...it,unit_cost:parseFloat(e.target.value)||0}:it))} placeholder="Costo" className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right"/></div>
                  <div className="col-span-3"><select value={item.warehouse} onChange={e => setItems(p => p.map((it,i) => i===idx ? {...it,warehouse:e.target.value as 'ocoa'|'local'}:it))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white">
                    <option value="ocoa">Ocoa</option><option value="local">Local 21</option></select></div>
                  <div className="col-span-1 text-right"><button type="button" onClick={() => setItems(p => p.filter((_,i)=>i!==idx))} className="text-red-400 hover:text-red-600 text-sm">x</button></div>
                </div>
              ))}
              <button type="button" onClick={() => setItems(p => [...p, {...EMPTY}])} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600">+ Agregar producto</button>
            </div>
          </div>
          <div className="flex items-center justify-between bg-gray-900 text-white rounded-xl p-4">
            <span className="font-medium">Total</span><span className="text-2xl font-bold">{formatCLP(totalAmount)}</span>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving?'Guardando...':'Registrar Compra'}</button>
          </div>
        </form>
      )}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por N OC, proveedor o factura..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Cargando compras...</div> :
        purchases.length === 0 ? <div className="p-12 text-center text-gray-400"><p className="text-lg font-medium text-gray-500">No hay compras registradas</p><p className="text-sm mt-1">Haz clic en Nueva Compra para registrar tu primera compra.</p></div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">N OC</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Factura</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Fecha</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {purchases.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-blue-700">{p.purchase_number}</td>
                  <td className="px-4 py-3"><p className="font-medium text-gray-800">{p.supplier_name}</p>{p.supplier_rut&&<p className="text-xs text-gray-400">{p.supplier_rut}</p>}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.invoice_number||'—'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{new Date(p.purchase_date).toLocaleDateString('es-CL')}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCLP(p.total_amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.status==='received'?'bg-green-100 text-green-700':p.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>
                      {p.status==='received'?'Recibida':p.status==='pending'?'Pendiente':'Cancelada'}
                    </span>
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
