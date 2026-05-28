"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Simple pet owner dashboard page
// This can be updated later with more features
export default function DashboardPage() {
  return (
    <main>
      <Navbar />

      <section style={{ minHeight: "80vh", backgroundColor: "#f9fafb", padding: "48px 16px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>

          <h1 style={{ fontSize: "26px", fontWeight: "bold", marginBottom: "8px" }}>Welcome, Pet Owner</h1>
          <p style={{ color: "#6b7280", marginBottom: "32px" }}>What would you like to do today?</p>

          {/* Quick links to main features */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <Link href="/content" style={{ textDecoration: "none" }}>
              <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", textAlign: "center" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>📖</div>
                <h3 style={{ fontWeight: "bold", marginBottom: "6px" }}>First Aid Content</h3>
                <p style={{ color: "#6b7280", fontSize: "13px" }}>Choose your pet and open emergency guides</p>
              </div>
            </Link>

            <Link href="/quiz" style={{ textDecoration: "none" }}>
              <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", textAlign: "center" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>📝</div>
                <h3 style={{ fontWeight: "bold", marginBottom: "6px" }}>Quiz</h3>
                <p style={{ color: "#6b7280", fontSize: "13px" }}>Test your first aid knowledge</p>
              </div>
            </Link>

            <Link href="/emergency" style={{ textDecoration: "none" }}>
              <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", textAlign: "center" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>🚨</div>
                <h3 style={{ fontWeight: "bold", marginBottom: "6px" }}>Emergency</h3>
                <p style={{ color: "#6b7280", fontSize: "13px" }}>Find emergency contacts</p>
              </div>
            </Link>

            <Link href="/enquiry" style={{ textDecoration: "none" }}>
              <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", textAlign: "center" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>💬</div>
                <h3 style={{ fontWeight: "bold", marginBottom: "6px" }}>Submit Enquiry</h3>
                <p style={{ color: "#6b7280", fontSize: "13px" }}>Send a question to our team</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
