import axios from 'axios'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

/**
 * Upload yon imaj nan Cloudinary epi retounen URL piblik la.
 * @param {File} file - Fichye imaj itilizatè a chwazi
 * @param {Function} onProgress - Callback pousantaj (0-100)
 * @returns {Promise<string>} URL piblik imaj la
 */
export async function uploadImage(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'chat-app')

  const response = await axios.post(UPLOAD_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total))
      }
    },
  })

  return response.data.secure_url
}
