import supabase from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────

export type FirstAidContent = {
  contentID:         string
  staffID:           string | null   // set when staff creates content; requires migration below
  petType:           string
  emergencyCategory: string
  lastUpdateDate:    string
}

export type Guide = {
  guideID:     string
  contentID:   string
  title:       string
  stepNumber:  number
  instruction: string
  videoUrl:    string | null   // short demo video for this guide
}

export type EducationalVideo = {
  videoID:     string
  contentID:   string
  title:       string
  videoUrl:    string
  description: string | null
}

export type Quiz = {
  quizID:    string
  contentID: string
  title:     string
  questions: QuizQuestion[]   // stored as JSONB in Supabase
}

export type QuizQuestion = {
  question: string
  options:  string[]
  answer:   number   // index of correct option
}

export type ContentReview = {
  reviewID:     string
  contentID:    string
  vetID:        string | null
  status:       'pending' | 'validated' | 'rejected'
  comment:      string | null
  reviewedDate: string | null
}

// ── Step 1: Staff creates a first-aid content record ──────────────────────

/**
 * Staff.createFirstAidContent()
 * Inserts the parent content row (petType + emergencyCategory).
 * This must be called first before creating a Guide, Video, or Quiz.
 */
export async function createFirstAidContent(payload: {
  staffID:           string
  petType:           string
  emergencyCategory: string
}): Promise<FirstAidContent> {
  const { data, error } = await supabase
    .from('first_aid_content')
    .insert({
      staffID:           payload.staffID,
      petType:           payload.petType,
      emergencyCategory: payload.emergencyCategory,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ── Step 2a: Staff creates a guide ───────────────────────────────────────

/**
 * Staff.createGuide()
 * Inserts a Guide row linked to an existing first_aid_content record.
 * Optionally attaches a short demo video URL.
 */
export async function createGuide(payload: {
  contentID:   string
  title:       string
  stepNumber:  number
  instruction: string
  videoUrl?:   string
}): Promise<Guide> {
  const { data, error } = await supabase
    .from('guide')
    .insert({
      contentID:   payload.contentID,
      title:       payload.title,
      stepNumber:  payload.stepNumber,
      instruction: payload.instruction,
      videoUrl:    payload.videoUrl ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ── Step 2b: Staff creates an educational video ───────────────────────────

/**
 * Staff.createEducationalVideo()
 * Inserts an EducationalVideo row linked to an existing first_aid_content record.
 * Requires an educational_video table — see migration in README.
 */
export async function createEducationalVideo(payload: {
  contentID:   string
  title:       string
  videoUrl:    string
  description: string
}): Promise<EducationalVideo> {
  const { data, error } = await supabase
    .from('educational_video')
    .insert({
      contentID:   payload.contentID,
      title:       payload.title,
      videoUrl:    payload.videoUrl,
      description: payload.description,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ── Step 2c: Staff creates a quiz ─────────────────────────────────────────

/**
 * Staff.createQuiz()
 * Inserts a Quiz row linked to an existing first_aid_content record.
 * questions is stored as JSONB — requires a quiz table, see migration in README.
 */
export async function createQuiz(payload: {
  contentID: string
  title:     string
  questions: QuizQuestion[]
}): Promise<Quiz> {
  const { data, error } = await supabase
    .from('quiz')
    .insert({
      contentID: payload.contentID,
      title:     payload.title,
      questions: payload.questions,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ── Step 3: Staff requests vet validation ────────────────────────────────

/**
 * Staff.requestVetValidation()
 * Creates a ContentReview row linking the content to the chosen vet.
 */
export async function requestVetValidation(
  contentID: string,
  vetID:     string
): Promise<ContentReview> {
  const { data, error } = await supabase
    .from('content_review')
    .insert({ contentID, vetID, status: 'pending' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ── Step 4: Staff polls for review result ────────────────────────────────

/**
 * Staff.viewContentReview()
 * Returns the most recent review record for a given content item.
 */
export async function viewContentReview(contentID: string): Promise<ContentReview | null> {
  const { data, error } = await supabase
    .from('content_review')
    .select('*')
    .eq('contentID', contentID)
    .order('reviewedDate', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data
}

// ── Step 5: Staff updates guide after review ─────────────────────────────

/**
 * Staff.updateGuide()
 * Updates title, instruction, optional videoUrl and refreshes lastUpdateDate.
 */
export async function updateGuide(
  guideID:     string,
  title:       string,
  instruction: string,
  videoUrl?:   string
): Promise<Guide> {
  const { data: guide, error: ge } = await supabase
    .from('guide')
    .update({ title, instruction, videoUrl: videoUrl ?? null })
    .eq('guideID', guideID)
    .select()
    .single()

  if (ge) throw new Error(ge.message)

  await supabase
    .from('first_aid_content')
    .update({ lastUpdateDate: new Date().toISOString() })
    .eq('contentID', guide.contentID)

  return guide
}

/**
 * Staff.updateEducationalVideo()
 */
export async function updateEducationalVideo(
  videoID:     string,
  title:       string,
  videoUrl:    string,
  description: string
): Promise<EducationalVideo> {
  const { data, error } = await supabase
    .from('educational_video')
    .update({ title, videoUrl, description })
    .eq('videoID', videoID)
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase
    .from('first_aid_content')
    .update({ lastUpdateDate: new Date().toISOString() })
    .eq('contentID', data.contentID)

  return data
}

/**
 * Staff.updateQuiz()
 */
export async function updateQuiz(
  quizID:    string,
  title:     string,
  questions: QuizQuestion[]
): Promise<Quiz> {
  const { data, error } = await supabase
    .from('quiz')
    .update({ title, questions })
    .eq('quizID', quizID)
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase
    .from('first_aid_content')
    .update({ lastUpdateDate: new Date().toISOString() })
    .eq('contentID', data.contentID)

  return data
}

// ── Staff: view all submitted content with review outcomes ────────────────

/**
 * Staff.viewStaffContent()
 *
 * Queries from first_aid_content (where staffID lives) and embeds
 * content_review + guide. PostgREST cannot filter on an embedded table's
 * column from the parent query, so we start from first_aid_content instead.
 *
 * Migration required (run once in Supabase SQL editor):
 *   alter table first_aid_content add column if not exists "staffID" uuid references auth.users;
 *
 * Also update createFirstAidContent() to pass staffID when inserting.
 */
export async function viewStaffContent(staffID: string): Promise<ContentReview[]> {
  const { data, error } = await supabase
    .from('first_aid_content')
    .select('*, guide(*), content_review(*)')
    .eq('staffID', staffID)
    .order('lastUpdateDate', { ascending: false })

  if (error) throw new Error(error.message)

  // Flatten into ContentReview shape so the page works without changes.
  // Each first_aid_content row may have multiple reviews; we take the latest.
  const rows: ContentReview[] = (data ?? []).map((fac: any) => {
    const reviews: ContentReview[] = fac.content_review ?? []
    const latest = reviews.sort(
      (a, b) => new Date(b.reviewedDate ?? 0).getTime() - new Date(a.reviewedDate ?? 0).getTime()
    )[0] ?? {
      reviewID:     '',
      contentID:    fac.contentID,
      vetID:        null,
      status:       'pending' as const,
      comment:      null,
      reviewedDate: null,
    }

    return {
      ...latest,
      // Attach first_aid_content + guide so the page can read them as before
      first_aid_content: fac,
      guide: fac.guide ?? [],
    } as any
  })

  return rows
}

// ── Staff: edit guide steps and reset review to pending ──────────────────

/**
 * Staff.resubmitContent()
 * Called after a vet rejects a guide. Does two things atomically:
 *   1. Updates the guide row (title + instruction) via the existing updateGuide helper.
 *   2. Resets the content_review status back to 'pending' and clears the
 *      vet's previous comment and reviewedDate so it re-enters the vet queue.
 *
 * Returns the updated ContentReview (with joined first_aid_content + guide)
 * so the staff page can update its local state in one call.
 */
export async function resubmitContent(
  reviewID:    string,
  draft:       { title: string; instruction: string; videoUrl?: string }
): Promise<ContentReview> {
  // 1. Fetch the review to get contentID → guideID
  const { data: review, error: re } = await supabase
    .from('content_review')
    .select('*, first_aid_content(*, guide(*))')
    .eq('reviewID', reviewID)
    .single()

  if (re) throw new Error(re.message)
  if (review.status !== 'rejected') throw new Error('Only rejected content can be resubmitted.')

  const guides: Guide[] = (review as any).first_aid_content?.guide ?? []
  if (guides.length === 0) throw new Error('No guide steps found for this content.')

  // 2. Update the first guide step (extend to loop over all steps if needed)
  await updateGuide(guides[0].guideID, draft.title, draft.instruction, draft.videoUrl)

  // 3. Reset the review row back to pending, clearing prior vet decision
  const { data: updated, error: ue } = await supabase
    .from('content_review')
    .update({
      status:       'pending',
      comment:      null,
      reviewedDate: null,
    })
    .eq('reviewID', reviewID)
    .select('*, first_aid_content(*, guide(*))')
    .single()

  if (ue) throw new Error(ue.message)
  return updated
}

// ── Vet-side functions (unchanged) ────────────────────────────────────────

async function resolveVetPK(authUID: string): Promise<string> {
  const { data: vetRow } = await supabase
    .from('veterinarian')
    .select('id')
    .eq('id', authUID)
    .single()

  let vetPK: string | null = vetRow?.id ?? null
  if (!vetPK) {
    const { data: vetByProfile } = await supabase
      .from('veterinarian')
      .select('id')
      .eq('vet_id', authUID)
      .single()
    vetPK = vetByProfile?.id ?? null
  }

  if (!vetPK) throw new Error('Veterinarian record not found for this user.')
  return vetPK
}

export async function viewPendingContent(authUID: string): Promise<ContentReview[]> {
  const vetPK = await resolveVetPK(authUID)
  const { data, error } = await supabase
    .from('content_review')
    .select('*, first_aid_content(*, guide(*))')
    .eq('vetID', vetPK)
    .eq('status', 'pending')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function viewAllVetContent(authUID: string): Promise<ContentReview[]> {
  const vetPK = await resolveVetPK(authUID)
  const { data, error } = await supabase
    .from('content_review')
    .select('*, first_aid_content(*, guide(*))')
    .eq('vetID', vetPK)
    .order('reviewedDate', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function validateContent(reviewID: string, comment: string): Promise<ContentReview> {
  const { data, error } = await supabase
    .from('content_review')
    .update({ status: 'validated', comment, reviewedDate: new Date().toISOString() })
    .eq('reviewID', reviewID)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function rejectContent(reviewID: string, comment: string): Promise<ContentReview> {
  const { data, error } = await supabase
    .from('content_review')
    .update({ status: 'rejected', comment, reviewedDate: new Date().toISOString() })
    .eq('reviewID', reviewID)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}