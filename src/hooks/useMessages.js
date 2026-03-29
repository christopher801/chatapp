import { useEffect, useState, useCallback, useRef } from 'react'
import { listenRoomMessages, listenDirectMessages, loadMoreRoomMessages, loadMoreDirectMessages } from '../services/messageService'

export function useMessages(mode, id, currentUid) {
  const [messages, setMessages] = useState([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const firstDocRef = useRef(null)

  useEffect(() => {
    if (!id) { setMessages([]); return }
    setMessages([])
    firstDocRef.current = null

    let unsub
    if (mode === 'room') {
      unsub = listenRoomMessages(id, msgs => {
        setMessages(msgs)
        if (msgs.length > 0) firstDocRef.current = msgs[0]._snap
        setHasMore(msgs.length >= 40)
      })
    } else if (mode === 'direct' && currentUid) {
      unsub = listenDirectMessages(currentUid, id, msgs => {
        setMessages(msgs)
        if (msgs.length > 0) firstDocRef.current = msgs[0]._snap
        setHasMore(msgs.length >= 40)
      })
    }
    return () => unsub && unsub()
  }, [mode, id, currentUid])

  const loadMore = useCallback(async () => {
    if (!firstDocRef.current || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      let older = []
      if (mode === 'room') {
        older = await loadMoreRoomMessages(id, firstDocRef.current)
      } else if (mode === 'direct') {
        older = await loadMoreDirectMessages(currentUid, id, firstDocRef.current)
      }
      if (older.length > 0) {
        firstDocRef.current = older[0]._snap
        setMessages(prev => [...older, ...prev])
        setHasMore(older.length >= 40)
      } else {
        setHasMore(false)
      }
    } finally {
      setLoadingMore(false)
    }
  }, [mode, id, currentUid, loadingMore, hasMore])

  return { messages, loadMore, loadingMore, hasMore }
}
