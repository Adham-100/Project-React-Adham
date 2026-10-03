import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCart } from '../../context/useCart'
import { useToast } from '../../context/useToast'
import { formatStoreCategory, loadStoreProducts } from '../../data/storeProducts'

const PAGE_SIZE = 12

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

export function Products({ showHero = false }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(() => searchParams.get('category') || 'all')
  const [sort, setSort] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const { addItem } = useCart()
  const { notify } = useToast()

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        setProducts(await loadStoreProducts(controller.signal))
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'We could not load the products right now.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProducts()
    return () => controller.abort()
  }, [])

  const categories = [...new Set(products.map((product) => product.category))].sort()
  const visibleProducts = products
    .filter((product) => category === 'all' || product.category === category)
    .filter((product) =>
      `${product.title} ${product.brand || ''} ${product.category}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    )
    .sort((first, second) => {
      if (sort === 'price-low') return first.price - second.price
      if (sort === 'price-high') return second.price - first.price
      if (sort === 'rating') return second.rating - first.rating
      if (sort === 'newest') {
        const firstAdded = first.createdAt || Number(first.id) || 0
        const secondAdded = second.createdAt || Number(second.id) || 0
        return secondAdded - firstAdded
      }
      return 0
    })
  const pageCount = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE))
  const pageProducts = visibleProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <main className="store-page">
      {showHero && (
        <section className="store-hero" aria-labelledby="store-title">
        <div className="hero-copy">
          {/* <p className="eyebrow">GOOD FOOD, GOOD MOOD</p> */}
          <h1 id="store-title">Your everyday shop, made <span>easy.</span></h1>
          <p className="hero-description">
            Find something fresh for the fridge, the pantry, and everything in between.
          </p>
          <a className="hero-link" href="#products">
            Shop the collection <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
        <div className="hero-image-wrap">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=85"
            alt="Fresh colorful produce at a market"
          />
          <div className="hero-note"><strong>Good picks.</strong><span>Every single day.</span></div>
        </div>
        </section>
      )}

      {!showHero && (
        <section className="products-page-heading" aria-labelledby="products-title">
          <div>
            <p className="eyebrow">THE ADHAM'S MARKET COLLECTION</p>
            <h1 id="products-title">Good things for every day.</h1>
            <p>Browse groceries, kitchen essentials, and Home &amp; Furniture.</p>
          </div>
          <Link className="all-departments-link" to="/categories">
            Browse departments <span aria-hidden="true">&rarr;</span>
          </Link>
        </section>
      )}

      <section className="catalog-section" id="products" aria-labelledby="catalog-title">
        <div className="catalog-heading">
          <div>
            <p className="eyebrow">THE DAILY EDIT</p>
            <p className="catalog-title" id="catalog-title">A little bit of everything</p>
          </div>
          <p className="catalog-count">
            {isLoading ? 'Finding your favorites...' : `${visibleProducts.length} items`}
          </p>
        </div>

        <div className="catalog-controls" id="categories">
          <label className="search-control">
            <span className="sr-only">Search products</span>
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search products"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
              }}
            />
          </label>

          <label className="select-control">
            <span className="sr-only">Filter by category</span>
            <select value={category} onChange={(event) => {
              const nextCategory = event.target.value
              setCategory(nextCategory)
              setCurrentPage(1)
              setSearchParams(nextCategory === 'all' ? {} : { category: nextCategory })
            }}>
              <option value="all">All departments</option>
              {categories.map((item) => (
                <option key={item} value={item}>{formatStoreCategory(item)}</option>
              ))}
            </select>
          </label>

          <label className="select-control sort-control">
            <span className="sr-only">Sort products</span>
            <select value={sort} onChange={(event) => {
              setSort(event.target.value)
              setCurrentPage(1)
            }}>
              <option value="none">Sort: None</option>
              <option value="newest">Newest added</option>
              <option value="price-low">Price: Low to high</option>
              <option value="price-high">Price: High to low</option>
              <option value="rating">Top rated</option>
            </select>
          </label>
        </div>

        {error && (
          <div className="catalog-message error-message" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>Try again</button>
          </div>
        )}

        {isLoading && (
          <div className="catalog-message" role="status">Loading today&apos;s picks...</div>
        )}

        {!isLoading && !error && visibleProducts.length === 0 && (
          <div className="catalog-message" role="status">No products match that search.</div>
        )}

        {!isLoading && !error && visibleProducts.length > 0 && (
          <div className="product-grid">
            {pageProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  <img src={product.thumbnail} alt={product.title} loading="lazy" />
                </div>
                <div className="product-info">
                  <p className="product-category">{formatStoreCategory(product.category)}</p>
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

        {!isLoading && !error && pageCount > 1 && (
          <nav className="pagination" aria-label="Product pages">
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
            >
              &larr;
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <button
                className={page === currentPage ? 'current-page' : ''}
                type="button"
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
                key={page}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage === pageCount}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              &rarr;
            </button>
          </nav>
        )}
      </section>
    </main>
  )
}