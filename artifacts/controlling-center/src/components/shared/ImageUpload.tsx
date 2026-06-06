import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";

export const MAX_IMAGE_BYTES = 1_500_000;

// Reads an image File into a data URL, rejecting non-images / oversized files.
export function readImageFile(file: File, maxBytes = MAX_IMAGE_BYTES): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("not-image"));
    if (file.size > maxBytes) return reject(new Error("too-large"));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("read-error"));
    reader.readAsDataURL(file);
  });
}

interface ImageUploadProps {
  onUploaded: (dataUrl: string) => void;
  maxBytes?: number;
  hint?: string;
  testId?: string;
  className?: string;
}

// Reusable click-or-drag-drop image picker. Validates type/size and surfaces
// localized toasts; hands the resulting data URL back to the caller.
export function ImageUpload({ onUploaded, maxBytes = MAX_IMAGE_BYTES, hint, testId = "image-upload", className = "" }: ImageUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file, maxBytes);
      onUploaded(dataUrl);
      toast.success(t("ent_logo_uploaded"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "read-error";
      if (msg === "not-image") toast.error(t("ent_logo_not_image"));
      else if (msg === "too-large") toast.error(t("ent_logo_too_large"));
      else toast.error(t("ent_logo_read_error"));
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
      className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs transition-colors ${dragging ? "border-primary bg-primary/5 text-primary" : "border-slate-300 text-muted-foreground hover:border-primary/50 hover:bg-muted"} ${className}`}
      data-testid={testId}
    >
      <UploadCloud className="h-4 w-4 shrink-0" />
      <span>{hint ?? t("ent_logo_drop_hint")}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
        data-testid={`${testId}-input`}
      />
    </div>
  );
}
