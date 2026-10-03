import { Link } from 'react-router-dom'
import { useCart } from '../../context/useCart'
import { formatStoreCategory } from '../../data/storeProducts'

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

export function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart()

  return (
    <main className="cart-page">
      <div className="cart-heading">
        <div>
          <p className="eyebrow">YOUR ADHAM'S MARKET BAG</p>
          <h1>Your cart</h1>
        </div>
        <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
      </div>

      {items.length === 0 ? (
        <section className="cart-empty">
          <p className="cart-empty-title">Your cart is waiting for something good.</p>
          <p>Browse the daily picks and add a few favorites.</p>
          <Link className="hero-link" to="/products">Browse products <span aria-hidden="true">&rarr;</span></Link>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Items in your cart">
            {items.map((item) => (
              <article className="cart-item" key={item.id}>
                <img src={item.thumbnail} alt={item.title} />
                <div className="cart-item-info">
                  <p>{formatStoreCategory(item.category)}</p>
                  <p className="cart-item-title">{item.title}</p>
                  <strong>{formatPrice(item.price)}</strong>
                </div>
                <div className="quantity-control" aria-label={`Quantity for ${item.title}`}>
                  <button type="button" aria-label={`Decrease ${item.title}`} onClick={() => updateQuantity(item.id, item.quantity - 1)}>&minus;</button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label={`Increase ${item.title}`} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <button className="remove-item" type="button" onClick={() => removeItem(item.id)}>Remove</button>
              </article>
            ))}
          </section>

          <aside className="order-summary" aria-labelledby="summary-title">
            <p className="order-summary-title" id="summary-title">Order summary</p>
            <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
            <div><span>Delivery</span><strong>Free</strong></div>
            <div className="summary-total"><span>Total</span><strong>{formatPrice(subtotal)}</strong></div>
            <Link className="auth-submit checkout-link" to="/checkout">Continue to checkout</Link>
            <Link className="continue-shopping" to="/products">Continue shopping</Link>
          </aside>
        </div>
      )}
    </main>
  )
}