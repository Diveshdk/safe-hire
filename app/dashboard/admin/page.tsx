import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldCheck, XCircle, Clock, CheckCircle2, Building2 } from "lucide-react"
import { AdminRequestActions } from "./admin-actions"

export default async function AdminPage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!profile?.is_admin) redirect("/dashboard")

  const { data: requests } = await supabase
    .from("institute_verification_requests")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: institutes } = await supabase
    .from("institutes")
    .select("id, name, domain, created_at")
    .order("created_at", { ascending: false })

  const pending = requests?.filter(r => r.status === "pending") ?? []
  const resolved = requests?.filter(r => r.status !== "pending") ?? []

  return (
    <div className="grid gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#18181B]">Admin Panel</h1>
        <p className="text-sm text-[#71717A] mt-1">Institute verification management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: pending.length, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
          { label: "Approved Institutes", value: institutes?.length ?? 0, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "Total Requests", value: requests?.length ?? 0, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          { label: "Rejected", value: resolved.filter(r => r.status === "rejected").length, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-[#71717A] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-[#18181B] mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" /> Pending Requests ({pending.length})
          </h2>
          <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden divide-y divide-[#F4F4F6]">
            {pending.map((req: any) => (
              <div key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#18181B] text-sm">{req.institute_name}</p>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    {req.email} · <span className="font-mono">@{req.domain}</span>
                  </p>
                  <p className="text-[10px] text-[#A1A1AA] mt-0.5">
                    {new Date(req.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
                {req.id_card_url && (
                  <a
                    href={req.id_card_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline shrink-0"
                  >
                    View ID Card →
                  </a>
                )}
                <AdminRequestActions requestId={req.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold text-emerald-800">All caught up!</p>
          <p className="text-sm text-emerald-600 mt-1">No pending institute requests.</p>
        </div>
      )}

      {/* Approved Institutes */}
      {institutes && institutes.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-[#18181B] mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Approved Institutes ({institutes.length})
          </h2>
          <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden divide-y divide-[#F4F4F6]">
            {institutes.map((inst: any) => (
              <div key={inst.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#18181B]">{inst.name}</p>
                  <p className="text-xs text-[#71717A] font-mono">@{inst.domain}</p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  Approved
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved requests */}
      {resolved.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-[#18181B] mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-[#A1A1AA]" /> Resolved Requests
          </h2>
          <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden divide-y divide-[#F4F4F6]">
            {resolved.map((req: any) => (
              <div key={req.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#18181B]">{req.institute_name}</p>
                  <p className="text-xs text-[#71717A] mt-0.5">{req.email}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                  req.status === "approved"
                    ? "text-emerald-700 bg-emerald-100"
                    : "text-red-700 bg-red-100"
                }`}>
                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
