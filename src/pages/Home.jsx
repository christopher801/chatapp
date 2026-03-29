import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { listenUsers } from '../services/messageService'
import Sidebar from '../components/layout/Sidebar'
import ChatWindow from '../components/chat/ChatWindow'

export default function Home() {
  const { user } = useAuth()
  const [mode, setMode] = useState('direct')
  const [activeId, setActiveId] = useState(null)
  const [activeTitle, setActiveTitle] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [activeRoom, setActiveRoom] = useState(null)

  useEffect(() => {
    const unsub = listenUsers(setAllUsers)
    return unsub
  }, [])

  const handleSelectRoom = useCallback((id, name, room) => {
    setMode('room'); setActiveId(id); setActiveTitle(name); setActiveRoom(room || null)
  }, [])

  const handleSelectDirect = useCallback((uid, name) => {
    setMode('direct'); setActiveId(uid); setActiveTitle(name); setActiveRoom(null)
  }, [])

  const otherUser = mode === 'direct'
    ? allUsers.find(u => u.uid === activeId) || null
    : null

  return (
    <div className="app-layout">
      {/* Bouton hamburger mobil */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="d-md-none"
          style={{
            position: 'fixed', top: 12, left: 12, zIndex: 400,
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            border: 'none', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
          }}>
          ☰
        </button>
      )}

      <Sidebar
        onSelectRoom={handleSelectRoom}
        onSelectDirect={handleSelectDirect}
        activeId={activeId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <ChatWindow
        mode={mode}
        id={activeId}
        title={activeTitle}
        pinnedMessage={activeRoom?.pinnedMessage || null}
        otherUser={otherUser}
      />
    </div>
  )
}
