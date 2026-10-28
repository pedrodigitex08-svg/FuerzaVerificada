import { redirect } from "next/navigation";

interface VacantesRedirectProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function VacantesRedirectPage({ searchParams }: VacantesRedirectProps) {
  const params = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (typeof v === "string" && v.trim()) {
        params.set(k, v.trim());
      } else if (Array.isArray(v)) {
        v.forEach((item) => {
          if (item && item.trim()) params.append(k, item.trim());
        });
      }
    });
  }

  const qs = params.toString();
  redirect(qs ? `/guarda/vacantes?${qs}` : "/guarda/vacantes");
}
