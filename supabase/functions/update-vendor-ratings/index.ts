
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get vendor ID from the request
    const { vendor_id } = await req.json()
    
    if (!vendor_id) {
      return new Response(
        JSON.stringify({ error: 'Vendor ID is required' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Calculate the average rating from completed bookings for this vendor
    const { data: bookings, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select('rating')
      .eq('vendor_id', vendor_id)
      .eq('booking_status', 'Confirmed')
      .eq('is_completed', true)
      .not('rating', 'is', null)

    if (bookingsError) {
      throw bookingsError
    }

    // Calculate average rating
    let averageRating = 0
    if (bookings && bookings.length > 0) {
      const sum = bookings.reduce((acc, booking) => acc + (booking.rating || 0), 0)
      averageRating = parseFloat((sum / bookings.length).toFixed(2))
    }

    // Update the vendor's rating
    const { error: updateError } = await supabaseClient
      .from('vendors')
      .update({ rating: averageRating, updated_at: new Date().toISOString() })
      .eq('id', vendor_id)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        vendor_id, 
        rating: averageRating, 
        bookings_count: bookings.length 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
