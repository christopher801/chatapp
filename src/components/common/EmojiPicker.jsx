import { useEffect, useRef } from 'react'

const EMOJI_ROWS = [
  ['😀','😂','😍','🥰','😎','🤔','😢','😡','🤯','🥳'],
  ['👍','👎','❤️','🔥','⭐','🎉','💯','✅','🙏','💪'],
  ['😊','😆','😅','🤣','😇','🥺','😤','🤗','😴','🤩'],
  ['👋','✌️','🤝','🫶','💥','🌟','🎯','💡','📸','🎵'],
]

export default function EmojiPicker({ onSelect, onClose, align = 'left' }) {
  const ref = useRef()

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    setTimeout(() => document.addEventListener('mousedown', handleClick), 0)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div ref={ref} className="emoji-picker-wrap"
      style={{ [align === 'right' ? 'right' : 'left']: 0 }}>
      {EMOJI_ROWS.map((row, i) => (
        <div key={i} style={{ display: 'flex' }}>
          {row.map(e => (
            <button key={e} className="emoji-btn-pick"
              onClick={() => { onSelect(e); onClose() }}>
              {e}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
