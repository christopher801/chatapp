import {
  collection, addDoc, serverTimestamp, query, orderBy,
  onSnapshot, doc, updateDoc, getDoc, setDoc,
  arrayUnion, arrayRemove, increment, limit,
  startAfter, getDocs, writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

export const getConvId = (a, b) => [a, b].sort().join('_')

// ─── ROOMS ───────────────────────────────────────────────────────────────────
export async function createRoom(name, createdBy, isPrivate = false, password = '') {
  const ref = await addDoc(collection(db, 'rooms'), {
    name, createdBy, members: [createdBy],
    isPrivate, password: isPrivate ? password : '',
    pinnedMessage: null, lastMessage: '', lastSenderName: '',
    lastMessageAt: serverTimestamp(), createdAt: serverTimestamp(),
  })
  return ref.id
}

export function listenRooms(callback) {
  const q = query(collection(db, 'rooms'), orderBy('lastMessageAt', 'desc'))
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export async function joinRoom(roomId, uid) {
  const ref = doc(db, 'rooms', roomId)
  const snap = await getDoc(ref)
  if (snap.exists() && !snap.data().members?.includes(uid))
    await updateDoc(ref, { members: arrayUnion(uid) })
}

export async function pinMessage(roomId, msg) {
  await updateDoc(doc(db, 'rooms', roomId), {
    pinnedMessage: msg ? { id: msg.id, text: msg.text, senderName: msg.senderName } : null,
  })
}

// ─── ROOM MESSAGES — lazy load ────────────────────────────────────────────────
const PAGE_SIZE = 40

export function listenRoomMessages(roomId, callback, lastDoc = null) {
  let q = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(PAGE_SIZE)
  )
  if (lastDoc) q = query(q, startAfter(lastDoc))
  return onSnapshot(q, snap => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data(), _snap: d }))
    callback(msgs)
  })
}

export async function loadMoreRoomMessages(roomId, beforeDoc) {
  const q = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('createdAt', 'desc'),
    startAfter(beforeDoc),
    limit(PAGE_SIZE)
  )
  const snap = await getDocs(q)
  return snap.docs.reverse().map(d => ({ id: d.id, ...d.data(), _snap: d }))
}

export async function sendRoomMessage(roomId, senderId, senderName, text, imageURL = null, replyTo = null, audioURL = null) {
  await addDoc(collection(db, 'rooms', roomId, 'messages'), {
    senderId, senderName, text: text || '', imageURL, audioURL, replyTo,
    reactions: {}, edited: false, deleted: false,
    seenBy: [senderId], createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'rooms', roomId), {
    lastMessage: audioURL ? '🎤 Mesaj vwa' : (text || '📷 Imaj'),
    lastSenderName: senderName,
    lastMessageAt: serverTimestamp(),
  })
}

// ─── DIRECT MESSAGES — lazy load ─────────────────────────────────────────────
export function listenDirectMessages(uid1, uid2, callback) {
  const convId = getConvId(uid1, uid2)
  const q = query(
    collection(db, 'direct', convId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(PAGE_SIZE)
  )
  return onSnapshot(q, snap => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data(), _snap: d }))
    callback(msgs)
  })
}

export async function loadMoreDirectMessages(uid1, uid2, beforeDoc) {
  const convId = getConvId(uid1, uid2)
  const q = query(
    collection(db, 'direct', convId, 'messages'),
    orderBy('createdAt', 'desc'),
    startAfter(beforeDoc),
    limit(PAGE_SIZE)
  )
  const snap = await getDocs(q)
  return snap.docs.reverse().map(d => ({ id: d.id, ...d.data(), _snap: d }))
}

export function listenDirectConversations(uid, callback) {
  const q = query(collection(db, 'direct'), orderBy('lastMessageAt', 'desc'))
  return onSnapshot(q, snap => {
    callback(snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c => c.participants?.includes(uid)))
  })
}

export async function sendDirectMessage(uid1, uid2, senderId, senderName, text, imageURL = null, replyTo = null, audioURL = null) {
  const convId = getConvId(uid1, uid2)
  const convRef = doc(db, 'direct', convId)
  const other = uid1 === senderId ? uid2 : uid1
  const snap = await getDoc(convRef)
  const lastMsg = audioURL ? '🎤 Mesaj vwa' : (text || '📷 Imaj')
  if (!snap.exists()) {
    await setDoc(convRef, {
      participants: [uid1, uid2],
      lastMessage: lastMsg, lastSenderName: senderName,
      lastMessageAt: serverTimestamp(),
      unread: { [uid1]: 0, [uid2]: 1 },
    })
  } else {
    await updateDoc(convRef, {
      lastMessage: lastMsg, lastSenderName: senderName,
      lastMessageAt: serverTimestamp(),
      [`unread.${other}`]: increment(1),
    })
  }
  await addDoc(collection(db, 'direct', convId, 'messages'), {
    senderId, senderName, text: text || '', imageURL, audioURL, replyTo,
    reactions: {}, edited: false, deleted: false,
    seen: false, delivered: true, createdAt: serverTimestamp(),
  })
}

// ─── SEEN — fix reyèl ────────────────────────────────────────────────────────
export async function markDirectAsRead(uid1, uid2, currentUid) {
  const convId = getConvId(uid1, uid2)
  // Reset unread count
  await updateDoc(doc(db, 'direct', convId), {
    [`unread.${currentUid}`]: 0
  }).catch(() => {})
  // Mak 40 dènye mesaj kòm seen nan yon batch
  const q = query(
    collection(db, 'direct', convId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(40)
  )
  const snap = await getDocs(q).catch(() => null)
  if (!snap) return
  const batch = writeBatch(db)
  snap.docs.forEach(d => {
    if (!d.data().seen && d.data().senderId !== currentUid) {
      batch.update(d.ref, { seen: true })
    }
  })
  await batch.commit().catch(() => {})
}

export async function forwardMessage(msg, targetMode, targetId, senderId, senderName) {
  const text = msg.text || ''
  const imageURL = msg.imageURL || null
  const audioURL = msg.audioURL || null
  if (targetMode === 'room') {
    await sendRoomMessage(targetId, senderId, senderName, text, imageURL, null, audioURL)
  } else {
    await sendDirectMessage(senderId, targetId, senderId, senderName, text, imageURL, null, audioURL)
  }
}

// ─── EDIT / DELETE / REACT ────────────────────────────────────────────────────
export async function editMessage(collPath, msgId, newText) {
  await updateDoc(doc(db, ...collPath, msgId), { text: newText, edited: true })
}

export async function deleteMessage(collPath, msgId) {
  await updateDoc(doc(db, ...collPath, msgId), { deleted: true, text: '', imageURL: null, audioURL: null })
}

export async function toggleReaction(collPath, msgId, emoji, uid) {
  const ref = doc(db, ...collPath, msgId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const reactions = snap.data().reactions || {}
  const users = reactions[emoji] || []
  await updateDoc(ref, {
    [`reactions.${emoji}`]: users.includes(uid)
      ? users.filter(u => u !== uid)
      : [...users, uid],
  })
}

// ─── TYPING ───────────────────────────────────────────────────────────────────
export async function setTyping(path, uid, isTyping) {
  const ref = doc(db, 'typing', path)
  if (isTyping) await setDoc(ref, { [uid]: Date.now() }, { merge: true })
  else await updateDoc(ref, { [uid]: null }).catch(() => {})
}

export function listenTyping(path, currentUid, callback) {
  return onSnapshot(doc(db, 'typing', path), snap => {
    if (!snap.exists()) { callback([]); return }
    const now = Date.now()
    callback(Object.entries(snap.data())
      .filter(([uid, ts]) => uid !== currentUid && ts && now - ts < 5000)
      .map(([uid]) => uid))
  })
}

// ─── PRESENCE ─────────────────────────────────────────────────────────────────
export const setOnline  = uid => updateDoc(doc(db, 'users', uid), { online: true,  lastSeen: serverTimestamp() }).catch(() => {})
export const setOffline = uid => updateDoc(doc(db, 'users', uid), { online: false, lastSeen: serverTimestamp() }).catch(() => {})

// ─── USERS ────────────────────────────────────────────────────────────────────
export function listenUsers(callback) {
  return onSnapshot(collection(db, 'users'), snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export const updateUserProfile = (uid, data) => updateDoc(doc(db, 'users', uid), data)
export const blockUser   = (me, uid) => updateDoc(doc(db, 'users', me), { blockedUsers: arrayUnion(uid) })
export const unblockUser = (me, uid) => updateDoc(doc(db, 'users', me), { blockedUsers: arrayRemove(uid) })
