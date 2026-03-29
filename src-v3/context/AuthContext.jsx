import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { setOnline, setOffline } from '../services/messageService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
      if (firebaseUser) {
        await setOnline(firebaseUser.uid)
        // Mete offline lè tab/fenèt fèmen
        const handleOffline = () => setOffline(firebaseUser.uid)
        window.addEventListener('beforeunload', handleOffline)
        return () => window.removeEventListener('beforeunload', handleOffline)
      }
    })
    return unsub
  }, [])

  // Vizibilite paj — setOffline lè itilizatè kite tab la
  useEffect(() => {
    if (!user) return
    function handleVisibility() {
      if (document.visibilityState === 'hidden') setOffline(user.uid)
      else setOnline(user.uid)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
