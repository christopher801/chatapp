import { useState, useRef, useEffect } from 'react'

export default function AudioPlayer({ src, isOwn }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onTime = () => setProgress(a.currentTime / (a.duration || 1) * 100)
    const onLoad = () => setDuration(Math.round(a.duration))
    const onEnd  = () => { setPlaying(false); setProgress(0) }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onLoad)
    a.addEventListener('ended', onEnd)
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onLoad)
      a.removeEventListener('ended', onEnd)
    }
  }, [])

  function toggle() {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play(); setPlaying(true) }
  }

  function fmt(s) {
    const m = Math.floor((s || 0) / 60)
    const sec = (s || 0) % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const trackColor = isOwn ? 'rgba(255,255,255,0.35)' : 'var(--border)'
  const fillColor  = isOwn ? 'rgba(255,255,255,0.85)' : 'var(--accent)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200, padding: '2px 0' }}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <button onClick={toggle} style={{
        width: 36, height: 36, borderRadius: '50%', border: 'none',
        background: isOwn ? 'rgba(255,255,255,0.25)' : 'var(--accent)',
        color: isOwn ? '#fff' : '#fff',
        cursor: 'pointer', fontSize: 16, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        transition: 'background 0.15s',
      }}>
        {playing ? '⏸' : '▶'}
      </button>

      <div style={{ flex: 1 }}>
        {/* Waveform simulasyon — ba pwogresyon */}
        <div style={{ height: 4, borderRadius: 2, background: trackColor,
          position: 'relative', cursor: 'pointer', marginBottom: 4 }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = (e.clientX - rect.left) / rect.width
            if (audioRef.current) audioRef.current.currentTime = pct * (audioRef.current.duration || 0)
          }}>
          <div style={{ height: '100%', width: `${progress}%`,
            background: fillColor, borderRadius: 2,
            transition: 'width 0.1s linear' }} />
        </div>
        <div style={{ fontSize: 11, opacity: 0.75 }}>
          {playing
            ? fmt(Math.round(audioRef.current?.currentTime || 0))
            : fmt(duration)} 🎤
        </div>
      </div>
    </div>
  )
}
