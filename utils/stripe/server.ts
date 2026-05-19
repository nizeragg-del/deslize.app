import Stripe from 'stripe'

const rawKey = process.env.STRIPE_SECRET_KEY || 'dummy_key_for_build'
// Clean the key from any carriage returns, newlines, tabs, trailing spaces, or hidden Unicode/control chars
const cleanKey = rawKey.trim().replace(/[^\x20-\x7E]/g, '')

export const stripe = new Stripe(cleanKey, {
  apiVersion: '2023-10-16' as any,
  appInfo: {
    name: 'Deslize',
    version: '0.1.0'
  }
})
