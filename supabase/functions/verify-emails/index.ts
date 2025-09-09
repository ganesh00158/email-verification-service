import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailVerificationRequest {
  emails: string[]
}

interface EmailVerificationResult {
  email: string
  status: 'VALID' | 'INVALID' | 'DISPOSABLE' | 'UNKNOWN'
  reason: string
  syntax_valid: boolean
  domain_exists: boolean
  mx_records_exist: boolean
}

// Email regex validation
function validateEmailSyntax(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Check if domain exists and has MX records
async function checkDomainAndMX(domain: string): Promise<{ domainExists: boolean; mxExists: boolean }> {
  try {
    // Using a DNS-over-HTTPS service to check domain
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`)
    const data = await response.json()
    
    const domainExists = data.Status === 0
    const mxExists = data.Answer && data.Answer.length > 0
    
    return { domainExists, mxExists }
  } catch (error) {
    console.error('Domain check error:', error)
    return { domainExists: false, mxExists: false }
  }
}

// Check if domain is disposable email provider
function isDisposableEmail(domain: string): boolean {
  const disposableDomains = [
    '10minutemail.com', 'guerrillamail.com', 'temp-mail.org', 'mailinator.com',
    'yopmail.com', 'throwaway.email', 'tempail.com', 'getnada.com'
  ]
  return disposableDomains.includes(domain.toLowerCase())
}

async function verifyEmail(email: string): Promise<EmailVerificationResult> {
  const domain = email.split('@')[1]
  
  // Step 1: Syntax validation
  const syntax_valid = validateEmailSyntax(email)
  if (!syntax_valid) {
    return {
      email,
      status: 'INVALID',
      reason: 'Invalid email syntax',
      syntax_valid: false,
      domain_exists: false,
      mx_records_exist: false
    }
  }
  
  // Step 2: Check if disposable
  if (isDisposableEmail(domain)) {
    return {
      email,
      status: 'DISPOSABLE',
      reason: 'Disposable email provider detected',
      syntax_valid: true,
      domain_exists: true,
      mx_records_exist: false
    }
  }
  
  // Step 3: Domain and MX record validation
  const { domainExists, mxExists } = await checkDomainAndMX(domain)
  
  if (!domainExists) {
    return {
      email,
      status: 'INVALID',
      reason: 'Domain does not exist',
      syntax_valid: true,
      domain_exists: false,
      mx_records_exist: false
    }
  }
  
  if (!mxExists) {
    return {
      email,
      status: 'INVALID',
      reason: 'No MX records found for domain',
      syntax_valid: true,
      domain_exists: true,
      mx_records_exist: false
    }
  }
  
  return {
    email,
    status: 'VALID',
    reason: 'Email validation passed all checks',
    syntax_valid: true,
    domain_exists: true,
    mx_records_exist: true
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Get user from token
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

    if (req.method === 'POST') {
      const { emails }: EmailVerificationRequest = await req.json()
      
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Please provide an array of emails' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Store emails as PENDING first
      const pendingEmails = emails.map(email => ({
        email: email.toLowerCase().trim(),
        status: 'PENDING',
        reason: 'Email verification in progress',
        syntax_valid: null,
        domain_exists: null,
        mx_records_exist: null,
        user_id: user.id
      }))

      const { data: insertedEmails, error: insertError } = await supabaseClient
        .from('email_verifications')
        .insert(pendingEmails)
        .select()

      if (insertError) {
        console.error('Insert error:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to store emails' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Verify emails in parallel
      const verificationPromises = emails.map(email => verifyEmail(email.toLowerCase().trim()))
      const results = await Promise.all(verificationPromises)

      // Update database with verification results
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        const emailRecord = insertedEmails[i]
        
        await supabaseClient
          .from('email_verifications')
          .update({
            status: result.status,
            reason: result.reason,
            syntax_valid: result.syntax_valid,
            domain_exists: result.domain_exists,
            mx_records_exist: result.mx_records_exist,
            verified_at: new Date().toISOString()
          })
          .eq('id', emailRecord.id)
      }

      return new Response(
        JSON.stringify({ 
          message: `Successfully verified ${results.length} emails`,
          results 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
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