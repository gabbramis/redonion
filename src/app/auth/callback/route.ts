import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ADMIN_EMAILS } from '../../../defs/admins'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error_description = requestUrl.searchParams.get('error_description')
  const error = requestUrl.searchParams.get('error')
  const origin = requestUrl.origin

  // Handle errors from Supabase auth
  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error_description || 'Authentication failed')}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Unable to verify authentication')}`
      )
    }

    if (data.user) {
      // Check if user is admin
      const userEmail = data.user.email?.toLowerCase() || ''
      const isAdmin = ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail)
      if(isAdmin) {
        return NextResponse.redirect(`${origin}/dashboard/admin`)
      }

      // Create a pending user_plans entry for new users
      // Check if user_plans entry already exists
      const { data: existingPlan } = await supabase
        .from('user_plans')
        .select('user_id')
        .eq('user_id', data.user.id)
        .single()

      // If no plan exists, create one
      if (!existingPlan) {
        const { error: planError } = await supabase
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

        if (planError) {
          console.error('Error creating user_plans entry:', planError)
          // Continue anyway - don't block login for this
        }
      }

      // Redirect based on role
      return NextResponse.redirect(`${origin}/dashboard/client/panel`)
    }
  }

  // If there's no code or user, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
