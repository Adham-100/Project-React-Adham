import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
}

export function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, login, register } = useAuth()
  const isRegister = location.pathname === '/register'
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (isRegister) {
        await register(form)
      } else {
        await login(form.username.trim(), form.password)
      }
      navigate('/', { replace: true })
    } catch (submitError) {
      setError(submitError.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-form-wrap">
          {isRegister && <p className="eyebrow">WELCOME TO ADHAM'S MARKET</p>}
          <h1 id="auth-title">{isRegister ? 'Create your account' : "Welcome to Adham's Market"}</h1>
          <p className="auth-intro">
            {isRegister ? 'A few details and your basket is ready.' : 'Enter your credentials'}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="auth-name-fields">
                <label>
                  First name
                  <input name="firstName" autoComplete="given-name" value={form.firstName} onChange={updateField} required />
                </label>
                <label>
                  Last name
                  <input name="lastName" autoComplete="family-name" value={form.lastName} onChange={updateField} required />
                </label>
              </div>
            )}

            {isRegister && (
              <label>
                Email address
                <input name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} required />
              </label>
            )}

            <label>
              Username
              <input name="username" autoComplete="username" value={form.username} onChange={updateField} required />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={isRegister ? 8 : undefined}
                value={form.password}
                onChange={updateField}
                required
              />
            </label>

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? 'Already have an account?' : "New to Adham's Market?"}{' '}
            <Link to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
          {isRegister && <p className="auth-demo-note">Demo accounts are saved in this browser.</p>}
        </div>
      </section>
    </main>
  )
}