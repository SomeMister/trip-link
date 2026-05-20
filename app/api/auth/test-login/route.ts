import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    // Rigid safety check: only execute in development mode to prevent any production risk
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const { email, password } = await request.json()
        if (!email || !password) {
            return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Try to sign in with password
        const signInResult = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        let finalUser = signInResult.data.user
        let finalError = signInResult.error

        // 2. If user doesn't exist, sign them up (which automatically signs them in)
        if (finalError && (finalError.message.includes('Invalid login credentials') || finalError.message.includes('should be registered'))) {
            const signUpResult = await supabase.auth.signUp({
                email,
                password,
            })
            finalUser = signUpResult.data.user
            finalError = signUpResult.error
        }

        if (finalError) {
            return NextResponse.json({ error: finalError.message }, { status: 400 })
        }

        return NextResponse.json({ success: true, user: finalUser })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
