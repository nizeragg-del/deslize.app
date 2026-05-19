import Stripe from 'stripe'

// Helper to sanitize environment variables in case they were pasted with the 'NAME=' prefix and/or enclosed in quotes
export function sanitizeEnvValue(val: string | undefined): string {
  if (!val) return ''
  let clean = val.trim().replace(/[^\x20-\x7E]/g, '')
  if (clean.includes('=')) {
    const parts = clean.split('=')
    const keyCandidate = parts[0].trim()
    // If the left side looks like an environment variable name (e.g. STRIPE_SECRET_KEY or any UPPER_CASE_NAME), extract the right side
    if (/^[A-Z_][A-Z0-9_]*$/i.test(keyCandidate)) {
      clean = parts.slice(1).join('=').trim()
    }
  }
  // Strip surrounding double or single quotes if they exist
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.substring(1, clean.length - 1).trim()
  }
  return clean
}

const rawKey = process.env.STRIPE_SECRET_KEY || 'dummy_key_for_build'
const cleanKey = sanitizeEnvValue(rawKey)

export const stripe = new Stripe(cleanKey || 'dummy_key_for_build', {
  apiVersion: '2023-10-16' as any,
  appInfo: {
    name: 'Deslize',
    version: '0.1.0'
  }
})
