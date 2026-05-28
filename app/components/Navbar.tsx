"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabase";

export default function Navbar() {
  const router = useRouter();

  // Store the logged in user, null means not logged in
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    // Check if there is already a session when the page loads
    async function getUser() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const userId = sessionData.session.user.id;

        // Get the user name from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("id", userId)
          .single();

        if (profile) {
          setUser({ name: profile.name, email: profile.email });
        }
      }
    }

    getUser();

    // Listen for login or logout changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setUser({ name: profile.name, email: profile.email });
        }
      } else {
        setUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Handle logout
  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  }

  // Get the first letter of the user name to use as avatar
  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : "";

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

        {/* Show login and register if not logged in, show profile and logout if logged in */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {user ? (
            <>
              <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "#374151", fontSize: "14px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#dc2626", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" }}>
                  {avatarLetter}
                </div>
                {user.name}
              </Link>
              <button
                onClick={handleLogout}
                style={{ padding: "8px 16px", border: "1px solid #dc2626", color: "#dc2626", borderRadius: "4px", fontSize: "14px", cursor: "pointer", backgroundColor: "white" }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ padding: "8px 16px", border: "1px solid #dc2626", color: "#dc2626", borderRadius: "4px", textDecoration: "none", fontSize: "14px" }}>
                Login
              </Link>
              <Link href="/register" style={{ padding: "8px 16px", backgroundColor: "#dc2626", color: "white", borderRadius: "4px", textDecoration: "none", fontSize: "14px" }}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
