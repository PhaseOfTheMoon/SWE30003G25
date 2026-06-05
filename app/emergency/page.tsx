"use client";

import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

// EmergencyPage displays important contact information for pet emergencies, including hotlines and nearby clinics. It provides a user-friendly interface for pet owners to quickly access help when their pet is in danger. (WC)
const EMERGENCY_CONTACTS = [
  {
    name: "24Hr Pet Emergency Hotline",
    number: "+60 3-7803 9494",
    note: "Available 24 hours, 7 days a week",
    icon: "🚨",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
  },
  {
    name: "Veterinary Association Helpline",
    number: "+60 3-8888 2222",
    note: "Mon – Fri, 8:00 AM – 6:00 PM",
    icon: "🩺",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    name: "Animal Poison Control",
    number: "+60 3-6666 5555",
    note: "For poisoning & toxic emergencies",
    icon: "☠️",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
];

const CLINIC = {
  name: "PawCare Veterinary Clinic",
  address: "12, Jalan SS2/55, SS2, 47300 Petaling Jaya, Selangor",
  hours: "Mon – Sun: 8:00 AM – 10:00 PM",
  phone: "+60 3-7777 1234",
  mapsUrl: "https://www.google.com/maps/search/veterinary+clinic+petaling+jaya",
};

// EmergencyPage displays important contact information for pet emergencies, including hotlines and nearby clinics. It provides a user-friendly interface for pet owners to quickly access help when their pet is in danger. (WC)
export default function EmergencyPage() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <Navbar />

      <section style={{ padding: "40px 16px 64px", maxWidth: "720px", margin: "0 auto" }}>

        {/* Back link */}
        <Link
          href="/"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#6b7280", fontSize: "14px", marginBottom: "28px", textDecoration: "none" }}
        >
          ← Back to Homepage
        </Link>

        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <p style={{ color: "#dc2626", fontWeight: "600", textTransform: "uppercase", fontSize: "12px", letterSpacing: "2px", marginBottom: "8px" }}>
            Emergency Help
          </p>
          <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#111827", marginBottom: "8px" }}>
            Emergency Contacts
          </h1>
          <p style={{ color: "#6b7280", fontSize: "15px", lineHeight: "1.6" }}>
            If your pet is in danger, call one of the numbers below immediately.
          </p>
        </div>

        {/* Contact cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "48px" }}>
          {EMERGENCY_CONTACTS.map((contact) => (
            <div
              key={contact.name}
              style={{
                backgroundColor: contact.bg,
                border: `1px solid ${contact.border}`,
                borderRadius: "14px",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div style={{ fontSize: "36px", lineHeight: 1 }}>{contact.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: "700", fontSize: "15px", color: "#111827", marginBottom: "2px" }}>
                  {contact.name}
                </p>
                <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>{contact.note}</p>
                <a
                  href={`tel:${contact.number.replace(/\s/g, "")}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "20px",
                    fontWeight: "800",
                    color: contact.color,
                    textDecoration: "none",
                    letterSpacing: "0.5px",
                  }}
                >
                  📞 {contact.number}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Clinic section */}
        <div style={{ marginBottom: "12px" }}>
          <p style={{ color: "#dc2626", fontWeight: "600", textTransform: "uppercase", fontSize: "12px", letterSpacing: "2px", marginBottom: "8px" }}>
            Nearby Clinic
          </p>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#111827", marginBottom: "16px" }}>
            Find a Veterinary Clinic
          </h2>
        </div>

        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          {/* Map embed */}
          <iframe
            title="Clinic Location"
            src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d15937.32867876528!2d101.5987!3d3.1073!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1svet+clinic+petaling+jaya!5e0!3m2!1sen!2smy!4v1700000000000"
            width="100%"
            height="240"
            style={{ border: "none", display: "block" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          {/* Clinic info */}
          <div style={{ padding: "20px 24px" }}>
            <p style={{ fontWeight: "700", fontSize: "16px", color: "#111827", marginBottom: "12px" }}>
              🏥 {CLINIC.name}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "15px", marginTop: "1px" }}>📍</span>
                <p style={{ fontSize: "14px", color: "#4b5563", margin: 0, lineHeight: "1.5" }}>{CLINIC.address}</p>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{ fontSize: "15px" }}>🕐</span>
                <p style={{ fontSize: "14px", color: "#4b5563", margin: 0 }}>{CLINIC.hours}</p>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{ fontSize: "15px" }}>📞</span>
                <a
                  href={`tel:${CLINIC.phone.replace(/\s/g, "")}`}
                  style={{ fontSize: "14px", color: "#dc2626", fontWeight: "600", textDecoration: "none" }}
                >
                  {CLINIC.phone}
                </a>
              </div>
            </div>

            <a
              href={CLINIC.mapsUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "16px",
                padding: "10px 20px",
                backgroundColor: "#dc2626",
                color: "white",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Open in Google Maps →
            </a>
          </div>
        </div>

      </section>

      <Footer />
    </main>
  );
}
