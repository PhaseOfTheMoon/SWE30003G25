'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboardLayout'
import {
  viewAllVetContent,
  validateContent,
  rejectContent,
  type ContentReview,
} from '@/lib/content'
import supabase from '@/lib/supabase'
import { VET_NAV } from '@/app/components/sidebar'

export default function ValidateContentPage() {
  return (
    <Suspense fallback={<ValidateContentFallback />}>
      <ValidateContentView />
    </Suspense>
  )
}

function ValidateContentFallback() {
  return (
    <DashboardLayout role="Veterinarian" name="Veterinarian" navItems={VET_NAV}>
      <p className="text-gray-500">Loading content validation...</p>
    </DashboardLayout>
  )
}

function ValidateContentView() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('status') ?? 'pending') as 'pending' | 'validated' | 'rejected'

  const [reviews, setReviews] = useState<ContentReview[]>([])
  const [tab, setTab] = useState<'pending' | 'validated' | 'rejected'>(initialTab)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ContentReview | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) loadPendingContent(data.user.id)
    })
  }, [])

  async function loadPendingContent(vetID: string) {
    setLoading(true)
    try {
      const data = await viewAllVetContent(vetID)
      console.log('RAW DATA:', JSON.stringify(data, null, 2))
      setReviews(data)
    } catch (e: any) {
      console.error(e.message)
      setFeedback('Error loading content: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // The filtered variable holds the list of content reviews that match the currently selected tab (pending, validated, or rejected). This allows the UI to display only the relevant reviews based on their status when a veterinarian clicks on the corresponding tab.
  const filtered = reviews.filter(r => r.status === tab)

  async function handleValidateContent() {
    if (!selected || !comment.trim()) return
    setSubmitting(true)
    setFeedback('')
    try {
      const updated = await validateContent(selected.reviewID, comment)
      updateReviewInList(updated)
      setFeedback('Content validated successfully.')
    } catch (e: any) {
      setFeedback('Error: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // The handleRejectContent function is called when a veterinarian chooses to reject a piece of content under review. 
  // It requires the veterinarian to provide a comment explaining the reason for rejection. The function then updates the content's status to "rejected" in the backend and provides feedback to the user about the action taken.
  async function handleRejectContent() {
    if (!selected || !comment.trim()) return
    setSubmitting(true)
    setFeedback('')
    try {
      const updated = await rejectContent(selected.reviewID, comment)
      updateReviewInList(updated)
      setFeedback('Content rejected. Staff will be notified.')
    } catch (e: any) {
      setFeedback('Error: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // The updateReviewInList function is a helper function that updates the state of the content reviews list after a review has been validated or rejected. 
  // It merges the updated review data returned from the API with the existing review in the state to ensure that any nested content details (like quiz questions or guide steps) are preserved while only the changed fields (status, comment, reviewedDate) are updated.
  function updateReviewInList(updated: ContentReview) {
    // The API returns a plain row without nested first_aid_content (quiz/video/guide).
    // Merge only the changed scalar fields into the existing record so the nested
    // content already in state is preserved.
    const merge = (existing: ContentReview): ContentReview => ({
      ...existing,
      status: updated.status,
      comment: updated.comment,
      reviewedDate: updated.reviewedDate,
    })

    setReviews(prev => prev.map(r => r.reviewID === updated.reviewID ? merge(r) : r))
    setSelected(prev => prev?.reviewID === updated.reviewID ? merge(prev) : prev)
    setComment('')
  }

  const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    validated: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  return (
    <DashboardLayout role="Veterinarian" name="Veterinarian" navItems={VET_NAV}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Validate Content</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['pending', 'validated', 'rejected'] as const).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => { setTab(s); setSelected(null) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
              ${tab === s
                ? s === 'pending' ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                : s === 'validated' ? 'bg-green-100  border-green-400  text-green-800'
                : 'bg-red-100 border-red-400 text-red-800'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 text-xs">({reviews.filter(r => r.status === s).length})</span>
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Left: reviews list */}
        <div className="w-1/2 space-y-3">
          {loading && <p className="text-gray-500">Loading…</p>}

          {!loading && filtered.length === 0 && (
            <p className="text-gray-400">No {tab} content.</p>
          )}

          {/* Review items */}
          {filtered.map((review, idx) => {
            const content = (review as any).first_aid_content
            const guides = content?.guide ?? []
            const quizzes = content?.quiz ?? []
            const videos  = content?.educational_video ?? []

            const typeBadges: { label: string; cls: string }[] = [
              ...(guides.length  > 0 ? [{ label: 'Guide', cls: 'bg-blue-50 text-blue-700' }] : []),
              ...(quizzes.length > 0 ? [{ label: 'Quiz',  cls: 'bg-purple-50 text-purple-700' }] : []),
              ...(videos.length  > 0 ? [{ label: 'Video', cls: 'bg-orange-50 text-orange-700' }] : []),
            ]

            const subtitles = [
              ...guides.map((g: any)  => g.title),
              ...quizzes.map((q: any) => q.title),
              ...videos.map((v: any)  => v.title),
            ].filter(Boolean)

            return (
              <button
                key={review.reviewID || `review-${idx}`}
                type="button"
                onClick={() => { setSelected(review); setFeedback('') }}
                className={`w-full text-left p-4 rounded-xl border transition-all
                  ${selected?.reviewID === review.reviewID
                    ? 'border-blue-500 bg-white shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {content?.petType} — {content?.emergencyCategory}
                    </p>
                    <div className="flex items-center flex-wrap gap-1.5 mt-1">
                      {typeBadges.map(b => (
                        <span key={b.label} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${b.cls}`}>
                          {b.label}
                        </span>
                      ))}
                      {subtitles.length > 0 && (
                        <p className="text-sm text-gray-500 truncate max-w-45">
                          {subtitles.join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[review.status]}`}>
                    {review.status}
                  </span>
                </div>
                {review.reviewedDate && (
                  <p className="text-xs text-gray-400 mt-2">
                    Reviewed: {new Date(review.reviewedDate).toLocaleString()}
                  </p>
                )}
              </button>
            )
          })}
        </div>

        {/* Right: review panel */}
        {selected && (
          <div className="w-1/2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5 self-start">
            {(() => {
              const content = (selected as any).first_aid_content
              const guides = content?.guide ?? []
              const quizzes = content?.quiz ?? []
              const videos  = content?.educational_video ?? []

              return (
                <>
                  {/* Header */}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {content?.petType} — {content?.emergencyCategory}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Content ID: <code className="font-mono">{selected.contentID}</code>
                    </p>
                  </div>

                  {/* Guide Steps */}
                  {guides.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span className="text-blue-600">📋</span> Guide Steps
                      </p>
                      {guides.map((g: any, gi: number) => (
                        <div key={g.guideID || `guide-${gi}`} className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs
                            font-bold flex items-center justify-center shrink-0">
                            {g.stepNumber}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{g.title}</p>
                            <p className="text-sm text-gray-600">{g.instruction}</p>
                            {g.videoUrl && (
                              <a
                                href={g.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 underline mt-1 inline-block"
                              >
                                Watch demo ↗
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Educational Videos */}
                  {videos.length > 0 && (
                    <div className="bg-orange-50 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span>🎬</span> Educational Videos
                      </p>
                      {videos.map((v: any, vi: number) => (
                        <div key={v.videoID || `video-${vi}`} className="bg-white rounded-lg p-3 border border-orange-100">
                          <p className="text-sm font-medium text-gray-800">{v.title}</p>
                          {v.description && (
                            <p className="text-sm text-gray-600 mt-1">{v.description}</p>
                          )}
                          {v.videoUrl && (
                            <a
                              href={v.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 underline mt-2 inline-block"
                            >
                              Watch video ↗
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quizzes */}
                  {quizzes.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-4 space-y-4">
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span>🧠</span> Quiz
                      </p>
                      {quizzes.map((q: any, qi: number) => (
                        <div key={q.quizID || `quiz-${qi}`}>
                          <p className="text-sm font-medium text-gray-800 mb-3">{q.title}</p>
                          {(q.questions ?? []).map((ques: any, quesI: number) => (
                            <div key={quesI} className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                {quesI + 1}. {ques.question}
                              </p>
                              <ul className="space-y-1.5">
                                {(ques.options ?? []).map((opt: string, optI: number) => (
                                  <li
                                    key={optI}
                                    className={`text-sm px-3 py-1.5 rounded-lg border flex items-center justify-between
                                      ${optI === ques.answer
                                        ? 'bg-green-50 border-green-300 text-green-800 font-medium'
                                        : 'bg-white border-gray-200 text-gray-600'}`}
                                  >
                                    <span>{opt}</span>
                                    {optI === ques.answer && (
                                      <span className="text-green-600 text-xs font-bold">✓ Correct</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No content warning */}
                  {guides.length === 0 && videos.length === 0 && quizzes.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No content attached to this review.</p>
                  )}
                </>
              )
            })()}

            {/* Review result (validated / rejected) */}
            {selected.status !== 'pending' && (
              <div className={`rounded-lg p-4 border
                ${selected.status === 'validated'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'}`}>
                <p className={`text-xs font-semibold mb-1
                  ${selected.status === 'validated' ? 'text-green-700' : 'text-red-700'}`}>
                  {selected.status === 'validated' ? '✓ You validated this content' : '✗ You rejected this content'}
                </p>
                {selected.comment && (
                  <p className="text-sm text-gray-800">{selected.comment}</p>
                )}
              </div>
            )}

            {/* Review actions (pending only) */}
            {selected.status === 'pending' && (
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Your Review Comment</p>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Add your veterinary feedback or notes…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none
                    focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleValidateContent}
                    disabled={!comment.trim() || submitting}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium
                      hover:bg-green-700 disabled:opacity-40 transition-colors"
                  >
                    {submitting ? 'Saving…' : '✓ Validate'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectContent}
                    disabled={!comment.trim() || submitting}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium
                      hover:bg-red-700 disabled:opacity-40 transition-colors"
                  >
                    {submitting ? 'Saving…' : '✗ Reject'}
                  </button>
                </div>
              </div>
            )}

            {/* Feedback message */}
            {feedback && (
              <p className={`text-sm font-medium ${feedback.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {feedback}
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
