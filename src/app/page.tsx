import { getServiceSupabase } from '@/lib/supabase'
import { weekStart, weekdayNameRu } from '@/lib/time'
import { fromRow } from '@/lib/anna/profile'
import type { Profile } from '@/types'

export const dynamic = 'force-dynamic'

interface DashboardData {
  profile: Profile
  schedules: { weekday: number; time_local: string }[]
  completedThisWeek: number
  nextSession: { scheduled_for: string; status: string; origin: string } | null
  transcript: { role: string; content: string; created_at: string }[]
}

async function loadDashboard(): Promise<DashboardData | null> {
  const supabase = getServiceSupabase()
  const { data: profileRow } = await supabase.from('profiles').select('*').order('created_at', { ascending: true }).limit(1).maybeSingle()
  if (!profileRow) return null
  const profile = fromRow(profileRow)

  const { data: schedules } = await supabase
    .from('schedules').select('weekday, time_local').eq('profile_id', profile.id).eq('active', true).order('weekday')

  const currentWeekStart = weekStart(new Date(), profile.timezone)
  const { count } = await supabase
    .from('sessions').select('id', { count: 'exact', head: true })
    .eq('profile_id', profile.id).eq('week_start', currentWeekStart).eq('status', 'completed')

  const { data: nextSession } = await supabase
    .from('sessions').select('scheduled_for, status, origin')
    .eq('profile_id', profile.id).in('status', ['pending', 'prompted'])
    .order('scheduled_for', { ascending: true }).limit(1).maybeSingle()

  const { data: transcript } = await supabase
    .from('messages').select('role, content, created_at')
    .eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(20)

  return {
    profile,
    schedules: schedules ?? [],
    completedThisWeek: count ?? 0,
    nextSession: nextSession ?? null,
    transcript: (transcript ?? []).reverse(),
  }
}

export default async function DashboardPage() {
  let data: DashboardData | null = null
  let configError = false
  try {
    data = await loadDashboard()
  } catch {
    configError = true
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.25rem 4rem', fontFamily: 'var(--font-sans)' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Анна</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Помощник по лёгким тренировкам для Милы</p>

      {configError && (
        <Card>
          <p>Supabase не настроен. Задайте <code>NEXT_PUBLIC_SUPABASE_URL</code> и <code>SUPABASE_SERVICE_ROLE_KEY</code>.</p>
        </Card>
      )}

      {!configError && !data && (
        <Card>
          <p>Пока нет данных — Мила ещё не написала Анне в Telegram.</p>
        </Card>
      )}

      {data && (
        <>
          <Card>
            <h2 style={heading}>Эта неделя</h2>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{data.completedThisWeek} / 2</p>
            <p style={{ color: 'var(--text-secondary)' }}>тренировок выполнено</p>
          </Card>

          <Card>
            <h2 style={heading}>Расписание</h2>
            {data.schedules.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Ещё не задано.</p>}
            {data.schedules.map((s, i) => (
              <p key={i}>{weekdayNameRu(s.weekday)} в {s.time_local}</p>
            ))}
          </Card>

          <Card>
            <h2 style={heading}>Ближайшая тренировка</h2>
            {data.nextSession ? (
              <p>{new Date(data.nextSession.scheduled_for).toLocaleString('ru-RU', { timeZone: data.profile.timezone, weekday: 'long', hour: '2-digit', minute: '2-digit' })} — статус: {data.nextSession.status}</p>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>Нет запланированной тренировки.</p>
            )}
          </Card>

          <Card>
            <h2 style={heading}>Последние сообщения</h2>
            {data.transcript.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Пока пусто.</p>}
            {data.transcript.map((m, i) => (
              <p key={i} style={{ marginBottom: '0.5rem' }}>
                <strong>{m.role === 'assistant' ? 'Анна' : 'Мила'}:</strong> {m.content}
              </p>
            ))}
          </Card>
        </>
      )}
    </main>
  )
}

const heading: React.CSSProperties = { fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section style={{
      background: 'var(--bg-card)', borderRadius: 16, padding: '1.25rem',
      marginBottom: '1rem', boxShadow: 'var(--shadow)',
    }}>
      {children}
    </section>
  )
}
