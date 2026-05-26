"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function LoginPage() {
  const router = useRouter();

  // Form field states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Sign in using Supabase auth
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError("Invalid email or password. Please try again.");
      return;
    }

    // Get the user role from the profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    console.log("user id:", data.user.id)   // check UUID matches
    console.log("profile:", profile)       
    setLoading(false);

    // Redirect to the right dashboard based on role
    if (profile?.role === "staff") {
      router.push("/staff");
    } else if (profile?.role === "veterinarian") {
      router.push("/vet");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <main>
      <Navbar />

      <section style={{ minHeight: "80vh", backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>

          {/* Title */}
          <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px", textAlign: "center" }}>Login</h1>
          <p style={{ color: "#6b7280", fontSize: "14px", textAlign: "center", marginBottom: "28px" }}>
            Login to access your account
          </p>

          <form onSubmit={handleLogin}>
            {/* Email field */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: "8px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

            {/* Forgot password link */}
            <div style={{ textAlign: "right", marginBottom: "20px" }}>
              <Link href="/forgot-password" style={{ color: "#dc2626", fontSize: "13px", textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>

            {/* Show error message if login failed */}
            {error && (
              <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "16px", backgroundColor: "#fef2f2", padding: "10px", borderRadius: "4px" }}>
                {error}
              </p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "11px", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "4px", fontSize: "15px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Link to register page */}
          <p style={{ textAlign: "center", fontSize: "13px", color: "#6b7280", marginTop: "20px" }}>
            Do not have an account?{" "}
            <Link href="/register" style={{ color: "#dc2626", fontWeight: "600", textDecoration: "none" }}>
              Register here
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
