'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  cost_price: number | null;
  stock: number;
  stock_local21: number;
  stock_ocoa: number;
  sku: string | null;
    barcode: string | null;
}

interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  warehouse: 'local' | 'ocoa';
  subtotal: number;
}

interface Sale {
  id: string;
  sale_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  payment_method: string;
  total: number;
  cost_total: number;
  discount: number;
  status: string;
  notes: string | null;
  created_at: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function VentasPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSales, setLoadingSales] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [search, setSalesSearch] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerRut, setCustomerRut] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash' | 'flow' | 'whatsapp'>('cash');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<SaleItem[]>([]);

  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
    const [scannerActive, setScannerActive] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    const res = await fetch('/api/admin/products?limit=500');
    const data = await res.json();
    setProducts(data.products || []);
  }, []);

  const fetchSales = useCallback(async () => {
    setLoadingSales(true);
    const params = new URLSearchParams({ limit: '20' });
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/ventas?${params}`);
    const data = await res.json();
    setSales(data.sales || []);
    setLoadingSales(false);
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchSales(); }, [fetchSales]);

  useEffect(() => {
    if (!productSearch.trim()) { setProductResults([]); return; }
    const q = productSearch.toLowerCase();
    setProductResults(
      products.filter(p =>
        p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)) || (p.barcode && p.barcode.toLowerCase().includes(q))
      ).slice(0, 8)
    );
  }, [productSearch, products]);

  function addProduct(p: Product) {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === p.id);
      if (existing) {
        return prev.map(i => i.product_id === p.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unit_price }
          : i
        );
      }
      return [...prev, {
        product_id: p.id,
        product_name: p.name,
        quantity: 1,
        unit_price: p.price,
        unit_cost: p.cost_price || 0,
        warehouse: 'local',
        subtotal: p.price,
      }];
    });
    setProductSearch('');
    setProductResults([]);
  }

    function handleBarcodeScan(code: string) {
    if (!code.trim()) return;
    const found = products.find((p: Product) => p.barcode === code || p.sku === code);
    if (found) {
      addProduct(found);
      setSuccess(`Producto agregado por scanner: ${found.name}`);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(`No se encontró producto con código: ${code}`);
      setTimeout(() => setError(''), 3000);
    }
    setBarcodeInput('');
  }

  function toggleScanner() {
    setScannerActive(!scannerActive);
    if (!scannerActive) {
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  }

  function updateItem(index: number, field: keyof SaleItem, value: string | number) {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        updated.subtotal = Number(updated.quantity) * Number(updated.unit_price);
      }
      return updated;
    }));
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const total = Math.max(0, subtotal - discount);
  const costTotal = items.reduce((sum, i) => sum + i.unit_cost * i.quantity, 0);
  const profit = total - costTotal;
  const margin = total > 0 ? Math.round(profit / total * 100) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) { setError('Agrega al menos un producto'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/admin/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          customer_rut: customerRut || null,
          payment_method: paymentMethod,
          discount,
          notes: notes || null,
          items: items.map(i => ({
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: i.unit_price,
            unit_cost: i.unit_cost,
            warehouse: i.warehouse,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar venta');
      setSuccess(`Venta ${data.sale.sale_number} registrada correctamente`);
      setCustomerName(''); setCustomerPhone(''); setCustomerRut('');
      setPaymentMethod('cash'); setDiscount(0); setNotes('');
      setItems([]);
      fetchSales();
      fetchProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar venta');
    } finally {
      setLoading(false);
    }
  }

  const paymentLabels: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    flow: 'Flow',
    whatsapp: 'WhatsApp',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Registrar venta</h2>
        <p className="text-sm text-gray-500 mt-1">WhatsApp, teléfono, caja — descuenta stock automáticamente</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Datos del cliente (opcional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Juan Pérez" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono / WhatsApp</label>
              <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+56 9 1234 5678" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">RUT</label>
              <input type="text" value={customerRut} onChange={e => setCustomerRut(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12.345.678-9" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Pago</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Método de pago</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as typeof paymentMethod)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
                <option value="flow">Flow</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descuento (CLP)</label>
              <input type="number" min="0" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Productos</h3>
          <div className="relative mb-4">
            <input
              type="text"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU o código de barras..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
                        <button type="button" onClick={toggleScanner} className={`mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${scannerActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              {scannerActive ? 'Desactivar scanner' : 'Usar scanner'}
            </button>
            {scannerActive && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600 mb-2">Scanner activo — escanea con lector USB/Bluetooth o ingresa el código manualmente</p>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBarcodeScan(barcodeInput); } }}
                  placeholder="Esperando código de barras..."
                  className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  autoFocus
                />
              </div>
            )}
            {productResults.length > 0 && (
              <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {productResults.map(p => (
                  <button key={p.id} type="button" onClick={() => addProduct(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      {formatCLP(p.price)} · Stock local: {p.stock_local21} · Ocoa: {p.stock_ocoa}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 mb-1">
                <div className="col-span-4">Producto</div>
                <div className="col-span-1 text-center">Cant.</div>
                <div className="col-span-2">Precio unit.</div>
                <div className="col-span-2">Bodega</div>
                <div className="col-span-2 text-right">Subtotal</div>
                <div className="col-span-1"></div>
              </div>
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center text-sm">
                  <div className="col-span-4 font-medium text-gray-800 truncate">{item.product_name}</div>
                  <div className="col-span-1">
                    <input type="number" min="1" value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-center text-sm" />
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="0" value={item.unit_price}
                      onChange={e => updateItem(index, 'unit_price', Number(e.target.value))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <select value={item.warehouse} onChange={e => updateItem(index, 'warehouse', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm">
                      <option value="local">Local 21</option>
                      <option value="ocoa">Ocoa</option>
                    </select>
                  </div>
                  <div className="col-span-2 text-right font-medium text-gray-900">{formatCLP(item.subtotal)}</div>
                  <div className="col-span-1 text-right">
                    <button type="button" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {items.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Sin productos — usa el buscador de arriba</p>
          )}
        </div>

        {items.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-5 text-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400 text-xs mb-1">Subtotal</div>
                <div className="font-bold text-lg">{formatCLP(subtotal)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Descuento</div>
                <div className="font-bold text-lg text-orange-400">- {formatCLP(discount)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Total a cobrar</div>
                <div className="font-bold text-xl text-green-400">{formatCLP(total)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Utilidad estimada</div>
                <div className={`font-bold text-lg ${profit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  {formatCLP(profit)} <span className="text-sm font-normal">({margin}%)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-xs font-medium text-gray-600 mb-1">Notas (opcional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Instrucciones especiales, referencia del pedido, etc." />
        </div>

        <button type="submit" disabled={loading || items.length === 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm">
          {loading ? 'Registrando...' : `Registrar venta — ${formatCLP(total)}`}
        </button>
      </form>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de ventas</h3>
        <div className="mb-3">
          <input type="text" value={search} onChange={e => setSalesSearch(e.target.value)}
            placeholder="Buscar por número, cliente o método de pago..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loadingSales ? (
            <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Sin ventas registradas aún</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">N°</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Pago</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Fecha</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Utilidad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map(sale => {
                  const saleProfit = sale.total - sale.cost_total;
                  const saleMargin = sale.total > 0 ? Math.round(saleProfit / sale.total * 100) : 0;
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">{sale.sale_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sale.customer_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{paymentLabels[sale.payment_method] || sale.payment_method}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(sale.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCLP(sale.total)}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={`font-medium ${saleProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCLP(saleProfit)} <span className="text-xs text-gray-400">({saleMargin}%)</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          sale.status === 'completed' ? 'bg-green-100 text-green-700' :
                          sale.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{sale.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
    }
