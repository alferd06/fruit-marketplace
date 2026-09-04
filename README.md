fruit-marketplace/
├── client/                      # React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CatalogPage.jsx
│   │   │   ├── ProductDetailPage.jsx
│   │   │   ├── CheckoutPage.jsx
│   │   │   ├── OrderStatusPage.jsx
│   │   │   └── AdminPage.jsx        # opsional
│   │   ├── components/
│   │   ├── services/
│   │   │   └── api.js               # axios instance, base URL dari .env
│   │   └── hooks/
│   │       └── useGeolocation.js
│   └── .env                         # VITE_API_URL=...
│
└── server/                      # Express
    ├── src/
    │   ├── config/
    │   │   └── db.js                # koneksi pg ke Supabase/Neon
    │   ├── routes/
    │   │   ├── products.routes.js
    │   │   ├── orders.routes.js
    │   │   └── payments.routes.js   # termasuk endpoint webhook Midtrans
    │   ├── controllers/
    │   ├── services/
    │   │   └── midtrans.service.js
    │   └── app.js
    ├── .env                          # DATABASE_URL, MIDTRANS_SERVER_KEY, dst — JANGAN commit
    ├── .env.example                  # template tanpa isi rahasia, INI yang di-commit
    └── .gitignore                    # wajib exclude .env, node_modules