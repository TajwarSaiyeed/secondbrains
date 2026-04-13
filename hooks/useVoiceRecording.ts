import { useState, useRef } from 'react'

export function useVoiceRecording(onRecordingComplete: (blob: Blob) => void) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  async function toggleRecording() {
    if (isRecording) {
      if (mediaRecorder.current) {
        mediaRecorder.current.stop()
        setIsRecording(false)
      }
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunks.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, {
          type: 'audio/webm; codecs=opus',
        })
        stream.getTracks().forEach((track) => track.stop())

        if (audioBlob.size > 0) {
          onRecordingComplete(audioBlob)
        }
      }

      recorder.start()
      setIsRecording(true)
      mediaRecorder.current = recorder
      setError(null)
    } catch (err: any) {
      setError('Could not access microphone: ' + err.message)
    }
  }

  function cancelRecording() {
    if (isRecording && mediaRecorder.current) {
      // Just stop tracks, don't trigger upload
      mediaRecorder.current.onstop = null
      const stream = mediaRecorder.current.stream
      stream.getTracks().forEach((track) => track.stop())
      mediaRecorder.current.stop()
      setIsRecording(false)
    }
  }

  return {
    isRecording,
    toggleRecording,
    cancelRecording,
    error,
  }
}
