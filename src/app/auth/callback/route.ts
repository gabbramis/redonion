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
      // Create a pending user_plans entry for new users (OAuth)
      // Check if user_plans entry already exists
      const { data: existingPlan } = await supabase
        .from('user_plans')
        .select('user_id')
        .eq('user_id', data.user.id)
        .single()

      // If no plan exists, create one
      if (!existingPlan) {
        await supabase
          .from('user_plans')
          .insert({
            user_id: data.user.id,
            plan_name: 'Sin Plan',
            plan_tier: 'none',
            billing_type: 'monthly',
            price: 0,
            features: [],
            status: 'pending',
            subscription_id: null,
            subscription_start: null,
            subscription_end: null,
            billing_frequency: 1,
            billing_period: 'months',
            start_date: new Date().toISOString(),
          })
      }

      // Check if user is admin
      const isAdmin = data.user.email === 'gabrielaramis01@gmail.com' ||
                      data.user.user_metadata?.role === 'admin'

      // Redirect based on role
      const redirectPath = isAdmin ? '/dashboard/admin' : '/dashboard/client/panel'
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // If there's an error, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
