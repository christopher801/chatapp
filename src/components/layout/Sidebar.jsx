import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useRooms } from '../../hooks/useRooms'
import { listenUsers, createRoom, joinRoom, blockUser, unblockUser } from '../../services/messageService'
import Avatar from '../common/Avatar'
import LanguageSwitcher from '../common/LanguageSwitcher'
import Profile from '../../pages/Profile'

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'Kounye a'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function Sidebar({ onSelectRoom, onSelectDirect, activeId, isOpen, onClose }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { theme, toggle: toggleTheme } = useTheme()
  const rooms = useRooms()
  const [allUsers, setAllUsers] = useState([])
  const [tab, setTab] = useState('direct')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [roomPw, setRoomPw] = useState('')
  const [creating, setCreating] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [myUser, setMyUser] = useState(null)

  useEffect(() => {
    const unsub = listenUsers(all => {
      setAllUsers(all)
      setMyUser(all.find(u => u.uid === user?.uid) || null)
    })
    return unsub
  }, [user])

  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  async function handleCreateRoom() {
    if (!newRoomName.trim()) return
    setCreating(true)
    try {
      const rid = await createRoom(newRoomName.trim(), user.uid, isPrivate, roomPw)
      setShowCreate(false); setNewRoomName(''); setIsPrivate(false); setRoomPw('')
      onSelectRoom(rid, newRoomName.trim()); onClose()
    } finally { setCreating(false) }
  }

  async function handleJoinRoom(room) {
    if (room.isPrivate) {
      const pw = window.prompt(`${t('enterRoomPassword')}: "${room.name}"`)
      if (pw === null) return
      if (pw !== room.password) { alert(t('wrongPassword')); return }
    }
    await joinRoom(room.id, user.uid)
    onSelectRoom(room.id, room.name, room)
    onClose()
  }

  const blockedList = myUser?.blockedUsers || []
  const otherUsers = allUsers.filter(u => u.uid !== user?.uid)

  const filteredRooms = useMemo(() =>
    rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
  , [rooms, search])

  const filteredUsers = useMemo(() =>
    otherUsers.filter(u =>
      u.displayName?.toLowerCase().includes(search.toLowerCase()) &&
      !blockedList.includes(u.uid)
    )
  , [otherUsers, search, blockedList])

  return (
    <>
      {showProfile && <Profile onClose={() => setShowProfile(false)} />}

      {/* Overlay mobil */}
      {isOpen && <div className="sidebar-overlay d-md-none" onClick={onClose} />}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-title">
            <button onClick={() => setShowProfile(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, padding: 0 }}>
              <Avatar name={user?.displayName || ''} photoURL={user?.photoURL || ''}
                size={36} showOnline online />
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('appName')}
              </span>
            </button>
            <div className="sidebar-actions">
              <LanguageSwitcher />
              <button className="icon-btn" onClick={toggleTheme}
                title={theme === 'dark' ? 'Mode klè' : 'Mode nwa'}>
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              {tab === 'rooms' && (
                <button className="icon-btn" onClick={() => setShowCreate(v => !v)} title={t('newRoom')}>
                  ✏️
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input"
              placeholder={t('searchMessages')}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Tabs */}
          <div className="conv-tabs">
            {[['direct', t('directMessages')], ['rooms', t('rooms')]].map(([tb, label]) => (
              <button key={tb} className={`conv-tab ${tab === tb ? 'active' : ''}`}
                onClick={() => setTab(tb)}>{label}</button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="conv-list">
          {/* Create room form */}
          {tab === 'rooms' && showCreate && (
            <div className="create-room-form">
              <input placeholder={t('roomName')} value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateRoom()} autoFocus />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <input type="checkbox" id="priv" checked={isPrivate}
                  onChange={e => setIsPrivate(e.target.checked)} />
                <label htmlFor="priv" style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                  {t('roomPrivate')}
                </label>
              </div>
              {isPrivate && (
                <input type="password" placeholder={t('roomPassword')}
                  value={roomPw} onChange={e => setRoomPw(e.target.value)}
                  style={{ marginBottom: 6 }} />
              )}
              <div className="create-room-btns">
                <button className="cr-btn confirm" onClick={handleCreateRoom} disabled={creating}>
                  {creating ? '...' : t('create')}
                </button>
                <button className="cr-btn cancel" onClick={() => setShowCreate(false)}>
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}

          {/* DIRECT */}
          {tab === 'direct' && filteredUsers.map(u => {
            const isActive = activeId === u.uid
            return (
              <div key={u.uid} className={`conv-item ${isActive ? 'active' : ''}`}
                onClick={() => { onSelectDirect(u.uid, u.displayName); onClose() }}>
                <div className="conv-avatar-wrap">
                  <Avatar name={u.displayName} photoURL={u.photoURL}
                    size={52} showOnline online={u.online} />
                </div>
                <div className="conv-meta">
                  <div className={`conv-name`}>{u.displayName}</div>
                  <div className="conv-preview">
                    {u.online ? t('online') : t('offline')}
                  </div>
                </div>
                <div className="conv-right">
                  {/* Bouton bloke discret */}
                  <button onClick={e => { e.stopPropagation(); blockUser(user.uid, u.uid) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 13, color: 'var(--text-muted)', padding: '2px 4px',
                      opacity: 0, transition: 'opacity 0.15s' }}
                    className="block-btn" title={t('blockUser')}>⊘</button>
                </div>
              </div>
            )
          })}

          {/* ROOMS */}
          {tab === 'rooms' && filteredRooms.map(room => {
            const isActive = activeId === room.id
            return (
              <div key={room.id} className={`conv-item ${isActive ? 'active' : ''}`}
                onClick={() => handleJoinRoom(room)}>
                <div className="conv-avatar-wrap">
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'var(--bg-active)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>
                    {room.isPrivate ? '🔒' : '#'}
                  </div>
                </div>
                <div className="conv-meta">
                  <div className="conv-name">{room.name}</div>
                  {room.lastMessage && (
                    <div className="conv-preview">
                      {room.lastSenderName && <span>{room.lastSenderName}: </span>}
                      {room.lastMessage}
                    </div>
                  )}
                </div>
                <div className="conv-right">
                  {room.lastMessageAt && (
                    <div className="conv-time">{timeAgo(room.lastMessageAt)}</div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Empty state */}
          {tab === 'direct' && filteredUsers.length === 0 && (
            <div style={{ padding: '20px 16px', textAlign: 'center',
              color: 'var(--text-muted)', fontSize: 13 }}>
              {search ? t('noResults') : 'Pa gen itilizatè'}
            </div>
          )}
        </div>
      </div>

      {/* CSS pou block-btn hover */}
      <style>{`.conv-item:hover .block-btn { opacity: 1 !important; }`}</style>
    </>
  )
}
