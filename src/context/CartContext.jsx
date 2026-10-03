import { useEffect, useState } from 'react'
import { CartContext } from './storeContexts'

const CART_KEY = 'marketly.cart'

function readCart() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY))
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart)

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  function addItem(product) {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) => item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item)
      }

      return [...current, {
        id: product.id,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail,
        category: product.category,
        quantity: 1,
      }]
    })
  }

  function updateQuantity(productId, quantity) {
    if (quantity < 1) {
      setItems((current) => current.filter((item) => item.id !== productId))
      return
    }

    setItems((current) => current.map((item) => item.id === productId
      ? { ...item, quantity }
      : item))
  }

  function removeItem(productId) {
    setItems((current) => current.filter((item) => item.id !== productId))
  }

  function clearCart() {
    setItems([])
  }

  const itemCount = items.reduce((total, item) => total + item.quantity, 0)
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

