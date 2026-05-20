'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye, Database } from 'lucide-react'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-white relative overflow-hidden font-[family-name:var(--font-manrope)] flex flex-col justify-between">
      {/* Glow Effects */}
      <div className="hero-glow" style={{ top: '-10%', left: '-10%', opacity: 0.3 }}></div>
      <div className="hero-glow-cyan" style={{ bottom: '-10%', right: '-10%', opacity: 0.3 }}></div>

      {/* Top Header */}
      <header className="border-b border-[var(--border-dark)] bg-[var(--surface-dark)]/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="logo">
            <div className="logo-icon">
              <span></span><span></span><span></span>
            </div>
            <span className="logo-text text-lg">deslize</span>
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
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Home</span>
        </Link>

        {/* Hero Title */}
        <div className="mb-12">
          <div className="inline-flex p-3 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-3">
            Política de Privacidade
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Última atualização: 20 de maio de 2026
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6 sm:p-10 shadow-xl backdrop-blur-xl space-y-8 text-[var(--text-muted)] leading-relaxed text-sm">
          
          <section className="space-y-3">
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-[var(--brand-primary)]" />
              Compromisso com sua Privacidade
            </h2>
            <p>
              Nós do <strong>Deslize</strong> valorizamos profundamente a confiança que você deposita em nós. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e compartilhamos suas informações pessoais ao utilizar nossa plataforma de geração de carrosséis por inteligência artificial.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white flex items-center gap-2.5">
              <Database className="w-5 h-5 text-[var(--brand-primary)]" />
              Informações que Coletamos
            </h2>
            <p>
              Para prestar nossos serviços com máxima eficiência, coletamos as seguintes categorias de dados:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Dados de Registro:</strong> E-mail, nome, senha criptografada (gerenciados com máxima segurança pelo <strong>Supabase</strong>).</li>
              <li><strong>Integrações de Terceiros:</strong> Dados de perfil público fornecidos ao realizar login via Google.</li>
              <li><strong>Informações de Faturamento:</strong> Endereço de e-mail e dados transacionais não sensíveis (todos os dados de cartão são enviados e processados de forma segura diretamente pela <strong>Stripe</strong>).</li>
              <li><strong>Preferências de Marca:</strong> Fontes, cores, logos e dados configurados no seu Brand Kit para personalizar seus carrosséis.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white flex items-center gap-2.5">
              <Eye className="w-5 h-5 text-[var(--brand-primary)]" />
              Como Utilizamos Seus Dados
            </h2>
            <p>
              Seus dados são coletados estritamente para:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Criar, manter e gerenciar sua conta de acesso.</li>
              <li>Alimentar o algoritmo de IA com as preferências de sua marca e gerar os posts perfeitamente estilizados.</li>
              <li>Processar as transações financeiras e gerenciar créditos em conformidade legal.</li>
              <li>Enviar atualizações críticas do Serviço, suporte ou novidades sobre a plataforma (você pode optar por não receber e-mails promocionais a qualquer momento).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-[var(--brand-primary)]" />
              Segurança e Criptografia
            </h2>
            <p>
              A segurança dos seus dados é prioritária. O Deslize utiliza soluções consolidadas no mercado como o <strong>Supabase</strong>, contando com criptografia em trânsito (SSL/TLS) e criptografia de ponta no banco de dados. Contudo, nenhuma transmissão na internet é 100% impenetrável, por isso recomendamos sempre a utilização de senhas fortes e exclusivas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-[var(--brand-primary)]" />
              Direitos dos Usuários (LGPD)
            </h2>
            <p>
              Em total conformidade com a Lei Geral de Proteção de Dados (LGPD), você possui os seguintes direitos garantidos:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Confirmar a existência de processamento e acessar seus dados.</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li>Solicitar a portabilidade ou a exclusão total e permanente dos seus dados de nossos servidores a qualquer momento.</li>
            </ul>
            <p>
              Para exercer qualquer um de seus direitos, entre em contato direto com o nosso time através do canal de suporte no dashboard.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-[var(--brand-primary)]" />
              Alterações nesta Política
            </h2>
            <p>
              Podemos atualizar esta Política de Privacidade de tempos em tempos. Ao fazermos alterações significativas, publicaremos um aviso em destaque na plataforma ou notificaremos você por e-mail antes que as alterações entrem em vigor.
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
