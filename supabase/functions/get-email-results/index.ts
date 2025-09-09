import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const format = url.searchParams.get('format') || 'json'

    let query = supabaseClient
      .from('email_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status.toUpperCase())
    }

    const { data: emails, error } = await query

    if (error) {
      console.error('Query error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch email results' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = 'email,status,reason,syntax_valid,domain_exists,mx_records_exist,verified_at\n'
      const csvRows = emails.map(email => 
        `"${email.email}","${email.status}","${email.reason}","${email.syntax_valid}","${email.domain_exists}","${email.mx_records_exist}","${email.verified_at}"`
      ).join('\n')
      
      const csvContent = csvHeaders + csvRows

      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="email_verification_results.csv"'
        },
      })
    }

    // Return JSON by default
    return new Response(
      JSON.stringify({ emails }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})