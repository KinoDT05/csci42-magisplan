import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/moderator']
const authRoutes = ['/login', '/signup', '/(auth)']

export async function updateSession(request: NextRequest) {
    const response = NextResponse.next()
    const { pathname } = request.nextUrl

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Not logged in + trying to access protected route → send to login
    if (!user && protectedRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Logged in + trying to access login/signup → send to app
    if (user && authRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/user/dashboard', request.url))
    }

    return response
}
