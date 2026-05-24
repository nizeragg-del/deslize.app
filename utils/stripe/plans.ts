import { sanitizeEnvValue } from '@/utils/stripe/server'

export type PlanKey =
  | 'starter'
  | 'pro'
  | 'agency'
  | 'starter_annual'
  | 'pro_annual'
  | 'agency_annual'

export type BillingPlan = 'starter' | 'pro' | 'agency'

type PlanConfig = {
  key: PlanKey
  plan: BillingPlan
  credits: number
  envKey: string
}

export const STRIPE_PLANS: Record<PlanKey, PlanConfig> = {
  starter: { key: 'starter', plan: 'starter', credits: 30, envKey: 'STRIPE_PRICE_STARTER' },
  pro: { key: 'pro', plan: 'pro', credits: 80, envKey: 'STRIPE_PRICE_PRO' },
  agency: { key: 'agency', plan: 'agency', credits: 200, envKey: 'STRIPE_PRICE_AGENCY' },
  starter_annual: { key: 'starter_annual', plan: 'starter', credits: 30, envKey: 'STRIPE_PRICE_STARTER_ANNUAL' },
  pro_annual: { key: 'pro_annual', plan: 'pro', credits: 80, envKey: 'STRIPE_PRICE_PRO_ANNUAL' },
  agency_annual: { key: 'agency_annual', plan: 'agency', credits: 200, envKey: 'STRIPE_PRICE_AGENCY_ANNUAL' },
}

export function getPlanConfig(planKey: unknown) {
  if (typeof planKey !== 'string') return null
  return STRIPE_PLANS[planKey as PlanKey] || null
}

export function getPlanPriceId(planKey: unknown) {
  const plan = getPlanConfig(planKey)
  if (!plan) return null

  const priceId = sanitizeEnvValue(process.env[plan.envKey])
  if (!priceId) return null

  return { ...plan, priceId }
}

export function getPlanByPriceId(priceId: unknown) {
  if (typeof priceId !== 'string' || !priceId) return null

  for (const plan of Object.values(STRIPE_PLANS)) {
    const configuredPriceId = sanitizeEnvValue(process.env[plan.envKey])
    if (configuredPriceId && configuredPriceId === priceId) {
      return { ...plan, priceId: configuredPriceId }
    }
  }

  return null
}
