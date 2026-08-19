import type { Language } from '@/types'

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1'

function apiKey(): string | null {
  return process.env.ELEVENLABS_API_KEY ?? null
}

/** Synthesizes `text` to an OGG/Opus buffer via ElevenLabs TTS. Returns null if not configured. */
export async function speak(text: string, language: Language): Promise<Buffer | null> {
  const key = apiKey()
  const voiceId = process.env.ELEVENLABS_VOICE_ID
  if (!key || !voiceId) return null

  try {
    const res = await fetch(
      `${ELEVENLABS_API}/text-to-speech/${voiceId}?output_format=ogg_opus`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          language_code: language,
          voice_settings: { stability: 0.6, similarity_boost: 0.8 },
        }),
      }
    )
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

/** Transcribes an audio buffer via ElevenLabs Scribe. Returns null if not configured or on failure. */
export async function transcribe(audio: Buffer): Promise<string | null> {
  const key = apiKey()
  if (!key) return null

  try {
    const form = new FormData()
    form.append('model_id', 'scribe_v1')
    form.append('file', new Blob([new Uint8Array(audio)], { type: 'audio/ogg' }), 'voice.ogg')

    const res = await fetch(`${ELEVENLABS_API}/speech-to-text`, {
      method: 'POST',
      headers: { 'xi-api-key': key },
      body: form,
    })
    if (!res.ok) return null
    const data = await res.json() as { text?: string }
    return data.text?.trim() || null
  } catch {
    return null
  }
}
