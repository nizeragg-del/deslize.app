import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer>
      <Link href="/" className="logo">
        <Logo />
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
