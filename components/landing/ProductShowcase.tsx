"use client";

import { motion } from "framer-motion";

export function ProductShowcase() {
  return (
    <section className="product-showcase" aria-labelledby="product-showcase-title">
      <motion.div
        className="product-showcase-copy"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="section-label">Fluxo real</div>
        <h2 id="product-showcase-title">Do tema ao post pronto em segundos</h2>
        <p>
          Veja o Deslize em ação: você descreve a ideia, escolhe o Brand Kit e recebe um carrossel editável,
          pronto para exportar em PNG e publicar no Instagram.
        </p>
      </motion.div>

      <div className="product-showcase-grid">
        <motion.figure
          className="product-shot"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <img src="/sales/04_dashboard.webp" alt="Dashboard do Deslize para criar carrosséis com IA" />
          <figcaption>Descreva o tema e gere a primeira versão.</figcaption>
        </motion.figure>

        <motion.figure
          className="product-shot featured"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.18 }}
        >
          <img src="/sales/08_final_studio_view.webp" alt="Studio do Deslize com carrossel pronto para editar e exportar" />
          <figcaption>Ajuste os slides, exporte e publique.</figcaption>
        </motion.figure>
      </div>
    </section>
  );
}
