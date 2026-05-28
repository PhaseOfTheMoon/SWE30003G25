import Link from "next/link";

// Footer component used across all pages
export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#1f2937", color: "#9ca3af", padding: "40px 16px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "24px" }}>
        <div>
          <h3 style={{ color: "white", fontWeight: "bold", fontSize: "18px", marginBottom: "12px" }}>🐾 PetFirstAid</h3>
          <p style={{ fontSize: "13px", lineHeight: "1.6" }}>
            A web based application by Swinsoft Consulting for the Veterinary Association. Helping pet owners handle emergencies correctly.
          </p>
        </div>
        <div>
          <h4 style={{ color: "white", fontWeight: "600", marginBottom: "12px" }}>Quick Links</h4>
          <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
            <li style={{ marginBottom: "8px" }}><Link href="/" style={{ color: "#9ca3af", textDecoration: "none" }}>Home</Link></li>
            <li style={{ marginBottom: "8px" }}><Link href="/about" style={{ color: "#9ca3af", textDecoration: "none" }}>About Us</Link></li>
            <li style={{ marginBottom: "8px" }}><Link href="/content" style={{ color: "#9ca3af", textDecoration: "none" }}>First Aid Content</Link></li>
            <li style={{ marginBottom: "8px" }}><Link href="/contact" style={{ color: "#9ca3af", textDecoration: "none" }}>Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 style={{ color: "white", fontWeight: "600", marginBottom: "12px" }}>Services</h4>
          <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
            <li style={{ marginBottom: "8px" }}><Link href="/content" style={{ color: "#9ca3af", textDecoration: "none" }}>First Aid Content</Link></li>
            <li style={{ marginBottom: "8px" }}><Link href="/quiz" style={{ color: "#9ca3af", textDecoration: "none" }}>First Aid Quiz</Link></li>
            <li style={{ marginBottom: "8px" }}><Link href="/emergency" style={{ color: "#9ca3af", textDecoration: "none" }}>Emergency Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 style={{ color: "white", fontWeight: "600", marginBottom: "12px" }}>Contact</h4>
          <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
            <li style={{ marginBottom: "8px" }}>📧 info@petfirstaid.com</li>
            <li style={{ marginBottom: "8px" }}>📞 +60 12-345 6789</li>
            <li style={{ marginBottom: "8px" }}>🕐 Mon to Fri, 8am to 5pm</li>
          </ul>
        </div>

        {/* Enquiry button so users can quickly go to the enquiry page */}
        <div>
          <h4 style={{ color: "white", fontWeight: "600", marginBottom: "12px" }}>Have a Question?</h4>
          <p style={{ fontSize: "13px", lineHeight: "1.6", marginBottom: "12px" }}>
            Cannot find what you need? Send us an enquiry and our team will help you.
          </p>
          <Link href="/enquiry" style={{ padding: "8px 16px", backgroundColor: "#dc2626", color: "white", borderRadius: "4px", textDecoration: "none", fontSize: "13px", fontWeight: "600" }}>
            Submit Enquiry
          </Link>
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: "12px", color: "#6b7280", marginTop: "32px" }}>
        © 2026 PetFirstAid. Developed by Group 25 for Swinburne University SWE30003.
      </div>
    </footer>
  );
}
