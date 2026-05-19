"use client";
import { motion } from "framer-motion";

export function FeaturesSection() {
  return (
    <section className="section" id="features">
      <motion.div 
        className="section-label"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >Por que usar o Deslize?</motion.div>
      <motion.h2 
        className="section-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
      >
        Você não precisa ser designer<br/>para ter um feed impecável
      </motion.h2>
      <motion.p 
        className="section-sub"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15 }}
      >
        Nossa inteligência artificial cria a cópia e o design alinhados ao seu negócio em menos de 1 minuto.
      </motion.p>
      
      <div className="features-grid">
        <motion.div 
          className="feature-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="feature-icon purple">✨</div>
          <div className="feature-title">Brand Kit automático</div>
          <p className="feature-desc">Esqueça os templates genéricos do Canva. O Deslize aplica suas cores, tipografia e logo em cada slide, garantindo que o carrossel tenha a cara da sua marca.</p>
        </motion.div>
        
        <motion.div 
          className="feature-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="feature-icon cyan">⚡</div>
          <div className="feature-title">Copywriting persuasivo</div>
          <p className="feature-desc">Nossa IA é treinada com os melhores frameworks de copywriting para Instagram. Ganchos fortes, desenvolvimento fluido e CTAs que convertem.</p>
        </motion.div>
        
        <motion.div 
          className="feature-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="feature-icon green">🎨</div>
          <div className="feature-title">Editor flexível</div>
          <p className="feature-desc">A IA gerou o carrossel, mas você quer mudar um texto ou a cor de fundo de um slide específico? Nosso editor permite ajustes finos em segundos.</p>
        </motion.div>
      </div>
    </section>
  );
}
