import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';

function formatRupiah(n) {
  return 'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const STATUS_OPTIONS = [
  { value: 'menunggu_pembayaran', label: 'Menunggu Pembayaran' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'dikirim', label: 'Dikirim' },
  { value: 'selesai', label: 'Selesai' },
];

const TABS = [{ key: 'semua', label: 'Semua' }, ...STATUS_OPTIONS.map((s) => ({ key: s.value, label: s.label }))];

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('semua');
  const [updatingId, setUpdatingId] = useState(null);

  function loadOrders() {
    setLoading(true);
    api.get('/api/orders').then((res) => setOrders(res.data)).finally(() => setLoading(false));
  }
  useEffect(() => { loadOrders(); }, []);

  const filtered = useMemo(() => {
    let list = orders;
    if (activeTab !== 'semua') list = list.filter((o) => o.delivery_status === activeTab);
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (o) => o.order_code.toLowerCase().includes(q) || o.buyer_name.toLowerCase().includes(q) || o.buyer_phone.includes(q)
      );
    }
    return list;
  }, [orders, activeTab, search]);

  const stats = useMemo(() => {
    const today = orders;
    return {
      total: today.length,
      totalValue: today.reduce((sum, o) => sum + Number(o.total_amount), 0),
      diproses: today.filter((o) => o.delivery_status === 'diproses').length,
      dikirim: today.filter((o) => o.delivery_status === 'dikirim').length,
      selesai: today.filter((o) => o.delivery_status === 'selesai').length,
    };
  }, [orders]);

  async function handleStatusChange(orderCode, newStatus) {
    setUpdatingId(orderCode);
    try {
      await api.patch(`/api/orders/${orderCode}/status`, { delivery_status: newStatus });
      setOrders((prev) => prev.map((o) => (o.order_code === orderCode ? { ...o, delivery_status: newStatus } : o)));
    } catch {
      alert('Gagal update status');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-space-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        <StatCard label="Total Pesanan" value={stats.total} sub={`Nilai: ${formatRupiah(stats.totalValue)}`} icon="receipt_long" />
        <StatCard label="Diproses" value={stats.diproses} sub="Perlu dikemas" icon="inventory_2" accent />
        <StatCard label="Dikirim" value={stats.dikirim} sub="Dalam perjalanan" icon="two_wheeler" />
        <StatCard label="Selesai" value={stats.selesai} sub="Sudah sampai" icon="check_circle" />
      </div>

      <div className="flex flex-col gap-space-md bg-surface-container-lowest p-space-md rounded-2xl shadow-sm">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-space-md">
          <div className="relative flex-1 max-w-xl">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
            <input
              className="w-full h-11 pl-11 pr-space-md bg-surface-container-low rounded-xl text-body-md text-on-surface placeholder:text-outline focus:outline-none shadow-sm"
              placeholder="Cari kode pesanan, nama, atau nomor telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={loadOrders} className="h-11 px-space-md rounded-xl bg-primary text-on-primary flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[18px]">autorenew</span>
            <span className="text-label-lg">Muat Ulang</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-space-md py-1.5 rounded-full text-label-md font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {tab.label} ({tab.key === 'semua' ? orders.length : orders.filter((o) => o.delivery_status === tab.key).length})
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-left text-on-surface border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-outline text-label-sm uppercase tracking-wider">
                <th className="py-3 px-space-md font-semibold">Kode Pesanan</th>
                <th className="py-3 px-space-md font-semibold">Pembeli</th>
                <th className="py-3 px-space-md font-semibold">Item</th>
                <th className="py-3 px-space-md font-semibold">Total</th>
                <th className="py-3 px-space-md font-semibold">Status Pengiriman</th>
                <th className="py-3 px-space-md font-semibold">Lokasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {loading ? (
                <tr><td colSpan={6} className="py-6 text-center text-on-surface-variant">Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-on-surface-variant">Tidak ada pesanan.</td></tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-container-low/70 transition-colors">
                    <td className="py-3.5 px-space-md align-top">
                      <div className="flex flex-col">
                        <span className="text-title-md font-bold">{order.order_code}</span>
                        <span className="text-body-sm text-outline">
                          {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-space-md align-top">
                      <div className="flex flex-col">
                        <span className="text-title-md font-semibold">{order.buyer_name}</span>
                        <span className="text-body-sm text-outline">{order.buyer_phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-space-md align-top">
                      <div className="flex flex-col gap-0.5">
                        {order.items.map((it) => (
                          <span key={it.id} className="text-body-sm">{it.product_name} × {it.quantity}kg</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-space-md align-top text-price-sm font-bold">{formatRupiah(order.total_amount)}</td>
                    <td className="py-3.5 px-space-md align-top">
                      <select
                        value={order.delivery_status}
                        disabled={updatingId === order.order_code}
                        onChange={(e) => handleStatusChange(order.order_code, e.target.value)}
                        className="h-8 px-2.5 rounded-lg bg-surface-container text-on-surface text-label-md focus:outline-none disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-space-md align-top">
                      {order.latitude ? (
                        <a
                          href={`https://maps.google.com/?q=${order.latitude},${order.longitude}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary text-label-md"
                        >
                          <span className="material-symbols-outlined text-[16px]">location_on</span>
                          Lihat Peta
                        </a>
                      ) : (
                        <span className="text-body-sm text-outline">Alamat manual saja</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-label-md uppercase tracking-wider text-outline">{label}</span>
          <span className={`text-display-lg font-bold mt-1 ${accent ? 'text-secondary' : 'text-on-surface'}`}>{value}</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
      </div>
      <span className="text-body-sm text-outline mt-space-md">{sub}</span>
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    api.get('/api/products').then((res) => setProducts(res.data)).finally(() => setLoading(false));
  }, []);

  function setDraft(id, field, value) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function handleSave(product) {
    const draft = drafts[product.id] || {};
    const stock = draft.stock !== undefined ? Number(draft.stock) : product.stock;
    const is_available = draft.is_available !== undefined ? draft.is_available : product.is_available;
    setSavingId(product.id);
    try {
      const res = await api.patch(`/api/products/${product.id}/stock`, { stock, is_available });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? res.data : p)));
      setDrafts((prev) => { const cp = { ...prev }; delete cp[product.id]; return cp; });
    } catch {
      alert('Gagal update produk');
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <p className="text-on-surface-variant py-6 text-center">Memuat produk...</p>;

  return (
    <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-low text-outline text-label-sm uppercase tracking-wider">
            <th className="py-3 px-space-md font-semibold">Produk</th>
            <th className="py-3 px-space-md font-semibold">Harga</th>
            <th className="py-3 px-space-md font-semibold">Stok (kg)</th>
            <th className="py-3 px-space-md font-semibold">Tersedia</th>
            <th className="py-3 px-space-md font-semibold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container-low">
          {products.map((p) => {
            const draft = drafts[p.id] || {};
            const stockVal = draft.stock !== undefined ? draft.stock : p.stock;
            const availVal = draft.is_available !== undefined ? draft.is_available : p.is_available;
            const dirty = draft.stock !== undefined || draft.is_available !== undefined;
            return (
              <tr key={p.id}>
                <td className="py-3 px-space-md">
                  <span className="text-title-md font-semibold">{p.name}</span>
                </td>
                <td className="py-3 px-space-md text-price-sm font-bold text-primary">{formatRupiah(p.price)}</td>
                <td className="py-3 px-space-md">
                  <input
                    type="number"
                    min="0"
                    value={stockVal}
                    onChange={(e) => setDraft(p.id, 'stock', e.target.value)}
                    className="w-20 h-9 px-2 rounded-lg bg-surface-container-low text-on-surface focus:outline-none"
                  />
                </td>
                <td className="py-3 px-space-md">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availVal}
                      onChange={(e) => setDraft(p.id, 'is_available', e.target.checked)}
                    />
                    <span className="text-body-sm">{availVal ? 'Tersedia' : 'Habis'}</span>
                  </label>
                </td>
                <td className="py-3 px-space-md text-right">
                  <button
                    onClick={() => handleSave(p)}
                    disabled={!dirty || savingId === p.id}
                    className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-label-sm font-semibold disabled:opacity-40"
                  >
                    {savingId === p.id ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState('pesanan');

  return (
    <div className="min-h-screen bg-surface font-sans">
      <header className="bg-surface-container-lowest shadow-sm px-space-xl h-16 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-space-sm">
          <span className="text-headline-sm text-primary font-bold">SegarBuah</span>
          <span className="text-label-sm text-outline">Admin</span>
        </div>
        <nav className="flex items-center gap-space-sm">
          <button
            onClick={() => setTab('pesanan')}
            className={`px-space-md py-2 rounded-xl text-title-md font-semibold ${tab === 'pesanan' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'}`}
          >
            Pesanan
          </button>
          <button
            onClick={() => setTab('produk')}
            className={`px-space-md py-2 rounded-xl text-title-md font-semibold ${tab === 'produk' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'}`}
          >
            Produk & Stok
          </button>
        </nav>
      </header>

      <main className="px-space-xl py-space-xl">
        {tab === 'pesanan' ? <OrdersTab /> : <ProductsTab />}
      </main>
    </div>
  );
}