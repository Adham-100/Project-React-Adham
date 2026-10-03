import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/useCart'
import { useToast } from '../../context/useToast'
import { loadStoreProducts } from '../../data/storeProducts'

const departments = [
  {
    category: 'groceries',
    title: 'Groceries',
    description: 'Fresh produce, pantry staples, and everyday favorites.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85',
    alt: 'A fresh bowl of greens and vegetables',
  },
  {
    category: 'kitchen-accessories',
    title: 'Kitchen essentials',
    description: 'Useful tools for all the little things you make.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=85',
    alt: 'A bright home kitchen',
  },
  {
    category: 'furniture',
    title: 'Home & Furniture',
    description: 'Furniture, decor, and useful home accessories.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85',
    alt: 'A comfortable living room with a sofa',
  },
]

export function Home() {
  const [topPicks, setTopPicks] = useState([])
  const [isLoadingPicks, setIsLoadingPicks] = useState(true)
  const [picksError, setPicksError] = useState('')
  const { addItem } = useCart()
  const { notify } = useToast()

  useEffect(() => {
    const controller = new AbortController()

    async function loadTopPicks() {
      try {
        const products = (await loadStoreProducts(controller.signal))
          .filter((product) => product.category === 'groceries')
          .sort((first, second) => second.rating - first.rating)
          .slice(0, 4)
        setTopPicks(products)
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setPicksError(loadError.message || 'Top picks are temporarily unavailable.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingPicks(false)
      }
    }

    loadTopPicks()
    return () => controller.abort()
  }, [])

  function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  return (
    <main className="store-page home-page">
      <section className="store-hero" aria-labelledby="store-title">
        <div className="hero-copy">
          <p className="eyebrow">GOOD FOOD, GOOD MOOD</p>
          <h1 id="store-title">Your everyday shop, made <span>easy.</span></h1>
          <p className="hero-description">
            Find something fresh for the fridge, the pantry, and everything in between.
          </p>
          <Link className="hero-link" to="/products">
            Browse all products <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <div className="hero-image-wrap">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=85"
            alt="Fresh colorful produce at a market"
          />
          <div className="hero-note"><strong>Good picks.</strong><span>Every single day.</span></div>
        </div>
      </section>

      <section className="home-top-picks" aria-labelledby="top-picks-title">
        <div className="catalog-heading">
          <div>
            <p className="eyebrow">CUSTOMER FAVORITES</p>
            <p className="catalog-title" id="top-picks-title">Top picks this week</p>
          </div>
          <Link className="all-departments-link" to="/products">
            Shop all products <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {isLoadingPicks && <p className="catalog-message" role="status">Finding this week&apos;s favorites...</p>}
        {picksError && <p className="catalog-message" role="alert">{picksError}</p>}
        {!isLoadingPicks && !picksError && (
          <div className="product-grid">
            {topPicks.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  <img src={product.thumbnail} alt={product.title} loading="lazy" />
                </div>
                <div className="product-info">
                  <p className="product-category">Groceries</p>
                  <p className="product-title">{product.title}</p>
                  <div className="product-meta">
                    <span className="product-rating"><span aria-hidden="true">★</span> {product.rating}</span>
                    {product.brand && <span>{product.brand}</span>}
                  </div>
                  <p className="product-price">{formatPrice(product.price)}</p>
                  <Link className="product-details-link" to={`/products/${product.id}?department=${product.category}`}>
                    View details <span aria-hidden="true">&rarr;</span>
                  </Link>
                  <button
                    className="add-to-cart-button"
                    type="button"
                    onClick={() => {
                      addItem(product)
                      notify(`${product.title} added to your cart`)
                    }}
                  >
                    Add to cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="home-departments" aria-labelledby="home-departments-title">
        <div className="catalog-heading">
          <div>
            <p className="eyebrow">START WITH AN AISLE</p>
            <p className="catalog-title" id="home-departments-title">What are you looking for?</p>
          </div>
          <Link className="all-departments-link" to="/categories">
            All departments <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <div className="home-department-grid">
          {departments.map((department) => (
            <Link
              className="home-department"
              key={department.category}
              to={`/products?category=${department.category}`}
            >
              <img src={department.image} alt={department.alt} />
              <span className="home-department-copy">
                <strong>{department.title}</strong>
                <span>{department.description}</span>
              </span>
              <span className="home-department-arrow" aria-hidden="true">&rarr;</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}