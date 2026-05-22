import supabase from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────
export type Enquiry = {
  enquiryID: string
  subject: string
  message: string
  status: 'pending' | 'assigned' | 'responded'
  response: string | null
  petOwnerID: string
  vetID: string | null
  created_at:  string
}

// ── Scenario 3: PetOwner submits enquiry ──────────────────────────────────

/**
 * PetOwner.submitEnquiry()
 * Inserts a new enquiry row and returns it.
 */
export async function submitEnquiry(payload: {
  subject: string
  message: string
  petOwnerID: string
}): Promise<Enquiry> {
  const { data, error } = await supabase
    .from('enquiry')
    .insert({
      subject: payload.subject,
      message: payload.message,
      petOwnerID: payload.petOwnerID,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ── Scenario 3: Staff views all enquiries ────────────────────────────────

/**
 * Staff.viewEnquiry()
 * Returns all enquiries, newest first.
 */
export async function viewEnquiry(): Promise<Enquiry[]> {
  const { data, error } = await supabase
    .from('enquiry')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

// ── Scenario 3: Staff assigns enquiry to a Veterinarian ─────────────────

/**
 * Staff.assignEnquiryToVet()
 * Sets vetID and flips status → 'assigned'.
 */
export async function assignEnquiryToVet(
  enquiryID: string,
  vetID:      string
): Promise<Enquiry> {
  const { data, error } = await supabase
    .from('enquiry')
    .update({ vetID, status: 'assigned' })
    .eq('enquiryID', enquiryID)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ── Scenario 3: Vet views their assigned enquiries ───────────────────────

/**
 * Veterinarian.viewAssignedEnquiry()
 * Returns enquiries assigned to the given vet.
 */
export async function viewAssignedEnquiry(vetID: string): Promise<Enquiry[]> {
  const { data, error } = await supabase
    .from('enquiry')
    .select('*')
    .eq('vetID', vetID)
    .eq('status', 'assigned')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

// ── Scenario 3: Vet responds to assigned enquiry ─────────────────────────

/**
 * Veterinarian.respondAssignedEnquiry()
 * Saves the vet's response and flips status → 'responded'.
 */
export async function respondAssignedEnquiry(
  enquiryID: string,
  response:  string
): Promise<Enquiry> {
  const { data, error } = await supabase
    .from('enquiry')
    .update({ response, status: 'responded' })
    .eq('enquiryID', enquiryID)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ── Scenario 3 (else branch): Staff responds to general enquiry ──────────

/**
 * Staff.respondToEnquiry()
 * Saves a staff response directly without vet involvement.
 */
export async function respondToEnquiry(
  enquiryID: string,
  response:  string
): Promise<Enquiry> {
  const { data, error } = await supabase
    .from('enquiry')
    .update({ response, status: 'responded' })
    .eq('enquiryID', enquiryID)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}