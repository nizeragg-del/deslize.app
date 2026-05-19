"use client";
import { motion } from "framer-motion";

export function StatsBar() {
  return (
    <motion.div 
      className="stats-bar"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="stat"><div className="stat-number">3×</div><div className="stat-label">mais engajamento com carrosséis</div></div>
      <div className="stat"><div className="stat-number">&lt;30s</div><div className="stat-label">tempo médio de geração</div></div>
      <div className="stat"><div className="stat-number">1080p</div><div className="stat-label">exportação em alta resolução</div></div>
      <div className="stat"><div className="stat-number">100%</div><div className="stat-label">identidade da sua marca</div></div>
    </motion.div>
  );
}
