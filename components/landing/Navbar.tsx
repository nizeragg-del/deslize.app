"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="logo">
          <div className="logo-icon">
            <span></span><span></span><span></span>
          </div>
          <span className="logo-text">deslize</span>
        </Link>
        
        {/* Desktop Links */}
        <ul className="nav-links">
          <li><a href="#features">Funcionalidades</a></li>
          <li><a href="#how">Como funciona</a></li>
          <li><a href="#pricing">Planos</a></li>
          <li><a href="#faq">FAQ</a></li>
          <li><Link href="/login" className="nav-cta">Começar grátis</Link></li>
        </ul>

        {/* Mobile Toggle & CTA */}
        <div className="mobile-toggle">
          <Link href="/login" className="nav-cta mobile-cta">Começar</Link>
          <button onClick={() => setIsOpen(!isOpen)} className="menu-btn">
            {isOpen ? <X size={24} color="white" /> : <Menu size={24} color="white" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mobile-menu"
          >
            <ul>
              <li><a href="#features" onClick={() => setIsOpen(false)}>Funcionalidades</a></li>
              <li><a href="#how" onClick={() => setIsOpen(false)}>Como funciona</a></li>
              <li><a href="#pricing" onClick={() => setIsOpen(false)}>Planos</a></li>
              <li><a href="#faq" onClick={() => setIsOpen(false)}>FAQ</a></li>
              <li className="mt-2"><Link href="/login" className="nav-cta">Começar grátis</Link></li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
