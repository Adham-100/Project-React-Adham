import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useCart } from '../../context/useCart'
import { useToast } from '../../context/useToast'
import { saveStoreOrder, loadStoreOrders } from '../../data/storeOrders'

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

function createOrderNumber() {
  let orderNumber
  do {
    orderNumber = `ADM-${Math.floor(100000 + Math.random() * 900000)}`
  } while (loadStoreOrders().some((order) => order.orderNumber === orderNumber))
  return orderNumber
}

export function CheckoutPage() {
  const { items, itemCount, subtotal, clearCart } = useCart()
  const { user } = useAuth()
  const { notify } = useToast()
  const [form, setForm] = useState({
    fullName: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  if (items.length === 0 && !order) return <Navigate to="/cart" replace />

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function placeOrder(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('https://dummyjson.com/carts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 1,
          products: items.map((item) => ({ id: item.id, quantity: item.quantity })),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'We could not place your order.')
      }

      const orderNumber = createOrderNumber()
      const savedOrder = saveStoreOrder({
        id: orderNumber,
        orderNumber,
        dummyJsonId: data.id,
        customerName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        userId: user?.id || null,
        products: items.map(({ id, title, price, quantity }) => ({ id, title, price, quantity })),
        total: subtotal,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
      clearCart()
      setOrder(savedOrder)
      notify('Order placed successfully.')
    } catch (submitError) {
      setError(submitError.message || 'We could not place your order.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (order) {
    return (
      <main className="checkout-page">
        <section className="checkout-success" role="status">
          <p className="eyebrow">ORDER CONFIRMED</p>
          <h1>Thank you, {order.customerName.split(' ')[0]}.</h1>
          <p>Your order has been saved.</p>
          <p>Delivery to {order.address}, {order.city} {order.postalCode}.</p>
          <Link className="hero-link" to="/products">Continue shopping <span aria-hidden="true">&rarr;</span></Link>
        </section>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <Link className="back-to-shop" to="/cart">&larr; Back to cart</Link>
      <div className="checkout-heading">
        <p className="eyebrow">DELIVERY DETAILS</p>
        <h1>Checkout</h1>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form-card" onSubmit={placeOrder}>
          <div className="checkout-fields">
            <label>Full name<input name="fullName" autoComplete="name" value={form.fullName} onChange={updateField} required /></label>
            <label>Email address<input name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} required /></label>
            <label>Phone number<input name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={updateField} required /></label>
            <label>Street address<input name="address" autoComplete="street-address" value={form.address} onChange={updateField} required /></label>
            <label>City<input name="city" autoComplete="address-level2" value={form.city} onChange={updateField} required /></label>
            <label>Postal code<input name="postalCode" autoComplete="postal-code" value={form.postalCode} onChange={updateField} required /></label>
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Placing order...' : 'Place order'}
          </button>
          <p className="checkout-demo-note">Payment processing is not enabled in this demo.</p>
        </form>

        <aside className="checkout-summary order-summary" aria-labelledby="checkout-summary-title">
          <p className="order-summary-title" id="checkout-summary-title">Order summary</p>
          <div className="checkout-products">
            {items.map((item) => (
              <div className="checkout-product" key={item.id}>
                <span>{item.title} <small>× {item.quantity}</small></span>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>
          <div><span>Items</span><strong>{itemCount}</strong></div>
          <div><span>Delivery</span><strong>Free</strong></div>
          <div className="summary-total"><span>Total</span><strong>{formatPrice(subtotal)}</strong></div>
        </aside>
      </div>
    </main>
  )
}