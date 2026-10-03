export const STORE_DEPARTMENTS = [
  { id: 'groceries', label: 'Groceries', limit: 15 },
  { id: 'kitchen-accessories', label: 'Kitchen essentials', limit: 15 },
  { id: 'furniture', label: 'Home & Furniture', limit: 8 },
]

export const STORE_CATEGORIES = STORE_DEPARTMENTS.map((department) => department.id)
export const STORE_SOURCE_CATEGORIES = [...STORE_CATEGORIES, 'home-decoration']
export const STORE_PRODUCT_LIMIT = 60

const PRODUCT_CHANGES_KEY = 'adham-market.product-changes'
const DELETED_PRODUCTS_KEY = 'adham-market.deleted-products'

function readStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function writeStoredArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getStoredStoreProduct(productId) {
  return readStoredArray(PRODUCT_CHANGES_KEY)
    .find((product) => String(product.id) === String(productId)) || null
}

export function isStoreProductDeleted(productId) {
  return readStoredArray(DELETED_PRODUCTS_KEY).includes(String(productId))
}

export function saveStoreProduct(product) {
  const products = readStoredArray(PRODUCT_CHANGES_KEY)
  const nextProduct = {
    ...product,
    createdAt: product.createdAt || Date.now(),
  }
  const remaining = products.filter((item) => String(item.id) !== String(product.id))
  writeStoredArray(PRODUCT_CHANGES_KEY, [nextProduct, ...remaining])
  writeStoredArray(
    DELETED_PRODUCTS_KEY,
    readStoredArray(DELETED_PRODUCTS_KEY).filter((id) => id !== String(product.id)),
  )
  return nextProduct
}

export function deleteStoreProduct(productId) {
  const products = readStoredArray(PRODUCT_CHANGES_KEY)
  const storedProduct = products.find((product) => String(product.id) === String(productId))
  writeStoredArray(
    PRODUCT_CHANGES_KEY,
    products.filter((product) => String(product.id) !== String(productId)),
  )

  if (!storedProduct?.isCustom) {
    const deletedIds = readStoredArray(DELETED_PRODUCTS_KEY)
    writeStoredArray(DELETED_PRODUCTS_KEY, [...new Set([...deletedIds, String(productId)])])
  }
}

function applyStoredProductChanges(products) {
  const changes = readStoredArray(PRODUCT_CHANGES_KEY)
  const changedById = new Map(changes.map((product) => [String(product.id), product]))
  const deletedIds = new Set(readStoredArray(DELETED_PRODUCTS_KEY))
  const updatedProducts = products
    .filter((product) => !deletedIds.has(String(product.id)))
    .map((product) => changedById.get(String(product.id)) || product)
  const newProducts = changes.filter((product) => product.isCustom)

  return [...newProducts, ...updatedProducts].slice(0, STORE_PRODUCT_LIMIT)
}

export function formatStoreCategory(category) {
  const department = STORE_DEPARTMENTS.find((item) => item.id === category)
  if (department) return department.label
  return category.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')
}

export async function loadStoreProducts(signal) {
  const sources = [
    { id: 'groceries', limit: 15 },
    { id: 'kitchen-accessories', limit: 15 },
    { id: 'furniture', limit: 8 },
    { id: 'home-decoration', limit: 3 },
  ]
  const responses = await Promise.all(
    sources.map(({ id, limit, skip = 0 }) =>
      fetch(`https://dummyjson.com/products/category/${id}?limit=${limit}&skip=${skip}`, { signal }),
    ),
  )

  if (responses.some((response) => !response.ok)) {
    throw new Error('We could not load the store products right now.')
  }

  const [groceries, kitchenEssentials, furniture, homeDecor] = await Promise.all(
    responses.map((response) => response.json()),
  )
  const homeFurniture = [...furniture.products, ...homeDecor.products]
    .map((product) => ({ ...product, category: 'furniture', sourceCategory: product.category }))

  return applyStoredProductChanges([
    ...groceries.products,
    ...kitchenEssentials.products,
    ...homeFurniture,
  ])
}