const ORDERS_KEY = 'adham-market.orders'
const SEEDED_ORDERS_KEY = 'adham-market.sample-orders-added'

export function loadStoreOrders() {
  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY))
    return Array.isArray(orders) ? orders : []
  } catch {
    return []
  }
}

export function saveStoreOrder(order) {
  const savedOrder = {
    ...order,
    id: order.id || `order-${Date.now()}`,
    createdAt: order.createdAt || new Date().toISOString(),
  }
  const orders = loadStoreOrders().filter((item) => item.id !== savedOrder.id)
  localStorage.setItem(ORDERS_KEY, JSON.stringify([savedOrder, ...orders]))
  return savedOrder
}

export function deleteStoreOrder(orderId) {
  const orders = loadStoreOrders().filter((order) => order.id !== orderId)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

export function seedSampleStoreOrders() {
  const existingOrders = loadStoreOrders()
  if (localStorage.getItem(SEEDED_ORDERS_KEY)) return existingOrders

  const customers = [
    ['Jordan Lee', 'jordan.lee@example.com'],
    ['Taylor Morgan', 'taylor.morgan@example.com'],
    ['Casey Rivera', 'casey.rivera@example.com'],
    ['Riley Parker', 'riley.parker@example.com'],
    ['Avery Brooks', 'avery.brooks@example.com'],
    ['Morgan Ellis', 'morgan.ellis@example.com'],
    ['Jamie Quinn', 'jamie.quinn@example.com'],
    ['Drew Bennett', 'drew.bennett@example.com'],
  ]
  const statuses = ['completed', 'completed', 'processing', 'pending', 'completed', 'cancelled', 'pending', 'completed']
  const now = Date.now()
  const sampleOrders = customers.map(([customerName, email], index) => {
    const total = Number((24 + Math.random() * 176).toFixed(2))
    return {
      id: `sample-${now}-${index}`,
      customerName,
      email,
      total,
      status: statuses[index],
      products: [{ id: `sample-item-${index}`, title: 'Market basket', price: total, quantity: 1 }],
      createdAt: new Date(now - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)).toISOString(),
      isSample: true,
    }
  })
  const orders = [...sampleOrders, ...existingOrders]
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  localStorage.setItem(SEEDED_ORDERS_KEY, 'true')
  return orders
}