import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login, loginWithGoogle } from '../services/authService'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from '../components/common/LanguageSwitcher'

export default function Login() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(t('errorLogin'))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate('/')
    } catch (err) {
      setError(t('errorLogin'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      <div
        className="card shadow-lg"
        style={{ width: '100%', maxWidth: 400, borderRadius: 20, border: 'none' }}
      >
        <div className="card-body p-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h2 className="fw-bold mb-1" style={{ color: '#6366f1' }}>💬 ChatApp</h2>
              <p className="text-muted mb-0" style={{ fontSize: 14 }}>{t('login')}</p>
            </div>
            <LanguageSwitcher />
          </div>

          {error && (
            <div className="alert alert-danger py-2" style={{ fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>
                {t('email')}
              </label>
              <input
                type="email"
                className="form-control"
                style={{ borderRadius: 12, border: '1.5px solid #dee2e6' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="mb-4">
              <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>
                {t('password')}
              </label>
              <input
                type="password"
                className="form-control"
                style={{ borderRadius: 12, border: '1.5px solid #dee2e6' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn w-100 mb-3"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                borderRadius: 12,
                fontWeight: 600,
                padding: '10px',
                border: 'none',
              }}
            >
              {loading ? t('loading') : t('login')}
            </button>
          </form>

          <div className="d-flex align-items-center gap-2 mb-3">
            <hr className="flex-fill" />
            <span style={{ fontSize: 12, color: '#adb5bd' }}>ou</span>
            <hr className="flex-fill" />
          </div>

          <button
            className="btn w-100 mb-3"
            onClick={handleGoogle}
            disabled={loading}
            style={{
              border: '1.5px solid #dee2e6',
              borderRadius: 12,
              fontWeight: 500,
              padding: '10px',
              background: '#fff',
              color: '#212529',
            }}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              style={{ width: 18, marginRight: 8 }}
            />
            {t('loginWithGoogle')}
          </button>

          <div className="text-center">
            <Link
              to="/register"
              style={{ fontSize: 13, color: '#6366f1', textDecoration: 'none' }}
            >
              {t('noAccount')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
