import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin
      return NextResponse.redirect(`${appUrl}${next}`)
    }
  }

  // Se houver algum erro, redireciona para o login com mensagem
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin
  return NextResponse.redirect(`${appUrl}/login?error=Não foi possível validar o código de autenticação.`)
}
