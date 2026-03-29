import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useMessages } from '../../hooks/useMessages'
import { useTyping } from '../../hooks/useTyping'
import { sendRoomMessage, sendDirectMessage, markDirectAsRead, listenUsers } from '../../services/messageService'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import Avatar from '../common/Avatar'

function formatDateSep(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const today = new Date()
  const yest = new Date(today); yest.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Jodi a'
  if (d.toDateString() === yest.toDateString()) return 'Yè'
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

function withDateSeps(msgs) {
  const out = []
  let last = null
  for (const m of msgs) {
    const d = (m.createdAt?.toDate ? m.createdAt.toDate() : new Date()).toDateString()
    if (d !== last) { out.push({ _sep: true, label: formatDateSep(m.createdAt), key: d }); last = d }
    out.push(m)
  }
  return out
}

// Son notifikasyon — Web Audio API, pa bezwen lib
function playNotif() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'; osc.frequency.value = 880
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(); osc.stop(ctx.currentTime + 0.3)
  } catch {}
}

export default function ChatWindow({ mode, id, title, pinnedMessage, otherUser }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { messages, loadMore, loadingMore, hasMore } = useMessages(mode, id, user?.uid)
  const messagesAreaRef = useRef()
  const bottomRef = useRef()
  const prevCountRef = useRef(0)
  const [replyTo, setReplyTo] = useState(null)
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [soundOn, setSoundOn] = useState(true)

  const typingPath = useMemo(() => {
    if (!id) return null
    return mode === 'room' ? `room_${id}` : `direct_${[user?.uid, id].sort().join('_')}`
  }, [mode, id, user?.uid])

  const { typers, notifyTyping } = useTyping(typingPath, user?.uid)

  const collectionPath = useMemo(() => {
    if (!id) return []
    return mode === 'room'
      ? ['rooms', id, 'messages']
      : ['direct', [user?.uid, id].sort().join('_'), 'messages']
  }, [mode, id, user?.uid])

  useEffect(() => {
    const unsub = listenUsers(setUsers)
    return unsub
  }, [])

  // Infinite scroll — detekte lè itilizatè scroll anlè
  useEffect(() => {
    const el = messagesAreaRef.current
    if (!el) return
    function onScroll() {
      if (el.scrollTop < 80 && hasMore && !loadingMore) loadMore()
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [hasMore, loadingMore, loadMore])

  // Auto-scroll pou nouvo mesaj + son notifikasyon
  useEffect(() => {
    const el = messagesAreaRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200
    if (nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    // Son — sèlman lè mesaj nouvo vini (pa chajman inisyal)
    if (soundOn && messages.length > prevCountRef.current && prevCountRef.current > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.senderId !== user?.uid && document.visibilityState === 'hidden') {
        playNotif()
      }
    }
    prevCountRef.current = messages.length
  }, [messages, soundOn, user?.uid])

  // Mak kòm li
  useEffect(() => {
    if (mode === 'direct' && id && user?.uid) markDirectAsRead(user.uid, id, user.uid)
  }, [mode, id, user?.uid, messages.length])

  async function handleSend({ text, imageURL, audioURL = null }) {
    if (!user || !id) return
    const reply = replyTo
      ? { msgId: replyTo.id, text: replyTo.text || '', senderName: replyTo.senderName }
      : null
    try {
      if (mode === 'room')
        await sendRoomMessage(id, user.uid, user.displayName, text, imageURL, reply, audioURL)
      else
        await sendDirectMessage(user.uid, id, user.uid, user.displayName, text, imageURL, reply, audioURL)
      setReplyTo(null)
    } catch { alert(t('errorMessage')) }
  }

  const filtered = useMemo(() => {
    const base = search.trim()
      ? messages.filter(m => m.text?.toLowerCase().includes(search.toLowerCase()))
      : messages
    return withDateSeps(base)
  }, [messages, search])

  if (!id) {
    return (
      <div className="chat-panel">
        <div className="chat-empty">
          <div className="chat-empty-icon">💬</div>
          <div className="chat-empty-title">ChatApp</div>
          <div className="chat-empty-sub">{mode === 'room' ? t('selectRoom') : t('selectUser')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <Avatar name={title || ''} size={40}
          photoURL={otherUser?.photoURL || ''}
          showOnline={mode === 'direct'} online={otherUser?.online} />
        <div className="chat-header-info">
          <div className="chat-header-name">{mode === 'room' ? `# ${title}` : title}</div>
          <div className={`chat-header-status ${otherUser?.online ? 'online' : ''}`}>
            {mode === 'direct'
              ? (otherUser?.online ? `● ${t('online')}` : `○ ${t('offline')}`)
              : t('rooms')}
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn" onClick={() => setSoundOn(v => !v)}
            title={soundOn ? 'Silenye' : 'Aktive son'}
            style={{ fontSize: 17 }}>
            {soundOn ? '🔔' : '🔕'}
          </button>
          <button className="icon-btn" onClick={() => setShowSearch(v => !v)}
            style={{ fontSize: 17 }}>🔍</button>
        </div>
      </div>

      {showSearch && (
        <div style={{ padding: '6px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('searchMessages')} autoFocus
            style={{ width: '100%', padding: '7px 14px', borderRadius: 'var(--radius-full)',
              border: '1.5px solid var(--border-input)', background: 'var(--bg-input)',
              color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
        </div>
      )}

      {pinnedMessage && (
        <div style={{ padding: '6px 20px', background: 'var(--bg-active)',
          borderBottom: '1px solid var(--border)', fontSize: 13,
          color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>📌</span>
          <span><strong>{pinnedMessage.senderName}</strong>: {pinnedMessage.text}</span>
        </div>
      )}

      {/* Messages area */}
      <div className="messages-area" ref={messagesAreaRef}>
        {/* Load more btn */}
        {hasMore && (
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <button onClick={loadMore} disabled={loadingMore}
              style={{ fontSize: 12, padding: '4px 16px',
                borderRadius: 'var(--radius-full)', border: '1px solid var(--border)',
                background: 'var(--bg-hover)', color: 'var(--text-secondary)',
                cursor: loadingMore ? 'default' : 'pointer' }}>
              {loadingMore ? '...' : `⬆ ${t('loadMore')}`}
            </button>
          </div>
        )}

        {filtered.length === 0 && !loadingMore && (
          <div style={{ margin: 'auto', color: 'var(--text-muted)', textAlign: 'center', fontSize: 14 }}>
            {search ? t('noResults') : 'Voye premye mesaj ou a 👋'}
          </div>
        )}

        {filtered.map((item, idx) => {
          if (item._sep) return <div key={item.key} className="date-sep">{item.label}</div>
          const msg = item
          const prev = filtered[idx - 1]
          const next = filtered[idx + 1]
          const isGroupStart = !prev || prev._sep || prev.senderId !== msg.senderId
          const isGroupEnd   = !next || next._sep || next.senderId !== msg.senderId
          return (
            <MessageBubble key={msg.id} msg={msg}
              isOwn={msg.senderId === user?.uid}
              isGroupStart={isGroupStart} showAvatar={isGroupEnd}
              collectionPath={collectionPath}
              onReply={setReplyTo} users={users} />
          )
        })}

        {typers.length > 0 && (
          <div className="typing-row">
            <div style={{ width: 32 }} />
            <div className="typing-bubble">
              <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
              {t('typing')}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={handleSend} replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)} onTyping={notifyTyping} />
    </div>
  )
}
