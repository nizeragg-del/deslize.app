"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="faq-section" id="faq">
      <motion.div 
        style={{textAlign: 'center', marginBottom: 50}}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="section-label" style={{textAlign: 'center'}}>Dúvidas</div>
        <div className="section-title" style={{fontSize: 36}}>Perguntas frequentes</div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        <div className={`faq-item ${openFaq === 0 ? 'open' : ''}`} onClick={() => toggleFaq(0)}>
          <div className="faq-q">O que é um crédito? <div className="faq-icon">+</div></div>
          <div className="faq-a">1 crédito = 1 carrossel gerado completo, com todos os slides. Ajustes pontuais em slides individuais consomem 0,5 crédito. Os créditos renovam todo mês e não acumulam.</div>
        </div>
        <div className={`faq-item ${openFaq === 1 ? 'open' : ''}`} onClick={() => toggleFaq(1)}>
          <div className="faq-q">Os carrosséis ficam com minha cara? <div className="faq-icon">+</div></div>
          <div className="faq-a">Sim. Você configura seu brand kit com cores, fontes, logo e tom de voz. A IA usa esses parâmetros para gerar cada carrossel — sem template genérico, do zero, sempre fiel à sua identidade.</div>
        </div>
        <div className={`faq-item ${openFaq === 2 ? 'open' : ''}`} onClick={() => toggleFaq(2)}>
          <div className="faq-q">Qual a qualidade dos PNGs exportados? <div className="faq-icon">+</div></div>
          <div className="faq-a">1080×1350px em alta resolução — o padrão profissional para carrosséis no Instagram (proporção 4:5). Cada slide é renderizado com Playwright para garantir pixel-perfect.</div>
        </div>
        <div className={`faq-item ${openFaq === 3 ? 'open' : ''}`} onClick={() => toggleFaq(3)}>
          <div className="faq-q">Posso cancelar a qualquer momento? <div className="faq-icon">+</div></div>
          <div className="faq-a">Sim. Cancele pelo painel de conta com um clique. Você mantém o acesso até o fim do período pago. Sem multa, sem burocracia.</div>
        </div>
        <div className={`faq-item ${openFaq === 4 ? 'open' : ''}`} onClick={() => toggleFaq(4)}>
          <div className="faq-q">Funciona para qualquer nicho? <div className="faq-icon">+</div></div>
          <div className="faq-a">Sim. Marketing digital, moda, gastronomia, finanças, saúde, tecnologia, pets — qualquer nicho. A IA adapta o copy e o design ao contexto que você descrever.</div>
        </div>
      </motion.div>
    </section>
  );
}
