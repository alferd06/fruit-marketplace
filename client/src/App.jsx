import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import PaymentPage from './pages/PaymentPage';
import OrderStatusPage from './pages/OrderStatusPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-canvas min-h-screen font-sans">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/payment/:orderCode" element={<PaymentPage />} />
          <Route path="/order/:orderCode" element={<OrderStatusPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}