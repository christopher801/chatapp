import { useState, useRef, useCallback } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { uploadImage } from '../../services/cloudinaryService'
import EmojiPicker from '../common/EmojiPicker'

export default function MessageInput({ onSend, replyTo, onCancelReply, onTyping }) {
  const { t } = useLanguage()
  const [text, setText] = useState('')
  const [imgFile, setImgFile] = useState(null)    // File pou preview
  const [imgPreview, setImgPreview] = useState('') // Data URL
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showEmoji, setShowEmoji] = useState(false)
  const fileRef = useRef()
  const textareaRef = useRef()

  const canSend = (text.trim() || imgFile) && !uploading

  // Auto-resize textarea
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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

  function removePreview() {
    setImgFile(null)
    setImgPreview('')
  }

  async function handleSend() {
    if (!canSend) return
    let imageURL = null

    if (imgFile) {
      setUploading(true)
      setProgress(0)
      try {
        imageURL = await uploadImage(imgFile, setProgress)
      } catch {
        alert(t('errorUpload'))
        setUploading(false)
        return
      }
      setUploading(false)
      setImgFile(null)
      setImgPreview('')
    }

    onSend({ text: text.trim(), imageURL })
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function insertEmoji(emoji) {
    setText(prev => prev + emoji)
    textareaRef.current?.focus()
  }

  return (
    <div className="input-area" style={{ position: 'relative' }}>
      {/* Emoji picker */}
      {showEmoji && (
        <EmojiPicker
          onSelect={insertEmoji}
          onClose={() => setShowEmoji(false)}
          align="left"
        />
      )}

      {/* Reply bar */}
      {replyTo && (
        <div className="reply-bar">
          <span>↩ <strong>{replyTo.senderName}</strong>: {replyTo.text || '📷'}</span>
          <button onClick={onCancelReply}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
        </div>
      )}

      {/* Image preview */}
      {imgPreview && (
        <div style={{ padding: '4px 0 6px' }}>
          <div className="img-preview-wrap">
            <img src={imgPreview} alt="preview" />
            <button className="img-preview-remove" onClick={removePreview}>✕</button>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="upload-progress">
          <span>{t('uploading')} {progress}%</span>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="input-row">
        {/* Emoji */}
        <button className="input-btn" onClick={() => setShowEmoji(v => !v)} title="Emoji">
          🙂
        </button>

        {/* Upload */}
        <button className="input-btn" onClick={() => fileRef.current.click()}
          disabled={uploading} title={t('uploadImage')}>
          📎
        </button>
        <input ref={fileRef} type="file" accept="image/*"
          style={{ display: 'none' }} onChange={handleFileSelect} />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="msg-textarea"
          rows={1}
          placeholder={t('typeMessage')}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />

        {/* Send */}
        <button className="send-btn" onClick={handleSend} disabled={!canSend}>
          ➤
        </button>
      </div>
    </div>
  )
}
