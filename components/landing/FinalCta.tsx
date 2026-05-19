"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export function FinalCta() {
  return (
    <motion.div 
      className="final-cta"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
    >
      <h2>Seu próximo carrossel<br/><span className="gradient-text">está a 30 segundos.</span></h2>
      <p>Crie o primeiro gratuitamente. Sem cartão de crédito.</p>
      <Link href="/login" className="btn-primary" style={{display: 'inline-flex'}}>
        ✦ Começar agora — é grátis
      </Link>
    </motion.div>
  );
}
