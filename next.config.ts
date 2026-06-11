import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://baozkodcgbescngmixwz.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_9C9zi2I9te_LzfbkT2QPwA_kj6AfEpQ',
    ADMIN_KEY: 'bfg-goals-2026',
    SUPABASE_PROJECT_REF: 'baozkodcgbescngmixwz',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  }
}

export default nextConfig
