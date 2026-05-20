"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, ShieldCheck, RefreshCw, Sparkles, Heart } from "lucide-react";

export function PricingSection() {
  const testimonials = [
    {
      name: "Renata Carvalho",
      role: "Infoprodutora & Mentora",
      handle: "@renatacarvalho.digital",
      img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120",
      content: "Eu levava horas para diagramar um carrossel no Canva. Com o Deslize, coloco o tema e em 20 segundos tenho um post de altíssimo nível pronto. Meu engajamento cresceu mais de 45%!",
      metrics: "+45% engajamento"
    },
    {
      name: "Bruno Mello",
      role: "Especialista em Tráfego Pago",
      handle: "@brunomello.ads",
      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120",
      content: "Os carrosséis gerados convertem muito em anúncios! O design limpo e os contrastes escuros convertem muito mais leads. O investimento se pagou logo no primeiro dia.",
      metrics: "3.2x ROI em anúncios"
    },
    {
      name: "Clara Vasconcelos",
      role: "Criadora de Conteúdo SaaS",
      handle: "@clara.saas",
      img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120",
      content: "A integração com o Brand Kit é perfeita. Coloco minhas fontes e cores da paleta padrão e ele respeita tudo perfeitamente. Nunca vi algo tão prático e robusto.",
      metrics: "12 carrosséis/semana"
    }
  ];

  return (
    <section className="pricing-section space-y-20 pb-20" id="pricing">
      <div className="space-y-4 text-center">
        <motion.div 
          className="section-label inline-block" style={{textAlign: 'center'}}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >Planos</motion.div>
        <motion.h2 
          className="section-title text-4xl md:text-5xl font-[family-name:var(--font-bricolage)] font-bold text-white max-w-2xl mx-auto leading-tight" style={{textAlign: 'center', fontSize: 36}}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Escale sua criação de conteúdo
        </motion.h2>
        <p className="text-[var(--text-muted)] max-w-md mx-auto text-sm text-center">
          Escolha o plano ideal para o seu perfil e comece a gerar conteúdo de grife em segundos.
        </p>
      </div>

      <div className="pricing-grid">
        {/* FREE */}
        <motion.div 
          className="plan-card bg-[#0f111a]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 relative flex flex-col justify-between"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div>
            <div className="plan-name text-lg font-bold text-white mb-2">Teste Grátis</div>
            <div className="plan-price text-3xl font-extrabold text-white mb-2">R$0</div>
            <div className="plan-credits text-xs text-[var(--accent)] font-semibold mb-6">1 crédito único</div>
            <div className="plan-divider border-t border-white/5 my-4"></div>
            <ul className="plan-features space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> 1 carrossel completo</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> Export PNG 1080px</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> 1 brand kit</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> 7 dias de histórico</li>
            </ul>
          </div>
          <div>
            <Link href="/login" className="plan-btn plan-btn-ghost flex items-center justify-center py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/10 transition-all">Começar grátis</Link>
            <div className="text-[10px] text-center text-white/40 mt-3 font-medium">
              Sem fidelidade • Cancele em 1 clique
            </div>
          </div>
        </motion.div>

        {/* STARTER */}
        <motion.div 
          className="plan-card bg-[#0f111a]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 relative flex flex-col justify-between"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <div className="plan-name text-lg font-bold text-white mb-2">Starter</div>
            <div className="plan-price text-3xl font-extrabold text-white mb-2">R$29<span className="text-sm font-normal text-white/50">/mês</span></div>
            <div className="plan-credits text-xs text-[var(--accent)] font-semibold mb-6">30 créditos/mês</div>
            <div className="plan-divider border-t border-white/5 my-4"></div>
            <ul className="plan-features space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> 30 carrosséis/mês</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> Export PNG 1080px</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> 1 brand kit</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> 30 dias de histórico</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> Suporte por e-mail</li>
            </ul>
          </div>
          <div>
            <Link href="/login" className="plan-btn plan-btn-ghost flex items-center justify-center py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/10 transition-all">Assinar Starter</Link>
            <div className="text-[10px] text-center text-white/40 mt-3 font-medium">
              Checkout 100% seguro via Stripe
            </div>
          </div>
        </motion.div>

        {/* PRO */}
        <motion.div 
          className="plan-card featured bg-[#0f111a]/95 border-2 border-[var(--brand-primary)] rounded-3xl p-8 relative flex flex-col justify-between shadow-[0_0_50px_rgba(124,58,237,0.15)]"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--brand-primary)] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3 fill-current" />
            Mais popular
          </div>
          <div>
            <div className="plan-name text-lg font-bold text-white mb-2 mt-2">Pro</div>
            <div className="plan-price text-3xl font-extrabold text-white mb-2">R$59<span className="text-sm font-normal text-white/50">/mês</span></div>
            <div className="plan-credits text-xs text-[var(--accent)] font-semibold mb-6">80 créditos/mês</div>
            <div className="plan-divider border-t border-white/5 my-4"></div>
            <ul className="plan-features space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> 80 carrosséis/mês</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> Export PNG 1080px</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> 3 brand kits</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> Histórico ilimitado</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> Suporte prioritário</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> Ajustes por IA</li>
            </ul>
          </div>
          <div>
            <Link href="/login" className="plan-btn plan-btn-primary flex items-center justify-center py-3 bg-[var(--brand-primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--p-light)] transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)]">Assinar Pro</Link>
            <div className="text-[10px] text-center text-white/50 mt-3 font-semibold flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Garantia incondicional de 7 dias
            </div>
          </div>
        </motion.div>

        {/* AGENCY */}
        <motion.div 
          className="plan-card bg-[#0f111a]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 relative flex flex-col justify-between"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div>
            <div className="plan-name text-lg font-bold text-white mb-2">Agência</div>
            <div className="plan-price text-3xl font-extrabold text-white mb-2">R$119<span className="text-sm font-normal text-white/50">/mês</span></div>
            <div className="plan-credits text-xs text-[var(--accent)] font-semibold mb-6">200 créditos/mês</div>
            <div className="plan-divider border-t border-white/5 my-4"></div>
            <ul className="plan-features space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> 200 carrosséis/mês</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> Export PNG 1080px</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> 10 brand kits</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> Histórico ilimitado</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> Suporte prioritário</li>
              <li className="flex items-center gap-2"><div className="plan-check text-[var(--accent)]">✓</div> Multi-usuários em breve</li>
            </ul>
          </div>
          <div>
            <Link href="/login" className="plan-btn plan-btn-ghost flex items-center justify-center py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/10 transition-all">Assinar Agência</Link>
            <div className="text-[10px] text-center text-white/40 mt-3 font-medium">
              Sem fidelidade • Cancele quando quiser
            </div>
          </div>
        </motion.div>
      </div>

      {/* Testimonials - Social Proof (Melhoria 8) */}
      <div className="pt-20 border-t border-white/5 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-amber-500/20">
            <Heart className="w-3 h-3 fill-current" /> Prova Social
          </div>
          <h3 className="text-3xl font-[family-name:var(--font-bricolage)] font-bold text-white">
            Aprovado por <span className="text-gradient">criadores inteligentes</span>
          </h3>
          <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">
            Veja o depoimento de quem já abandonou o Canva e começou a faturar mais com posts magnéticos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <motion.div 
              key={idx}
              className="bg-[#0f111a]/60 border border-white/5 rounded-2xl p-6 flex flex-col justify-between space-y-6 backdrop-blur-sm hover:border-[var(--brand-primary)]/40 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-white/80 leading-relaxed italic">
                  "{t.content}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <img src={t.img} alt={t.name} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">{t.name}</h4>
                    <span className="text-[10px] text-[var(--text-muted)] leading-tight">{t.role}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-[var(--brand-primary)]/10 text-[var(--accent)] border border-[var(--brand-primary)]/20 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  {t.metrics}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
