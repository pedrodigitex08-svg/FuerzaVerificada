import { createClient } from "@/lib/supabase/client";

const STORAGE_BUCKET = "documents";

/**
 * Extrae la ruta interna del bucket 'documents' a partir de una URL pública/firmada
 * de Supabase Storage o de una ruta relativa directa (ej. 'reports/informe-123.pdf').
 */
export function extractStoragePath(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null;
  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;

  // Caso 1: Ya es una ruta relativa interna del bucket
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed.replace(/^\/+/, "");
  }

  // Caso 2: URL de Supabase Storage (/storage/v1/object/{public|sign|authenticated}/documents/...)
  const markerRegex = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/documents\/([^?]+)/i;
  const match = trimmed.match(markerRegex);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  return null;
}

/**
 * Genera una Signed URL temporal (por defecto 1 hora = 3600s) para proteger documentos
 * sensibles (informes de poligrafía, hojas de vida y cédulas) bajo la Ley 1581 de 2012.
 * Si el archivo es externo o el bucket aún opera en modo público sin firma, retorna
 * un fallback seguro.
 */
export async function resolveSecureDocumentUrl(
  urlOrPath: string | null | undefined,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!urlOrPath) return null;

  const storagePath = extractStoragePath(urlOrPath);
  if (!storagePath) {
    return urlOrPath;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }

    // Fallback a URL pública si el bucket no requiere firma o en modo desarrollo
    const { data: pub } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return pub?.publicUrl || urlOrPath;
  } catch {
    return urlOrPath;
  }
}

/**
 * Abre un documento confidencial generando al vuelo una URL firmada temporal (1 hora).
 */
export async function openSecureDocument(
  urlOrPath: string | null | undefined
): Promise<void> {
  if (!urlOrPath || typeof window === "undefined") return;

  // Abrir ventana inmediatamente para evitar bloqueadores de popups del navegador
  const newWin = window.open("about:blank", "_blank");
  const resolvedUrl = await resolveSecureDocumentUrl(urlOrPath, 3600);

  if (resolvedUrl) {
    if (newWin) {
      newWin.location.href = resolvedUrl;
    } else {
      window.location.href = resolvedUrl;
    }
  } else if (newWin) {
    newWin.close();
  }
}
