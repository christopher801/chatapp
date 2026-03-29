import { useEffect } from 'react'

export default function Lightbox({ src, onClose }) {
  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>✕</button>
      <a href={src} download target="_blank" rel="noreferrer"
        className="lightbox-dl" onClick={e => e.stopPropagation()}>⬇</a>
      <img src={src} alt="" onClick={e => e.stopPropagation()} />
    </div>
  )
}
