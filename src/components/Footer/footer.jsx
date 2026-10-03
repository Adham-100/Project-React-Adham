import { Link } from 'react-router-dom'
import './footer.css'

const currentYear = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand-block">
          <Link className="footer-brand" to="/">Adham's Market</Link>
          <p>Good food, everyday essentials, and a little more ease in every shop.</p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/categories">Departments</Link>
          <Link to="/cart">Your cart</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>&copy; {currentYear} Adham's Market</span>
        <span>Fresh finds for everyday living.</span>
      </div>
    </footer>
  )
}