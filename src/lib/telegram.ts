const TELEGRAM_API = 'https://api.telegram.org'

function botToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN ?? null
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = botToken()
  if (!token) return false

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Sends an audio buffer (OGG/Opus, as produced by ElevenLabs TTS) as a Telegram voice note. */
export async function sendTelegramVoice(chatId: string, audio: Buffer): Promise<boolean> {
  const token = botToken()
  if (!token) return false

  try {
    const form = new FormData()
    form.append('chat_id', chatId)
    form.append('voice', new Blob([new Uint8Array(audio)], { type: 'audio/ogg' }), 'voice.ogg')

    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendVoice`, { method: 'POST', body: form })
    return res.ok
  } catch {
    return false
  }
}

/** Downloads an incoming voice note by Telegram file_id (two-step: resolve path, then fetch it). */
export async function downloadTelegramFile(fileId: string): Promise<Buffer | null> {
  const token = botToken()
  if (!token) return null

  try {
    const infoRes = await fetch(`${TELEGRAM_API}/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`)
    if (!infoRes.ok) return null
    const info = await infoRes.json() as { ok: boolean; result?: { file_path?: string } }
    const filePath = info.result?.file_path
    if (!filePath) return null

    const fileRes = await fetch(`${TELEGRAM_API}/file/bot${token}/${filePath}`)
    if (!fileRes.ok) return null
    return Buffer.from(await fileRes.arrayBuffer())
  } catch {
    return null
  }
}
