"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import supabase from "@/lib/supabase";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

type Props = {
  role: "Staff" | "Veterinarian";
  navItems: NavItem[];
  children: ReactNode;
};

export default function DashboardLayout({ role, navItems, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("");

  useEffect(() => {
    async function fetchName() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      if (profile?.name) setName(profile.name);
    }
    fetchName();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const avatarLetter = name ? name.charAt(0).toUpperCase() : "";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>

      {/* Top navbar */}
      <nav style={{ backgroundColor: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.08)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#dc2626" }}>
            🐾 PetFirstAid
          </div>
          <div style={{ fontSize: "13px", color: "#6b7280", backgroundColor: "#f3f4f6", padding: "4px 12px", borderRadius: "999px" }}>
            {role} Portal
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#dc2626", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" }}>
              {avatarLetter}
            </div>
            <span style={{ fontSize: "14px", color: "#374151" }}>{name}</span>
            <button
              onClick={handleLogout}
              style={{ padding: "8px 16px", border: "1px solid #dc2626", color: "#dc2626", borderRadius: "4px", fontSize: "14px", cursor: "pointer", backgroundColor: "white" }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div style={{ display: "flex", flex: 1 }}>

        {/* Sidebar */}
        <aside style={{ width: "220px", backgroundColor: "white", borderRight: "1px solid #e5e7eb", padding: "24px 12px", display: "flex", flexDirection: "column" }}>
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: active ? "600" : "400",
                    color: active ? "white" : "#374151",
                    backgroundColor: active ? "#dc2626" : "transparent",
                    textDecoration: "none",
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "#fef2f2";
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div style={{ marginTop: "auto", paddingTop: "24px", borderTop: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: "11px", color: "#9ca3af" }}>PetFirstAid © 2026</p>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          {children}
        </main>

      </div>
    </div>
  );
}
