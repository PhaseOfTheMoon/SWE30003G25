"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { viewPublishedVideos, type FirstAidVideoContent } from "@/lib/content";

type LoadState = "loading" | "ready" | "error";

function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname === "youtu.be") {
      id = u.pathname.slice(1);
    } else if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else if (u.pathname.startsWith("/embed/")) return url;
    }
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

export default function VideoPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [contentRows, setContentRows] = useState<FirstAidVideoContent[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadVideos() {
      try {
        const data = await viewPublishedVideos();
        setContentRows(data);
        setState("ready");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load videos.");
        setState("error");
      }
    }

    loadVideos();
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
            Educational Videos
          </h1>
          <p style={{ color: "#4b5563", maxWidth: "680px", lineHeight: 1.7 }}>
            Short videos for pet emergencies, published only after veterinarian validation.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 16px 56px", flex: 1, width: "100%" }}>
        {state === "loading" && (
          <p style={{ color: "#6b7280" }}>Loading validated videos...</p>
        )}

        {state === "error" && (
          <div style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "8px", padding: "16px", color: "#9f1239" }}>
            <strong>Could not load videos.</strong>
            <p style={{ marginTop: "6px" }}>{message}</p>
          </div>
        )}

        {state === "ready" && contentRows.length === 0 && (
          <div style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
              No validated videos yet
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "18px" }}>
              Staff can create an educational video from the staff portal, then request veterinarian validation.
            </p>
            <Link href="/staff/manageContent" style={{ color: "#dc2626", fontWeight: 700, textDecoration: "none" }}>
              Create video as staff
            </Link>
          </div>
        )}

        {contentRows.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "18px" }}>
            {contentRows.flatMap((content) =>
              content.educational_video.map((video) => (
                <article key={video.videoID} style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "22px" }}>
                  <p style={{ color: "#dc2626", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                    {content.petType} / {content.emergencyCategory}
                  </p>
                  <h2 style={{ color: "#111827", fontSize: "20px", fontWeight: 800, marginBottom: "10px" }}>
                    {video.title}
                  </h2>
                  {video.description && (
                    <p style={{ color: "#4b5563", lineHeight: 1.65, marginBottom: "16px" }}>
                      {video.description}
                    </p>
                  )}
                  {(() => {
                    const embedUrl = toYouTubeEmbed(video.videoUrl);
                    return embedUrl ? (
                      <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", borderRadius: "8px", overflow: "hidden", background: "#000" }}>
                        <iframe
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                          src={embedUrl}
                          title={video.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <a href={video.videoUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", color: "white", backgroundColor: "#dc2626", borderRadius: "4px", padding: "10px 14px", fontWeight: 700, textDecoration: "none" }}>
                        Watch video
                      </a>
                    );
                  })()}
                </article>
              ))
            )}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
