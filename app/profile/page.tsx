"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ProfilePage() {
  const router = useRouter();

  // Store user profile data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the current session and load profile data
    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        // If not logged in, redirect to login page
        router.push("/login");
        return;
      }

      const userId = sessionData.session.user.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", userId)
        .single();

      if (profile) {
        setName(profile.name);
        setEmail(profile.email);
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  // Get first letter of name for the avatar circle
  const avatarLetter = name ? name.charAt(0).toUpperCase() : "";

  if (loading) {
    return (
      <main>
        <Navbar />
        <section style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#6b7280" }}>Loading...</p>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <Navbar />

      <section style={{ minHeight: "80vh", backgroundColor: "#f9fafb", padding: "48px 16px" }}>
        <div style={{ maxWidth: "500px", margin: "0 auto", backgroundColor: "white", borderRadius: "8px", padding: "40px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>

          <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "32px", textAlign: "center" }}>My Profile</h1>

          {/* Avatar section */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" }}>
            {/* Red circle with first letter of name */}
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", fontWeight: "bold", color: "white", marginBottom: "12px" }}>
              {avatarLetter}
            </div>
            <p style={{ color: "#6b7280", fontSize: "13px" }}>Profile Picture</p>
          </div>

          {/* Name field */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Full Name</label>
            <div style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", backgroundColor: "#f9fafb", color: "#374151" }}>
              {name}
            </div>
          </div>

          {/* Email field */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Email</label>
            <div style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", backgroundColor: "#f9fafb", color: "#374151" }}>
              {email}
            </div>
          </div>

          {/* Role info */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Role</label>
            <div style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", backgroundColor: "#f9fafb", color: "#374151" }}>
              Pet Owner
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
