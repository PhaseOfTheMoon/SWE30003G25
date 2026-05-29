'use client'

import DashboardLayout from '@/app/components/dashboardLayout'
import { useEffect, useState } from 'react'
import {
  viewStaffContent,
  resubmitContent,
  publishContent,
  editGuideAndResubmit,
  updateGuide,
  type ContentReview,
} from '@/lib/content'
import supabase from '@/lib/supabase'
import { STAFF_NAV } from '@/app/components/sidebar'

type EditDraft = {
  title: string
  instruction: string
}

type GuideStepEdit = {
  guideID: string
  title: string
  instruction: string
  videoUrl?: string
}

const STATUS_META: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  pending: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', dot: '#f59e0b', label: 'Pending Review' },
  validated: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', dot: '#16a34a', label: 'Validated' },
  rejected: { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239', dot: '#dc2626', label: 'Rejected' },
  published: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#3b82f6', label: 'Published' },
}

const CATEGORY_ICON: Record<string, string> = {
  'Emergency Care': '🚨',
  'First Aid': '🩹',
  'Preventive Care': '🛡️',
  'Behavioural': '🧠',
}

export default function StaffPendingReviewPage() {
  const [reviews, setReviews] = useState<ContentReview[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'validated' | 'rejected' | 'published'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, EditDraft>>({})
  const [submitting, setSubmitting] = useState(false)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [validatedEditing, setValidatedEditing] = useState<string | null>(null)
  const [validatedSteps, setValidatedSteps] = useState<Record<string, GuideStepEdit[]>>({})
  const [revalidating, setRevalidating] = useState(false)
  const [feedback, setFeedback] = useState<Record<string, { type: 'ok' | 'err'; msg: string }>>({})

  useEffect(() => { loadContent() }, [])

  // Load the content reviews assigned to this staff from the API when the component mounts. We get the current user from Supabase auth, then call viewStaffContent with their user ID to fetch their content reviews. 
  // The reviews are stored in state and displayed in the UI. We also handle loading state and errors.
  async function loadContent() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const data = await viewStaffContent(user.id)
      setReviews(data)
    } catch (e: any) {
      console.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  // When the staff clicks "Edit" on a rejected content review, we want to populate the edit form with the existing content data so they can make changes. 
  // The startEdit function takes the review being edited, extracts the relevant fields (like title and instruction from the guide), and sets them in the drafts state keyed by reviewID. 
  // It also sets the editing state to the current reviewID to show the edit form.
  function startEdit(review: ContentReview) {
    const guides = (review as any).guide ?? []
    const first = guides[0]
    setDrafts(prev => ({
      ...prev,
      [review.reviewID]: {
        title: first?.title ?? '',
        instruction: first?.instruction ?? '',
      },
    }))
    setEditing(review.reviewID)
  }

  // When the staff finishes editing and clicks "Resubmit", we call handleResubmit which takes the current draft data for that review and sends it to the API via resubmitContent.
  async function handleResubmit(review: ContentReview) {
    const draft = drafts[review.reviewID]
    if (!draft?.title.trim() || !draft?.instruction.trim()) return
    setSubmitting(true)
    try {
      // Save the edited guide step first
      const guides = (review as any).guide ?? []
      if (guides[0]) {
        await updateGuide(guides[0].guideID, draft.title, draft.instruction, guides[0].videoUrl ?? undefined)
      }
      // Then resubmit for vet re-validation
      const updated = await resubmitContent(review.reviewID)
      setReviews(prev => prev.map(r => r.reviewID === updated.reviewID ? updated : r))
      setEditing(null)
      setFeedback(prev => ({ ...prev, [review.reviewID]: { type: 'ok', msg: 'Resubmitted for vet review.' } }))
    } catch (e: any) {
      setFeedback(prev => ({ ...prev, [review.reviewID]: { type: 'err', msg: 'Error: ' + e.message } }))
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePublish(review: ContentReview) {
    setPublishing(review.reviewID)
    try {
      const updated = await publishContent(review.reviewID)
      setReviews(prev => prev.map(r => r.reviewID === review.reviewID ? { ...r, ...updated } : r))
      setFeedback(prev => ({ ...prev, [review.reviewID]: { type: 'ok', msg: 'Posted to dashboard! Content is now visible to users.' } }))
    } catch (e: any) {
      setFeedback(prev => ({ ...prev, [review.reviewID]: { type: 'err', msg: 'Publish failed: ' + e.message } }))
    } finally {
      setPublishing(null)
    }
  }

  function startValidatedEdit(review: ContentReview) {
    const guides = (review as any).guide ?? []
    setValidatedSteps(prev => ({
      ...prev,
      [review.reviewID]: guides.map((g: any) => ({
        guideID: g.guideID,
        title: g.title ?? '',
        instruction: g.instruction ?? '',
        videoUrl: g.videoUrl ?? '',
      })),
    }))
    setValidatedEditing(review.reviewID)
  }

  async function handleSaveAndRevalidate(review: ContentReview) {
    const steps = validatedSteps[review.reviewID] ?? []
    if (steps.some(s => !s.title.trim() || !s.instruction.trim())) return
    setRevalidating(true)
    try {
      const updated = await editGuideAndResubmit(review.reviewID, steps)
      await loadContent()
      setValidatedEditing(null)
      setFeedback(prev => ({ ...prev, [review.reviewID]: { type: 'ok', msg: 'Saved and sent for vet re-validation.' } }))
    } catch (e: any) {
      setFeedback(prev => ({ ...prev, [review.reviewID]: { type: 'err', msg: 'Error: ' + e.message } }))
    } finally {
      setRevalidating(false)
    }
  }

  const counts = {
    all: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    validated: reviews.filter(r => r.status === 'validated').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
    published: reviews.filter(r => r.status === 'published').length,
  }

  // We want to allow the staff to filter the content reviews by their status using tabs (All, Pending, Validated, Rejected). 
  // The filtered variable computes the list of reviews to display based on the activeTab state. If "All" is selected, we show all reviews; otherwise, we filter by the selected status.
  const filtered = activeTab === 'all' ? reviews : reviews.filter(r => r.status === activeTab)

  // When the staff clicks on a content review in the list, we want to show its details in an expanded panel. The toggleExpanded function sets the expanded state to the reviewID of the clicked review, or collapses it if it's already expanded.
  const tabs = [
    { key: 'all' as const, label: 'All', count: counts.all },
    { key: 'pending' as const, label: 'Pending', count: counts.pending },
    { key: 'validated' as const, label: 'Validated', count: counts.validated },
    { key: 'rejected' as const, label: 'Rejected', count: counts.rejected },
    { key: 'published' as const, label: 'Published', count: counts.published },
  ]

  return (
    <DashboardLayout role="Staff" navItems={STAFF_NAV}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '22px' }}>🔬</span>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            Pending Review
          </h1>
        </div>
        <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
          Track validation status of your submitted guides. Edit and resubmit rejected content.
        </p>
      </div>

      {/* Validated banner — ready to publish */}
      {counts.validated > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: '8px', padding: '12px 16px', marginBottom: '12px',
        }}>
          <span style={{ fontSize: '18px' }}>✅</span>
          <p style={{ fontSize: '14px', color: '#166534', margin: 0, fontWeight: '500' }}>
            <strong>{counts.validated} item{counts.validated !== 1 ? 's' : ''}</strong> validated by the vet and ready to publish.
          </p>
        </div>
      )}

      {/* Rejected banner */}
      {counts.rejected > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          backgroundColor: '#fff1f2', border: '1px solid #fecdd3',
          borderRadius: '8px', padding: '12px 16px', marginBottom: '24px',
        }}>
          <span style={{ fontSize: '18px' }}>✖️</span>
          <p style={{ fontSize: '14px', color: '#9f1239', margin: 0, fontWeight: '500' }}>
            <strong>{counts.rejected} item{counts.rejected !== 1 ? 's' : ''}</strong> were rejected by the vet and need revision.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #dc2626' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === tab.key ? '#dc2626' : '#6b7280',
              cursor: 'pointer',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
            <span style={{
              marginLeft: '6px',
              fontSize: '11px',
              fontWeight: '700',
              padding: '1px 6px',
              borderRadius: '999px',
              backgroundColor: activeTab === tab.key ? '#fef2f2' : '#f3f4f6',
              color: activeTab === tab.key ? '#dc2626' : '#9ca3af',
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Loading your content…</p>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 20px',
          backgroundColor: 'white', borderRadius: '8px',
          border: '1px solid #e5e7eb', color: '#9ca3af',
        }}>
          <p style={{ fontSize: '28px', margin: '0 0 8px' }}>📭</p>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 2px' }}>
            Nothing here yet
          </p>
          <p style={{ fontSize: '13px', margin: 0 }}>No content in this category.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((review, idx) => {
            const content = (review as any).first_aid_content
            const guides = (review as any).guide ?? []
            const quizzes = (review as any).quiz ?? []
            const videos = (review as any).educational_video ?? []
            const contentType = guides.length > 0 ? 'Guide' : quizzes.length > 0 ? 'Quiz' : videos.length > 0 ? 'Video' : null
            const meta = STATUS_META[review.status] ?? STATUS_META.pending
            const isOpen = expanded === review.reviewID
            const isEditing = editing === review.reviewID
            const draft = drafts[review.reviewID]
            const fb = feedback[review.reviewID]
            const isRejected = review.status === 'rejected'
            const isValidated = review.status === 'validated'
            const isValidatedEdit = validatedEditing === review.reviewID
            const vsteps = validatedSteps[review.reviewID] ?? []

            return (
              <div
                key={review.reviewID || `review-${idx}`}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: `1px solid ${isRejected ? '#fecdd3' : isValidated ? '#bbf7d0' : '#e5e7eb'}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                }}
              >
                {/* Card row */}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* Category + status badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {CATEGORY_ICON[content?.emergencyCategory] ?? '📄'} {content?.emergencyCategory}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          fontSize: '11px', fontWeight: '600',
                          padding: '2px 8px', borderRadius: '999px',
                          backgroundColor: meta.bg, color: meta.text,
                          border: `1px solid ${meta.border}`,
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: meta.dot, display: 'inline-block' }} />
                          {meta.label}
                        </span>
                      </div>

                      {/* Title */}
                      <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 4px' }}>
                        {content?.petType} — {content?.emergencyCategory}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        {contentType && (
                          <span style={{
                            fontSize: '10px', fontWeight: '700', padding: '2px 7px',
                            borderRadius: '999px',
                            backgroundColor: contentType === 'Guide' ? '#dbeafe' : contentType === 'Quiz' ? '#ede9fe' : '#ffedd5',
                            color: contentType === 'Guide' ? '#1d4ed8' : contentType === 'Quiz' ? '#6d28d9' : '#c2410c',
                          }}>
                            {contentType === 'Guide' ? '📋' : contentType === 'Quiz' ? '🧠' : '🎬'} {contentType}
                          </span>
                        )}
                        {(guides[0]?.title || quizzes[0]?.title || videos[0]?.title) && (
                          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                            {guides[0]?.title ?? quizzes[0]?.title ?? videos[0]?.title}
                          </p>
                        )}
                      </div>

                      {/* Date */}
                      {review.reviewedDate && (
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                          Reviewed: {new Date(review.reviewedDate).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : review.reviewID)}
                      style={{
                        flexShrink: 0,
                        padding: '6px 14px',
                        fontSize: '12px', fontWeight: '600',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#374151',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isOpen ? 'Collapse ▲' : 'Details ▼'}
                    </button>
                  </div>
                </div>

                {/* Expanded panel */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #f3f4f6' }}>

                    {/* Guide Steps — read-only view (or edit form if rejected+editing) */}
                    <div style={{ padding: '16px 20px', backgroundColor: '#fafafa' }}>
                      {!isEditing ? (
                        <>
                          {/* Guide Steps */}
                          {guides.length > 0 && (
                            <>
                              <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                📋 Guide Steps
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                                {guides.map((g: any, gi: number) => (
                                  <div key={g.guideID ?? `guide-${gi}`} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <span style={{
                                      width: '22px', height: '22px', borderRadius: '50%',
                                      backgroundColor: '#dbeafe', color: '#1d4ed8',
                                      fontSize: '11px', fontWeight: '700',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      flexShrink: 0, marginTop: '1px',
                                    }}>
                                      {g.stepNumber}
                                    </span>
                                    <div>
                                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: '0 0 2px' }}>{g.title}</p>
                                      <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.6' }}>{g.instruction}</p>
                                      {g.videoUrl && (
                                        <a href={g.videoUrl} target="_blank" rel="noopener noreferrer"
                                          style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px', display: 'inline-block' }}>
                                          Watch demo ↗
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          {/* Educational Videos */}
                          {videos.length > 0 && (
                            <>
                              <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                🎬 Educational Videos
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                                {videos.map((v: any, vi: number) => (
                                  <div key={v.videoID ?? `video-${vi}`} style={{
                                    backgroundColor: '#fff7ed', border: '1px solid #fed7aa',
                                    borderRadius: '6px', padding: '12px',
                                  }}>
                                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>{v.title}</p>
                                    {v.description && (
                                      <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 6px', lineHeight: '1.6' }}>{v.description}</p>
                                    )}
                                    {v.videoUrl && (
                                      <a href={v.videoUrl} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: '12px', color: '#3b82f6' }}>
                                        Watch video ↗
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          {/* Quiz */}
                          {quizzes.length > 0 && (
                            <>
                              <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                🧠 Quiz
                              </p>
                              {quizzes.map((q: any, qi: number) => (
                                <div key={q.quizID ?? `quiz-${qi}`} style={{ marginBottom: '12px' }}>
                                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: '0 0 10px' }}>{q.title}</p>
                                  {(q.questions ?? []).map((ques: any, quesI: number) => (
                                    <div key={quesI} style={{ marginBottom: '14px' }}>
                                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 6px' }}>
                                        {quesI + 1}. {ques.question}
                                      </p>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        {(ques.options ?? []).map((opt: string, optI: number) => (
                                          <div key={optI} style={{
                                            fontSize: '13px', padding: '7px 12px',
                                            borderRadius: '5px', border: '1px solid',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            backgroundColor: optI === ques.answer ? '#f0fdf4' : 'white',
                                            borderColor: optI === ques.answer ? '#86efac' : '#e5e7eb',
                                            color: optI === ques.answer ? '#166534' : '#374151',
                                            fontWeight: optI === ques.answer ? '600' : '400',
                                          }}>
                                            <span>{opt}</span>
                                            {optI === ques.answer && (
                                              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700' }}>✓ Correct</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </>
                          )}

                          {/* Fallback if nothing */}
                          {guides.length === 0 && videos.length === 0 && quizzes.length === 0 && (
                            <p style={{ fontSize: '13px', color: '#9ca3af' }}>No content attached.</p>
                          )}
                        </>
                      ) : (
                        /* Edit form — only for rejected */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <p style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            ✏️ Editing Guide (Step 1)
                          </p>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                              Title
                            </label>
                            <input
                              type="text"
                              value={draft?.title ?? ''}
                              onChange={e => setDrafts(prev => ({ ...prev, [review.reviewID]: { ...prev[review.reviewID], title: e.target.value } }))}
                              style={{
                                width: '100%', fontSize: '13px',
                                padding: '8px 12px', border: '1px solid #d1d5db',
                                borderRadius: '4px', outline: 'none', boxSizing: 'border-box',
                                color: '#111827', backgroundColor: 'white',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                              Instruction
                            </label>
                            <textarea
                              rows={4}
                              value={draft?.instruction ?? ''}
                              onChange={e => setDrafts(prev => ({ ...prev, [review.reviewID]: { ...prev[review.reviewID], instruction: e.target.value } }))}
                              style={{
                                width: '100%', fontSize: '13px',
                                padding: '8px 12px', border: '1px solid #d1d5db',
                                borderRadius: '4px', outline: 'none',
                                resize: 'vertical', boxSizing: 'border-box',
                                color: '#111827', backgroundColor: 'white',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Vet comment — shown whenever there's one */}
                    {review.comment && (
                      <div style={{
                        padding: '14px 20px',
                        borderTop: '1px solid #f3f4f6',
                        backgroundColor: isRejected ? '#fff1f2' : '#f0fdf4',
                      }}>
                        <p style={{
                          fontSize: '11px', fontWeight: '700',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          color: isRejected ? '#dc2626' : '#16a34a',
                          margin: '0 0 6px',
                        }}>
                          🔬 Vet's Comment
                        </p>
                        <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.6', fontStyle: 'italic' }}>
                          "{review.comment}"
                        </p>
                      </div>
                    )}

                    {/* Action row — publish + edit for validated */}
                    {isValidated && !isValidatedEdit && (
                      <div style={{ padding: '14px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handlePublish(review)}
                          disabled={publishing === review.reviewID}
                          style={{
                            padding: '9px 20px',
                            backgroundColor: '#1d4ed8', color: 'white',
                            border: 'none', borderRadius: '4px',
                            fontSize: '13px', fontWeight: '700',
                            cursor: publishing === review.reviewID ? 'not-allowed' : 'pointer',
                            opacity: publishing === review.reviewID ? 0.6 : 1,
                          }}
                        >
                          {publishing === review.reviewID ? 'Posting…' : '📢 Post to Dashboard'}
                        </button>
                        {guides.length > 0 && (
                          <button
                            onClick={() => startValidatedEdit(review)}
                            style={{
                              padding: '9px 20px',
                              backgroundColor: 'white', color: '#374151',
                              border: '1px solid #d1d5db', borderRadius: '4px',
                              fontSize: '13px', fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            ✏️ Edit
                          </button>
                        )}
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                          Edit will send the content back for vet re-validation.
                        </p>
                      </div>
                    )}

                    {/* Edit form for validated guide content */}
                    {isValidated && isValidatedEdit && (
                      <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 20px', backgroundColor: '#fafafa' }}>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          ✏️ Edit Guide Steps
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                          {vsteps.map((step, si) => (
                            <div key={step.guideID} style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px' }}>
                              <p style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', margin: '0 0 10px' }}>Step {si + 1}</p>
                              <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Title</label>
                                <input
                                  type="text"
                                  value={step.title}
                                  onChange={e => setValidatedSteps(prev => ({
                                    ...prev,
                                    [review.reviewID]: prev[review.reviewID].map((s, i) => i === si ? { ...s, title: e.target.value } : s),
                                  }))}
                                  style={{ width: '100%', fontSize: '13px', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box', color: '#111827' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Instruction</label>
                                <textarea
                                  rows={3}
                                  value={step.instruction}
                                  onChange={e => setValidatedSteps(prev => ({
                                    ...prev,
                                    [review.reviewID]: prev[review.reviewID].map((s, i) => i === si ? { ...s, instruction: e.target.value } : s),
                                  }))}
                                  style={{ width: '100%', fontSize: '13px', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: '4px', resize: 'vertical', boxSizing: 'border-box', color: '#111827' }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleSaveAndRevalidate(review)}
                            disabled={revalidating || vsteps.some(s => !s.title.trim() || !s.instruction.trim())}
                            style={{
                              padding: '9px 20px',
                              backgroundColor: '#16a34a', color: 'white',
                              border: 'none', borderRadius: '4px',
                              fontSize: '13px', fontWeight: '700',
                              cursor: revalidating ? 'not-allowed' : 'pointer',
                              opacity: revalidating ? 0.6 : 1,
                            }}
                          >
                            {revalidating ? 'Saving…' : '📤 Save & Send for Re-validation'}
                          </button>
                          <button
                            onClick={() => setValidatedEditing(null)}
                            style={{
                              padding: '9px 14px',
                              backgroundColor: 'transparent', color: '#6b7280',
                              border: '1px solid #e5e7eb', borderRadius: '4px',
                              fontSize: '13px', cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action row — only for rejected */}
                    {isRejected && (
                      <div style={{ padding: '14px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {!isEditing ? (
                          <button
                            onClick={() => startEdit(review)}
                            style={{
                              padding: '9px 20px',
                              backgroundColor: '#dc2626', color: 'white',
                              border: 'none', borderRadius: '4px',
                              fontSize: '13px', fontWeight: '700',
                              cursor: 'pointer',
                            }}
                          >
                            ✏️ Edit & Resubmit
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleResubmit(review)}
                              disabled={submitting || !draft?.title.trim() || !draft?.instruction.trim()}
                              style={{
                                padding: '9px 20px',
                                backgroundColor: '#16a34a', color: 'white',
                                border: 'none', borderRadius: '4px',
                                fontSize: '13px', fontWeight: '700',
                                cursor: 'pointer', opacity: submitting ? 0.5 : 1,
                              }}
                            >
                              {submitting ? 'Resubmitting…' : '📤 Resubmit for Review'}
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              style={{
                                padding: '9px 14px',
                                backgroundColor: 'transparent', color: '#6b7280',
                                border: '1px solid #e5e7eb', borderRadius: '4px',
                                fontSize: '13px', cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Feedback toast */}
                    {fb && (
                      <div style={{
                        padding: '10px 20px',
                        borderTop: '1px solid #f3f4f6',
                        backgroundColor: fb.type === 'ok' ? '#f0fdf4' : '#fff1f2',
                      }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', margin: 0, color: fb.type === 'ok' ? '#16a34a' : '#dc2626' }}>
                          {fb.msg}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
