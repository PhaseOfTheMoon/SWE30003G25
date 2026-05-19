import Link from "next/link";

// Navbar component used across all pages
export default function Navbar() {
  return (
    <nav style={{ backgroundColor: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "22px", fontWeight: "bold", color: "#dc2626" }}>
          🐾 PetFirstAid
        </div>
        <div style={{ display: "flex", gap: "24px", fontSize: "15px" }}>
          <Link href="/" style={{ color: "#374151", textDecoration: "none" }}>Home</Link>
          <Link href="/about" style={{ color: "#374151", textDecoration: "none" }}>About</Link>
          <Link href="/guide" style={{ color: "#374151", textDecoration: "none" }}>First-Aid Guide</Link>
          <Link href="/emergency" style={{ color: "#374151", textDecoration: "none" }}>Emergency</Link>
          <Link href="/contact" style={{ color: "#374151", textDecoration: "none" }}>Contact</Link>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href="/login" style={{ padding: "8px 16px", border: "1px solid #dc2626", color: "#dc2626", borderRadius: "4px", textDecoration: "none", fontSize: "14px" }}>
            Login
          </Link>
          <Link href="/register" style={{ padding: "8px 16px", backgroundColor: "#dc2626", color: "white", borderRadius: "4px", textDecoration: "none", fontSize: "14px" }}>
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
