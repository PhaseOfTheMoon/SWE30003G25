'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/app/components/dashboardLayout'
import supabase from '@/lib/supabase'
import {
  createFirstAidContent,
  createGuide,
  createEducationalVideo,
  createQuiz,
  requestVetValidation,
  viewContentReview,
  updateGuide,
  updateEducationalVideo,
  updateQuiz,
  type FirstAidContent,
  type Guide,
  type EducationalVideo,
  type Quiz,
  type QuizQuestion,
  type ContentReview,
} from '@/lib/content'
import { STAFF_NAV } from '@/app/components/sidebar'

// Defines pet types and emergency categories as constants for dropdown selection in the form. 
// In a real application, these might be fetched from the database or defined in a shared config file. (WC)
const PET_TYPES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Small Pets']
const CATEGORIES = ['Choking', 'Bleeding', 'Burns', 'Fracture', 'Poisoning', 'Seizure']

type ContentType = 'guide' | 'video' | 'quiz'

// In a real application, we would likely want to define these types in a shared file and import them where needed, 
// but for simplicity we will define them here. (WC)
type GuideStep = {
  stepNumber: number
  instruction: string
  videoUrl: string
}

const INPUT_CLS =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 ' +
  'placeholder:text-gray-400'

type Vet = { vetID: string; name: string }

export default function StaffContentPage() {

  // Auth
  const [staffUserID, setStaffUserID] = useState<string | null>(null)

  // Vets list (fetched from database)
  const [vets, setVets] = useState<Vet[]>([])

  useEffect(() => {
    async function init() {
      // Get logged-in staff's auth uuid
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setStaffUserID(user.id)

      // Fetch all vets joined with their profile name (WC)
      const { data, error } = await supabase
        .from('veterinarian')
        .select('id, profiles!veterinarian_id_fkey(name)')
      console.log('vets data:', data, 'error:', error)

      if (!error && data) {
        setVets(data.map((v: any) => ({
          vetID: v.id,
          name: v.profiles?.name ?? 'Unknown Vet',
        })))
      }
    }
    init()
  }, [])

  const [petType, setPetType] = useState('')
  const [emergencyCategory, setEmergencyCategory] = useState('')
  const [creatingContent, setCreatingContent] = useState(false)
  const [content, setContent] = useState<FirstAidContent | null>(null)

  const [contentType, setContentType] = useState<ContentType | null>(null)
  const [savingType, setSavingType] = useState(false)
  const [savedGuides, setSavedGuides] = useState<Guide[]>([])
  const [savedVideo, setSavedVideo] = useState<EducationalVideo | null>(null)
  const [savedQuiz, setSavedQuiz] = useState<Quiz | null>(null)

  // guide 
  const [guideTitle, setGuideTitle] = useState('')
  const [steps, setSteps] = useState<GuideStep[]>([
    { stepNumber: 1, instruction: '', videoUrl: '' },
  ])

  // video
  const [videoTitle, setVideoTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoDesc, setVideoDesc] = useState('')

  // quiz
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { question: '', options: ['', '', '', ''], answer: '' },
  ])
  // Track correct answer by index in UI; converted to text on save 
  const [answerIndexes, setAnswerIndexes] = useState<number[]>([-1])

  // Step 3
  const [selectedVet, setSelectedVet] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [reviewRecord, setReviewRecord] = useState<ContentReview | null>(null)

  // Step 4
  const [updTitle, setUpdTitle] = useState('')
  const [updBody, setUpdBody] = useState('')
  const [updVideoUrl, setUpdVideoUrl] = useState('')
  const [updating, setUpdating] = useState(false)

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  const typeSaved = !!(savedGuides.length || savedVideo || savedQuiz)

  // Auto-refresh review status every 5 seconds if pending (WC)
  useEffect(() => {
    if (!content || !reviewRecord || reviewRecord.status !== 'pending') return
    const id = setInterval(async () => {
      const review = await viewContentReview(content.contentID)
      if (review && review.status !== 'pending') {
        setReviewRecord(review)
        clearInterval(id)
        if (savedGuides.length) { setUpdTitle(savedGuides[0].title); setUpdBody(savedGuides[0].instruction); setUpdVideoUrl(savedGuides[0].videoUrl ?? '') }
        if (savedVideo) { setUpdTitle(savedVideo.title); setUpdBody(savedVideo.description ?? ''); setUpdVideoUrl(savedVideo.videoUrl) }
        if (savedQuiz) { setUpdTitle(savedQuiz.title) }
      }
    }, 5000)
    return () => clearInterval(id)
  }, [content, reviewRecord, savedGuides, savedVideo, savedQuiz])

  // handlers for creating content record, saving guide/video/quiz, requesting validation, updating content, etc. 
  // Each handler manages its own loading state and feedback messages for success/error. In a real application, we would likely want to add more robust error handling and validation, 
  // but for simplicity we will just check that required fields are filled in before allowing actions. (WC)
  async function handleCreateContent() {
    if (!petType || !emergencyCategory || !staffUserID) return
    setCreatingContent(true); setFeedback(null)
    try {
      const result = await createFirstAidContent({ staffID: staffUserID, petType, emergencyCategory })
      setContent(result)
      setFeedback({ msg: 'Content record created.', ok: true })
    } catch (e: any) { setFeedback({ msg: 'Error: ' + e.message, ok: false }) }
    finally { setCreatingContent(false) }
  }

  // handlers for saving guide, video, quiz (WC)
  async function handleSaveGuide() {
    if (!content || !guideTitle || steps.some(s => !s.instruction)) return
    setSavingType(true); setFeedback(null)
    try {
      const saved: Guide[] = []
      for (const step of steps) {
        const guide = await createGuide({
          contentID: content.contentID, title: guideTitle,
          stepNumber: step.stepNumber, instruction: step.instruction,
          videoUrl: step.videoUrl || undefined,
        })
        saved.push(guide)
      }
      setSavedGuides(saved)
      setFeedback({ msg: `Guide saved — ${saved.length} step${saved.length > 1 ? 's' : ''}.`, ok: true })
    } catch (e: any) { setFeedback({ msg: 'Error: ' + e.message, ok: false }) }
    finally { setSavingType(false) }
  }

  // since we only allow creating one type of content per record, the guide and video handlers are mutually exclusive, 
  // so we can store the saved video/guide directly without needing an array (WC)
  async function handleSaveVideo() {
    if (!content || !videoTitle || !videoUrl) return
    setSavingType(true); setFeedback(null)
    try {
      const vid = await createEducationalVideo({ contentID: content.contentID, title: videoTitle, videoUrl, description: videoDesc })
      setSavedVideo(vid)
      setFeedback({ msg: 'Educational video saved.', ok: true })
    } catch (e: any) { setFeedback({ msg: 'Error: ' + e.message, ok: false }) }
    finally { setSavingType(false) }
  }

  // for quiz, we allow multiple questions but they belong to the same quiz record, so we can store the saved quiz directly without needing an array (WC)
  async function handleSaveQuiz() {
    if (!content || !quizTitle || questions.some(q => !q.question)) return
    if (questions.some(q => q.options.some(o => !o.trim()))) {
      setFeedback({ msg: 'All answer options must be filled in before saving.', ok: false })
      return
    }
    // in a real application, we would likely want to validate the quiz more thoroughly (e.g. at least 2 questions, each with 4 options, etc.) 
    // and provide a better UI for managing questions and options, but for simplicity we will just check that all fields are filled in before saving. (WC)
    setSavingType(true); setFeedback(null)
    try {
      // Convert answerIndex to answer text before saving
      const questionsWithAnswer = questions.map((q, i) => ({
        ...q,
        answer: answerIndexes[i] >= 0 ? q.options[answerIndexes[i]] : '',
      }))
      const quiz = await createQuiz({ contentID: content.contentID, title: quizTitle, questions: questionsWithAnswer, petType, emergencyCategory })
      setSavedQuiz(quiz)
      setFeedback({ msg: 'Quiz saved.', ok: true })
    } catch (e: any) { setFeedback({ msg: 'Error: ' + e.message, ok: false }) }
    finally { setSavingType(false) }
  }

  // handler for requesting vet validation. In a real application, we would likely want to allow the staff to send update requests after review as well, 
  // but for simplicity we will just implement the initial validation request here. (WC)
  async function handleRequestValidation() {
    if (!content || !selectedVet) return
    setRequesting(true); setFeedback(null)
    try {
      const review = await requestVetValidation(content.contentID, selectedVet)
      setReviewRecord(review)
      setFeedback({ msg: 'Validation request sent to veterinarian.', ok: true })
    } catch (e: any) { setFeedback({ msg: 'Error: ' + e.message, ok: false }) }
    finally { setRequesting(false) }
  }

  // for simplicity, the update handler can update the title and either guide steps or video description based on what content type was created. In a real application, 
  // we would likely want more granular update handlers and forms for each content type. (WC)
  async function handleUpdateContent() {
    if (!updTitle) return
    setUpdating(true); setFeedback(null)
    try {
      if (savedGuides.length) {
        await updateGuide(savedGuides[0].guideID, updTitle, updBody, updVideoUrl || undefined)
      } else if (savedVideo) {
        await updateEducationalVideo(savedVideo.videoID, updTitle, updVideoUrl, updBody)
      } else if (savedQuiz) {
        await updateQuiz(savedQuiz.quizID, updTitle, questions, petType, emergencyCategory)
      }
      setFeedback({ msg: 'Content updated successfully.', ok: true })
    } catch (e: any) { setFeedback({ msg: 'Error: ' + e.message, ok: false }) }
    finally { setUpdating(false) }
  }

  // step for guide form
  function updateStep(i: number, field: keyof GuideStep, value: string | number) {
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }
  function addStep() {
    setSteps(prev => [...prev, { stepNumber: prev.length + 1, instruction: '', videoUrl: '' }])
  }
  function removeStep(i: number) {
    setSteps(prev => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, stepNumber: idx + 1 })))
  }

  // quiz form handlers
  function updateQuestion(i: number, field: keyof QuizQuestion, value: any) {
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
  }
  function updateOption(qi: number, oi: number, value: string) {
    setQuestions(prev => prev.map((q, idx) =>
      idx === qi ? { ...q, options: q.options.map((o, j) => j === oi ? value : o) } : q))
  }
  function addQuestion() {
    setQuestions(prev => [...prev, { question: '', options: ['', '', '', ''], answer: '' }])
    setAnswerIndexes(prev => [...prev, -1])
  }
  function removeQuestion(i: number) {
    setQuestions(prev => prev.filter((_, idx) => idx !== i))
    setAnswerIndexes(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <DashboardLayout role="Staff" navItems={STAFF_NAV}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '22px' }}>📋</span>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Manage Content</h1>
          </div>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            Create first-aid guides, videos and quizzes, then send for vet validation.
          </p>
        </div>

        {/* Step 1 */}
        <Step step={1} title="Create first-aid content record" done={!!content}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Pet type">
              <Select value={petType} onChange={setPetType} disabled={!!content} options={PET_TYPES} />
            </Field>
            <Field label="Emergency category">
              <Select value={emergencyCategory} onChange={setEmergencyCategory} disabled={!!content} options={CATEGORIES} />
            </Field>
          </div>
          {!content && (
            <Btn className="mt-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateContent}
              disabled={creatingContent || !petType || !emergencyCategory}>
              {creatingContent ? 'Creating…' : 'Create record'}
            </Btn>
          )}
          {content && (
            <SavedBadge>
              Content ID: <code className="font-mono text-xs">{content.contentID}</code>
              &nbsp;—&nbsp;{content.petType} / {content.emergencyCategory}
            </SavedBadge>
          )}
        </Step>

        {/* Step 2 */}
        <Step step={2} title="Choose content type" done={typeSaved} locked={!content}>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {(['guide', 'video', 'quiz'] as ContentType[]).map(t => (
              <button key={t} onClick={() => !typeSaved && setContentType(t)} disabled={typeSaved}
                className={`rounded-xl border p-4 text-center transition-all disabled:pointer-events-none
                  ${contentType === t ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                <span className="text-2xl block mb-1">
                  {t === 'guide' ? '📋' : t === 'video' ? '🎬' : '❓'}
                </span>
                <p className="text-sm font-semibold text-gray-800">{t === 'video' ? 'Educational video' : t.charAt(0).toUpperCase() + t.slice(1)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t === 'guide' ? 'Step-by-step guide' : t === 'video' ? 'Video with description' : 'Knowledge check'}
                </p>
              </button>
            ))}
          </div>

          {/* Guide form */}
          {contentType === 'guide' && !typeSaved && (
            <div className="space-y-5">
              <Field label="Guide title">
                <input type="text" value={guideTitle} onChange={e => setGuideTitle(e.target.value)}
                  placeholder="e.g. How to handle a choking dog"
                  className={INPUT_CLS} />
              </Field>

              <div className="space-y-3">
                {steps.map((step, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100 border-b border-gray-200">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Step {step.stepNumber}</span>
                      {steps.length > 1 && (
                        <button type="button" onClick={() => removeStep(i)} className="text-xs text-red-400 hover:text-red-600 font-medium">
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <Field label="Instruction">
                        <textarea rows={3} value={step.instruction}
                          onChange={e => updateStep(i, 'instruction', e.target.value)}
                          placeholder="Describe what to do in this step…"
                          className={INPUT_CLS + ' resize-none'} />
                      </Field>
                      <Field label="Demo video URL (optional)">
                        <input type="text" value={step.videoUrl}
                          onChange={e => updateStep(i, 'videoUrl', e.target.value)}
                          placeholder="https://youtube.com/watch?v=…"
                          className={INPUT_CLS} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addStep} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                + Add step
              </button>

              <div>
                <Btn className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveGuide}
                  disabled={savingType || !guideTitle || steps.some(s => !s.instruction)}>
                  {savingType ? 'Saving…' : `Save guide (${steps.length} step${steps.length > 1 ? 's' : ''})`}
                </Btn>
              </div>
            </div>
          )}

          {/* Video form */}
          {contentType === 'video' && !typeSaved && (
            <div className="space-y-4">
              <Field label="Video title">
                <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)}
                  placeholder="e.g. Dog CPR technique" className={INPUT_CLS} />
              </Field>
              <Field label="Video URL">
                <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=…" className={INPUT_CLS} />
              </Field>
              <Field label="Description">
                <textarea rows={4} value={videoDesc} onChange={e => setVideoDesc(e.target.value)}
                  placeholder="What this video covers…" className={INPUT_CLS + ' resize-none'} />
              </Field>
              <Btn className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveVideo}
                disabled={savingType || !videoTitle || !videoUrl}>
                {savingType ? 'Saving…' : 'Save video'}
              </Btn>
            </div>
          )}

          {/* Quiz form */}
          {contentType === 'quiz' && !typeSaved && (
            <div className="space-y-4">
              <Field label="Quiz title">
                <input type="text" value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                  placeholder="e.g. Dog choking first-aid quiz" className={INPUT_CLS} />
              </Field>
              {questions.map((q, qi) => (
                <div key={qi} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100 border-b border-gray-200">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Question {qi + 1}</span>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => removeQuestion(qi)} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <input type="text" value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)}
                      placeholder="Enter question…" className={INPUT_CLS} />
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input type="radio" name={`q${qi}-answer`} checked={answerIndexes[qi] === oi}
                            onChange={() => setAnswerIndexes(prev => prev.map((v, idx) => idx === qi ? oi : v))}
                            className="w-4 h-4 shrink-0 text-blue-600" />
                          <input type="text" value={opt} onChange={e => updateOption(qi, oi, e.target.value)}
                            placeholder={`Option ${oi + 1}`} className={INPUT_CLS} />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">Select the radio button next to the correct answer.</p>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addQuestion} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add question</button>
              <div>
                <Btn className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveQuiz}
                  disabled={savingType || !quizTitle || questions.some(q => !q.question) || questions.some(q => q.options.some(o => !o.trim()))}>
                  {savingType ? 'Saving…' : 'Save quiz'}
                </Btn>
              </div>
            </div>
          )}

          {typeSaved && (
            <SavedBadge>
              {savedGuides.length > 0 && `Guide saved — ${savedGuides.length} step${savedGuides.length > 1 ? 's' : ''}`}
              {savedVideo && `Video saved — ID: ${savedVideo.videoID}`}
              {savedQuiz && `Quiz saved — ID: ${savedQuiz.quizID}`}
            </SavedBadge>
          )}
        </Step>

        {/* Step 3 */}
        <Step step={3} title="Request veterinarian validation" done={!!reviewRecord} locked={!typeSaved}>
          <div className="flex gap-3">
            <select
              value={selectedVet}
              onChange={e => setSelectedVet(e.target.value)}
              disabled={!!reviewRecord || vets.length === 0}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
            >
              <option value="">{vets.length === 0 ? 'Loading veterinarians…' : 'Select a veterinarian…'}</option>
              {vets.map(v => <option key={v.vetID} value={v.vetID}>{v.name}</option>)}
            </select>
            {!reviewRecord && (
              <Btn
                className="bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
                onClick={handleRequestValidation}
                disabled={requesting || !selectedVet || vets.length === 0}
              >
                {requesting ? 'Sending…' : 'Send for validation'}
              </Btn>
            )}
          </div>
          {reviewRecord?.status === 'pending' && (
            <p className="mt-3 text-sm text-blue-600">⏳ Awaiting veterinarian review… (auto-refreshes every 5 s)</p>
          )}
        </Step>

        {/* Step 4 */}
        {reviewRecord && reviewRecord.status !== 'pending' && (
          <Step step={4} title="View review & update content" done={false} locked={false}>
            <div className={`rounded-xl p-4 border mb-5 ${reviewRecord.status === 'validated' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${reviewRecord.status === 'validated' ? 'text-green-700' : 'text-red-700'}`}>
                Veterinarian {reviewRecord.status === 'validated' ? '✓ validated' : '✗ rejected'}
              </p>
              {reviewRecord.comment && <p className="text-sm text-gray-800">{reviewRecord.comment}</p>}
              {reviewRecord.reviewedDate && <p className="text-xs text-gray-500 mt-1">{new Date(reviewRecord.reviewedDate).toLocaleString()}</p>}
            </div>
            <div className="space-y-4">
              <Field label="Updated title">
                <input type="text" value={updTitle} onChange={e => setUpdTitle(e.target.value)} className={INPUT_CLS} />
              </Field>
              {(savedGuides.length > 0 || savedVideo) && (
                <Field label={savedGuides.length > 0 ? 'Updated instruction (step 1)' : 'Updated description'}>
                  <textarea rows={5} value={updBody} onChange={e => setUpdBody(e.target.value)} className={INPUT_CLS + ' resize-none'} />
                </Field>
              )}
              {(savedGuides.length > 0 || savedVideo) && (
                <Field label="Video URL">
                  <input type="text" value={updVideoUrl} onChange={e => setUpdVideoUrl(e.target.value)} className={INPUT_CLS} />
                </Field>
              )}
              <Btn className="bg-gray-900 hover:bg-black text-white" onClick={handleUpdateContent} disabled={updating || !updTitle}>
                {updating ? 'Updating…' : 'Update content'}
              </Btn>
            </div>
          </Step>
        )}

        {feedback && (
          <p className={`mt-4 text-sm font-medium ${feedback.ok ? 'text-green-600' : 'text-red-600'}`}>
            {feedback.ok ? '✓' : '✗'} {feedback.msg}
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}

// Reusable components for steps, fields, buttons, etc. (WC)
function Step({ step, title, done, locked = false, children }: {
  step: number; title: string; done: boolean; locked?: boolean; children: React.ReactNode
}) {
  return (
    <div className={`mb-5 rounded-2xl border p-6 bg-white shadow-sm transition-opacity ${locked ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex items-center gap-3 mb-5">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-700'}`}>
          {done ? '✓' : step}
        </span>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  )
}
// In a real application, we would likely want to create more reusable components for form fields, buttons, badges, etc. to keep the code DRY and maintainable, but for simplicity we will define them inline here. (WC)
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

// A simple select component that can be reused for pet type and emergency category selection. In a real application, we might want to create more customizable form components like this. (WC)
function Select({ value, onChange, disabled, options }: {
  value: string; onChange: (v: string) => void; disabled?: boolean; options: string[]
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100">
      <option value="">Select…</option>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  )
}

// A reusable button component that can be used for various actions like creating content, saving, requesting validation, etc. It accepts props for styling, click handler, and disabled state. (WC)
function Btn({ children, className = '', onClick, disabled }: {
  children: React.ReactNode; className?: string; onClick?: () => void; disabled?: boolean
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${className}`}>
      {children}
    </button>
  )
}

// A badge component to indicate saved content with a checkmark. It can be reused for showing the status of saved guides, videos, quizzes, etc. (WC)
function SavedBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-800">
      ✓ {children}
    </div>
  )
}
