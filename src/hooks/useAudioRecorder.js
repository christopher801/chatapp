import { useState, useRef, useCallback } from 'react'

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const start = useCallback(async () => {
    if (recording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(100)
      mediaRef.current = mr
      setRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } catch (e) {
      alert('Mikwofòn pa disponib. Verifye pèmisyon navigatè a.')
    }
  }, [recording])

  const stop = useCallback(() => {
    return new Promise(resolve => {
      if (!mediaRef.current) { resolve(null); return }
      mediaRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        mediaRef.current.stream.getTracks().forEach(t => t.stop())
        mediaRef.current = null
        clearInterval(timerRef.current)
        setRecording(false)
        setDuration(0)
        resolve(blob)
      }
      mediaRef.current.stop()
    })
  }, [])

  const cancel = useCallback(() => {
    if (!mediaRef.current) return
    mediaRef.current.stream.getTracks().forEach(t => t.stop())
    mediaRef.current = null
    chunksRef.current = []
    clearInterval(timerRef.current)
    setRecording(false)
    setDuration(0)
  }, [])

  return { recording, duration, start, stop, cancel }
}
