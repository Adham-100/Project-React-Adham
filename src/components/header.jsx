import { NavLink, Link } from 'react-router-dom'
import { FaHouse, FaProductHunt } from 'react-icons/fa6'
import { MdCategory, MdDashboard, MdShoppingBasket } from 'react-icons/md'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import './Header/header.css'

export function Header() {
    const { user, logout } = useAuth()
    const { itemCount } = useCart()

    return (
        <header className="site-header">
            <div className="header-inner">
                <Link className="brand" to="/" aria-label="Adham's Market home">
                    <span className="brand-mark"><FaHouse aria-hidden="true" /></span>
                    <span>Adham's Market</span>
                </Link>
                <nav className="main-nav" aria-label="Main navigation">
                    <NavLink to="/" end><FaHouse aria-hidden="true" /> Home</NavLink>
                    <NavLink to="/products"><FaProductHunt aria-hidden="true" /> Products</NavLink>
                    <NavLink to="/categories"><MdCategory aria-hidden="true" /> Categories</NavLink>
                    {user?.role === 'admin' && (
                        <NavLink to="/admin"><MdDashboard aria-hidden="true" /> Dashboard</NavLink>
                    )}
                </nav>
                {/* <span className="header-promise">A better kind of grocery run</span> */}
                <div className="header-account">
                    <Link className="cart-link" to="/cart" aria-label={`Cart, ${itemCount} items`}>
                        <MdShoppingBasket aria-hidden="true" />
                        <span>Cart</span>
                        <span className="cart-count">{itemCount}</span>
                    </Link>
                    {user ? (
                        <>
                            <span className="account-greeting">Hi, {user.firstName}</span>
                            <button className="sign-out-button" type="button" onClick={logout}>Sign out</button>
                        </>
                    ) : (
                        <Link className="sign-in-link" to="/login">Sign in</Link>
                    )}
                </div>
            </div>
        </header>
    )
}
