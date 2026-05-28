'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import {
  type EducationalVideo,
} from '@/lib/content'
import supabase from '@/lib/supabase'

// Convert YouTube watch/shortlink URLs to embed URLs for iframe rendering.
function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`
    }
  } catch {}
  return url
}

const PET_EMOJI: Record<string, string> = {
  Dog: '🐕', Cat: '🐈', Bird: '🐦', Rabbit: '🐇', Other: '🐾',
}

const CAT_EMOJI: Record<string, string> = {
  Choking: '😮', Bleeding: '🩸', Burns: '🔥', Fracture: '🦴', Poisoning: '☠️', Seizure: '⚡',
}

type Step = 'pet' | 'category' | 'video'

export default function VideoPage() {
  const [step, setStep] = useState<Step>('pet')
  const [petTypes, setPetTypes] = useState<string[]>([])
  const [categories, setCats] = useState<string[]>([])
  const [video, setVideo] = useState<EducationalVideo | null>(null)

  const [selectedPet, setSelectedPet] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const [loadingPets, setLoadingPets] = useState(true)
  const [loadingCats, setLoadingCats] = useState(false)
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [error, setError] = useState('')

  // Fetch available pet types — validated only
  useEffect(() => {
    async function loadValidatedPetTypes() {
      try {
        const { data: reviewed, error: revErr } = await supabase
          .from('content_review').select('contentID').eq('status', 'published')
        if (revErr) throw new Error(revErr.message)
        const validatedIDs = (reviewed ?? []).map((r: any) => r.contentID)
        if (validatedIDs.length === 0) { setPetTypes([]); return }

        const { data, error: err } = await supabase
          .from('first_aid_content').select('petType').in('contentID', validatedIDs)
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

  // Fetch categories for selected pet — validated only
  async function handleSelectPet(pet: string) {
    setSelectedPet(pet)
    setSelectedCategory('')
    setVideo(null)
    setStep('category')
    setLoadingCats(true)
    setError('')
    try {
      const { data: reviewed, error: revErr } = await supabase
        .from('content_review').select('contentID').eq('status', 'published')
      if (revErr) throw new Error(revErr.message)
      const validatedIDs = (reviewed ?? []).map((r: any) => r.contentID)
      if (validatedIDs.length === 0) { setCats([]); return }

      const { data, error: err } = await supabase
        .from('first_aid_content').select('contentID, emergencyCategory').eq('petType', pet)
      if (err) throw new Error(err.message)

      const filtered = (data ?? []).filter((r: any) => validatedIDs.includes(r.contentID))
      const cats = [...new Set(filtered.map((r: any) => r.emergencyCategory))].sort()
      setCats(cats)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingCats(false)
    }
  }

  // Fetch video for selected pet + category — validated content only
  async function handleSelectCategory(cat: string) {
    setSelectedCategory(cat)
    setStep('video')
    setLoadingVideo(true)
    setError('')
    try {
      // Join through content_review to only surface validated content
      const { data: reviewed, error: revErr } = await supabase
        .from('content_review')
        .select('contentID')
        .eq('status', 'published')
      if (revErr) throw new Error(revErr.message)
      const validatedIDs = (reviewed ?? []).map((r: any) => r.contentID)
      if (validatedIDs.length === 0) { setVideo(null); return }

      const { data, error: err } = await supabase
        .from('first_aid_content')
        .select('contentID')
        .eq('petType', selectedPet)
        .eq('emergencyCategory', cat)
        .in('contentID', validatedIDs)
        .limit(1)
      if (err) throw new Error(err.message)
      if (!data || data.length === 0) { setVideo(null); return }

      const { data: vidData, error: vidErr } = await supabase
        .from('educational_video')
        .select('*')
        .eq('contentID', data[0].contentID)
        .maybeSingle()
      if (vidErr) throw new Error(vidErr.message)
      setVideo(vidData ?? null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingVideo(false)
    }
  }

  function reset() {
    setStep('pet'); setSelectedPet(''); setSelectedCategory(''); setVideo(null); setError('')
  }

  return (
    <main>
      <Navbar />

      <section style={{ minHeight: '80vh', backgroundColor: '#f9fafb', padding: '40px 16px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>

          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px', marginBottom: '24px', textDecoration: 'none' }}>
            ← Back to Homepage
          </Link>

          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#111827', marginBottom: '6px' }}>🎬 Educational Videos</h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Watch expert pet first-aid demonstrations.</p>
          </div>

          {/* Breadcrumb */}
          {(selectedPet || selectedCategory) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button onClick={reset} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 0, fontWeight: '500' }}>All Pets</button>
              {selectedPet && (
                <>
                  <span>›</span>
                  <button
                    onClick={() => { setStep('category'); setSelectedCategory(''); setVideo(null) }}
                    style={{ background: 'none', border: 'none', color: selectedCategory ? '#3b82f6' : '#111827', cursor: selectedCategory ? 'pointer' : 'default', padding: 0, fontWeight: '500' }}
                  >{selectedPet}</button>
                </>
              )}
              {selectedCategory && <><span>›</span><span style={{ color: '#111827', fontWeight: '500' }}>{selectedCategory}</span></>}
            </div>
          )}

          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', color: '#dc2626', fontSize: '14px', marginBottom: '20px' }}>
              ✗ {error}
            </div>
          )}

          {/* Pet selection */}
          {step === 'pet' && (
            loadingPets ? <p style={{ color: '#9ca3af', fontSize: '14px' }}>Loading…</p> :
            petTypes.length === 0 ? (
              <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>No videos available yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                {petTypes.map(pet => (
                  <button key={pet} onClick={() => handleSelectPet(pet)}
                    style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '24px 16px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)' }}
                  >
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>{PET_EMOJI[pet] ?? '🐾'}</div>
                    <p style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{pet}</p>
                  </button>
                ))}
              </div>
            )
          )}

          {/* Category selection */}
          {step === 'category' && (
            loadingCats ? <p style={{ color: '#9ca3af', fontSize: '14px' }}>Loading categories…</p> :
            categories.length === 0 ? (
              <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>No videos available for {selectedPet} yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => handleSelectCategory(cat)}
                    style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '20px 16px', textAlign: 'left', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)' }}
                  >
                    <p style={{ fontSize: '22px', marginBottom: '8px' }}>{CAT_EMOJI[cat] ?? '🚨'}</p>
                    <p style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{cat}</p>
                  </button>
                ))}
              </div>
            )
          )}

          {/* Video viewer — viewVideo() */}
          {step === 'video' && (
            loadingVideo ? (
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>Loading video…</p>
            ) : !video ? (
              <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>🎬</div>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>No video available for {selectedPet} — {selectedCategory} yet.</p>
              </div>
            ) : (
              <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
                {/* Video player */}
                <div style={{ position: 'relative', paddingBottom: '56.25%', backgroundColor: '#111' }}>
                  <iframe
                    src={toEmbedUrl(video.videoUrl)}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                  {/* Fallback — always visible if embed is blocked */}
                  <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        backgroundColor: '#ff0000', color: 'white',
                        fontSize: '12px', fontWeight: '600',
                        padding: '6px 12px', borderRadius: '6px',
                        textDecoration: 'none',
                      }}
                    >
                      ▶ Watch on YouTube
                    </a>
                  </div>
                </div>

                {/* Video meta */}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                    <h2 style={{ fontWeight: 'bold', fontSize: '18px', color: '#111827', margin: 0 }}>{video.title}</h2>
                    {video.duration && (
                      <span style={{ fontSize: '12px', backgroundColor: '#f3f4f6', color: '#6b7280', padding: '4px 10px', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        ⏱ {video.duration}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: '999px', fontWeight: '500' }}>
                      {selectedPet}
                    </span>
                    <span style={{ fontSize: '12px', backgroundColor: '#fef9c3', color: '#854d0e', padding: '3px 10px', borderRadius: '999px', fontWeight: '500' }}>
                      {selectedCategory}
                    </span>
                  </div>

                  {video.description && (
                    <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.7' }}>
                      {video.description}
                    </p>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
