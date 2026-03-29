import { useEffect, useState, useCallback, useRef } from 'react'
import { setTyping, listenTyping } from '../services/messageService'

export function useTyping(path, currentUid) {
  const [typers, setTypers] = useState([])
  const timer = useRef(null)

  useEffect(() => {
    if (!path || !currentUid) return
    const unsub = listenTyping(path, currentUid, setTypers)
    return () => { unsub(); setTyping(path, currentUid, false) }
  }, [path, currentUid])

  const notifyTyping = useCallback(() => {
    if (!path || !currentUid) return
    setTyping(path, currentUid, true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setTyping(path, currentUid, false), 3000)
  }, [path, currentUid])

  return { typers, notifyTyping }
}
