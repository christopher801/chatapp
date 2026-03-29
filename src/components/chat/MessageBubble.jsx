import { useState, useCallback, memo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { toggleReaction, editMessage, deleteMessage } from '../../services/messageService'
import Avatar from '../common/Avatar'
import Lightbox from '../common/Lightbox'
import AudioPlayer from './AudioPlayer'
import ForwardModal from './ForwardModal'

const QUICK_EMOJIS = ['👍','❤️','😂','😮','😢','🔥']

function formatTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const MessageBubble = memo(function MessageBubble({
  msg, isOwn, isGroupStart, showAvatar,
  collectionPath, onReply, users = []
}) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [lightbox, setLightbox] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(msg.text)
  const [forwarding, setForwarding] = useState(false)
  const closeLightbox = useCallback(() => setLightbox(false), [])

  if (msg.deleted) {
    return (
      <div className={`msg-row ${isOwn ? 'own' : ''} ${isGroupStart ? 'msg-group-start' : ''}`}>
        <div className="msg-avatar"><div style={{ width: 32 }} /></div>
        <div className="msg-col">
          <div className="bubble deleted">🚫 {t('deleted')}</div>
        </div>
      </div>
    )
  }

  async function handleEdit() {
    if (!editText.trim() || editText === msg.text) { setEditing(false); return }
    try { await editMessage(collectionPath, msg.id, editText.trim()) }
    catch { alert(t('errorEdit')) }
    setEditing(false)
  }

  async function handleDelete() {
    if (!window.confirm(t('confirmDelete'))) return
    try { await deleteMessage(collectionPath, msg.id) }
    catch { alert(t('errorDelete')) }
  }

  async function handleReaction(emoji) {
    await toggleReaction(collectionPath, msg.id, emoji, user.uid)
  }

  const reactions = msg.reactions || {}
  const hasReactions = Object.values(reactions).some(a => a.length > 0)
  const senderPhotoURL = users.find(u => u.uid === msg.senderId)?.photoURL || ''

  return (
    <>
      {lightbox && <Lightbox src={msg.imageURL} onClose={closeLightbox} />}
      {forwarding && <ForwardModal msg={msg} onClose={() => setForwarding(false)} />}

      <div className={`msg-row ${isOwn ? 'own' : ''} ${isGroupStart ? 'msg-group-start' : ''} msg-anim`}>

        <div className="msg-avatar">
          {!isOwn && showAvatar
            ? <Avatar name={msg.senderName || ''} size={32} photoURL={senderPhotoURL} />
            : <div style={{ width: 32 }} />}
        </div>

        <div className="msg-col" style={{ position: 'relative' }}>
          {!isOwn && isGroupStart && msg.senderName && (
            <div className="msg-sender-name">{msg.senderName}</div>
          )}

          {/* Aksyon hover */}
          <div className={`bubble-actions ${isOwn ? 'own' : 'rx'}`}>
            {QUICK_EMOJIS.map(e => (
              <button key={e} className="action-btn" style={{ fontSize: 14 }}
                onClick={() => handleReaction(e)}>{e}</button>
            ))}
            <button className="action-btn" title={t('replyTo')}
              onClick={() => onReply && onReply(msg)}>↩</button>
            <button className="action-btn" title={t('forwardMessage')}
              onClick={() => setForwarding(true)}>↗</button>
            {isOwn && !msg.imageURL && !msg.audioURL && (
              <button className="action-btn" title={t('editMessage')}
                onClick={() => { setEditing(true); setEditText(msg.text) }}>✏️</button>
            )}
            {isOwn && (
              <button className="action-btn" title={t('deleteMessage')}
                onClick={handleDelete} style={{ color: 'var(--danger)' }}>🗑</button>
            )}
          </div>

          {/* Reply preview */}
          {msg.replyTo && (
            <div className={`bubble ${isOwn ? 'own' : 'rx'}`}
              style={{ padding: '5px 12px', opacity: 0.75, marginBottom: 2, fontSize: 12 }}>
              <div className="bubble-reply">
                <strong>{msg.replyTo.senderName}</strong>
                <br />{msg.replyTo.text || '📷'}
              </div>
            </div>
          )}

          {/* Imaj */}
          {msg.imageURL && (
            <div className={`bubble bubble-img ${isOwn ? 'own' : 'rx'}`}>
              <img src={msg.imageURL} alt="" onClick={() => setLightbox(true)}
                style={{ cursor: 'zoom-in' }} />
            </div>
          )}

          {/* Mesaj vwa */}
          {msg.audioURL && (
            <div className={`bubble ${isOwn ? 'own' : 'rx'}`} style={{ padding: '8px 12px' }}>
              <AudioPlayer src={msg.audioURL} isOwn={isOwn} />
            </div>
          )}

          {/* Tèks */}
          {(msg.text || editing) && (
            <div className={`bubble ${isOwn ? 'own' : 'rx'}`}>
              {editing ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input autoFocus value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setEditing(false) }}
                    style={{ flex: 1, borderRadius: 8,
                      border: '1.5px solid rgba(255,255,255,0.4)',
                      background: 'rgba(255,255,255,0.15)', color: 'inherit',
                      padding: '2px 8px', fontSize: 14, outline: 'none' }} />
                  <button onClick={handleEdit} style={{ background: 'rgba(255,255,255,0.2)',
                    border: 'none', borderRadius: 6, color: 'inherit',
                    padding: '2px 8px', cursor: 'pointer' }}>✓</button>
                  <button onClick={() => setEditing(false)} style={{ background: 'rgba(255,255,255,0.1)',
                    border: 'none', borderRadius: 6, color: 'inherit',
                    padding: '2px 8px', cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <>
                  {msg.text}
                  {msg.edited && <span className="edited-tag">({t('edited')})</span>}
                </>
              )}
            </div>
          )}

          {/* Reaksyon */}
          {hasReactions && (
            <div className="reactions-bar"
              style={{ justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
              {Object.entries(reactions).map(([emoji, uids]) =>
                uids.length > 0 && (
                  <button key={emoji}
                    className={`reaction-pill ${uids.includes(user?.uid) ? 'mine' : ''}`}
                    onClick={() => handleReaction(emoji)}>
                    {emoji} <span>{uids.length}</span>
                  </button>
                )
              )}
            </div>
          )}

          {/* Status + timestamp */}
          {isOwn ? (
            <div className="msg-status" style={{ marginTop: 2 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 3 }}>
                {formatTime(msg.createdAt)}
              </span>
              <span className={`check ${msg.seen ? 'seen' : ''}`}
                title={msg.seen ? 'Li' : msg.delivered ? 'Delivre' : 'Voye'}>
                {msg.seen ? '✓✓' : msg.delivered ? '✓✓' : '✓'}
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 4, marginTop: 1 }}>
              {formatTime(msg.createdAt)}
            </div>
          )}
        </div>
      </div>
    </>
  )
})

export default MessageBubble
