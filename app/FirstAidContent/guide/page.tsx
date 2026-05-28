'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import styles from '@/app/content/content.module.css'
import {
  getPetTypes,
  getEmergencyCategories,
  viewSteps,
  type Guide,
  type EducationalVideo,
} from '@/lib/content'
import supabase from '@/lib/supabase'

type Step = 'pet' | 'category' | 'guide'

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
      if (u.pathname.startsWith('/embed/')) return url
    }
  } catch {}
  return null
}

const CATEGORY_EMOJI: Record<string, string> = {
  Choking: '😮', Bleeding: '🩸', Burns: '🔥', Fracture: '🦴',
  Poisoning: '☠️', Seizure: '⚡',
}

const PET_EMOJI: Record<string, string> = {
  Dog: '🐕', Cat: '🐈', Bird: '🐦', Rabbit: '🐇', Other: '🐾',
}

export default function GuidePage() {
  const [step, setStep] = useState<Step>('pet')
  const [petTypes, setPetTypes] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [guides, setGuides] = useState<Guide[]>([])
  const [video, setVideo] = useState<EducationalVideo | null>(null)

  const [selectedPet, setSelectedPet] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [contentID, setContentID] = useState('')

  const [loadingPets, setLoadingPets] = useState(true)
  const [loadingCats, setLoadingCats] = useState(false)
  const [loadingGuide, setLoadingGuide] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [error, setError] = useState('')

  // Step 1: load pet types that have at least one validated content record
  useEffect(() => {
    async function loadValidatedPetTypes() {
      try {
        const { data: reviewed, error: revErr } = await supabase
          .from('content_review')
          .select('contentID')
          .eq('status', 'validated')
        if (revErr) throw new Error(revErr.message)
        const validatedIDs = (reviewed ?? []).map((r: any) => r.contentID)
        if (validatedIDs.length === 0) { setPetTypes([]); return }

        const { data, error: err } = await supabase
          .from('first_aid_content')
          .select('petType')
          .in('contentID', validatedIDs)
        if (err) throw new Error(err.message)
        const pets = [...new Set((data ?? []).map((r: any) => r.petType))].sort()
        setPetTypes(pets)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoadingPets(false)
      }
    }
    loadValidatedPetTypes()
  }, [])

  // Step 2: select a pet → load its emergency categories (validated only)
  async function handleSelectPet(pet: string) {
    setSelectedPet(pet)
    setSelectedCategory('')
    setGuides([])
    setVideo(null)
    setStep('category')
    setLoadingCats(true)
    setError('')
    try {
      // Only show categories that have validated content
      const { data: reviewed, error: revErr } = await supabase
        .from('content_review')
        .select('contentID')
        .eq('status', 'validated')
      if (revErr) throw new Error(revErr.message)
      const validatedIDs = (reviewed ?? []).map((r: any) => r.contentID)
      if (validatedIDs.length === 0) { setCategories([]); return }

      const { data, error: err } = await supabase
        .from('first_aid_content')
        .select('contentID, emergencyCategory')
        .eq('petType', pet)
      if (err) throw new Error(err.message)

      const filtered = (data ?? []).filter((r: any) => validatedIDs.includes(r.contentID))
      const cats = [...new Set(filtered.map((r: any) => r.emergencyCategory))].sort()
      setCategories(cats)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingCats(false)
    }
  }

  // Step 3: select a category → load guide steps + optional video (validated only)
  async function handleSelectCategory(category: string) {
    setSelectedCategory(category)
    setStep('guide')
    setLoadingGuide(true)
    setError('')
    setActiveStep(0)
    try {
      // Get the most recently validated contentID for this pet + category
      const { data: reviewed, error: revErr } = await supabase
        .from('content_review')
        .select('contentID, reviewedDate')
        .eq('status', 'validated')
        .order('reviewedDate', { ascending: false })
      if (revErr) throw new Error(revErr.message)
      const validatedIDs = (reviewed ?? []).map((r: any) => r.contentID)
      if (validatedIDs.length === 0) { setGuides([]); return }

      // Find all validated records for this pet + category, pick the most recently validated
      const { data: allMatches, error: err } = await supabase
        .from('first_aid_content')
        .select('contentID')
        .eq('petType', selectedPet)
        .eq('emergencyCategory', category)
        .in('contentID', validatedIDs)
      if (err) throw new Error(err.message)
      if (!allMatches || allMatches.length === 0) { setGuides([]); return }

      // Pick the one that was validated most recently
      const matchIDs = allMatches.map((r: any) => r.contentID)
      const bestReview = (reviewed ?? []).find((r: any) => matchIDs.includes(r.contentID))
      const cid = bestReview?.contentID ?? matchIDs[0]
      setContentID(cid)

      const { data: vidData, error: vidErr } = await supabase
        .from('educational_video')
        .select('*')
        .eq('contentID', cid)
        .maybeSingle()
      if (vidErr) throw new Error(vidErr.message)
      const [steps] = await Promise.all([viewSteps(cid)])
      setGuides(steps)
      setVideo(vidData ?? null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingGuide(false)
    }
  }

  function reset() {
    setStep('pet')
    setSelectedPet('')
    setSelectedCategory('')
    setGuides([])
    setVideo(null)
    setContentID('')
    setActiveStep(0)
    setError('')
  }

  return (
    <main className={styles.page}>
      <Navbar />

      <section style={{ minHeight: '80vh', backgroundColor: '#f9fafb', padding: '40px 16px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Back link */}
        <Link
          href="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px', marginBottom: '24px', textDecoration: 'none' }}
        >
          ← Back to Homepage
        </Link>

        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>First aid guide</h1>
          <p className={styles.lead}>
            Select your pet type and emergency category to view first-aid instructions.
          </p>
        </header>

        {/* Breadcrumb */}
        {(selectedPet || selectedCategory) && (
          <nav className={styles.breadcrumb} aria-label="Guide navigation">
            <button onClick={reset} className={styles.breadcrumbLink}>
              All Pets
            </button>
            {selectedPet && (
              <>
                <span className={styles.breadcrumbSep}>›</span>
                <button
                  onClick={() => { setStep('category'); setSelectedCategory(''); setGuides([]); setVideo(null) }}
                  className={selectedCategory ? styles.breadcrumbLink : styles.breadcrumbCurrent}
                >
                  {selectedPet}
                </button>
              </>
            )}
            {selectedCategory && (
              <>
                <span className={styles.breadcrumbSep}>›</span>
                <span className={styles.breadcrumbCurrent}>{selectedCategory}</span>
              </>
            )}
          </nav>
        )}

        {/* Error */}
        {error && (
          <div className={styles.alert}>
            <strong>Could not load guides.</strong>
            <p className={styles.alertDetail}>{error}</p>
          </div>
        )}

        {/* ── Step 1: Pet selection ── */}
        {step === 'pet' && (
          <>
            {loadingPets ? (
              <div className={styles.loadingList}>
                {[0, 1, 2].map(i => <div key={i} className={styles.loadingRow} />)}
              </div>
            ) : petTypes.length === 0 ? (
              <div className={styles.emptyState}>
                <h2>No pet types found</h2>
                <p>No first-aid content has been added yet.</p>
              </div>
            ) : (
              <div className={styles.petPicker}>
                <p className={styles.label}>Which pet needs help?</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                  {petTypes.map(pet => (
                    <button
                      key={pet}
                      type="button"
                      onClick={() => handleSelectPet(pet)}
                      style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '32px 16px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}
                    >
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>{PET_EMOJI[pet] ?? '🐾'}</div>
                      <p style={{ fontWeight: '700', fontSize: '15px', color: '#111827', margin: 0 }}>{pet}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Step 2: Category selection ── */}
        {step === 'category' && (
          <>
            {loadingCats ? (
              <div className={styles.loadingList}>
                {[0, 1, 2].map(i => <div key={i} className={styles.loadingRow} />)}
              </div>
            ) : categories.length === 0 ? (
              <div className={styles.emptyState}>
                <h2>No guides for {selectedPet} yet</h2>
                <p>Check back later or choose a different pet type.</p>
              </div>
            ) : (
              <div className={styles.petPicker}>
                <p className={styles.label}>What is the emergency?</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '32px 16px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}
                    >
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>{CATEGORY_EMOJI[cat] ?? '🚨'}</div>
                      <p style={{ fontWeight: '700', fontSize: '15px', color: '#111827', margin: 0 }}>{cat}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Step 3: Guide steps ── */}
        {step === 'guide' && (
          <>
            {loadingGuide ? (
              <div className={styles.loadingList}>
                {[0, 1, 2].map(i => <div key={i} className={styles.loadingRow} />)}
              </div>
            ) : guides.length === 0 ? (
              <div className={styles.emptyState}>
                <h2>No guide steps found</h2>
                <p>This category has no step-by-step guide. Check the Educational Videos section instead.</p>
              </div>
            ) : (
              <div className={styles.contentList}>
                <details open className={styles.disclosure}>
                  <summary className={styles.summary}>
                    <span className={styles.summaryText}>
                      <span className={styles.summaryTitle}>{selectedCategory}</span>
                      <span className={styles.summaryMeta}>
                        {guides.length} step{guides.length === 1 ? '' : 's'}
                        {video ? ' · with video' : ''}
                      </span>
                    </span>
                    <span className={styles.summaryAction}>
                      {selectedPet}
                    </span>
                  </summary>

                  <div className={styles.panel}>

                    {/* Guide steps */}
                    {guides.length > 0 && (
                      <ol className={styles.steps}>
                        {guides.map((g, i) => (
                          <li
                            key={g.guideID}
                            className={`${styles.step} ${guides.length > 1 && activeStep !== i ? styles.stepHidden : ''}`}
                          >
                            <span className={styles.stepNumber}>{g.stepNumber}</span>
                            <span>
                              <strong className={styles.stepTitle}>{g.title}</strong>
                              <span className={styles.stepText}>{g.instruction}</span>
                              {g.videoUrl && (
                                <a
                                  href={g.videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={styles.stepLink}
                                >
                                  Open step demo
                                </a>
                              )}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}

                    {/* Prev / Next navigation */}
                    {guides.length > 1 && (
                      <div className={styles.stepNavActions}>
                        <button
                          type="button"
                          onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                          disabled={activeStep === 0}
                          className={styles.stepNavPrev}
                        >
                          ← Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveStep(s => Math.min(guides.length - 1, s + 1))}
                          disabled={activeStep === guides.length - 1}
                          className={styles.stepNavNext}
                        >
                          Next →
                        </button>
                      </div>
                    )}

                    {/* Educational video */}
                    {video && (
                      <div className={styles.videoBlock}>
                        <p className={styles.videoLabel}>Educational video</p>
                        <div className={styles.videoList}>
                          <div>
                            <h3 className={styles.videoTitle}>{video.title}</h3>
                            {video.description && (
                              <p className={styles.videoDescription}>{video.description}</p>
                            )}
                            {toEmbedUrl(video.videoUrl) ? (
                              <div className={styles.videoEmbed}>
                                <iframe
                                  className={styles.videoIframe}
                                  src={toEmbedUrl(video.videoUrl)!}
                                  title={video.title}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            ) : (
                              <a
                                href={video.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.videoFallback}
                              >
                                Watch video
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </details>
              </div>
            )}
          </>
        )}

        </div>
      </section>

      <Footer />
    </main>
  )
}
