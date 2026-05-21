"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          backgroundColor: isScrolled ? "rgba(7, 7, 13, 0.85)" : "rgba(7, 7, 13, 0.3)",
          borderBottomColor: isScrolled ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.02)",
          boxShadow: isScrolled ? "0 4px 30px rgba(0, 0, 0, 0.3)" : "none"
        }}
        transition={{ duration: 0.3 }}
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 100,
          padding: "0 40px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: "1px",
          borderBottomStyle: "solid",
          transition: "padding 0.3s ease"
        }}
      >
        <Link href="/" className="logo">
          <Logo />
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
