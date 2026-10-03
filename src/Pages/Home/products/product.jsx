import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useCart } from '../../../context/useCart'
import { useToast } from '../../../context/useToast'
import {
  formatStoreCategory,
  getStoredStoreProduct,
  isStoreProductDeleted,
  STORE_CATEGORIES,
  STORE_SOURCE_CATEGORIES,
} from '../../../data/storeProducts'

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

export function Product() {
  const { productId } = useParams()
  const [searchParams] = useSearchParams()
  const department = searchParams.get('department')
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { addItem } = useCart()
  const { notify } = useToast()

  useEffect(() => {
    const controller = new AbortController()

    async function loadProduct() {
      setIsLoading(true)
      setError('')

      try {
        const storedProduct = getStoredStoreProduct(productId)
        if (storedProduct) {
          setProduct(storedProduct)
          return
        }
        if (isStoreProductDeleted(productId)) {
          throw new Error("This product is no longer available in Adham's Market.")
        }

        const response = await fetch(`https://dummyjson.com/products/${productId}`, {
          signal: controller.signal,
        })
        const data = await response.json()

        const displayCategory = STORE_CATEGORIES.includes(department)
          ? department
          : data.category === 'home-decoration' ? 'furniture' : data.category

        if (!response.ok || !STORE_SOURCE_CATEGORIES.includes(data.category) || !STORE_CATEGORIES.includes(displayCategory)) {
          throw new Error("This product is not available in Adham's Market.")
        }

        setProduct({ ...data, category: displayCategory })
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'We could not load this product.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadProduct()
    return () => controller.abort()
  }, [productId, department])

  return (
    <main className="product-detail-page">
      <Link className="back-to-shop" to="/products">&larr; Back to products</Link>
      {isLoading && <p className="catalog-message" role="status">Loading product...</p>}
      {error && <p className="catalog-message" role="alert">{error}</p>}
      {product && !error && (
        <article className="product-detail">
          <div className="detail-image">
            <img src={product.thumbnail} alt={product.title} />
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{formatStoreCategory(product.category)}</p>
            <h1>{product.title}</h1>
            <p className="detail-rating"><span aria-hidden="true">★</span> {product.rating} customer rating</p>
            <p className="detail-description">{product.description}</p>
            <p className="detail-price">{formatPrice(product.price)}</p>
            <p className="detail-stock">{product.stock > 0 ? 'In stock and ready to shop' : 'Currently out of stock'}</p>
            {product.brand && <p className="detail-brand">Brand: {product.brand}</p>}
            <button
              className="add-to-cart-button detail-add-button"
              type="button"
              disabled={product.stock < 1}
              onClick={() => {
                addItem(product)
                notify(`${product.title} added to your cart`)
              }}
            >
              Add to cart
            </button>
          </div>
        </article>
      )}
    </main>
  )
}
