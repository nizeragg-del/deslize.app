"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { CarouselPreview } from "./CarouselPreview";

export function HeroSection() {
  return (
    <motion.section 
      className="hero"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="hero-glow"></div>
      <div className="hero-glow-cyan"></div>

      <div className="hero-content-left">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          Do tema ao post pronto em segundos
        </div>

        <h1>
          Crie carrosséis<br />
          <span className="text-gradient">prontos para postar.</span><br />
          Sem abrir o Canva.
        </h1>

        <p>Descreva o tema, escolha o formato e a IA gera um carrossel completo com a identidade da sua marca. Exporte em PNG, pronto para o Instagram.</p>

        <div className="hero-actions">
          <Link href="/login" className="btn-primary">
            Testar grátis
          </Link>
          <a href="#how" className="btn-secondary">
            Ver o fluxo real →
          </a>
        </div>

        <p className="hero-note">Sem cartão de crédito · 1 carrossel grátis · Exportação 1080×1350px</p>
      </div>

      <div className="hero-content-right">
        <CarouselPreview />
      </div>
    </motion.section>
  );
}
