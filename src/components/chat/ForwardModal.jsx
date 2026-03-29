import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { forwardMessage, listenUsers } from '../../services/messageService'
import { useRooms } from '../../hooks/useRooms'
import Avatar from '../common/Avatar'

export default function ForwardModal({ msg, onClose }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const rooms = useRooms()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(null)
  const [done, setDone] = useState(null)

  useEffect(() => {
    const unsub = listenUsers(setUsers)
    return unsub
  }, [])

  const others = users.filter(u => u.uid !== user?.uid &&
    u.displayName?.toLowerCase().includes(search.toLowerCase()))
  const filteredRooms = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()))

  async function handle(mode, id, label) {
    setSending(id)
    try {
      await forwardMessage(msg, mode, id, user.uid, user.displayName)
      setDone(label)
      setTimeout(onClose, 1200)
    } catch { alert(t('errorMessage')) }
    setSending(null)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
      zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, animation: 'fadeIn 0.18s ease',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-panel)', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: 400, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '16px 20px 8px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{t('forwardMessage')}</span>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 20 }}>✕</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('searchMessages')} autoFocus
            style={{ width: '100%', padding: '8px 14px',
              borderRadius: 'var(--radius-full)', border: '1.5px solid var(--border-input)',
              background: 'var(--bg-input)', color: 'var(--text-primary)',
              fontSize: 14, outline: 'none' }} />
        </div>

        {done && (
          <div style={{ padding: '8px 20px', background: 'var(--bg-active)',
            color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>
            ✅ {t('forwardedTo')} {done}
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {others.length > 0 && (
            <div style={{ padding: '6px 20px 2px',
              fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {t('directMessages')}
            </div>
          )}
          {others.map(u => (
            <div key={u.uid} onClick={() => handle('direct', u.uid, u.displayName)}
              style={{ display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px', cursor: 'pointer',
                background: sending === u.uid ? 'var(--bg-active)' : 'transparent',
                transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Avatar name={u.displayName} photoURL={u.photoURL} size={38} showOnline online={u.online} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{u.displayName}</span>
              {sending === u.uid && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>...</span>}
            </div>
          ))}

          {filteredRooms.length > 0 && (
            <div style={{ padding: '6px 20px 2px',
              fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {t('rooms')}
            </div>
          )}
          {filteredRooms.map(r => (
            <div key={r.id} onClick={() => handle('room', r.id, r.name)}
              style={{ display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px', cursor: 'pointer',
                background: sending === r.id ? 'var(--bg-active)' : 'transparent',
                transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 38, height: 38, borderRadius: '50%',
                background: 'var(--bg-active)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {r.isPrivate ? '🔒' : '#'}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{r.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
