import { useMemo } from 'react'

const COLORS = [
  '#1877f2','#e41e3f','#00b09b','#f7971e',
  '#8e44ad','#16a085','#d35400','#2980b9',
]

export default function Avatar({ name = '', photoURL = '', size = 38, showOnline = false, online = false }) {
  const initials = useMemo(() =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  , [name])

  const color = useMemo(() =>
    COLORS[name.charCodeAt(0) % COLORS.length] || COLORS[0]
  , [name])

  const style = {
    width: size, height: size,
    fontSize: size * 0.38,
    borderRadius: '50%',
    flexShrink: 0,
  }

  return (
    <div style={{ position: 'relative', flexShrink: 0, display: 'inline-block' }}>
      {photoURL ? (
        <img src={photoURL} alt={name}
          className="avatar" style={style}
          onError={e => { e.target.style.display = 'none' }} />
      ) : (
        <div className="avatar" style={{ ...style, background: color, display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700,
          fontSize: size * 0.38 }}>
          {initials || '?'}
        </div>
      )}
      {showOnline && (
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: size < 36 ? 9 : 12, height: size < 36 ? 9 : 12,
          borderRadius: '50%',
          background: online ? 'var(--online)' : 'var(--text-muted)',
          border: '2px solid var(--bg-sidebar)',
        }} />
      )}
    </div>
  )
}
