import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../services/authService'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from '../components/common/LanguageSwitcher'

export default function Register() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Modpas dwe gen omwen 6 karaktè.')
      return
    }
    setLoading(true)
    try {
      await register(email, password, displayName)
      navigate('/')
    } catch (err) {
      console.error(err)
      setError(t('errorRegister'))
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
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h2 className="fw-bold mb-1" style={{ color: '#6366f1' }}>💬 ChatApp</h2>
              <p className="text-muted mb-0" style={{ fontSize: 14 }}>{t('register')}</p>
            </div>
            <LanguageSwitcher />
          </div>

          {error && (
            <div className="alert alert-danger py-2" style={{ fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>
                {t('displayName')}
              </label>
              <input
                type="text"
                className="form-control"
                style={{ borderRadius: 12, border: '1.5px solid #dee2e6' }}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

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
                minLength={6}
                autoComplete="new-password"
              />
              <div style={{ fontSize: 11, color: '#adb5bd', marginTop: 4 }}>
                Omwen 6 karaktè
              </div>
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
              {loading ? t('loading') : t('register')}
            </button>
          </form>

          <div className="text-center">
            <Link
              to="/login"
              style={{ fontSize: 13, color: '#6366f1', textDecoration: 'none' }}
            >
              {t('hasAccount')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
