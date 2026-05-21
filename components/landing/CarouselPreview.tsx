"use client";
import { useState, useRef, useEffect } from "react";
import { Logo } from "@/components/Logo";

const TOTAL_SLIDES = 7;

export function CarouselPreview() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const startXRef = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewportWidthRef = useRef(0);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    startXRef.current = clientX;
    if (viewportRef.current) {
      viewportWidthRef.current = viewportRef.current.clientWidth;
    }
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startXRef.current;
    
    // Resistance at boundaries
    if (currentIndex === 0 && diff > 0) {
      setDragOffset(diff * 0.3);
    } else if (currentIndex === TOTAL_SLIDES - 1 && diff < 0) {
      setDragOffset(diff * 0.3);
    } else {
      setDragOffset(diff);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = viewportWidthRef.current * 0.15;
    if (dragOffset < -threshold && currentIndex < TOTAL_SLIDES - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (dragOffset > threshold && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
    setDragOffset(0);
  };

  const scrollToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="demo-preview">
      <div className="ig-frame">
        <div className="ig-header">
          <div className="ig-avatar">
            <Logo markOnly />
          </div>
          <div style={{ flex: 1 }}>
            <div className="ig-handle">@deslize.ai</div>
            <div className="ig-sub">Ferramenta para Criadores</div>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14m-7-7h14" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div style={{ position: "relative" }}>
          <div 
            className="ig-viewport" 
            ref={viewportRef}
            style={{
              overflow: "hidden",
              position: "relative",
              width: "100%",
              aspectRatio: "4/5",
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none"
            }}
            onTouchStart={(e) => handleStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX)}
            onTouchEnd={handleEnd}
            onMouseDown={(e) => { handleStart(e.clientX); e.preventDefault(); }}
            onMouseMove={(e) => { if (isDragging) handleMove(e.clientX); }}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
          >
            <div 
              className="ig-track" 
              style={{ 
                display: "flex", 
                height: "100%",
                width: "100%",
                transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
                transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.215, 0.61, 0.355, 1)"
              }}
            >
              {/* Slide 1: Hook */}
              <div className="ig-slide s1" style={{ width: "100%", minWidth: "100%", flexShrink: 0 }}>
                <div className="slide-tag" style={{ color: "var(--cyan)" }}>
                  CRIAÇÃO DE CONTEÚDO
                </div>
                <div className="slide-logo">
                  <Logo markOnly size={18} className="slide-logo-mark" />
                  <div className="slide-logo-text">DESLIZE</div>
                </div>
                <div className="slide-content" style={{ paddingBottom: "52px" }}>
                  <h2 className="slide-h">
                    Carrosséis que parecem<br />
                    <span className="slide-gradient-text">feitos por designer.</span>
                  </h2>
                  <p className="slide-body">
                    Pausar o scroll não precisa ser difícil. Descubra como criar conteúdo visualmente impecável em segundos.
                  </p>
                </div>
              </div>

              {/* Slide 2: Problem */}
              <div className="ig-slide s2" style={{ width: "100%", minWidth: "100%", flexShrink: 0 }}>
                <div className="slide-tag" style={{ color: "var(--p-light)" }}>
                  O PROBLEMA
                </div>
                <div className="slide-content" style={{ paddingBottom: "52px" }}>
                  <h2 className="slide-h">O tempo é seu maior inimigo.</h2>
                  <p className="slide-body">
                    Você passa horas no Canva ajustando margens e fontes. No final, o design fica amador e o engajamento despenca.
                  </p>
                </div>
              </div>

              {/* Slide 3: Solution */}
              <div className="ig-slide s3" style={{ width: "100%", minWidth: "100%", flexShrink: 0 }}>
                <div className="slide-tag" style={{ color: "rgba(255,255,255,0.6)" }}>
                  A SOLUÇÃO
                </div>
                <div className="slide-content" style={{ paddingBottom: "52px" }}>
                  <h2 className="slide-h">Conheça o Deslize.</h2>
                  <p className="slide-body">
                    Nossa IA entende o seu negócio e gera um carrossel inteiro com a sua identidade visual já aplicada. Sem templates engessados.
                  </p>
                  <div style={{ marginTop: "16px", padding: "16px", background: "rgba(0,0,0,0.15)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="slide-body" style={{ color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>Seu Prompt</p>
                    <p style={{ fontSize: "14px", color: "#fff", fontStyle: "italic", lineHeight: 1.4 }}>
                      "Crie um carrossel sobre como economizar tempo na criação de conteúdo..."
                    </p>
                  </div>
                </div>
              </div>

              {/* Slide 4: Features */}
              <div className="ig-slide s4" style={{ width: "100%", minWidth: "100%", flexShrink: 0 }}>
                <div className="slide-tag" style={{ color: "var(--cyan)" }}>
                  O QUE VOCÊ RECEBE
                </div>
                <div className="slide-content" style={{ paddingBottom: "52px" }}>
                  <h2 className="slide-h">Tudo o que você precisa.</h2>
                  <div className="slide-list" style={{ marginTop: "16px" }}>
                    <div className="slide-list-item">
                      <div className="slide-list-icon">✦</div>
                      <div>
                        <span style={{ fontWeight: 600, color: "#fff" }}>Design Exclusivo</span><br />
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>Cores e fontes da sua marca</span>
                      </div>
                    </div>
                    <div className="slide-list-item">
                      <div className="slide-list-icon">✦</div>
                      <div>
                        <span style={{ fontWeight: 600, color: "#fff" }}>Copywriter IA</span><br />
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>Textos que prendem a atenção</span>
                      </div>
                    </div>
                    <div className="slide-list-item">
                      <div className="slide-list-icon">✦</div>
                      <div>
                        <span style={{ fontWeight: 600, color: "#fff" }}>Exportação Rápida</span><br />
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>PNG 1080x1350px em segundos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 5: Details */}
              <div className="ig-slide s5" style={{ width: "100%", minWidth: "100%", flexShrink: 0 }}>
                <div className="slide-tag" style={{ color: "var(--p-light)" }}>
                  FLEXIBILIDADE
                </div>
                <div className="slide-content" style={{ paddingBottom: "52px" }}>
                  <h2 className="slide-h">Controle Total.</h2>
                  <p className="slide-body">
                    Não gostou de uma palavra ou cor? Edite instantaneamente. A IA refaz as partes que você precisa sem alterar o resto.
                  </p>
                </div>
              </div>

              {/* Slide 6: How-to */}
              <div className="ig-slide s6" style={{ width: "100%", minWidth: "100%", flexShrink: 0 }}>
                <div className="slide-tag" style={{ color: "var(--cyan)" }}>
                  COMO FUNCIONA
                </div>
                <div className="slide-content" style={{ paddingBottom: "52px" }}>
                  <h2 className="slide-h">Em 3 passos simples.</h2>
                  <div className="slide-list" style={{ marginTop: "16px" }}>
                    <div className="slide-list-item" style={{ alignItems: "center" }}>
                      <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--p-light)", minWidth: "24px" }}>1</span>
                      <span style={{ color: "#fff", fontWeight: 500 }}>Descreva seu tema</span>
                    </div>
                    <div className="slide-list-item" style={{ alignItems: "center" }}>
                      <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--p-light)", minWidth: "24px" }}>2</span>
                      <span style={{ color: "#fff", fontWeight: 500 }}>A IA gera e formata</span>
                    </div>
                    <div className="slide-list-item" style={{ alignItems: "center" }}>
                      <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--p-light)", minWidth: "24px" }}>3</span>
                      <span style={{ color: "#fff", fontWeight: 500 }}>Baixe e poste</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 7: CTA */}
              <div className="ig-slide s7" style={{ width: "100%", minWidth: "100%", flexShrink: 0 }}>
                <div className="slide-logo">
                  <Logo markOnly size={18} className="slide-logo-mark" />
                  <div className="slide-logo-text">DESLIZE</div>
                </div>
                <div className="slide-content" style={{ paddingBottom: "52px", display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", alignItems: "center", textAlign: "center" }}>
                  <h2 className="slide-h" style={{ fontSize: "24px" }}>Pronto para acelerar?</h2>
                  <p className="slide-body" style={{ marginBottom: "24px" }}>
                    Crie seu primeiro carrossel profissional de graça hoje mesmo.
                  </p>
                  <div className="slide-cta-btn" style={{ alignSelf: "center", cursor: "pointer" }}>
                    Começar Grátis →
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Persistent Overlay: Progress Bar & Swiper Arrow */}
          <div className="slide-progress" style={{ pointerEvents: "none", position: "absolute", bottom: 0, left: 0, right: 0 }}>
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentIndex + 1) / TOTAL_SLIDES) * 100}%` }}
              ></div>
            </div>
            <div className="progress-label">{currentIndex + 1}/{TOTAL_SLIDES}</div>
          </div>

          {currentIndex < TOTAL_SLIDES - 1 && (
            <div style={{
              position: "absolute",
              right: 0, top: 0, bottom: 0, width: "48px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(to right, transparent, rgba(0,0,0,0.4))",
              pointerEvents: "none", zIndex: 9
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>

        {/* IG Actions */}
        <div className="ig-actions" style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: "16px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        
        <div className="ig-caption" style={{ padding: "0 14px 14px", fontSize: "13px", color: "var(--text)" }}>
          <span style={{ fontWeight: "700", marginRight: "6px" }}>deslize.ai</span>
          Descubra como criar conteúdo visualmente impecável em segundos.
          <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--muted2)" }}>AGORA</div>
        </div>

        <div className="ig-dots">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <div 
              key={i} 
              className={`ig-dot ${currentIndex === i ? "active" : ""}`}
              onClick={() => scrollToSlide(i)}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
