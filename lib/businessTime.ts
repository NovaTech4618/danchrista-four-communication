import { supabase } from "@/lib/supabase";

const FALLBACK_TIMEZONE = "Africa/Lagos";

type Parts = { year: string; month: string; day: string };

function datePartsInZone(date: Date, timeZone: string): Parts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return {
    year: parts.find((p) => p.type === "year")?.value ?? "1970",
    month: parts.find((p) => p.type === "month")?.value ?? "01",
    day: parts.find((p) => p.type === "day")?.value ?? "01",
  };
}

function offsetForZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  if (raw === "GMT" || raw === "UTC") return "+00:00";
  const match = raw.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return "+00:00";
  return `${match[1]}${match[2].padStart(2, "0")}:${match[3] ?? "00"}`;
}

function zonedMidnight(date: Date, timeZone: string): Date {
  const { year, month, day } = datePartsInZone(date, timeZone);
  const localMidnightLabel = `${year}-${month}-${day}T00:00:00`;
  const offset = offsetForZone(new Date(`${localMidnightLabel}Z`), timeZone);
  return new Date(`${localMidnightLabel}${offset}`);
}

export async function getCompanyTimezone(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return FALLBACK_TIMEZONE;
  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).maybeSingle();
  if (!profile?.company_id) return FALLBACK_TIMEZONE;
  const { data: company } = await supabase.from("companies").select("timezone").eq("id", profile.company_id).maybeSingle();
  return company?.timezone?.trim() || FALLBACK_TIMEZONE;
}

export async function getBusinessDayRange(reference = new Date()): Promise<{ start: string; end: string; timezone: string }> {
  const timezone = await getCompanyTimezone();
  const startDate = zonedMidnight(reference, timezone);
  const nextDayReference = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  const endDate = zonedMidnight(nextDayReference, timezone);
  return { start: startDate.toISOString(), end: endDate.toISOString(), timezone };
}
