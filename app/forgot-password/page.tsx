"use client";

import { useState } from "react";
import Link from "next/link";
import supabase from "../../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Send OTP to the email
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: otpError } = await supabase.auth.resetPasswordForEmail(email);

    setLoading(false);

    if (otpError) {
      setError("Could not send OTP. Please check your email and try again.");
      return;
    }

    setOtpSent(true);
  }

  // Verify OTP then update the password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "recovery",
      });

      if (verifyError || !verifyData?.session) {
        setError("Invalid or expired OTP. Please try again.");
        setLoading(false);
        return;
      }

      // Use the access token directly to update the password
      const accessToken = verifyData.session.access_token;
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        setError("Failed to update password. Please try again.");
        setLoading(false);
        return;
      }

      await supabase.auth.signOut();
      setSuccess("Password updated successfully! You can now login with your new password.");
    } catch (err) {
      console.log("unexpected error:", err);
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  return (
    <main>
      <Navbar />

      <section style={{ minHeight: "80vh", backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>

          <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px", textAlign: "center" }}>Reset Password</h1>
          <p style={{ color: "#6b7280", fontSize: "14px", textAlign: "center", marginBottom: "28px" }}>
            {!otpSent ? "Enter your email to receive a one-time code." : "Enter the code sent to your email and set a new password."}
          </p>

          {/* Show email form first */}
          {!otpSent && (
            <form onSubmit={handleSendOtp}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              {error && (
                <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "16px", backgroundColor: "#fef2f2", padding: "10px", borderRadius: "4px" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", padding: "11px", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "4px", fontSize: "15px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Sending..." : "Send Code"}
              </button>
            </form>
          )}

          {/* Show OTP and new password form after code is sent */}
          {otpSent && !success && (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>One-Time Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter the code from your email"
                  required
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              {error && (
                <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "16px", backgroundColor: "#fef2f2", padding: "10px", borderRadius: "4px" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", padding: "11px", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "4px", fontSize: "15px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Updating..." : "Reset Password"}
              </button>

              <p style={{ textAlign: "center", fontSize: "13px", color: "#6b7280", marginTop: "16px" }}>
                Wrong email?{" "}
                <button onClick={() => setOtpSent(false)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                  Go back
                </button>
              </p>
            </form>
          )}

          {success && (
            <p style={{ color: "#16a34a", fontSize: "13px", backgroundColor: "#f0fdf4", padding: "10px", borderRadius: "4px", textAlign: "center" }}>
              {success}
            </p>
          )}

          <p style={{ textAlign: "center", fontSize: "13px", color: "#6b7280", marginTop: "20px" }}>
            Remember your password?{" "}
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
