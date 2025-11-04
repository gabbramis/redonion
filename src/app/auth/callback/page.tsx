"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_EMAILS } from "@/defs/admins";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔍 Auth callback page loaded');

        // Get the code from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);

        const code = searchParams.get('code') || hashParams.get('code');
        const error = searchParams.get('error') || hashParams.get('error');
        const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

        console.log('🔍 Code present:', !!code);
        console.log('🔍 Error present:', !!error);

        if (error) {
          console.error('❌ Auth error:', error, errorDescription);
          setError(errorDescription || 'Authentication failed');
          setTimeout(() => router.push(`/login?error=${encodeURIComponent(errorDescription || 'Authentication failed')}`), 2000);
          return;
        }

        if (code) {
          console.log('📧 Processing auth code...');

          // First, check if we already have a session
          const { data: sessionData } = await supabase.auth.getSession();

          let user = sessionData?.session?.user;

          // If no session, try to exchange code
          if (!user) {
            console.log('🔄 No existing session, attempting code exchange...');
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
              console.error('❌ Error exchanging code:', exchangeError);
              console.error('❌ This might be a PKCE verifier issue');

              // Fallback: Try to get user directly (they might be auto-logged in)
              const { data: userData } = await supabase.auth.getUser();

              if (userData?.user) {
                console.log('✅ User found via getUser fallback');
                user = userData.user;
              } else {
                setError('Unable to verify email. Please try logging in with your credentials.');
                setTimeout(() => router.push('/login'), 3000);
                return;
              }
            } else {
              console.log('✅ Code exchange successful');
              user = data?.user;
            }
          } else {
            console.log('✅ Using existing session');
          }

          if (user) {
            // Create user_plans entry via API
            console.log('📝 Creating user_plans entry...');
            const response = await fetch('/api/create-user-plan', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
                email: user.email,
              }),
            });

            if (!response.ok) {
              console.error('⚠️ Failed to create user_plans entry');
              // Don't block login for this
            } else {
              console.log('✅ User_plans entry created');
            }

            // Check if user is admin
            const userEmail = user.email?.toLowerCase() || '';
            const isAdmin = ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail);

            // Redirect based on role
            if (isAdmin) {
              console.log('👑 Admin user detected, redirecting to admin panel');
              router.push('/dashboard/admin');
            } else {
              console.log('👤 Regular user, redirecting to client panel');
              router.push('/dashboard/client/panel');
            }
          }
        } else {
          // No code or error, check if user is already logged in
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            const userEmail = user.email?.toLowerCase() || '';
            const isAdmin = ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail);

            if (isAdmin) {
              router.push('/dashboard/admin');
            } else {
              router.push('/dashboard/client/panel');
            }
          } else {
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('❌ Unexpected error in auth callback:', err);
        setError('An unexpected error occurred');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    handleAuthCallback();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 to-orange-600">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          {error ? (
            <>
              <svg
                className="w-16 h-16 text-red-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Error de autenticación
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4 notranslate">
                {error}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 notranslate">
                Redirigiendo al inicio de sesión...
              </p>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600 mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 notranslate">
                Verificando autenticación
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center notranslate">
                Por favor espera un momento...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
