"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Background images for the hero slideshow
const heroSlides = [
  "/images/dog.jpg",
  "/images/cat.jpg",
  "/images/hamster.jpg",
];

// Services offered by the web application
const services = [
  {
    icon: "📖",
    title: "First-Aid Guide",
    desc: "Step by step instructions for common pet emergencies like choking, bleeding, and seizures.",
  },
  {
    icon: "🎬",
    title: "Educational Videos",
    desc: "Short videos that teach you how to handle pet emergencies in the right way.",
  },
  {
    icon: "📝",
    title: "First-Aid Quiz",
    desc: "Test your knowledge with quizzes so you are prepared when your pet needs help.",
  },
  {
    icon: "🚨",
    title: "Emergency Contact",
    desc: "Find 24 hour emergency hotlines and nearby veterinary clinics based on your location.",
  },
  {
    icon: "💬",
    title: "Submit Enquiry",
    desc: "Send a question to our staff and get help from a qualified veterinarian.",
  },
  {
    icon: "🐾",
    title: "Pet Categories",
    desc: "Get first aid content for dogs, cats, and small pets like rabbits and hamsters.",
  },
];

// Reasons why users should use this application
const reasons = [
  {
    icon: "✅",
    title: "Vet Validated Content",
    desc: "All content is checked and approved by veterinarians before it is published.",
  },
  {
    icon: "⚡",
    title: "Fast Access",
    desc: "Find the right information quickly when every second matters.",
  },
  {
    icon: "🔒",
    title: "Trusted and Reliable",
    desc: "Content is managed by the Veterinary Association to make sure it is accurate.",
  },
  {
    icon: "📱",
    title: "Easy to Use",
    desc: "Designed to be simple so anyone can use it during an emergency.",
  },
];

export default function HomePage() {
  // Track which slide is currently showing
  const [current, setCurrent] = useState(0);

  // Auto change slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main>
      {/* Navigation bar */}
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

      {/* Hero section with crossfade background images */}
      <section style={{ position: "relative", height: "560px", overflow: "hidden" }}>
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${slide})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: index === current ? 1 : 0,
              transition: "opacity 1.5s ease-in-out",
            }}
          />
        ))}

        {/* Dark overlay so the text is readable */}
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: "white", padding: "16px" }}>
          <div>
            <p style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "3px", color: "#fca5a5", marginBottom: "10px" }}>
              Best Pet First Aid Information
            </p>
            <h1 style={{ fontSize: "52px", fontWeight: "bold", marginBottom: "16px" }}>Keep Your Pet Safe</h1>
            <p style={{ fontSize: "18px", color: "#e5e7eb", marginBottom: "28px", maxWidth: "500px" }}>
              Get fast and reliable first aid information for your pets, verified by qualified veterinarians.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
              <Link href="/register" style={{ padding: "12px 24px", backgroundColor: "#dc2626", color: "white", borderRadius: "4px", textDecoration: "none", fontWeight: "bold" }}>
                Get Started
              </Link>
              <Link href="/guide" style={{ padding: "12px 24px", border: "2px solid white", color: "white", borderRadius: "4px", textDecoration: "none", fontWeight: "bold" }}>
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Dot indicators to show which slide is active */}
        <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px" }}>
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                backgroundColor: i === current ? "#dc2626" : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>
      </section>

      {/* About section */}
      <section style={{ padding: "64px 16px", backgroundColor: "white" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", gap: "48px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "280px" }}>
            <p style={{ color: "#dc2626", fontWeight: "600", textTransform: "uppercase", fontSize: "13px", marginBottom: "8px" }}>About Us</p>
            <h2 style={{ fontSize: "30px", fontWeight: "bold", marginBottom: "16px" }}>
              Reliable First Aid Information <span style={{ color: "#dc2626" }}>For Your Pets</span>
            </h2>
            <p style={{ color: "#4b5563", marginBottom: "12px", lineHeight: "1.7" }}>
              The Pet First Aid web based application is developed by Swinsoft Consulting for the Veterinary Association. It gives pet owners quick access to correct and verified first aid information.
            </p>
            <p style={{ color: "#4b5563", marginBottom: "20px", lineHeight: "1.7" }}>
              All content is uploaded by our staff and must be validated by a qualified veterinarian before it is shown to users. You can trust that the information is accurate and safe to follow.
            </p>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "24px" }}>
              <li style={{ marginBottom: "8px", color: "#374151" }}>✔ Vet validated first aid guides</li>
              <li style={{ marginBottom: "8px", color: "#374151" }}>✔ Available for dogs, cats and small pets</li>
              <li style={{ marginBottom: "8px", color: "#374151" }}>✔ 24/7 emergency contact support</li>
            </ul>
            <Link href="/about" style={{ padding: "10px 24px", backgroundColor: "#dc2626", color: "white", borderRadius: "4px", textDecoration: "none", fontWeight: "bold" }}>
              Learn More
            </Link>
          </div>

          {/* Two pet images side by side */}
          <div style={{ flex: 1, minWidth: "280px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <img src="/images/dog.jpg" alt="Dog" style={{ borderRadius: "8px", objectFit: "cover", height: "200px", width: "100%" }} />
            <img src="/images/cat.jpg" alt="Cat" style={{ borderRadius: "8px", objectFit: "cover", height: "200px", width: "100%" }} />
          </div>
        </div>
      </section>

      {/* Services section */}
      <section style={{ padding: "64px 16px", backgroundColor: "#f9fafb" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "#dc2626", fontWeight: "600", textTransform: "uppercase", fontSize: "13px", marginBottom: "8px" }}>Our Services</p>
          <h2 style={{ fontSize: "30px", fontWeight: "bold", marginBottom: "40px" }}>
            What We <span style={{ color: "#dc2626" }}>Offer</span>
          </h2>

          {/* Service cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {services.map((s, i) => (
              <div key={i} style={{ backgroundColor: "white", borderRadius: "8px", padding: "24px", textAlign: "left", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #f3f4f6" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>{s.icon}</div>
                <h3 style={{ fontSize: "17px", fontWeight: "bold", marginBottom: "8px" }}>{s.title}</h3>
                <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.6" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us section */}
      <section style={{ padding: "64px 16px", backgroundColor: "white" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", gap: "48px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "280px" }}>
            <img src="/images/hamster.jpg" alt="hamster" style={{ borderRadius: "8px", objectFit: "cover", width: "100%", height: "320px" }} />
          </div>
          <div style={{ flex: 1, minWidth: "280px" }}>
            <p style={{ color: "#dc2626", fontWeight: "600", textTransform: "uppercase", fontSize: "13px", marginBottom: "8px" }}>Why Choose Us</p>
            <h2 style={{ fontSize: "30px", fontWeight: "bold", marginBottom: "28px" }}>
              Special Care <span style={{ color: "#dc2626" }}>For Your Pets</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {reasons.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>{r.icon}</span>
                  <div>
                    <h4 style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>{r.title}</h4>
                    <p style={{ color: "#6b7280", fontSize: "12px", lineHeight: "1.5" }}>{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to action banner */}
      <section style={{ padding: "56px 16px", backgroundColor: "#dc2626", textAlign: "center", color: "white" }}>
        <h2 style={{ fontSize: "30px", fontWeight: "bold", marginBottom: "12px" }}>Ready to Get Started?</h2>
        <p style={{ marginBottom: "24px", color: "#fecaca" }}>
          Register now to access all first aid guides, videos and quizzes for free.
        </p>
        <Link href="/register" style={{ padding: "12px 32px", backgroundColor: "white", color: "#dc2626", fontWeight: "bold", borderRadius: "4px", textDecoration: "none" }}>
          Register Now
        </Link>
      </section>

      {/* Footer */}
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
              <li style={{ marginBottom: "8px" }}><Link href="/guide" style={{ color: "#9ca3af", textDecoration: "none" }}>First Aid Guide</Link></li>
              <li style={{ marginBottom: "8px" }}><Link href="/contact" style={{ color: "#9ca3af", textDecoration: "none" }}>Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: "white", fontWeight: "600", marginBottom: "12px" }}>Services</h4>
            <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
              <li style={{ marginBottom: "8px" }}><Link href="/guide" style={{ color: "#9ca3af", textDecoration: "none" }}>First Aid Guide</Link></li>
              <li style={{ marginBottom: "8px" }}><Link href="/video" style={{ color: "#9ca3af", textDecoration: "none" }}>Educational Videos</Link></li>
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

          {/* Enquiry button in footer so users can quickly go to the enquiry page */}
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
    </main>
  );
}
