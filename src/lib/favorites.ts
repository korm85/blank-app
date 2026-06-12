export const FAV_KEY = (userId: string) => `bfg_fav_${userId}`

export function getFavoriteTeamCode(userId: string): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(FAV_KEY(userId)) ?? ''
}

export function saveFavoriteTeam(
  userId: string,
  teamCode: string,
  syncToDb: (code: string) => void
) {
  localStorage.setItem(FAV_KEY(userId), teamCode)
  syncToDb(teamCode)
}
