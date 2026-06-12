export async function sendWhatsApp(chatId: string, message: string): Promise<boolean> {
  const id = process.env.green_api_id
  const token = process.env.green_api_token
  if (!id || !token) return false

  try {
    const res = await fetch(
      `https://api.green-api.com/waInstance${id}/sendMessage/${token}`,
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

export function getGroupChatId(): string {
  return process.env.green_api_chat ?? ''
}
