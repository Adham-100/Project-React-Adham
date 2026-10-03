import { Link } from 'react-router-dom'

const departments = [
  {
    id: 'groceries',
    title: 'Groceries',
    description: 'Fresh produce, pantry staples, drinks, and everyday favorites.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=85',
    alt: 'Fresh fruit and vegetables at a market',
    count: '15 items',
  },
  {
    id: 'kitchen-accessories',
    title: 'Kitchen essentials',
    description: 'Handy little things that make everyday cooking easier.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=85',
    alt: 'Bright home kitchen with everyday cooking tools',
    count: '15 items',
  },
  {
    id: 'furniture',
    title: 'Home & Furniture',
    description: 'Furniture, decor, and useful home accessories.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85',
    alt: 'A comfortable living room with a sofa',
    count: '8 items',
  },
]

export function Categories() {
  return (
    <main className="categories-page">
      <div className="categories-heading">
        <div>
          <p className="eyebrow">SHOP BY DEPARTMENT</p>
          <h1>Find your aisle.</h1>
        </div>
        <Link className="all-departments-link" to="/products">Browse all 38 products <span aria-hidden="true">&rarr;</span></Link>
      </div>
      <div className="department-grid">
        {departments.map((department) => (
          <article className="department-card" key={department.id}>
            <img src={department.image} alt={department.alt} />
            <div className="department-copy">
              <div className="department-title-row">
                <p className="department-name">{department.title}</p>
                <span>{department.count}</span>
              </div>
              <p>{department.description}</p>
              <Link to={`/products?category=${department.id}`}>
                Explore department <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}