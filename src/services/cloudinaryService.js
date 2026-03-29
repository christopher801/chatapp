import axios from 'axios'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const IMG_URL   = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
const AUDIO_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`

// Compress + rezize imaj nan navigatè avan upload
export async function compressImage(file, maxWidth = 1200, quality = 0.82) {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
        'image/jpeg', quality)
    }
    img.src = url
  })
}

export async function uploadImage(file, onProgress) {
  const compressed = await compressImage(file)
  const form = new FormData()
  form.append('file', compressed)
  form.append('upload_preset', UPLOAD_PRESET)
  form.append('folder', 'chat-app/images')
  const res = await axios.post(IMG_URL, form, {
    onUploadProgress: e => onProgress && e.total && onProgress(Math.round(e.loaded * 100 / e.total))
  })
  return res.data.secure_url
}

export async function uploadAudio(blob, onProgress) {
  const form = new FormData()
  form.append('file', blob, 'voice.webm')
  form.append('upload_preset', UPLOAD_PRESET)
  form.append('folder', 'chat-app/audio')
  const res = await axios.post(AUDIO_URL, form, {
    onUploadProgress: e => onProgress && e.total && onProgress(Math.round(e.loaded * 100 / e.total))
  })
  return res.data.secure_url
}
