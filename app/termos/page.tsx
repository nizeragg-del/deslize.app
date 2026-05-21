'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, Shield, Gavel, Scale } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-white relative overflow-hidden font-[family-name:var(--font-manrope)] flex flex-col justify-between">
      {/* Glow Effects */}
      <div className="hero-glow" style={{ top: '-10%', left: '-10%', opacity: 0.3 }}></div>
      <div className="hero-glow-cyan" style={{ bottom: '-10%', right: '-10%', opacity: 0.3 }}></div>

      {/* Top Navbar */}
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

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-6 py-16 flex-1 w-full">
        {/* Breadcrumb / Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Home</span>
        </Link>

        {/* Hero Title Area */}
        <div className="mb-12">
          <div className="inline-flex p-3 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 mb-4">
            <Gavel className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-3">
            Termos de Uso
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Última atualização: 20 de maio de 2026
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6 sm:p-10 shadow-xl backdrop-blur-xl space-y-8 text-[var(--text-muted)] leading-relaxed text-sm">
          
          <section className="space-y-3">
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold">1</span>
              Aceitação dos Termos
            </h2>
            <p>
              Ao acessar, navegar ou utilizar a plataforma <strong>Deslize</strong> (doravante denominada "Serviço"), você concorda em cumprir e estar vinculado aos termos e condições descritos neste documento. Se você não concordar com qualquer termo deste instrumento, orientamos a não utilizar os nossos serviços.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold">2</span>
              Descrição do Serviço
            </h2>
            <p>
              O Deslize é uma plataforma SaaS que utiliza inteligência artificial para auxiliar os usuários na criação, estruturação e design de carrosséis e posts dinâmicos voltados para redes sociais (principalmente Instagram). Nós concedemos uma licença de uso limitada, não exclusiva e revogável.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold">3</span>
              Registro e Contas de Usuário
            </h2>
            <p>
              Para utilizar todas as funcionalidades do Serviço, você deve criar uma conta utilizando o e-mail ou integração com redes autorizadas (ex: Google). Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem sob sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado ou suspeito.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold">4</span>
              Uso de Créditos e Faturamento
            </h2>
            <p>
              A plataforma funciona sob modelos de créditos. O plano gratuito oferece créditos iniciais limitados para experimentação. Upgrades de créditos e planos recorrentes são processados através do parceiro homologado <strong>Stripe</strong>. Estornos, cobranças ou cancelamento da assinatura podem ser solicitados e gerenciados a qualquer momento diretamente no painel do usuário.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold">5</span>
              Propriedade Intelectual e Conteúdo Gerado
            </h2>
            <p>
              Os carrosséis criados e gerados pela nossa inteligência artificial pertencem inteiramente a você para uso profissional ou pessoal. O Deslize não reivindica propriedade sobre o material final exportado pelo usuário. Entretanto, o código fonte, marca, layouts internos e IA pertencem exclusivamente à nossa plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold">6</span>
              Limitação de Responsabilidade
            </h2>
            <p>
              O Serviço e o conteúdo gerado por IA são fornecidos "como estão", sem garantias explícitas de engajamento, desempenho ou infalibilidade algorítmica de plataformas terceiras (Instagram, TikTok, etc.). Em nenhuma circunstância o Deslize será responsável por perdas de receita decorrentes do uso da plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold">7</span>
              Modificações nos Termos
            </h2>
            <p>
              Reservamo-nos o direito de alterar estes termos a qualquer momento para refletir melhorias no Serviço ou atualizações de leis regulamentares. Avisaremos os usuários por e-mail ou na própria plataforma em caso de modificações substantivas. O uso continuado após as alterações indica seu consentimento explícito.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-dark)] bg-[#07070D] py-8 text-center text-xs text-[var(--text-muted2)]">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; 2026 Deslize. Todos os direitos reservados.</span>
          <div className="flex gap-6">
            <Link href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
            <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
