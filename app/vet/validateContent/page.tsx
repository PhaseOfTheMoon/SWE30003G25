'use client'

import { useEffect, useState } from 'react'
import {
  viewPendingContent,
  validateContent,
  rejectContent,
  type ContentReview,
} from '@/lib/content'
import supabase from '@/lib/supabase'

export default function ValidateContentPage() {
  const [vetUserID, setVetUserID] = useState<string | null>(null)
  const [reviews, setReviews]       = useState<ContentReview[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<ContentReview | null>(null)
  const [comment, setComment]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback]     = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setVetUserID(user.id)
        loadPendingContent(user.id)
      }
    }
    init()
  }, [])

  async function loadPendingContent(vetID: string) {
    setLoading(true)
    try {
      const data = await viewPendingContent(vetID)
      setReviews(data)
    } catch (e: any) {
      console.error(e.message)
    } finally {
      setLoading(false)
    }
  }

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

  function updateReviewInList(updated: ContentReview) {
    setReviews(prev => prev.map(r => r.reviewID === updated.reviewID ? updated : r))
    setSelected(updated)
    setComment('')
  }

  const STATUS_STYLES: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-800',
    validated: 'bg-green-100  text-green-800',
    rejected:  'bg-red-100    text-red-800',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Validate Content</h1>

      <div className="flex gap-6">
        {/* ── Left: reviews list ── */}
        <div className="w-1/2 space-y-3">
          {loading && <p className="text-gray-500">Loading…</p>}

          {!loading && reviews.length === 0 && (
            <p className="text-gray-400">No content pending review.</p>
          )}

          {reviews.map((review, idx) => {
            const content = (review as any).first_aid_content
            const guide   = (review as any).guide?.[0]

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
                    {guide && (
                      <p className="text-sm text-gray-500 mt-0.5">{guide.title}</p>
                    )}
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

        {/* ── Right: review panel ── */}
        {selected && (
          <div className="w-1/2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5 self-start">
            {(() => {
              const content = (selected as any).first_aid_content
              const guides  = (selected as any).guide ?? []
              return (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {content?.petType} — {content?.emergencyCategory}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Content ID: <code className="font-mono">{selected.contentID}</code>
                    </p>
                  </div>

                  {guides.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Guide Steps</p>
                      {guides.map((g: any, gi: number) => (
                        <div key={g.guideID || `guide-${gi}`} className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs
                            font-bold flex items-center justify-center shrink-0">
                            {g.stepNumber}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{g.title}</p>
                            <p className="text-sm text-gray-600">{g.instruction}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}

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

            {feedback && (
              <p className={`text-sm font-medium ${feedback.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {feedback}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
