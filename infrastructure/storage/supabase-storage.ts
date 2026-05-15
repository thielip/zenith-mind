import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

const SITE_ASSETS_BUCKET = "site-assets";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);

/** 部分瀏覽器／OS（尤其 Windows）選檔後 `file.type` 為空或為 octet-stream，改由副檔名推斷 */
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
};

function resolveImageContentType(file: File): string {
  const raw = file.type?.trim() ?? "";
  const normalized = raw === "image/jpg" ? "image/jpeg" : raw;
  if (normalized && ALLOWED_IMAGE_TYPES.has(normalized)) {
    return normalized;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && MIME_BY_EXTENSION[ext]) {
    return MIME_BY_EXTENSION[ext];
  }
  return normalized;
}

let bucketReady = false;

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

async function ensureBucket() {
  if (bucketReady) return;

  const { data } = await supabase.storage.getBucket(SITE_ASSETS_BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(SITE_ASSETS_BUCKET, {
      public: true,
      fileSizeLimit: MAX_IMAGE_SIZE,
      allowedMimeTypes: Array.from(ALLOWED_IMAGE_TYPES),
    });
    if (error && !error.message.toLowerCase().includes("already exists")) {
      throw error;
    }
  }

  bucketReady = true;
}

function extensionFromFile(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  const t = resolveImageContentType(file);
  if (t === "image/jpeg") return "jpg";
  if (t === "image/png") return "png";
  if (t === "image/webp") return "webp";
  if (t === "image/avif") return "avif";
  if (t === "image/svg+xml") return "svg";
  return "bin";
}

export async function uploadSiteAsset(file: File, folder = "cms") {
  const contentType = resolveImageContentType(file);
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error("UNSUPPORTED_IMAGE_TYPE");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  await ensureBucket();

  const ext = extensionFromFile(file);
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const path = `${safeFolder}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(SITE_ASSETS_BUCKET)
    .upload(path, buffer, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    const err = new Error(error.message || "STORAGE_UPLOAD_FAILED");
    err.name = "SupabaseStorageError";
    throw err;
  }

  const { data } = supabase.storage
    .from(SITE_ASSETS_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

export function getSiteAssetPathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${SITE_ASSETS_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;

  const path = url.slice(index + marker.length).split("?")[0];
  return path ? decodeURIComponent(path) : null;
}

export async function deleteSiteAssetByPublicUrl(url: string) {
  const path = getSiteAssetPathFromPublicUrl(url);
  if (!path) return { deleted: false, reason: "NOT_SITE_ASSET" as const };

  await ensureBucket();
  const { error } = await supabase.storage.from(SITE_ASSETS_BUCKET).remove([path]);
  if (error) throw error;
  return { deleted: true, reason: null };
}
