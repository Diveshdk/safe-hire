import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { buildAadhaarKey, extractLast4 } from "@/lib/utils/crypto"

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = getSupabaseAdmin()
  
  // 1. Fetch ALL records
  const { data: profiles, error: fetchErr } = await admin
    .from('profiles')
    .select('user_id, aadhaar_number, aadhaar_full_name')

  if (fetchErr) return NextResponse.json({ ok: false, error: fetchErr.message })

  const results = []
  
  // Identify legacy records
  const legacyRecords = profiles?.filter(p => /^\d{12}$/.test(p.aadhaar_number || "")) || []

  for (const record of legacyRecords) {
    const last4 = extractLast4(record.aadhaar_number!)
    const name = record.aadhaar_full_name
    
    if (!name) {
      results.push({ uid: record.user_id, status: "error", msg: "Missing name" })
      continue
    }

    try {
      const hash = buildAadhaarKey(last4, name)
      
      // Update with select to verify persistence
      const { data: updated, error: updErr } = await admin
        .from('profiles')
        .update({ aadhaar_number: hash })
        .eq('user_id', record.user_id)
        .select()
      
      if (updErr) {
        // If unique constraint violation, it means another row already has this hash
        if (updErr.code === '23505') {
           // Set to NULL to resolve the conflict (since it's a duplicate of an already secured account)
           await admin.from('profiles').update({ aadhaar_number: null }).eq('user_id', record.user_id)
           results.push({ uid: record.user_id, status: "conflict_resolved", msg: "Duplicate identity - cleared to NULL" })
        } else {
           results.push({ uid: record.user_id, status: "fail", msg: updErr.message })
        }
      } else {
        results.push({ uid: record.user_id, status: "success", hash: hash.substring(0, 8) + "..." })
      }
    } catch (e: any) {
      results.push({ uid: record.user_id, status: "exception", msg: e.message })
    }
  }

  return NextResponse.json({
    ok: true,
    totalLegacy: legacyRecords.length,
    results
  })
}
