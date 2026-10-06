import { useEffect, useState } from 'react'
import {
  deleteStoreProduct,
  formatStoreCategory,
  loadStoreProducts,
  saveStoreProduct,
  STORE_PRODUCT_LIMIT,
} from '../../data/storeProducts'
import { deleteStoreOrder, loadStoreOrders, saveStoreOrder, seedSampleStoreOrders } from '../../data/storeOrders'
import { useToast } from '../../context/useToast'
import { useAuth } from '../../context/useAuth'

const USER_LIMIT = 30
const emptyProduct = { id: null, title: '', category: 'groceries', price: '', stock: '' }
const emptyUser = { id: null, firstName: '', lastName: '', email: '', username: '', password: '' }
const emptyOrder = { id: null, customerName: '', email: '', total: 0, status: 'pending', products: [] }

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

function calculateOrderTotal(products) {
  return products.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0)
}

export function AdminDashboard() {
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState(loadStoreOrders)
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [productDraft, setProductDraft] = useState(emptyProduct)
  const [userDraft, setUserDraft] = useState(emptyUser)
  const [orderDraft, setOrderDraft] = useState(emptyOrder)
  const [orderProductDraft, setOrderProductDraft] = useState({ productId: '', quantity: 1 })
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const { notify } = useToast()
  const { user, logout } = useAuth()

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboard() {
      try {
        const [productData, userResponse] = await Promise.all([
          loadStoreProducts(controller.signal),
          fetch('https://dummyjson.com/users?limit=30&select=id,firstName,lastName,email,username,role', {
            signal: controller.signal,
          }),
        ])

        if (!userResponse.ok) {
          throw new Error('We could not load the dashboard data.')
        }

        const userData = await userResponse.json()
        setProducts(productData)
        setUsers(userData.users.slice(0, USER_LIMIT))
        setOrders(seedSampleStoreOrders())
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'We could not load the dashboard data.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadDashboard()
    return () => controller.abort()
  }, [])

  const filteredProducts = products.filter((product) =>
    `${product.title} ${product.category}`.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const filteredUsers = users.filter((user) =>
    `${user.firstName} ${user.lastName} ${user.email} ${user.username}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  )
  const filteredOrders = orders.filter((order) =>
    `${order.id} ${order.customerName} ${order.email} ${order.status}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  )
  const completedOrders = orders.filter((order) => order.status === 'completed')
  const totalIncome = completedOrders.reduce((total, order) => total + Number(order.total || 0), 0)
  const recentOrders = [...orders]
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
    .slice(0, 5)
  const orderStatuses = ['pending', 'processing', 'completed', 'cancelled'].map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }))

  function openProductForm(product = emptyProduct) {
    setProductDraft({ ...product })
    setIsFormOpen(true)
    setError('')
  }

  function openUserForm(user = emptyUser) {
    setUserDraft({ ...user, password: '' })
    setIsFormOpen(true)
    setError('')
  }

  function openOrderForm(order = emptyOrder) {
    const orderProducts = Array.isArray(order.products) ? order.products.map((item) => ({ ...item })) : []
    setOrderDraft({ ...order, products: orderProducts, total: calculateOrderTotal(orderProducts) })
    setOrderProductDraft({ productId: '', quantity: 1 })
    setIsFormOpen(true)
    setError('')
  }

  async function saveProduct(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    const editing = Boolean(productDraft.id)
    const payload = {
      title: productDraft.title.trim(),
      category: productDraft.category,
      price: Number(productDraft.price),
      stock: Number(productDraft.stock),
      thumbnail: productDraft.thumbnail || '/favicon.svg',
    }

    try {
      const response = await fetch(
        `https://dummyjson.com/products${editing ? `/${productDraft.id}` : '/add'}`,
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      const data = await response.json()
      const mockMiss = editing && response.status === 404
      if (!response.ok && !mockMiss) throw new Error(data.message || 'We could not save this product.')

      const existingProduct = products.find((item) => item.id === productDraft.id)
      const savedProduct = editing
        ? { ...existingProduct, ...payload, ...(mockMiss ? {} : data), id: productDraft.id }
        : { ...payload, ...data, id: `local-${Date.now()}`, isCustom: true, createdAt: Date.now() }
      saveStoreProduct(savedProduct)

      if (editing) {
        setProducts((current) => current.map((item) => item.id === productDraft.id ? savedProduct : item))
      } else {
        setProducts((current) => [savedProduct, ...current].slice(0, STORE_PRODUCT_LIMIT))
      }
      setIsFormOpen(false)
      setProductDraft(emptyProduct)
      notify(editing
        ? 'Product updated and saved in this browser.'
        : 'Product added to the catalog and saved in this browser.')
    } catch (saveError) {
      const message = saveError.message || 'We could not save this product.'
      setError(message)
      notify(message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteProduct(product) {
    setError('')

    try {
      const response = await fetch(`https://dummyjson.com/products/${product.id}`, { method: 'DELETE' })
      const data = await response.json()
      const mockMiss = response.status === 404
      if (!response.ok && !mockMiss) throw new Error(data.message || 'We could not delete this product.')
      deleteStoreProduct(product.id)
      setProducts((current) => current.filter((item) => item.id !== product.id))
      notify(`${product.title} removed from the catalog.`)
    } catch (deleteError) {
      const message = deleteError.message || 'We could not delete this product.'
      setError(message)
      notify(message, 'error')
    }
  }

  async function saveUser(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    const editing = Boolean(userDraft.id)
    const payload = {
      firstName: userDraft.firstName.trim(),
      lastName: userDraft.lastName.trim(),
      email: userDraft.email.trim(),
      username: userDraft.username.trim(),
    }
    if (!editing) payload.password = userDraft.password

    try {
      const response = await fetch(
        `https://dummyjson.com/users${editing ? `/${userDraft.id}` : '/add'}`,
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      const data = await response.json()
      const mockMiss = editing && response.status === 404
      if (!response.ok && !mockMiss) throw new Error(data.message || 'We could not save this user.')

      if (editing) {
        setUsers((current) => current.map((user) => user.id === userDraft.id
          ? { ...user, ...payload, ...(mockMiss ? {} : data), id: user.id }
          : user))
      } else {
        setUsers((current) => [{ ...payload, ...data, id: data.id || Date.now() }, ...current].slice(0, USER_LIMIT))
      }
      setIsFormOpen(false)
      setUserDraft(emptyUser)
      notify(mockMiss
        ? 'User updated in this demo view; DummyJSON does not persist mock IDs.'
        : editing ? 'User updated.' : 'User added to the demo directory.')
    } catch (saveError) {
      const message = saveError.message || 'We could not save this user.'
      setError(message)
      notify(message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  function saveOrder(event) {
    event.preventDefault()
    if (orderDraft.products.length === 0) {
      const message = 'Add at least one product to the order.'
      setError(message)
      notify(message, 'error')
      return
    }

    const editing = Boolean(orderDraft.id)
    const existingOrder = orders.find((order) => order.id === orderDraft.id)
    const order = {
      ...existingOrder,
      id: orderDraft.id || `manual-${Date.now()}`,
      customerName: orderDraft.customerName.trim(),
      email: orderDraft.email.trim(),
      total: calculateOrderTotal(orderDraft.products),
      status: orderDraft.status,
      products: orderDraft.products,
      createdAt: existingOrder?.createdAt || new Date().toISOString(),
    }

    saveStoreOrder(order)
    setOrders((current) => [order, ...current.filter((item) => item.id !== order.id)])
    setIsFormOpen(false)
    setOrderDraft(emptyOrder)
    setOrderProductDraft({ productId: '', quantity: 1 })
    notify(editing ? 'Order updated and saved in this browser.' : 'Order added and saved in this browser.')
  }

  function addOrderProduct() {
    const product = products.find((item) => String(item.id) === orderProductDraft.productId)
    if (!product) {
      const message = 'Choose a product to add to the order.'
      setError(message)
      notify(message, 'error')
      return
    }

    const quantity = Math.max(1, Number(orderProductDraft.quantity) || 1)
    const existingItem = orderDraft.products.find((item) => String(item.id) === String(product.id))
    const nextProducts = existingItem
      ? orderDraft.products.map((item) => String(item.id) === String(product.id)
        ? { ...item, quantity: Number(item.quantity) + quantity }
        : item)
      : [...orderDraft.products, {
        id: product.id,
        title: product.title,
        price: Number(product.price),
        quantity,
      }]

    setOrderDraft((current) => ({
      ...current,
      products: nextProducts,
      total: calculateOrderTotal(nextProducts),
    }))
    setOrderProductDraft({ productId: '', quantity: 1 })
    setError('')
  }

  function updateOrderProductQuantity(productId, quantity) {
    const nextProducts = orderDraft.products.map((item) => String(item.id) === String(productId)
      ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
      : item)
    setOrderDraft((current) => ({
      ...current,
      products: nextProducts,
      total: calculateOrderTotal(nextProducts),
    }))
  }

  function removeOrderProduct(productId) {
    const nextProducts = orderDraft.products.filter((item) => String(item.id) !== String(productId))
    setOrderDraft((current) => ({
      ...current,
      products: nextProducts,
      total: calculateOrderTotal(nextProducts),
    }))
  }

  function removeOrder(order) {
    deleteStoreOrder(order.id)
    setOrders((current) => current.filter((item) => item.id !== order.id))
    notify('Order deleted.')
    setError('')
  }

  async function deleteUser(user) {
    setError('')

    try {
      const response = await fetch(`https://dummyjson.com/users/${user.id}`, { method: 'DELETE' })
      const data = await response.json()
      const mockMiss = response.status === 404
      if (!response.ok && !mockMiss) throw new Error(data.message || 'We could not delete this user.')
      setUsers((current) => current.filter((item) => item.id !== user.id))
      notify(mockMiss
        ? `${user.firstName} ${user.lastName} removed from this demo view; DummyJSON does not persist mock IDs.`
        : `${user.firstName} ${user.lastName} removed from this demo directory.`)
    } catch (deleteError) {
      const message = deleteError.message || 'We could not delete this user.'
      setError(message)
      notify(message, 'error')
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">ADHAM'S MARKET OPERATIONS</p>
          <h1>Dashboard</h1>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist" aria-label="Dashboard sections">
          <button className={activeTab === 'overview' ? 'selected' : ''} type="button" role="tab" aria-selected={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setSearch(''); setIsFormOpen(false); setError('') }}>Overview</button>
          <button className={activeTab === 'products' ? 'selected' : ''} type="button" role="tab" aria-selected={activeTab === 'products'} onClick={() => { setActiveTab('products'); setSearch(''); setIsFormOpen(false); setError('') }}>Products <span>{products.length}</span></button>
          <button className={activeTab === 'users' ? 'selected' : ''} type="button" role="tab" aria-selected={activeTab === 'users'} onClick={() => { setActiveTab('users'); setSearch(''); setIsFormOpen(false); setError('') }}>Users <span>{users.length}</span></button>
          <button className={activeTab === 'orders' ? 'selected' : ''} type="button" role="tab" aria-selected={activeTab === 'orders'} onClick={() => { setActiveTab('orders'); setSearch(''); setIsFormOpen(false); setError('') }}>Orders <span>{orders.length}</span></button>
        </div>
        {activeTab !== 'overview' && (
          <label className="admin-search">
            <span className="sr-only">Search {activeTab}</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${activeTab}`} />
          </label>
        )}
        <button className="admin-add-button" type="button" onClick={() => {
          if (activeTab === 'products') openProductForm()
          else if (activeTab === 'users') openUserForm()
          else openOrderForm()
        }}>
          <span aria-hidden="true">+</span> Add {activeTab === 'products' ? 'product' : activeTab === 'users' ? 'user' : 'order'}
        </button>
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}

      {isFormOpen && (
        <form className="admin-form" onSubmit={activeTab === 'products' ? saveProduct : activeTab === 'users' ? saveUser : saveOrder}>
          <div className="admin-form-heading">
            <p className="admin-form-title">{activeTab === 'products'
              ? productDraft.id ? 'Edit product' : 'Add product'
              : activeTab === 'users'
                ? userDraft.id ? 'Edit user' : 'Add user'
                : orderDraft.id ? 'Edit order' : 'Add order'}</p>
            <button type="button" aria-label="Close form" onClick={() => setIsFormOpen(false)}>×</button>
          </div>
          {activeTab === 'products' ? (
            <div className="admin-fields">
              <label>Product name<input value={productDraft.title} onChange={(event) => setProductDraft({ ...productDraft, title: event.target.value })} required /></label>
              <label>Department<select value={productDraft.category} onChange={(event) => setProductDraft({ ...productDraft, category: event.target.value })}><option value="groceries">Groceries</option><option value="kitchen-accessories">Kitchen essentials</option><option value="furniture">Home &amp; Furniture</option></select></label>
              <label>Price<input type="number" min="0" step="0.01" value={productDraft.price} onChange={(event) => setProductDraft({ ...productDraft, price: event.target.value })} required /></label>
              <label>Stock<input type="number" min="0" step="1" value={productDraft.stock} onChange={(event) => setProductDraft({ ...productDraft, stock: event.target.value })} required /></label>
            </div>
          ) : activeTab === 'users' ? (
            <div className="admin-fields">
              <label>First name<input value={userDraft.firstName} onChange={(event) => setUserDraft({ ...userDraft, firstName: event.target.value })} required /></label>
              <label>Last name<input value={userDraft.lastName} onChange={(event) => setUserDraft({ ...userDraft, lastName: event.target.value })} required /></label>
              <label>Email<input type="email" value={userDraft.email} onChange={(event) => setUserDraft({ ...userDraft, email: event.target.value })} required /></label>
              <label>Username<input value={userDraft.username} onChange={(event) => setUserDraft({ ...userDraft, username: event.target.value })} required /></label>
              {!userDraft.id && <label>Password<input type="password" minLength="8" value={userDraft.password} onChange={(event) => setUserDraft({ ...userDraft, password: event.target.value })} required /></label>}
            </div>
          ) : (
            <div className="admin-fields">
              <label>Customer name<input value={orderDraft.customerName} onChange={(event) => setOrderDraft({ ...orderDraft, customerName: event.target.value })} required /></label>
              <label>Email<input type="email" value={orderDraft.email} onChange={(event) => setOrderDraft({ ...orderDraft, email: event.target.value })} /></label>
              <label>Status<select value={orderDraft.status} onChange={(event) => setOrderDraft({ ...orderDraft, status: event.target.value })}><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
              <div className="admin-order-products">
                <p className="admin-order-products-title">Products</p>
                <div className="admin-order-product-picker">
                  <label>
                    Product
                    <select value={orderProductDraft.productId} onChange={(event) => setOrderProductDraft({ ...orderProductDraft, productId: event.target.value })}>
                      <option value="">Choose a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={String(product.id)}>
                          {product.title} - {formatPrice(product.price)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Quantity
                    <input type="number" min="1" step="1" value={orderProductDraft.quantity} onChange={(event) => setOrderProductDraft({ ...orderProductDraft, quantity: event.target.value })} />
                  </label>
                  <button className="admin-cancel-button" type="button" onClick={addOrderProduct}>Add product</button>
                </div>
                {orderDraft.products.length > 0 ? (
                  <div className="admin-order-lines">
                    {orderDraft.products.map((item) => (
                      <div className="admin-order-line" key={item.id}>
                        <span className="admin-order-line-product">
                          <strong>{item.title}</strong>
                          <small>{formatPrice(item.price)} each</small>
                        </span>
                        <label>
                          <span className="sr-only">Quantity for {item.title}</span>
                          <input type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateOrderProductQuantity(item.id, event.target.value)} />
                        </label>
                        <strong>{formatPrice(item.price * item.quantity)}</strong>
                        <button className="admin-order-remove" type="button" aria-label={`Remove ${item.title}`} onClick={() => removeOrderProduct(item.id)}>×</button>
                      </div>
                    ))}
                  </div>
                ) : <p className="admin-order-empty">Choose products to build this order.</p>}
                <p className="admin-order-total">Order total <strong>{formatPrice(calculateOrderTotal(orderDraft.products))}</strong></p>
              </div>
            </div>
          )}
          <div className="admin-form-actions">
            <button className="admin-cancel-button" type="button" onClick={() => setIsFormOpen(false)}>Cancel</button>
            <button className="admin-add-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      )}

      {activeTab === 'overview' ? (
        <section className="admin-overview" aria-label="Shop overview">
          <div className="admin-profile-card">
            <div className="admin-profile-avatar" aria-hidden="true">
              {[user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('') || user?.username?.[0] || 'A'}
            </div>
            <div className="admin-profile-copy">
              <p className="eyebrow">ADMIN PROFILE</p>
              <p className="admin-profile-name">{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username}</p>
              <p>{user?.email || user?.username}</p>
            </div>
            <button className="sign-out-button" type="button" onClick={logout}>Sign out</button>
          </div>

          <div className="admin-metrics">
            <article className="admin-metric-card">
              <span>Income</span>
              <strong>{formatPrice(totalIncome)}</strong>
              <small>Completed orders</small>
            </article>
            <article className="admin-metric-card">
              <span>Orders</span>
              <strong>{orders.length}</strong>
              <small>{orderStatuses.find((item) => item.status === 'pending')?.count || 0} pending</small>
            </article>
            <article className="admin-metric-card">
              <span>Products</span>
              <strong>{products.length}</strong>
              <small>In the catalog</small>
            </article>
            <article className="admin-metric-card">
              <span>Customers</span>
              <strong>{users.length}</strong>
              <small>In the directory</small>
            </article>
          </div>

          <div className="admin-overview-grid">
            <section className="admin-overview-panel">
              <div className="admin-overview-panel-heading">
                <p className="admin-overview-title">Recent orders</p>
                <button type="button" onClick={() => setActiveTab('orders')}>View all</button>
              </div>
              {recentOrders.length ? (
                <table className="admin-overview-table">
                  <thead><tr><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.customerName}</td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>{formatPrice(order.total)}</td>
                        <td><span className={`order-status status-${order.status}`}>{order.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="admin-table-message">No orders yet.</p>}
            </section>

            <section className="admin-overview-panel admin-status-panel">
              <p className="admin-overview-title">Order status</p>
              {orderStatuses.map(({ status, count }) => (
                <div className="admin-status-row" key={status}>
                  <span className={`order-status status-${status}`}>{status}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </section>
          </div>
        </section>
      ) : (
      <div className="admin-table-wrap">
        {isLoading ? (
          <p className="admin-table-message" role="status">Loading dashboard data...</p>
        ) : activeTab === 'products' ? (
          <table className="admin-table">
            <thead><tr><th>Product</th><th>Department</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td><div className="admin-product-cell"><img src={product.thumbnail} alt="" /><span>{product.title}</span></div></td>
                  <td>{formatStoreCategory(product.category)}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>{product.stock}</td>
                  <td><div className="admin-row-actions"><button type="button" onClick={() => openProductForm(product)}>Edit</button><button type="button" onClick={() => deleteProduct(product)}>Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : activeTab === 'users' ? (
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role || 'customer'}</td>
                  <td><div className="admin-row-actions"><button type="button" onClick={() => openUserForm(user)}>Edit</button><button type="button" onClick={() => deleteUser(user)}>Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Customer</th><th>Email</th><th>Date</th><th>Products</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.customerName}</td>
                  <td>{order.email || 'Not provided'}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-order-items-list">
                      {order.products?.map((item, index) => (
                        <span key={`${item.id}-${index}`}>{item.title} × {item.quantity}</span>
                      ))}
                    </div>
                  </td>
                  <td>{formatPrice(order.total)}</td>
                  <td>{order.status}</td>
                  <td><div className="admin-row-actions"><button type="button" onClick={() => openOrderForm(order)}>Edit</button><button type="button" onClick={() => removeOrder(order)}>Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && !error && (activeTab === 'products' ? filteredProducts.length : activeTab === 'users' ? filteredUsers.length : filteredOrders.length) === 0 && (
          <p className="admin-table-message">No {activeTab} match this search.</p>
        )}
      </div>
      )}
    </main>
  )
}