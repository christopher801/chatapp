import { useEffect, useState } from 'react'
import { listenRooms } from '../services/messageService'

export function useRooms() {
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    const unsub = listenRooms(setRooms)
    return unsub
  }, [])

  return rooms
}
