import supabase from '@/lib/supabase'

// This file contains all content-related types and functions for both staff and vets, such as creating/updating first-aid guides, educational videos, quizzes, and handling vet reviews.
export type Enquiry = {
  enquiryID: string
  subject: string
  message: string
  status: 'pending' | 'assigned' | 'responded'
  response: string | null
  petOwnerID: string
  vetID: string | null
  created_at: string
}

// pet owner submits an enquiry about a pet emergency
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

//  Staff view all enquiries in the system, sorted by most recent
export async function viewEnquiry(): Promise<Enquiry[]> {
  const { data, error } = await supabase
    .from('enquiry')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

// Staff assigns an enquiry to a vet, changing status to 'assigned'
export async function assignEnquiryToVet(
  enquiryID: string,
  vetID: string
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

// Vet views all enquiries assigned to them with status 'assigned'
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

// Vet responds to an assigned enquiry, changing status to 'responded' and saving their reply
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

// Staff responds to an enquiry that has not been assigned to a vet, changing status to 'responded' and saving their reply
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