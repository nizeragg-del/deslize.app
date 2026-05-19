"use client";
import { motion } from "framer-motion";

export function HowItWorks() {
  return (
    <section className="how-section" id="how">
      <motion.div 
        className="section-label" style={{ textAlign: "center" }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >Passo a passo</motion.div>
      <motion.h2 
        className="section-title" style={{ textAlign: "center" }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
      >
        Como a mágica acontece
      </motion.h2>

      <div className="steps">
        <motion.div 
          className="step"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="step-circle">1</div>
          <h4>Configure sua marca</h4>
          <p>Faça upload do seu logo, escolha suas cores primárias e secundárias, e defina as fontes que você já usa no Instagram. Você só precisa fazer isso uma vez.</p>
        </motion.div>

        <motion.div 
          className="step"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="step-circle">2</div>
          <h4>Diga o que você quer</h4>
          <p>Digite um tema simples como "5 dicas para dormir melhor" ou cole um texto longo/link. A IA vai analisar, resumir e dividir o conteúdo em slides engajadores.</p>
        </motion.div>

        <motion.div 
          className="step"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="step-circle">3</div>
          <h4>Ajuste e exporte</h4>
          <p>Revise os slides gerados. Se algo não estiver perfeito, peça para a IA reescrever ou ajuste você mesmo. Clique em exportar e baixe seu carrossel pronto para postar.</p>
        </motion.div>
      </div>
    </section>
  );
}
