import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user is admin
      const isAdmin = data.user.email === 'gabrielaramis01@gmail.com' ||
                      data.user.user_metadata?.role === 'admin'

      // Redirect based on role
      const redirectPath = isAdmin ? '/dashboard/admin' : '/dashboard/client'
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // If there's an error, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
