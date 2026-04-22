import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!

const hexToBytes = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  const signature = req.headers.get('x-paystack-signature')
  if (!signature) return new Response('No signature', { status: 401 })

  const bodyText = await req.text()
  
  // Verify signature
  const hmac = crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(PAYSTACK_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['verify']
  );

  const isVerified = await crypto.subtle.verify(
    'HMAC',
    await hmac,
    hexToBytes(signature),
    new TextEncoder().encode(bodyText)
  );

  if (!isVerified) {
    return new Response('Invalid signature', { status: 401 })
  }

  try {
    const body = JSON.parse(bodyText)
    const { event, data } = body


    if (event === 'charge.success') {
      const reference = data.reference
      const amount = data.amount / 100 // kobo to NGN
      const email = data.customer.email
      const metadata = data.metadata || {}
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      const { error: insertError } = await supabase
        .from('donations')
        .insert({
          user_id: profile?.id || null,
          amount: amount,
          currency: data.currency,
          paystack_reference: reference,
          paystack_transaction_id: data.id.toString(),
          donor_name: metadata.donor_name || `${data.customer.first_name || ''} ${data.customer.last_name || ''}`.trim() || 'Anonymous',
          donor_email: email,
          status: 'completed',
          paid_at: data.paid_at,
          payment_channel: data.channel,
          donation_type: metadata.category || metadata.donation_type || 'General',
          is_anonymous: metadata.is_anonymous || false
        })

      if (insertError) {
        console.error('Error inserting donation:', insertError)
        return new Response('Database error', { status: 500 })
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      headers: { 'Content-Type': 'application/json' },
      status: 200 
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response('Webhook handler failed', { status: 400 })
  }
})
