import { useEffect, useRef, useState, useMemo, memo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useMessages } from '../../hooks/useMessages'
import { useTyping } from '../../hooks/useTyping'
import {
  sendRoomMessage, sendDirectMessage,
  markDirectAsRead, listenUsers,
} from '../../services/messageService'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import Avatar from '../common/Avatar'

function formatDateSep(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Jodi a'
  if (d.toDateString() === yesterday.toDateString()) return 'Yè'
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

// Ajoute separatè dat ant mesaj
function withDateSeps(messages) {
  const result = []
  let lastDate = null
  for (const msg of messages) {
    const d = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date()
    const dateStr = d.toDateString()
    if (dateStr !== lastDate) {
      result.push({ _sep: true, label: formatDateSep(msg.createdAt), key: dateStr })
      lastDate = dateStr
    }
    result.push(msg)
  }
  return result
}

export default function ChatWindow({ mode, id, title, pinnedMessage, otherUser }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const messages = useMessages(mode, id, user?.uid)
  const bottomRef = useRef()
  const [replyTo, setReplyTo] = useState(null)
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)

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

  // Auto-scroll sèlman si itilizatè nan ba a
  useEffect(() => {
    const el = bottomRef.current
    if (!el) return
    const parent = el.parentElement
    const nearBottom = parent.scrollHeight - parent.scrollTop - parent.clientHeight < 150
    if (nearBottom) el.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (mode === 'direct' && id && user?.uid) markDirectAsRead(user.uid, id, user.uid)
  }, [mode, id, user?.uid, messages.length])

  async function handleSend({ text, imageURL }) {
    if (!user || !id) return
    const reply = replyTo
      ? { msgId: replyTo.id, text: replyTo.text || '', senderName: replyTo.senderName }
      : null
    try {
      if (mode === 'room')
        await sendRoomMessage(id, user.uid, user.displayName, text, imageURL, reply)
      else
        await sendDirectMessage(user.uid, id, user.uid, user.displayName, text, imageURL, reply)
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
          <div className="chat-empty-sub">
            {mode === 'room' ? t('selectRoom') : t('selectUser')}
          </div>
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
              : `${t('rooms')}`}
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn" onClick={() => setShowSearch(v => !v)} title="Chèche">🔍</button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div style={{ padding: '6px 16px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-panel)' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('searchMessages')} autoFocus
            style={{ width: '100%', padding: '7px 14px', borderRadius: 'var(--radius-full)',
              border: '1.5px solid var(--border-input)', background: 'var(--bg-input)',
              color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
        </div>
      )}

      {/* Pinned */}
      {pinnedMessage && (
        <div style={{ padding: '6px 20px', background: 'var(--bg-active)',
          borderBottom: '1px solid var(--border)', fontSize: 13,
          color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>📌</span>
          <span><strong>{pinnedMessage.senderName}</strong>: {pinnedMessage.text}</span>
        </div>
      )}

      {/* Messages */}
      <div className="messages-area">
        {filtered.length === 0 && (
          <div style={{ margin: 'auto', color: 'var(--text-muted)', textAlign: 'center', fontSize: 14 }}>
            {search ? t('noResults') : 'Voye premye mesaj ou a 👋'}
          </div>
        )}

        {filtered.map((item, idx) => {
          if (item._sep) return (
            <div key={item.key} className="date-sep">{item.label}</div>
          )
          const msg = item
          const prev = filtered[idx - 1]
          const isGroupStart = !prev || prev._sep || prev.senderId !== msg.senderId
          const next = filtered[idx + 1]
          const isGroupEnd = !next || next._sep || next.senderId !== msg.senderId
          const isOwn = msg.senderId === user?.uid

          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={isOwn}
              isGroupStart={isGroupStart}
              showAvatar={isGroupEnd}
              collectionPath={collectionPath}
              onReply={setReplyTo}
              users={users}
            />
          )
        })}

        {/* Typing indicator */}
        {typers.length > 0 && (
          <div className="typing-row">
            <div style={{ width: 32 }} />
            <div className="typing-bubble">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
              {typers.length === 1 ? t('typing') : `${typers.length} ${t('typing')}`}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onTyping={notifyTyping}
      />
    </div>
  )
}
