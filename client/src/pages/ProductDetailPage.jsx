import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';

function formatRupiah(number) {
  return 'Rp ' + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [notes, setNotes] = useState('');

  const { location, status: geoStatus, errorMsg: geoError, requestLocation } = useGeolocation();

  useEffect(() => {
    api.get(`/api/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => setErrorMsg('Gagal memuat produk'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="pt-24 text-center text-on-surface-variant">Memuat produk...</div>;
  }
  if (!product) {
    return <div className="pt-24 text-center text-error">{errorMsg || 'Produk tidak ditemukan'}</div>;
  }

  const total = qty * product.price;
  const stock = product.stock;

  async function handleCheckout() {
    if (!buyerName || !buyerPhone || !buyerAddress) {
      setErrorMsg('Nama, nomor WhatsApp, dan alamat wajib diisi');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.post('/api/orders', {
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        buyer_address: buyerAddress,
        latitude: location?.latitude,
        longitude: location?.longitude,
        location_accuracy: location?.accuracy,
        items: [{ product_id: product.id, quantity: qty }],
      });
      navigate(`/payment/${res.data.order.order_code}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal membuat pesanan');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-col relative w-full pb-32 min-h-screen bg-surface">
      <div className="flex flex-col w-full">
        {/* Top Nav */}
        <div className="px-margin-mobile pt-space-xs pb-space-sm flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali ke katalog"
            className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <span className="text-title-md text-on-surface truncate px-space-xs">Detail Produk & Pemesanan</span>
          <div className="flex items-center gap-space-2xs">
            <button aria-label="Bagikan produk" className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface-variant active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
          </div>
        </div>

        <div className="px-margin-mobile flex flex-col gap-space-lg">
          {/* Hero Card */}
          <div className="bg-surface-container-lowest rounded-3xl p-space-sm shadow-[0_4px_20px_-4px_rgba(31,41,55,0.06)] flex flex-col gap-space-md">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface-container-low">
              <img alt={product.name} className="w-full h-full object-cover" src={product.image_url} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-label-sm ${product.is_available ? 'bg-surface-container-lowest/95 text-primary' : 'bg-error-container text-on-error-container'}`}>
                  <span className={`w-2 h-2 rounded-full ${product.is_available ? 'bg-primary' : 'bg-error'}`} />
                  {product.is_available ? 'Tersedia' : 'Habis'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-space-2xs">
              <h1 className="text-headline-lg text-on-surface mt-1 leading-snug">{product.name}</h1>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-display-lg-mobile text-primary tracking-tight">{formatRupiah(product.price)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-full text-primary text-label-md font-semibold">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {product.is_available ? `Stok Tersedia (Sisa ${stock} kg)` : 'Stok Habis'}
                </span>
              </div>
            </div>

            {product.description && (
              <p className="text-body-md text-on-surface-variant leading-relaxed">{product.description}</p>
            )}
          </div>

          {/* Quantity */}
          <div className="bg-surface-container-lowest rounded-3xl p-space-md shadow-[0_2px_12px_-2px_rgba(31,41,55,0.05)] flex items-center justify-between gap-space-md">
            <div className="flex flex-col">
              <span className="text-title-md text-on-surface font-semibold">Jumlah Pesanan (kg)</span>
              <span className="text-body-sm text-on-surface-variant mt-0.5">Minimal pembelian 1 kg</span>
            </div>
            <div className="flex items-center bg-surface-container-low rounded-2xl p-1 shadow-inner gap-1">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-surface-container-lowest text-on-surface flex items-center justify-center active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">remove</span>
              </button>
              <span className="w-10 text-center text-headline-md text-primary">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(stock, q + 1))}
                className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center active:scale-90 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            </div>
          </div>

          {/* Buyer Form */}
          <div className="bg-surface-container-lowest rounded-3xl p-space-md shadow-[0_2px_12px_-2px_rgba(31,41,55,0.05)] flex flex-col gap-space-md mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
              </div>
              <h2 className="text-headline-sm text-on-surface">Data Pembeli & Pengiriman</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md text-on-surface font-semibold">Nama Lengkap Penerima</label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-space-sm py-2.5 focus-within:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant mr-2">person</span>
                <input
                  className="bg-transparent w-full text-body-md text-on-surface focus:outline-none placeholder:text-on-surface-variant"
                  placeholder="Masukkan nama penerima"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md text-on-surface font-semibold">Nomor WhatsApp / Telepon</label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-space-sm py-2.5 focus-within:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant mr-2">call</span>
                <input
                  className="bg-transparent w-full text-body-md text-on-surface focus:outline-none placeholder:text-on-surface-variant"
                  placeholder="08xx-xxxx-xxxx"
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md text-on-surface font-semibold">Alamat Lengkap Pengiriman</label>
              <div className="bg-surface-container-low rounded-xl p-space-sm focus-within:bg-surface-container-high transition-colors">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant mt-0.5">home_pin</span>
                  <textarea
                    className="bg-transparent w-full text-body-md text-on-surface focus:outline-none resize-none placeholder:text-on-surface-variant"
                    placeholder="Tuliskan nama jalan, blok, nomor rumah, RT/RW"
                    rows={3}
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Location share */}
            <div className="flex flex-col gap-space-xs">
              <span className="text-label-md text-on-surface font-semibold">Titik Akurat GPS (Driver Kurir)</span>
              <div className="bg-surface-container-low rounded-2xl p-space-sm flex flex-col gap-space-xs">
                {geoStatus === 'success' && location ? (
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-label-sm px-2.5 py-1 rounded-full font-bold">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Lokasi berhasil ditambahkan</span>
                    </div>
                    <span className="text-label-sm text-on-surface-variant">
                      Akurasi ±{Math.round(location.accuracy)}m
                    </span>
                  </div>
                ) : (
                  <span className="text-body-sm text-on-surface-variant">
                    Belum ada titik lokasi — alamat manual di atas tetap dipakai kurir.
                  </span>
                )}
                {geoStatus === 'error' && (
                  <span className="text-body-sm text-error">{geoError}</span>
                )}
                <button
                  onClick={requestLocation}
                  type="button"
                  className="w-full mt-1 py-2 px-space-sm rounded-xl bg-surface-container-lowest text-primary text-label-md font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {geoStatus === 'loading' ? 'refresh' : 'my_location'}
                  </span>
                  <span>
                    {geoStatus === 'loading' ? 'Mendeteksi Lokasi GPS...' : 'Bagikan / Perbarui Titik Lokasi Saya'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md text-on-surface font-semibold">Catatan Pengiriman (Opsional)</label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-space-sm py-2.5 focus-within:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant mr-2">edit_note</span>
                <input
                  className="bg-transparent w-full text-body-md text-on-surface focus:outline-none placeholder:text-on-surface-variant"
                  placeholder="Contoh: Titipkan di pos satpam atau gantung di pagar"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {errorMsg && <p className="text-body-sm text-error">{errorMsg}</p>}
          </div>
        </div>
      </div>

      {/* Sticky Checkout Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-8px_24px_rgba(0,0,0,0.06)] px-margin-mobile py-space-sm pb-space-md">
        <div className="flex items-center justify-between gap-space-sm">
          <div className="flex flex-col">
            <span className="text-body-sm text-on-surface-variant">Total Pembayaran</span>
            <span className="text-headline-lg text-primary">{formatRupiah(total)}</span>
            <span className="text-label-sm text-on-surface-variant">({qty} kg x {formatRupiah(product.price)})</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={submitting || !product.is_available}
            className="flex-1 max-w-[210px] h-12 rounded-2xl bg-primary text-on-primary text-label-lg flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            <span>{submitting ? 'Memproses...' : 'Lanjut Bayar'}</span>
            {!submitting && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
          </button>
        </div>
      </div>
    </main>
  );
}