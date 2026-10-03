
import { Home } from './Pages/Home/landing'
import { Products } from './Pages/Products/products'
import { Product } from './Pages/Home/products/product'
import { CartPage } from './Pages/Cart/cart'
import { CheckoutPage } from './Pages/Checkout/checkout'
import { Categories } from './Pages/categories/categories'
import { AdminDashboard } from './Pages/Admin/admin'
import { AuthPage } from './Pages/Auth/auth'
import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Header } from './components/header'
import { Footer } from './components/Footer/footer'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastProvider'
import { useAuth } from './context/useAuth'

function AdminRoute() {
  const { user } = useAuth()

  if (user?.role !== 'admin') {
    return <Navigate to={user ? '/' : '/login'} replace />
  }

  return <AdminDashboard />
}

function AppContent() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/:productId" element={<Product />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
