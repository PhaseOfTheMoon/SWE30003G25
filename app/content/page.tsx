"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./content.module.css";
import {
  viewPublishedFirstAidContent,
  type FirstAidContentBundle,
} from "@/lib/content";

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

export default function ContentPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<FirstAidContentBundle[]>([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadContent() {
      try {
        const data = await viewPublishedFirstAidContent();
        setItems(data);
        setSelectedPet(data[0]?.petType ?? "");
        setState("ready");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load first-aid content.");
        setState("error");
      }
    }

    loadContent();
  }, []);

  const petTypes = useMemo(
    () => Array.from(new Set(items.map((item) => item.petType))).sort(),
    [items]
  );

  const selectedItems = useMemo(
    () => items.filter((item) => item.petType === selectedPet),
    [items, selectedPet]
  );

  return (
    <main className={styles.page}>
      <Navbar />

      <section className={styles.shell}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            First aid content
          </h1>
          <p className={styles.lead}>
            Pick a pet type, then open the emergency guide you need.
          </p>
        </header>

        {state === "loading" && (
          <div className={styles.loadingList}>
            {[0, 1, 2].map((item) => (
              <div key={item} className={styles.loadingRow} />
            ))}
          </div>
        )}

        {state === "error" && (
          <div className={styles.alert}>
            <strong>Could not load first-aid content.</strong>
            <p>
              Database access for public validated content needs to be enabled.
            </p>
            <p className={styles.alertDetail}>
              Supabase said: {message}
            </p>
          </div>
        )}

        {state === "ready" && items.length === 0 && (
          <div className={styles.emptyState}>
            <h2>
              No validated first-aid content yet
            </h2>
            <p>
              Staff need to create guide or video content and send it to a veterinarian for validation before it appears here.
            </p>
            <Link href="/staff/manageContent" className={styles.textLink}>
              Open staff content management
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className={styles.petPicker}>
              <p className={styles.label}>
                Pet type
              </p>
              <div className={styles.petList}>
                {petTypes.map((pet) => {
                  const active = selectedPet === pet;
                  const count = items.filter((item) => item.petType === pet).length;

                  return (
                    <button
                      key={pet}
                      type="button"
                      onClick={() => setSelectedPet(pet)}
                      className={`${styles.petButton} ${active ? styles.petButtonActive : ""}`}
                      aria-pressed={active}
                    >
                      <span className={styles.petName}>{pet}</span>
                      <span className={styles.petCount}>
                        {count} guide{count === 1 ? "" : "s"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.contentList}>
              {selectedItems.map((content) => (
                <details
                  key={content.contentID}
                  className={styles.disclosure}
                >
                  <summary className={styles.summary}>
                    <span className={styles.summaryText}>
                      <span className={styles.summaryTitle}>
                        {content.emergencyCategory}
                      </span>
                      <span className={styles.summaryMeta}>
                        {content.guide.length} step{content.guide.length === 1 ? "" : "s"}
                        {content.educational_video.length > 0 ? " with video" : ""}
                      </span>
                    </span>
                    <span className={styles.summaryAction}>
                      View guide
                    </span>
                  </summary>

                  <div className={styles.panel}>
                    {content.guide.length > 0 && (
                      <ol className={styles.steps}>
                        {content.guide.map((step) => (
                          <li key={step.guideID} className={styles.step}>
                            <span className={styles.stepNumber}>
                              {step.stepNumber}
                            </span>
                            <span>
                              <strong className={styles.stepTitle}>
                                {step.title}
                              </strong>
                              <span className={styles.stepText}>
                                {step.instruction}
                              </span>
                              {step.videoUrl && (
                                <a href={step.videoUrl} target="_blank" rel="noreferrer" className={styles.stepLink}>
                                  Open step demo
                                </a>
                              )}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}

                    {content.educational_video.length > 0 && (
                      <div className={styles.videoBlock}>
                        <p className={styles.videoLabel}>
                          Educational video
                        </p>
                        <div className={styles.videoList}>
                          {content.educational_video.map((video) => {
                            const embedUrl = toYouTubeEmbed(video.videoUrl);
                            return (
                              <div key={video.videoID}>
                                <h3 className={styles.videoTitle}>
                                  {video.title}
                                </h3>
                                {video.description && (
                                  <p className={styles.videoDescription}>
                                    {video.description}
                                  </p>
                                )}
                                {embedUrl ? (
                                  <div className={styles.videoEmbed}>
                                    <iframe
                                      className={styles.videoIframe}
                                      src={embedUrl}
                                      title={video.title}
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                ) : (
                                  <a href={video.videoUrl} target="_blank" rel="noreferrer" className={styles.videoFallback}>
                                    Watch video
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </>
        )}
      </section>

      <Footer />
    </main>
  );
}
