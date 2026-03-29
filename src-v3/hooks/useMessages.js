import { useEffect, useState } from 'react'
import { listenRoomMessages, listenDirectMessages } from '../services/messageService'

export function useMessages(mode, id, currentUid) {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (!id) return
    let unsubscribe
    if (mode === 'room') {
      unsubscribe = listenRoomMessages(id, setMessages)
    } else if (mode === 'direct' && currentUid) {
      unsubscribe = listenDirectMessages(currentUid, id, setMessages)
    }
    return () => unsubscribe && unsubscribe()
  }, [mode, id, currentUid])

  return messages
}
