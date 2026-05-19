"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export function PricingSection() {
  return (
    <section className="pricing-section" id="pricing">
      <motion.div 
        className="section-label" style={{textAlign: 'center'}}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >Planos</motion.div>
      <motion.h2 
        className="section-title" style={{textAlign: 'center', fontSize: 36}}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
      >
        Escale sua criação de conteúdo
      </motion.h2>

      <div className="pricing-grid">
        {/* FREE */}
        <motion.div 
          className="plan-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="plan-name">Teste Grátis</div>
          <div className="plan-price">R$0</div>
          <div className="plan-credits">1 crédito único</div>
          <div className="plan-divider"></div>
          <ul className="plan-features">
            <li><div className="plan-check">✓</div> 1 carrossel completo</li>
            <li><div className="plan-check">✓</div> Export PNG 1080px</li>
            <li><div className="plan-check">✓</div> 1 brand kit</li>
            <li><div className="plan-check">✓</div> 7 dias de histórico</li>
          </ul>
          <Link href="/login" className="plan-btn plan-btn-ghost flex items-center justify-center">Começar grátis</Link>
        </motion.div>

        {/* STARTER */}
        <motion.div 
          className="plan-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="plan-name">Starter</div>
          <div className="plan-price">R$29<span>/mês</span></div>
          <div className="plan-credits">30 créditos/mês</div>
          <div className="plan-divider"></div>
          <ul className="plan-features">
            <li><div className="plan-check">✓</div> 30 carrosséis/mês</li>
            <li><div className="plan-check">✓</div> Export PNG 1080px</li>
            <li><div className="plan-check">✓</div> 1 brand kit</li>
            <li><div className="plan-check">✓</div> 30 dias de histórico</li>
            <li><div className="plan-check">✓</div> Suporte por e-mail</li>
          </ul>
          <Link href="/login" className="plan-btn plan-btn-ghost flex items-center justify-center">Assinar Starter</Link>
        </motion.div>

        {/* PRO */}
        <motion.div 
          className="plan-card featured"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="plan-badge">Mais popular</div>
          <div className="plan-name">Pro</div>
          <div className="plan-price">R$59<span>/mês</span></div>
          <div className="plan-credits">80 créditos/mês</div>
          <div className="plan-divider"></div>
          <ul className="plan-features">
            <li><div className="plan-check">✓</div> 80 carrosséis/mês</li>
            <li><div className="plan-check">✓</div> Export PNG 1080px</li>
            <li><div className="plan-check">✓</div> 3 brand kits</li>
            <li><div className="plan-check">✓</div> Histórico ilimitado</li>
            <li><div className="plan-check">✓</div> Suporte prioritário</li>
            <li><div className="plan-check">✓</div> Ajustes por IA</li>
          </ul>
          <Link href="/login" className="plan-btn plan-btn-primary flex items-center justify-center">Assinar Pro</Link>
        </motion.div>

        {/* AGENCY */}
        <motion.div 
          className="plan-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div className="plan-name">Agência</div>
          <div className="plan-price">R$119<span>/mês</span></div>
          <div className="plan-credits">200 créditos/mês</div>
          <div className="plan-divider"></div>
          <ul className="plan-features">
            <li><div className="plan-check">✓</div> 200 carrosséis/mês</li>
            <li><div className="plan-check">✓</div> Export PNG 1080px</li>
            <li><div className="plan-check">✓</div> 10 brand kits</li>
            <li><div className="plan-check">✓</div> Histórico ilimitado</li>
            <li><div className="plan-check">✓</div> Suporte prioritário</li>
            <li><div className="plan-check">✓</div> Multi-usuários em breve</li>
          </ul>
          <Link href="/login" className="plan-btn plan-btn-ghost flex items-center justify-center">Assinar Agência</Link>
        </motion.div>
      </div>
    </section>
  );
}
