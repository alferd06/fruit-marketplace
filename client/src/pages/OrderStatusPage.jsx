import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function formatRupiah(n) {
  return 'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const STEPS = [
  { key: 'menunggu_pembayaran', label: 'Menunggu Pembayaran', desc: 'Menunggu konfirmasi QRIS dari Midtrans.', icon: 'hourglass_top' },
  { key: 'diproses', label: 'Sedang Diproses & Dikemas', desc: 'Buah sedang disortir dan dikemas.', icon: 'inventory_2' },
  { key: 'dikirim', label: 'Dalam Perjalanan Kurir', desc: 'Paket sedang diantar ke alamatmu.', icon: 'two_wheeler' },
  { key: 'selesai', label: 'Pesanan Selesai', desc: 'Diterima dan dinikmati segar.', icon: 'home' },
];

const HERO_TEXT = {
  menunggu_pembayaran: { badge: 'Menunggu Pembayaran', title: 'Menunggu Konfirmasi', desc: 'Pembayaran kamu sedang diverifikasi otomatis oleh Midtrans.' },
  diproses: { badge: 'Sedang Diproses Penjual', title: 'Disiapkan dengan Cermat', desc: 'Pesananmu sedang disortir & dikemas higienis.' },
  dikirim: { badge: 'Dalam Pengiriman', title: 'Kurir Sedang di Jalan', desc: 'Paket sedang menuju alamatmu.' },
  selesai: { badge: 'Selesai', title: 'Pesanan Diterima', desc: 'Terima kasih sudah berbelanja buah segar bersama kami!' },
};

export default function OrderStatusPage() {
  const { orderCode } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    api.get(`/api/orders/${orderCode}`)
      .then((res) => { setOrder(res.data.order); setItems(res.data.items); })
      .catch(() => {});
  }, [orderCode]);

  if (!order) {
    return <div className="pt-24 text-center text-on-surface-variant">Memuat status pesanan...</div>;
  }

  const currentIndex = STEPS.findIndex((s) => s.key === order.delivery_status);
  const hero = HERO_TEXT[order.delivery_status] || HERO_TEXT.menunggu_pembayaran;

  function handleCopy() {
    navigator.clipboard?.writeText(order.order_code);
    setToast(true);
    setTimeout(() => setToast(false), 2200);
  }

  return (
    <main className="flex flex-col w-full pb-10 min-h-screen bg-surface">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-space-md py-space-xs rounded-full shadow-lg flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-primary-fixed text-[18px]">check_circle</span>
          <span className="text-label-md">Nomor pesanan disalin!</span>
        </div>
      )}

      <div className="px-margin-mobile flex flex-col gap-space-md pt-space-sm">
        {/* Header */}
        <div className="flex items-center justify-between pb-space-2xs">
          <div className="flex items-center gap-space-xs">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-surface-container-low text-on-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
              <span className="text-label-sm text-on-surface-variant uppercase tracking-wider block">Status Pesanan</span>
              <h1 className="text-headline-sm text-on-surface font-bold leading-tight">Detail Pengiriman</h1>
            </div>
          </div>
          <a
            href="https://wa.me/628123456789"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-primary"
          >
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            <span className="text-label-sm font-semibold">Bantuan</span>
          </a>
        </div>

        {/* Hero Card */}
        <div className="w-full bg-gradient-to-br from-primary via-primary-container to-primary text-on-primary rounded-2xl p-space-md shadow-md relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-primary-fixed/10 pointer-events-none blur-xl" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-1.5 bg-primary-fixed/20 px-2.5 py-1 rounded-full w-fit mb-space-xs backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-fixed opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-fixed" />
                </span>
                <span className="text-label-sm text-on-primary font-bold">{hero.badge}</span>
              </div>
              <h2 className="text-headline-md font-bold text-on-primary">{hero.title}</h2>
              <p className="text-body-sm text-on-primary/90 mt-1 max-w-[260px]">{hero.desc}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-on-primary/10 flex items-center justify-center text-primary-fixed backdrop-blur-md">
              <span className="material-symbols-outlined text-[28px]">eco</span>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
          <div className="flex items-center justify-between mb-space-sm">
            <h3 className="text-title-md text-on-surface font-bold">Jejak Pesanan</h3>
            <span className="text-label-sm text-primary font-semibold">4 Langkah</span>
          </div>
          <div className="relative pl-6 space-y-6">
            <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-surface-container" />
            <div
              className="absolute left-[11px] top-3 w-0.5 bg-primary transition-all duration-500"
              style={{ height: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((step, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              const upcoming = i > currentIndex;
              return (
                <div key={step.key} className={`relative flex items-start gap-space-sm ${upcoming ? 'opacity-50' : ''}`}>
                  <div
                    className={`absolute -left-[23px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${
                      done || active ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                    } ${active ? 'ring-4 ring-primary/20' : ''}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{done ? 'check' : step.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-label-lg ${active ? 'text-primary font-bold' : 'text-on-surface font-semibold'}`}>{step.label}</span>
                      {active && <span className="text-label-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Aktif</span>}
                    </div>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-label-sm text-on-surface-variant block">No. Pesanan</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-headline-sm font-bold text-on-surface tracking-tight">{order.order_code}</span>
                <button onClick={handleCopy} className="text-primary p-1 rounded-md">
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                </button>
              </div>
            </div>
          </div>

          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1">
              <div className="flex-1 min-w-0">
                <h4 className="text-title-md font-bold text-on-surface truncate">{item.product_name}</h4>
                <span className="text-body-sm text-on-surface-variant block mt-0.5">{item.quantity} kg × {formatRupiah(item.price)}</span>
              </div>
              <span className="text-price-sm text-primary font-bold">{formatRupiah(item.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Address */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
          <div className="flex items-center gap-space-xs mb-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
            <h4 className="text-title-md text-on-surface font-bold">Alamat Pengantaran</h4>
          </div>
          <div className="pl-7">
            <div className="text-label-lg text-on-surface font-bold">
              {order.buyer_name} <span className="text-body-sm text-on-surface-variant font-normal">({order.buyer_phone})</span>
            </div>
            <p className="text-body-md text-on-surface-variant mt-1 leading-relaxed">{order.buyer_address}</p>
            {order.latitude && (
              <span className="inline-block mt-2 text-label-sm bg-surface-container text-on-surface px-2.5 py-1 rounded-md">
                Titik GPS tersimpan (±{Math.round(order.location_accuracy)}m)
              </span>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm mb-space-sm">
          <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/60">
            <h4 className="text-title-md text-on-surface font-bold">Rincian Pembayaran</h4>
            <div className="flex items-center gap-1 text-primary text-label-sm font-bold bg-primary/10 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Lunas via QRIS
            </div>
          </div>
          <div className="pt-2 border-t border-surface-container flex justify-between items-center mt-2">
            <span className="text-headline-sm font-bold text-on-surface">Total Pembayaran</span>
            <span className="text-price-lg font-bold text-primary">{formatRupiah(order.total_amount)}</span>
          </div>
        </div>

        {/* Action */}
        <a
          href="https://wa.me/628123456789"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[48px] px-space-sm rounded-xl bg-primary text-on-primary flex items-center justify-center gap-2 text-label-lg font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          Hubungi Penjual
        </a>
      </div>
    </main>
  );
}
