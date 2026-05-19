import Link from "next/link";

export function Footer() {
  return (
    <footer>
      <Link href="/" className="logo">
        <div className="logo-icon">
          <span></span><span></span><span></span>
        </div>
        <span className="logo-text">deslize</span>
      </Link>
      <p>© 2026 Deslize. Feito com ✦ no Brasil.</p>
      <div className="footer-links">
        <Link href="#">Termos</Link>
        <Link href="#">Privacidade</Link>
        <Link href="#">Contato</Link>
      </div>
    </footer>
  );
}
