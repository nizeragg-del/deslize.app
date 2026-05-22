"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Heart, ShieldCheck, Sparkles, Star } from "lucide-react";

const plans = [
  {
    name: "Teste grátis",
    price: "R$0",
    period: "",
    credits: "1 crédito único",
    cta: "Começar grátis",
    note: "Sem fidelidade. Cancele em 1 clique.",
    features: [
      "1 carrossel completo",
      "Export PNG 1080px",
      "1 brand kit",
      "7 dias de histórico",
    ],
  },
  {
    name: "Starter",
    price: "R$29",
    period: "/mês",
    credits: "30 créditos/mês",
    cta: "Assinar Starter",
    note: "Checkout 100% seguro via Stripe.",
    features: [
      "30 carrosséis/mês",
      "Export PNG 1080px",
      "1 brand kit",
      "30 dias de histórico",
      "Suporte por e-mail",
    ],
  },
  {
    name: "Pro",
    price: "R$59",
    period: "/mês",
    credits: "80 créditos/mês",
    cta: "Assinar Pro",
    note: "Garantia incondicional de 7 dias",
    featured: true,
    features: [
      "80 carrosséis/mês",
      "Export PNG 1080px",
      "3 brand kits",
      "Histórico ilimitado",
      "Suporte prioritário",
      "Ajustes por IA",
    ],
  },
  {
    name: "Agência",
    price: "R$119",
    period: "/mês",
    credits: "200 créditos/mês",
    cta: "Assinar Agência",
    note: "Sem fidelidade. Cancele quando quiser.",
    features: [
      "200 carrosséis/mês",
      "Export PNG 1080px",
      "10 brand kits",
      "Histórico ilimitado",
      "Suporte prioritário",
      "Multiusuários em breve",
    ],
  },
];

const testimonials = [
  {
    name: "Renata Carvalho",
    role: "Infoprodutora & Mentora",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120",
    content:
      "Eu levava horas para diagramar um carrossel no Canva. Com o Deslize, coloco o tema e em segundos tenho um post pronto para publicar.",
    metrics: "+45% engajamento",
  },
  {
    name: "Bruno Mello",
    role: "Especialista em Tráfego Pago",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120",
    content:
      "Os carrosséis gerados convertem muito bem em anúncios. O design limpo e os contrastes fortes ajudaram meus criativos a performar melhor.",
    metrics: "3.2x ROI",
  },
  {
    name: "Clara Vasconcelos",
    role: "Criadora de Conteúdo SaaS",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120",
    content:
      "A integração com o Brand Kit é perfeita. Coloco fontes e cores da paleta e o resultado já sai consistente com a marca.",
    metrics: "12 posts/semana",
  },
];

export function PricingSection() {
  return (
    <section className="pricing-section" id="pricing">
      <div className="pricing-header">
        <motion.div
          className="section-label"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Planos
        </motion.div>
        <motion.h2
          className="section-title pricing-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Escale sua criação de conteúdo
        </motion.h2>
        <p>
          Escolha o plano ideal para o seu momento e gere carrosséis prontos
          para publicar em segundos.
        </p>
      </div>

      <div className="pricing-grid">
        {plans.map((plan, index) => (
          <motion.article
            className={`plan-card${plan.featured ? " featured" : ""}`}
            key={plan.name}
            initial={{ opacity: 0, y: plan.featured ? 18 : 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 + index * 0.08 }}
          >
            {plan.featured ? (
              <div className="plan-badge">
                <Sparkles aria-hidden="true" />
                Mais popular
              </div>
            ) : null}

            <div>
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">
                {plan.price}
                {plan.period ? <span>{plan.period}</span> : null}
              </div>
              <div className="plan-credits">{plan.credits}</div>
              <div className="plan-divider" />

              <ul className="plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="plan-action">
              <Link
                href="/login"
                className={`plan-btn ${
                  plan.featured ? "plan-btn-primary" : "plan-btn-ghost"
                }`}
              >
                {plan.cta}
              </Link>
              <div className="plan-note">
                {plan.featured ? <ShieldCheck aria-hidden="true" /> : null}
                {plan.note}
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <div className="testimonials-section">
        <div className="testimonials-header">
          <div className="proof-badge">
            <Heart aria-hidden="true" />
            Prova social
          </div>
          <h3>
            Aprovado por <span>criadores inteligentes</span>
          </h3>
          <p>
            Depoimentos de quem já usa o Deslize para acelerar a criação e
            manter a marca consistente.
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <motion.article
              key={testimonial.name}
              className="testimonial-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div>
                <div className="testimonial-stars" aria-label="5 estrelas">
                  {[...Array(5)].map((_, starIndex) => (
                    <Star key={starIndex} aria-hidden="true" />
                  ))}
                </div>
                <p>"{testimonial.content}"</p>
              </div>

              <div className="testimonial-author">
                <div className="author-info">
                  <img src={testimonial.img} alt={testimonial.name} />
                  <div>
                    <h4>{testimonial.name}</h4>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
                <strong>{testimonial.metrics}</strong>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
