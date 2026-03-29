import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { updateUserProfile } from '../services/messageService'
import { uploadImage } from '../services/cloudinaryService'
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { auth } from '../services/firebase'
import Avatar from '../components/common/Avatar'

export default function Profile({ onClose }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [bio, setBio] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('info')
  const [msg, setMsg] = useState('')
  const fileRef = useRef()

  async function handleSave() {
    if (!displayName.trim()) return
    setSaving(true)
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() })
      await updateUserProfile(user.uid, { displayName: displayName.trim(), bio })
      setMsg('✅ Pwofil ou sove!')
      setTimeout(() => setMsg(''), 2000)
    } catch { setMsg('❌ Erè') }
    setSaving(false)
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) return
    setSaving(true)
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, cred)
      await updatePassword(auth.currentUser, newPassword)
      setMsg('✅ Modpas chanje!')
      setCurrentPassword('')
      setNewPassword('')
      setTimeout(() => setMsg(''), 2000)
    } catch { setMsg('❌ Modpas aktyèl pa kòrèk.') }
    setSaving(false)
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      await updateProfile(auth.currentUser, { photoURL: url })
      await updateUserProfile(user.uid, { photoURL: url })
      setMsg('✅ Foto mete ajou!')
      setTimeout(() => setMsg(''), 2000)
    } catch { setMsg('❌ Erè upload foto') }
    setUploading(false)
    fileRef.current.value = ''
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
      zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }} onClick={onClose}>
      <div style={{
        background:'#fff', borderRadius:20, width:'100%', maxWidth:420,
        boxShadow:'0 8px 40px rgba(0,0,0,0.2)', overflow:'hidden',
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
          padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ position:'relative', cursor:'pointer' }}
            onClick={() => fileRef.current.click()}>
            <Avatar name={user?.displayName || ''} photoURL={user?.photoURL || ''} size={60} />
            <span style={{ position:'absolute', bottom:0, right:0, background:'rgba(0,0,0,0.5)',
              color:'#fff', borderRadius:'50%', width:22, height:22, fontSize:13,
              display:'flex', alignItems:'center', justifyContent:'center' }}>📷</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*"
            style={{ display:'none' }} onChange={handlePhotoUpload} />
          <div>
            <div style={{ color:'#fff', fontWeight:700, fontSize:18 }}>{user?.displayName}</div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13 }}>{user?.email}</div>
          </div>
          <button onClick={onClose} style={{
            marginLeft:'auto', background:'rgba(255,255,255,0.15)', border:'none',
            borderRadius:'50%', width:32, height:32, color:'#fff', cursor:'pointer', fontSize:16 }}>✕</button>
        </div>

        {/* Tabs */}
        <div className="d-flex" style={{ borderBottom:'1px solid #e9ecef' }}>
          {['info','password'].map((tb) => (
            <button key={tb} onClick={() => setTab(tb)} className="btn flex-fill rounded-0 py-2"
              style={{ fontSize:13, color: tab===tb ? '#6366f1' : '#666',
                borderBottom: tab===tb ? '2px solid #6366f1' : '2px solid transparent',
                background:'none' }}>
              {tb === 'info' ? t('editProfile') : t('changePassword')}
            </button>
          ))}
        </div>

        {/* Kontni */}
        <div style={{ padding:'20px 24px' }}>
          {msg && (
            <div className="alert py-2 mb-3" style={{ fontSize:13,
              background: msg.startsWith('✅') ? '#d1fae5' : '#fee2e2',
              color: msg.startsWith('✅') ? '#065f46' : '#991b1b', border:'none' }}>
              {msg}
            </div>
          )}

          {tab === 'info' && (
            <>
              <div className="mb-3">
                <label style={{ fontSize:13, fontWeight:500, display:'block', marginBottom:4 }}>
                  {t('displayName')}
                </label>
                <input className="form-control" style={{ borderRadius:10 }}
                  value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="mb-3">
                <label style={{ fontSize:13, fontWeight:500, display:'block', marginBottom:4 }}>
                  {t('bio')}
                </label>
                <textarea className="form-control" rows={3} style={{ borderRadius:10, resize:'none' }}
                  value={bio} onChange={(e) => setBio(e.target.value)}
                  placeholder="Ekri yon ti bagay sou ou..." />
              </div>
              <button className="btn w-100" onClick={handleSave} disabled={saving}
                style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color:'#fff', border:'none', borderRadius:12, padding:'10px', fontWeight:600 }}>
                {saving ? t('loading') : t('saveProfile')}
              </button>
            </>
          )}

          {tab === 'password' && (
            <>
              <div className="mb-3">
                <label style={{ fontSize:13, fontWeight:500, display:'block', marginBottom:4 }}>
                  {t('currentPassword')}
                </label>
                <input type="password" className="form-control" style={{ borderRadius:10 }}
                  value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="mb-3">
                <label style={{ fontSize:13, fontWeight:500, display:'block', marginBottom:4 }}>
                  {t('newPassword')}
                </label>
                <input type="password" className="form-control" style={{ borderRadius:10 }}
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6} />
              </div>
              <button className="btn w-100" onClick={handleChangePassword} disabled={saving}
                style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color:'#fff', border:'none', borderRadius:12, padding:'10px', fontWeight:600 }}>
                {saving ? t('loading') : t('changePassword')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
