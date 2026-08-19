function greenApiCreds(): { id: string; token: string } | null {
  const id = process.env.green_api_id ?? process.env.GREEN_API_ID
  const token = process.env.green_api_token ?? process.env.GREEN_API_TOKEN
  if (!id || !token) return null
  return { id, token }
}

export async function sendWhatsApp(chatId: string, message: string): Promise<boolean> {
  const creds = greenApiCreds()
  if (!creds) return false

  try {
    const res = await fetch(
      `https://api.green-api.com/waInstance${creds.id}/sendMessage/${creds.token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message }),
      }
    )
    return res.ok
  } catch {
    return false
  }
}

/** Sends an audio buffer (e.g. an OGG/Opus TTS clip) as a WhatsApp voice note. */
export async function sendWhatsAppVoice(chatId: string, audio: Buffer, filename = 'voice.ogg'): Promise<boolean> {
  const creds = greenApiCreds()
  if (!creds) return false

  try {
    const form = new FormData()
    form.append('chatId', chatId)
    form.append('file', new Blob([new Uint8Array(audio)], { type: 'audio/ogg' }), filename)

    const res = await fetch(
      `https://api.green-api.com/waInstance${creds.id}/sendFileByUpload/${creds.token}`,
      { method: 'POST', body: form }
    )
    return res.ok
  } catch {
    return false
  }
}

/** Downloads an incoming media file (voice note, image, etc.) referenced by a Green API webhook payload. */
export async function downloadIncomingFile(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

export function getGroupChatId(): string {
  return process.env.green_api_chat ?? ''
}
