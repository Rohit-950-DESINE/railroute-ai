import type { AvailabilityStatus } from "@/lib/types";

const L: Record<AvailabilityStatus, string> = { AVAILABLE: "Available", RAC: "RAC", WAITLIST: "Waitlist", NOT_AVAILABLE: "Not available", UNKNOWN: "Unknown" };
export default function StatusPill({ s, label }: { s: AvailabilityStatus; label?: string }) {
  return <span className={`pill s-${s}`}>{label ? `${label} · ` : ""}{L[s]}</span>;
}
