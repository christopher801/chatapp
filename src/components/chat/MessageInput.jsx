import { useState, useRef, useCallback } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { uploadImage, uploadAudio } from '../../services/cloudinaryService'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import EmojiPicker from '../common/EmojiPicker'

export default function MessageInput({ onSend, replyTo, onCancelReply, onTyping }) {
  const { t } = useLanguage()
  const [text, setText] = useState('')
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showEmoji, setShowEmoji] = useState(false)
  const fileRef = useRef()
  const textareaRef = useRef()
  const { recording, duration, start: startRec, stop: stopRec, cancel: cancelRec } = useAudioRecorder()

  const canSend = (text.trim() || imgFile) && !uploading && !recording

  function autoResize(el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  function handleChange(e) {
    setText(e.target.value)
    autoResize(e.target)
    if (onTyping) onTyping()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setImgFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImgPreview(ev.target.result)
    reader.readAsDataURL(file)
    fileRef.current.value = ''
  }

  async function handleSend() {
    if (!canSend) return
    let imageURL = null
    if (imgFile) {
      setUploading(true)
      setProgress(0)
      try { imageURL = await uploadImage(imgFile, setProgress) }
      catch { alert(t('errorUpload')); setUploading(false); return }
      setUploading(false)
      setImgFile(null)
      setImgPreview('')
    }
    onSend({ text: text.trim(), imageURL })
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  async function handleStopRecord() {
    const blob = await stopRec()
    if (!blob || blob.size < 1000) return   // trop court
    setUploading(true)
    setProgress(0)
    try {
      const audioURL = await uploadAudio(blob, setProgress)
      onSend({ text: '', imageURL: null, audioURL })
    } catch { alert(t('errorUpload')) }
    setUploading(false)
  }

  function insertEmoji(emoji) {
    setText(prev => prev + emoji)
    textareaRef.current?.focus()
  }

  function fmtDur(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <div className="input-area" style={{ position: 'relative' }}>
      {showEmoji && (
        <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} align="left" />
      )}

      {replyTo && (
        <div className="reply-bar">
          <span>↩ <strong>{replyTo.senderName}</strong>: {replyTo.text || '📷'}</span>
          <button onClick={onCancelReply} style={{ background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0 }}>✕</button>
        </div>
      )}

      {imgPreview && (
        <div style={{ padding: '4px 0 6px' }}>
          <div className="img-preview-wrap">
            <img src={imgPreview} alt="preview" />
            <button className="img-preview-remove"
              onClick={() => { setImgFile(null); setImgPreview('') }}>✕</button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="upload-progress">
          <span>{t('uploading')} {progress}%</span>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Recording UI */}
      {recording ? (
        <div className="input-row" style={{ gap: 10 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--bg-input)', borderRadius: 'var(--radius-xl)',
            padding: '0 16px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%',
              background: 'var(--danger)', animation: 'recPulse 1s infinite' }} />
            <span style={{ fontSize: 14, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {fmtDur(duration)}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {t('recording')}...
            </span>
          </div>
          <button className="icon-btn" onClick={cancelRec} title={t('cancel')}
            style={{ background: 'var(--bg-hover)', color: 'var(--danger)' }}>🗑</button>
          <button className="send-btn" onClick={handleStopRecord}
            style={{ background: 'var(--online)' }}>⏹</button>
        </div>
      ) : (
        <div className="input-row">
          <button className="input-btn" onClick={() => setShowEmoji(v => !v)}>🙂</button>
          <button className="input-btn" onClick={() => fileRef.current.click()}
            disabled={uploading}>📎</button>
          <input ref={fileRef} type="file" accept="image/*"
            style={{ display: 'none' }} onChange={handleFileSelect} />

          <textarea ref={textareaRef} className="msg-textarea" rows={1}
            placeholder={t('typeMessage')} value={text}
            onChange={handleChange} onKeyDown={handleKeyDown} />

          {text.trim() || imgFile ? (
            <button className="send-btn" onClick={handleSend} disabled={!canSend}>➤</button>
          ) : (
            <button className="input-btn" onClick={startRec}
              title={t('voiceMessage')} style={{ color: 'var(--accent)' }}>🎤</button>
          )}
        </div>
      )}

      <style>{`
        @keyframes recPulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}
