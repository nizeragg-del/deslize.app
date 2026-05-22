'use client'

import Link from 'next/link'
import { ArrowLeft, Mail, MessageCircle, Clock, HelpCircle } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-white relative overflow-hidden font-[family-name:var(--font-manrope)] flex flex-col justify-between">
      <div className="hero-glow" style={{ top: '-10%', left: '-10%', opacity: 0.3 }}></div>
      <div className="hero-glow-cyan" style={{ bottom: '-10%', right: '-10%', opacity: 0.3 }}></div>

      <header className="border-b border-[var(--border-dark)] bg-[var(--surface-dark)]/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="logo">
            <Logo />
          </Link>
          <Link
            href="/login"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--accent)] text-white hover:brightness-110 transition-all shadow-md"
          >
            Acessar Plataforma
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 flex-1 w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Home</span>
        </Link>

        <div className="mb-12">
          <div className="inline-flex p-3 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 mb-4">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-3">
            Contato
          </h1>
          <p className="text-[var(--text-muted)] text-sm max-w-2xl leading-relaxed">
            Precisa de ajuda com sua conta, créditos, assinatura ou geração de carrosséis? Fale com o time Deslize pelo canal abaixo.
          </p>
        </div>

        <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6 sm:p-10 shadow-xl backdrop-blur-xl space-y-8 text-[var(--text-muted)] leading-relaxed text-sm">
          <section className="space-y-3">
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-[var(--brand-primary)]" />
              Atendimento por e-mail
            </h2>
            <p>
              Envie sua solicitação para{' '}
              <a href="mailto:suporte@deslize.com.br" className="text-white font-semibold hover:text-[var(--accent)] transition-colors">
                suporte@deslize.com.br
              </a>
              . Para agilizar o atendimento, inclua o e-mail da sua conta e descreva o que aconteceu com o máximo de contexto possível.
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border-dark)] bg-white/[0.03] p-5">
              <div className="flex items-center gap-2.5 text-white font-semibold mb-2">
                <Clock className="w-5 h-5 text-[var(--brand-primary)]" />
                Prazo de resposta
              </div>
              <p>
                Respondemos normalmente em até 2 dias úteis, de segunda a sexta-feira.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-dark)] bg-white/[0.03] p-5">
              <div className="flex items-center gap-2.5 text-white font-semibold mb-2">
                <HelpCircle className="w-5 h-5 text-[var(--brand-primary)]" />
                Assuntos comuns
              </div>
              <p>
                Suporte técnico, cobrança, cancelamento, créditos, acesso à conta e dúvidas sobre exportação.
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-[var(--border-dark)] bg-[#07070D] py-8 text-center text-xs text-[var(--text-muted2)]">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; 2026 Deslize. Todos os direitos reservados.</span>
          <div className="flex gap-6">
            <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
            <Link href="/contato" className="hover:text-white transition-colors">Contato</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
