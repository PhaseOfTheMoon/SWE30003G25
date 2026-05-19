import { supabase } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────
export type Guide = {
  guideID:    string
  contentID:  string
  title:      string
  stepNumber: number
  instruction: string
}

export type ContentReview = {
  reviewID:     string
  contentID:    string
  vetID:        string | null
  status:       'pending' | 'validated' | 'rejected'
  comment:      string | null
  reviewedDate: string | null
}

export type FirstAidContent = {
  contentID:         string
  petType:           string
  emergencyCategory: string
  lastUpdateDate:    string
}

// ── Scenario 4: Staff creates a guide ────────────────────────────────────

/**
 * Staff.createGuide()
 * Creates a FirstAidContent record (if needed) then inserts Guide steps.
 * Returns the saved guide row.
 */
export async function createGuide(payload: {
  petType:           string
  emergencyCategory: string
  title:             string
  stepNumber:        number
  instruction:       string
}): Promise<{ content: FirstAidContent; guide: Guide }> {
  // Upsert the parent content record
  const { data: content, error: ce } = await supabase
    .from('first_aid_content')
    .insert({
      petType:           payload.petType,
      emergencyCategory: payload.emergencyCategory,
    })
    .select()
    .single()

  if (ce) throw new Error(ce.message)

  // Insert the guide step
  const { data: guide, error: ge } = await supabase
    .from('guide')
    .insert({
      contentID:   content.contentID,
      title:       payload.title,
      stepNumber:  payload.stepNumber,
      instruction: payload.instruction,
    })
    .select()
    .single()

  if (ge) throw new Error(ge.message)
  return { content, guide }
}

// ── Scenario 4: Staff requests vet validation ────────────────────────────

/**
 * Staff.requestVetValidation()
 * Creates a ContentReview record linking the content to the assigned vet.
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

// ── Scenario 4: Vet views pending content ────────────────────────────────

/**
 * Veterinarian.viewPendingContent()
 * Returns all content reviews with status = 'pending' for the given vet.
 */
export async function viewPendingContent(vetID: string): Promise<ContentReview[]> {
  const { data, error } = await supabase
    .from('content_review')
    .select('*, first_aid_content(*), guide(*)')
    .eq('vetID', vetID)
    .eq('status', 'pending')

  if (error) throw new Error(error.message)
  return data ?? []
}

// ── Scenario 4: Vet validates content ────────────────────────────────────

/**
 * Veterinarian.validateContent()  →  submitValidate()
 * Sets status = 'validated' and saves the comment.
 */
export async function validateContent(
  reviewID: string,
  comment:  string
): Promise<ContentReview> {
  const { data, error } = await supabase
    .from('content_review')
    .update({ status: 'validated', comment, reviewedDate: new Date().toISOString() })
    .eq('reviewID', reviewID)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ── Scenario 4: Vet rejects content ──────────────────────────────────────

/**
 * Veterinarian.rejectContent()  →  submitReject()
 * Sets status = 'rejected' and saves the comment.
 */
export async function rejectContent(
  reviewID: string,
  comment:  string
): Promise<ContentReview> {
  const { data, error } = await supabase
    .from('content_review')
    .update({ status: 'rejected', comment, reviewedDate: new Date().toISOString() })
    .eq('reviewID', reviewID)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ── Scenario 4: Staff views the review result ────────────────────────────

/**
 * Staff.viewContentReview()
 * Returns the review record for a given content item.
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

// ── Scenario 4: Staff updates guide after review ─────────────────────────

/**
 * Staff.updateGuide()
 * Updates the guide instruction/title and refreshes lastUpdateDate.
 */
export async function updateGuide(
  guideID:     string,
  title:       string,
  instruction: string
): Promise<Guide> {
  const { data: guide, error: ge } = await supabase
    .from('guide')
    .update({ title, instruction })
    .eq('guideID', guideID)
    .select()
    .single()

  if (ge) throw new Error(ge.message)

  // Refresh lastUpdateDate on parent
  await supabase
    .from('first_aid_content')
    .update({ lastUpdateDate: new Date().toISOString() })
    .eq('contentID', guide.contentID)

  return guide
}