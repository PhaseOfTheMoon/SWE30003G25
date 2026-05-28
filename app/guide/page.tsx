"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { viewPublishedGuides, type FirstAidGuideContent } from "@/lib/content";

type LoadState = "loading" | "ready" | "error";

export default function GuidePage() {
  const [state, setState] = useState<LoadState>("loading");
  const [guides, setGuides] = useState<FirstAidGuideContent[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadGuides() {
      try {
        const data = await viewPublishedGuides();
        setGuides(data);
        setState("ready");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load guides.");
        setState("error");
      }
    }

    loadGuides();
  }, []);

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <section style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 16px" }}>
          <p style={{ color: "#dc2626", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
            First aid content
          </p>
          <h1 style={{ color: "#111827", fontSize: "36px", fontWeight: 800, marginBottom: "12px" }}>
            Step-by-Step Guides
          </h1>
          <p style={{ color: "#4b5563", maxWidth: "680px", lineHeight: 1.7 }}>
            Guides are shown here only after staff submit them and a veterinarian validates them.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 16px 56px", flex: 1, width: "100%" }}>
        {state === "loading" && (
          <p style={{ color: "#6b7280" }}>Loading validated guides...</p>
        )}

        {state === "error" && (
          <div style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "8px", padding: "16px", color: "#9f1239" }}>
            <strong>Could not load guides.</strong>
            <p style={{ marginTop: "6px" }}>{message}</p>
          </div>
        )}

        {state === "ready" && guides.length === 0 && (
          <div style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
              No validated guides yet
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "18px" }}>
              Staff can create a guide from the staff portal, then request veterinarian validation.
            </p>
            <Link href="/staff/manageContent" style={{ color: "#dc2626", fontWeight: 700, textDecoration: "none" }}>
              Create guide as staff
            </Link>
          </div>
        )}

        {guides.length > 0 && (
          <div style={{ display: "grid", gap: "18px" }}>
            {guides.map((content) => (
              <article key={content.contentID} style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <div>
                    <p style={{ color: "#dc2626", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                      {content.petType}
                    </p>
                    <h2 style={{ color: "#111827", fontSize: "22px", fontWeight: 800 }}>
                      {content.emergencyCategory}
                    </h2>
                  </div>
                  <p style={{ color: "#6b7280", fontSize: "13px" }}>
                    Updated {new Date(content.lastUpdateDate).toLocaleDateString()}
                  </p>
                </div>

                <ol style={{ display: "grid", gap: "12px", paddingLeft: "20px" }}>
                  {content.guide.map((step) => (
                    <li key={step.guideID} style={{ color: "#374151", lineHeight: 1.65 }}>
                      <strong style={{ color: "#111827" }}>{step.title}</strong>
                      <p>{step.instruction}</p>
                      {step.videoUrl && (
                        <a href={step.videoUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontSize: "14px", fontWeight: 700 }}>
                          Open demo video
                        </a>
                      )}
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
