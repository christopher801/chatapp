import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

// Kreye yon dokiman itilizatè nan Firestore apre enskripsyon
async function createUserDoc(user, displayName) {
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    displayName: displayName || user.displayName || 'Itilizatè',
    email: user.email,
    photoURL: user.photoURL || '',
    language: 'ht',
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  })
}

export async function register(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName })
  await createUserDoc(cred.user, displayName)
  return cred.user
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider()
  const cred = await signInWithPopup(auth, provider)
  // Kreye dokiman sèlman si li pa egziste
  const userRef = doc(db, 'users', cred.user.uid)
  await setDoc(userRef, {
    uid: cred.user.uid,
    displayName: cred.user.displayName,
    email: cred.user.email,
    photoURL: cred.user.photoURL || '',
    language: 'ht',
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  }, { merge: true })
  return cred.user
}

export async function logout() {
  await signOut(auth)
}
