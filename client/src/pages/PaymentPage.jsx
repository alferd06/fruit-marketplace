import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function formatRupiah(n) {
  return 'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function PaymentPage() {
  const { orderCode } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [qrUrl, setQrUrl] = useState(null);
  const [expiryTime, setExpiryTime] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [statusLabel, setStatusLabel] = useState('pending');
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState('');
  const pollRef = useRef(null);

  // 1. Load order + generate QRIS charge sekali di awal
  useEffect(() => {
    async function init() {
      const orderRes = await api.get(`/api/orders/${orderCode}`);
      setOrder(orderRes.data.order);
      setItems(orderRes.data.items);

      const chargeRes = await api.post('/api/payments/create-qris', { order_code: orderCode });
      const raw = chargeRes.data.raw;
      const qrAction = raw.actions?.find((a) => a.name === 'generate-qr-code');
      setQrUrl(qrAction?.url || null);
      setExpiryTime(raw.expiry_time ? new Date(raw.expiry_time) : null);
    }
    init().catch(() => showToast('Gagal memuat data pembayaran'));
  }, [orderCode]);

  // 2. Countdown timer
  useEffect(() => {
    if (!expiryTime) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((expiryTime - new Date()) / 1000));
      setSecondsLeft(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiryTime]);

  // 3. Polling status pembayaran tiap 5 detik (auto-update dari webhook backend)
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/orders/${orderCode}`);
        setOrder(res.data.order);
        if (res.data.order.delivery_status === 'diproses') {
          clearInterval(pollRef.current);
          navigate(`/order/${orderCode}`);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [orderCode, navigate]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }

  const handleCheckStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await api.get(`/api/orders/${orderCode}`);
      setOrder(res.data.order);
      if (res.data.order.delivery_status === 'diproses') {
        navigate(`/order/${orderCode}`);
      } else {
        showToast('Belum ada dana masuk. Coba lagi dalam beberapa detik.');
      }
    } finally {
      setChecking(false);
    }
  }, [orderCode, navigate]);

  function handleCopyNominal() {
    if (!order) return;
    navigator.clipboard?.writeText(order.total_amount.toString());
    showToast(`Nominal ${formatRupiah(order.total_amount)} berhasil disalin!`);
  }

  function handleCopyOrderCode() {
    navigator.clipboard?.writeText(orderCode);
    showToast('Nomor pesanan berhasil disalin!');
  }

  if (!order) {
    return <div className="pt-24 text-center text-on-surface-variant">Memuat pembayaran...</div>;
  }

  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : 0;
  const seconds = secondsLeft !== null ? secondsLeft % 60 : 0;
  const timerLabel = secondsLeft !== null ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : '--:--';

  return (
    <main className="flex flex-col relative w-full pb-10 min-h-screen bg-surface">
      <div className="px-margin-mobile pt-space-xs pb-space-sm flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-on-surface-variant py-1">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="text-label-md">Batal</span>
        </button>
        <div className="flex items-center gap-space-2xs bg-surface-container-high/60 px-2.5 py-1 rounded-full">
          <span className="material-symbols-outlined text-[14px] text-primary">lock</span>
          <span className="text-label-sm text-on-surface-variant font-semibold">Terkoneksi Aman • Midtrans</span>
        </div>
      </div>

      <div className="px-margin-mobile flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-headline-lg text-on-surface">Pembayaran QRIS</h1>
            <p className="text-body-sm text-on-surface-variant">Pindai kode QR untuk menyelesaikan pesanan</p>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary-fixed px-3 py-1 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
            <span className="text-label-sm text-on-secondary-fixed font-bold capitalize">{statusLabel}</span>
          </div>
        </div>

        {/* Timer */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/60 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[22px]">hourglass_top</span>
            </div>
            <div className="flex flex-col">
              <span className="text-label-sm text-on-surface-variant">Selesaikan Pembayaran Dalam</span>
              <span className="text-body-sm text-on-surface-variant/80">
                {expiryTime ? `Jatuh tempo: ${expiryTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` : ''}
              </span>
            </div>
          </div>
          <div className="bg-tertiary-fixed px-3 py-1.5 rounded-xl text-right">
            <span className="text-price-lg text-on-secondary-fixed font-bold tracking-tight">{timerLabel}</span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-space-sm">
          <div className="flex items-center justify-between pb-space-xs">
            <div className="flex items-center gap-2">
              <span className="text-label-md text-on-surface-variant">No. Pesanan:</span>
              <span className="text-label-md text-on-surface font-bold">{order.order_code}</span>
            </div>
            <button onClick={handleCopyOrderCode} className="flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded-lg text-primary">
              <span className="material-symbols-outlined text-[14px]">content_copy</span>
              <span className="text-label-sm">Salin</span>
            </button>
          </div>

          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-surface-container-low/80 p-2.5 rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[24px]">nutrition</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-title-md text-on-surface truncate">{item.product_name}</h2>
                <p className="text-body-sm text-on-surface-variant">{item.quantity} kg @ {formatRupiah(item.price)}</p>
              </div>
              <span className="text-label-md text-on-surface font-bold">{formatRupiah(item.subtotal)}</span>
            </div>
          ))}

          <div className="bg-primary/5 rounded-xl p-space-sm flex items-center justify-between mt-1">
            <div>
              <span className="text-label-sm text-on-surface-variant block">Total Tagihan</span>
              <span className="text-price-lg text-primary font-bold">{formatRupiah(order.total_amount)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2.5 py-1 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-label-sm text-on-surface font-semibold">QRIS Resmi Midtrans</span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-between pb-space-sm">
            <div className="flex items-center gap-1.5">
              <div className="bg-secondary px-2 py-0.5 rounded text-on-secondary font-black tracking-wider text-[11px]">QRIS</div>
              <span className="text-label-sm text-on-surface-variant font-medium">Standar Pembayaran Nasional</span>
            </div>
            <span className="text-label-sm text-primary font-bold">GPN</span>
          </div>

          <div className="relative w-full max-w-[240px] aspect-square bg-surface-container-lowest rounded-2xl p-3 shadow-md flex items-center justify-center my-2">
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code QRIS" className="w-full h-full object-contain" />
            ) : (
              <span className="text-body-sm text-on-surface-variant">Membuat kode QR...</span>
            )}
          </div>
          <p className="text-headline-sm text-on-surface mt-1">Scan QRIS untuk membayar</p>
          <p className="text-body-sm text-on-surface-variant mt-0.5">{order.buyer_name ? 'SegarBuah Pasar Lokal' : ''}</p>

          <div className="flex items-center gap-space-xs w-full mt-space-md">
            <button onClick={handleCopyNominal} className="flex-1 py-2.5 px-3 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">payments</span>
              <span className="text-label-md">Salin Nominal</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-space-xs mt-space-xs">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full h-12 bg-primary text-on-primary rounded-xl text-label-lg font-semibold flex items-center justify-center gap-2 shadow-md active:scale-[0.99] disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-[20px] ${checking && 'animate-spin'}`}>sync</span>
            <span>{checking ? 'Memverifikasi ke Midtrans...' : 'Cek Status Pembayaran'}</span>
          </button>
        </div>

        <div className="p-space-sm bg-surface-container-low/70 rounded-xl flex items-center justify-center gap-2 text-center">
          <span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
          <p className="text-body-sm text-on-surface-variant text-[11px] leading-tight">
            Diproses secara otomatis &amp; aman oleh <strong className="text-on-surface">Midtrans Payment Gateway</strong>.
          </p>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 inset-x-margin-mobile flex justify-center z-50">
          <div className="bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-fixed text-[18px]">check_circle</span>
            <span className="text-label-md font-medium">{toast}</span>
          </div>
        </div>
      )}
    </main>
  );
}