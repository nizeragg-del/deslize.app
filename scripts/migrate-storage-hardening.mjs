import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const apply = process.argv.includes('--apply')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const LEGACY_BUCKET = 'slides'
const PRIVATE_SLIDES_BUCKET = 'carousel-slides'
const BRAND_ASSETS_BUCKET = 'brand-assets'

function parsePublicStoragePath(url, bucket) {
  if (!url || typeof url !== 'string') return ''

  try {
    const parsed = new URL(url)
    const marker = `/storage/v1/object/public/${bucket}/`
    const index = parsed.pathname.indexOf(marker)
    if (index === -1) return ''

    return decodeURIComponent(parsed.pathname.slice(index + marker.length))
  } catch {
    return ''
  }
}

async function ensureUpload({ sourceBucket, targetBucket, path, contentType }) {
  const { data: existing } = await supabase.storage.from(targetBucket).list(
    path.split('/').slice(0, -1).join('/'),
    { search: path.split('/').at(-1), limit: 1 }
  )

  if (existing?.some((item) => item.name === path.split('/').at(-1))) {
    return { copied: false, skippedExisting: true }
  }

  const { data: downloaded, error: downloadError } = await supabase.storage
    .from(sourceBucket)
    .download(path)

  if (downloadError) {
    throw new Error(`download ${sourceBucket}/${path}: ${downloadError.message}`)
  }

  const { error: uploadError } = await supabase.storage
    .from(targetBucket)
    .upload(path, downloaded, {
      contentType,
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`upload ${targetBucket}/${path}: ${uploadError.message}`)
  }

  return { copied: true, skippedExisting: false }
}

async function migrateSlides() {
  const { data: rows, error } = await supabase
    .from('slides')
    .select('id, storage_path, storage_bucket')
    .or('storage_bucket.is.null,storage_bucket.eq.slides')
    .order('created_at', { ascending: true })

  if (error) throw error

  const result = {
    found: rows?.length || 0,
    copied: 0,
    skippedExisting: 0,
    updated: 0,
    failed: [],
  }

  for (const row of rows || []) {
    if (!row.storage_path) continue

    try {
      if (apply) {
        const upload = await ensureUpload({
          sourceBucket: LEGACY_BUCKET,
          targetBucket: PRIVATE_SLIDES_BUCKET,
          path: row.storage_path,
          contentType: 'image/png',
        })

        if (upload.copied) result.copied += 1
        if (upload.skippedExisting) result.skippedExisting += 1

        const { error: updateError } = await supabase
          .from('slides')
          .update({ storage_bucket: PRIVATE_SLIDES_BUCKET })
          .eq('id', row.id)

        if (updateError) throw updateError
        result.updated += 1
      }
    } catch (err) {
      result.failed.push({ id: row.id, path: row.storage_path, error: err.message })
    }
  }

  return result
}

async function migrateBrandLogos() {
  const { data: rows, error } = await supabase
    .from('brands')
    .select('id, logo_url')
    .like('logo_url', `%/storage/v1/object/public/${LEGACY_BUCKET}/%`)

  if (error) throw error

  const result = {
    found: rows?.length || 0,
    copied: 0,
    skippedExisting: 0,
    updated: 0,
    failed: [],
  }

  for (const row of rows || []) {
    const path = parsePublicStoragePath(row.logo_url, LEGACY_BUCKET)
    if (!path) continue

    try {
      if (apply) {
        const ext = path.split('.').pop()?.toLowerCase()
        const contentType =
          ext === 'svg' ? 'image/svg+xml'
          : ext === 'webp' ? 'image/webp'
          : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
          : 'image/png'

        const upload = await ensureUpload({
          sourceBucket: LEGACY_BUCKET,
          targetBucket: BRAND_ASSETS_BUCKET,
          path,
          contentType,
        })

        if (upload.copied) result.copied += 1
        if (upload.skippedExisting) result.skippedExisting += 1

        const { data } = supabase.storage.from(BRAND_ASSETS_BUCKET).getPublicUrl(path)
        const { error: updateError } = await supabase
          .from('brands')
          .update({ logo_url: data.publicUrl })
          .eq('id', row.id)

        if (updateError) throw updateError
        result.updated += 1
      }
    } catch (err) {
      result.failed.push({ id: row.id, path, error: err.message })
    }
  }

  return result
}

const slides = await migrateSlides()
const brandLogos = await migrateBrandLogos()

console.log(JSON.stringify({
  mode: apply ? 'apply' : 'dry-run',
  slides,
  brandLogos,
}, null, 2))

if (slides.failed.length || brandLogos.failed.length) {
  process.exitCode = 1
}
