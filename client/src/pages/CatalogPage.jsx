import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function formatRupiah(number) {
  return 'Rp ' + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function ProductCard({ product, onSelect }) {
  const available = product.is_available && product.stock > 0;
  return (
    <article
      onClick={() => onSelect(product.id)}
      className={`bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden relative transition-all duration-200 hover:shadow-md cursor-pointer ${!available && 'opacity-70'}`}
    >
      <div>
        <div className="relative w-full aspect-square bg-surface-container-low overflow-hidden">
          <img
            className={`w-full h-full object-cover transition-transform duration-300 ${!available && 'grayscale'}`}
            src={product.image_url}
            alt={product.name}
          />
          <div
            className={`absolute top-2 left-2 font-label-sm text-label-sm px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 ${
              available ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-error-container text-on-error-container'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-primary' : 'bg-error'}`} />
            <span>{available ? 'Tersedia' : 'Habis'}</span>
          </div>
        </div>
        <div className="p-space-xs flex flex-col">
          <h3 className="text-title-md text-on-surface font-bold line-clamp-1 leading-snug mt-1">{product.name}</h3>
          {product.description && (
            <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-1">{product.description}</p>
          )}
        </div>
      </div>
      <div className="p-space-xs pt-0 flex items-end justify-between mt-1">
        <span className="text-price-sm text-primary font-bold">
          {available ? formatRupiah(product.price) : <span className="text-error font-semibold text-body-sm">Stok Kosong</span>}
        </span>
        {available && (
          <button
            aria-label={`Lihat ${product.name}`}
            onClick={(e) => { e.stopPropagation(); onSelect(product.id); }}
            className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        )}
      </div>
    </article>
  );
}

export default function CatalogPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/api/products')
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
    );
  }, [products, query]);

  return (
    <main className="flex flex-col relative w-full pb-28 min-h-screen bg-surface">
      <div className="flex flex-col w-full">
        {/* Search Bar */}
        <section className="px-margin-mobile pt-space-xs pb-space-sm flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs">
            <div className="flex-1 flex items-center bg-surface-container-lowest rounded-2xl px-space-md h-12 shadow-sm">
              <span className="material-symbols-outlined text-primary text-[22px] mr-space-xs select-none">search</span>
              <input
                className="w-full bg-transparent text-on-surface placeholder:text-outline text-body-md focus:outline-none"
                placeholder="Cari buah segar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-outline">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Catalog Header */}
        <section className="px-margin-mobile pt-space-xs pb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-headline-sm text-on-surface font-bold">Koleksi Buah</span>
            <span className="text-label-sm bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full">
              {filtered.length} Pilihan
            </span>
          </div>
        </section>

        {/* Product Grid */}
        <section className="px-margin-mobile py-space-xs">
          {loading ? (
            <p className="text-center text-on-surface-variant py-8">Memuat produk...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-on-surface-variant py-8">Produk tidak ditemukan.</p>
          ) : (
            <div className="grid grid-cols-2 gap-space-sm">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} onSelect={(id) => navigate(`/product/${id}`)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}