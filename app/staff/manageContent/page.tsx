'use client'

import { useEffect, useState } from 'react'
import {
  createGuide,
  requestVetValidation,
  viewContentReview,
  updateGuide,
  type FirstAidContent,
  type Guide,
  type ContentReview,
} from '@/lib/content'

// Hardcoded vet list — replace with a real fetch from your users table
const VETS = [
  { vetID: 'vet-uuid-1', name: 'Dr. Sarah Lim' },
  { vetID: 'vet-uuid-2', name: 'Dr. James Tan' },
]

const PET_TYPES      = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other']
const CATEGORIES     = ['Choking', 'Bleeding', 'Burns', 'Fracture', 'Poisoning', 'Seizure']

type CreatedContent = {
  content: FirstAidContent
  guide:   Guide
}

export default function StaffContentPage() {
  // ── Step 1: Create guide ───────────────────────────────────────────────
  const [petType,           setPetType]           = useState('')
  const [emergencyCategory, setEmergencyCategory] = useState('')
  const [title,             setTitle]             = useState('')
  const [stepNumber,        setStepNumber]        = useState(1)
  const [instruction,       setInstruction]       = useState('')
  const [creating,          setCreating]          = useState(false)
  const [created,           setCreated]           = useState<CreatedContent | null>(null)

  // ── Step 2: Request validation ────────────────────────────────────────
  const [selectedVet,    setSelectedVet]    = useState('')
  const [requesting,     setRequesting]     = useState(false)
  const [reviewRecord,   setReviewRecord]   = useState<ContentReview | null>(null)

  // ── Step 3: View review + update guide ───────────────────────────────
  const [updatedTitle,       setUpdatedTitle]       = useState('')
  const [updatedInstruction, setUpdatedInstruction] = useState('')
  const [updating,           setUpdating]           = useState(false)

  const [feedback, setFeedback] = useState('')

  // Poll for review result once a request is made
  useEffect(() => {
    if (!created || reviewRecord?.status === 'validated' || reviewRecord?.status === 'rejected') return
    const interval = setInterval(async () => {
      const review = await viewContentReview(created.content.contentID)  // Staff.viewContentReview()
      if (review && review.status !== 'pending') {
        setReviewRecord(review)
        setUpdatedTitle(created.guide.title)
        setUpdatedInstruction(created.guide.instruction)
        clearInterval(interval)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [created, reviewRecord])

  // ── Handlers ──────────────────────────────────────────────────────────

  async function handleCreateGuide() {
    if (!petType || !emergencyCategory || !title || !instruction) return
    setCreating(true)
    setFeedback('')
    try {
      const result = await createGuide({          // Staff.createGuide()
        petType, emergencyCategory, title, stepNumber, instruction
      })
      setCreated(result)
      setFeedback('Guide saved successfully.')
    } catch (e: any) {
      setFeedback('Error: ' + e.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleRequestVetValidation() {
    if (!created || !selectedVet) return
    setRequesting(true)
    setFeedback('')
    try {
      const review = await requestVetValidation(    // Staff.requestVetValidation()
        created.content.contentID,
        selectedVet
      )
      setReviewRecord(review)
      setFeedback('Validation request sent to veterinarian.')
    } catch (e: any) {
      setFeedback('Error: ' + e.message)
    } finally {
      setRequesting(false)
    }
  }

  async function handleUpdateGuide() {
    if (!created || !updatedTitle || !updatedInstruction) return
    setUpdating(true)
    setFeedback('')
    try {
      await updateGuide(                          // Staff.updateGuide()
        created.guide.guideID,
        updatedTitle,
        updatedInstruction
      )
      setFeedback('Guide updated successfully.')
    } catch (e: any) {
      setFeedback('Error: ' + e.message)
    } finally {
      setUpdating(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">First-Aid Content Management</h1>

      {/* ── Step 1: Create Guide ── */}
      <Section
        step={1}
        title="Create Guide"
        done={!!created}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pet Type</label>
            <select
              value={petType}
              onChange={e => setPetType(e.target.value)}
              disabled={!!created}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
            >
              <option value="">Select…</option>
              {PET_TYPES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Category</label>
            <select
              value={emergencyCategory}
              onChange={e => setEmergencyCategory(e.target.value)}
              disabled={!!created}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
            >
              <option value="">Select…</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Guide Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={!!created}
            placeholder="e.g. How to handle a choking dog"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Step #</label>
            <input
              type="number"
              min={1}
              value={stepNumber}
              onChange={e => setStepNumber(Number(e.target.value))}
              disabled={!!created}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
            />
          </div>
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Instruction</label>
            <textarea
              rows={3}
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              disabled={!!created}
              placeholder="Describe the step…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
            />
          </div>
        </div>

        {!created && (
          <button
            onClick={handleCreateGuide}
            disabled={creating || !petType || !emergencyCategory || !title || !instruction}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium
              hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {creating ? 'Saving…' : 'Save Guide'}
          </button>
        )}

        {created && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✓ Guide saved — Content ID: <code className="font-mono text-xs">{created.content.contentID}</code>
            </p>
          </div>
        )}
      </Section>

      {/* ── Step 2: Request Vet Validation ── */}
      <Section
        step={2}
        title="Request Veterinarian Validation"
        done={!!reviewRecord}
        locked={!created}
      >
        <div className="flex gap-3">
          <select
            value={selectedVet}
            onChange={e => setSelectedVet(e.target.value)}
            disabled={!!reviewRecord}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          >
            <option value="">Select a veterinarian…</option>
            {VETS.map(v => <option key={v.vetID} value={v.vetID}>{v.name}</option>)}
          </select>

          {!reviewRecord && (
            <button
              onClick={handleRequestVetValidation}
              disabled={requesting || !selectedVet}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium
                hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {requesting ? 'Sending…' : 'Send for Validation'}
            </button>
          )}
        </div>

        {reviewRecord && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            {reviewRecord.status === 'pending' && (
              <p>⏳ Awaiting veterinarian review…</p>
            )}
            {reviewRecord.status === 'validated' && (
              <p>✓ Validated by veterinarian</p>
            )}
            {reviewRecord.status === 'rejected' && (
              <p>✗ Rejected — see comment below</p>
            )}
          </div>
        )}
      </Section>

      {/* ── Step 3: View Review + Update Guide ── */}
      {reviewRecord && reviewRecord.status !== 'pending' && (
        <Section
          step={3}
          title="View Review & Update Guide"
          done={false}
          locked={false}
        >
          {/* Vet comment */}
          <div className={`rounded-lg p-4 border mb-4 ${
            reviewRecord.status === 'validated'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1
              ${reviewRecord.status === 'validated' ? 'text-green-700' : 'text-red-700'}">
              Veterinarian {reviewRecord.status === 'validated' ? 'Validated' : 'Rejected'}
            </p>
            {reviewRecord.comment && (
              <p className="text-sm text-gray-800">{reviewRecord.comment}</p>
            )}
            {reviewRecord.reviewedDate && (
              <p className="text-xs text-gray-500 mt-1">
                {new Date(reviewRecord.reviewedDate).toLocaleString()}
              </p>
            )}
          </div>

          {/* Update guide form */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Updated Title</label>
              <input
                type="text"
                value={updatedTitle}
                onChange={e => setUpdatedTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Updated Instruction</label>
              <textarea
                rows={4}
                value={updatedInstruction}
                onChange={e => setUpdatedInstruction(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              onClick={handleUpdateGuide}
              disabled={updating}
              className="bg-gray-800 text-white px-6 py-2 rounded-lg text-sm font-medium
                hover:bg-gray-900 disabled:opacity-40 transition-colors"
            >
              {updating ? 'Updating…' : 'Update Guide'}
            </button>
          </div>
        </Section>
      )}

      {/* Global feedback */}
      {feedback && (
        <p className={`mt-6 text-sm font-medium ${feedback.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {feedback}
        </p>
      )}
    </div>
  )
}

// ── Helper component ──────────────────────────────────────────────────────
function Section({
  step, title, done, locked = false, children
}: {
  step: number; title: string; done: boolean; locked?: boolean; children: React.ReactNode
}) {
  return (
    <div className={`mb-6 rounded-2xl border p-6 bg-white shadow-sm transition-opacity ${locked ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
          ${done ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-700'}`}>
          {done ? '✓' : step}
        </span>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  )
}
