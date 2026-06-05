"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function RegisterPage() {
  const router = useRouter();

  // Form field states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Check password length 
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    // Check both passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // Sign up using Supabase auth, role defaults to pet_owner
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: "pet_owner",
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Show success message and redirect to login
    setSuccess("Account created! Please check your email to confirm, then login.");
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  }

  return (
    <main>
      <Navbar />

      <section style={{ minHeight: "80vh", backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>

          {/* Title */}
          <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px", textAlign: "center" }}>Create Account</h1>
          <p style={{ color: "#6b7280", fontSize: "14px", textAlign: "center", marginBottom: "28px" }}>
            Register to access pet first aid information
          </p>

          <form onSubmit={handleRegister}>
            {/* Full name field */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

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
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

            {/* Confirm password field */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

            {/* Show error message if any */}
            {error && (
              <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "16px", backgroundColor: "#fef2f2", padding: "10px", borderRadius: "4px" }}>
                {error}
              </p>
            )}

            {/* Show success message if registration worked */}
            {success && (
              <p style={{ color: "#16a34a", fontSize: "13px", marginBottom: "16px", backgroundColor: "#f0fdf4", padding: "10px", borderRadius: "4px" }}>
                {success}
              </p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "11px", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "4px", fontSize: "15px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          {/* Link to login page */}
          <p style={{ textAlign: "center", fontSize: "13px", color: "#6b7280", marginTop: "20px" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#dc2626", fontWeight: "600", textDecoration: "none" }}>
              Login here
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
