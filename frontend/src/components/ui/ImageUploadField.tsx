import { useId, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { Button } from "./Button";
import { mediaApi, type ImageUploadKind } from "../../shared/api/media";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";

type Props = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  kind: ImageUploadKind;
  ar?: boolean;
  disabled?: boolean;
  helperText?: string;
  previewAlt?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // e.g. ["image/png", "image/jpeg"]
};

export default function ImageUploadField({
  label,
  value,
  onChange,
  kind,
  ar = true,
  disabled = false,
  helperText,
  previewAlt,
  maxSize,
  allowedTypes
}: Props) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const chooseFile = () => {
    if (disabled || isUploading) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const onFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate local type and size before upload if provided
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      const extensions = allowedTypes.map((t) => t.split("/")[1] || t).join(", ");
      setUploadError(
        ar
          ? `صيغة الملف غير مدعومة. الصيغ المسموحة هي: ${extensions}`
          : `Unsupported file format. Allowed formats are: ${extensions}`
      );
      return;
    }

    if (maxSize && file.size > maxSize) {
      const sizeInMB = (maxSize / (1024 * 1024)).toFixed(0);
      setUploadError(
        ar
          ? `حجم الملف كبير جداً. الحد الأقصى المسموح به هو ${sizeInMB} ميجابايت.`
          : `File size is too large. The maximum allowed limit is ${sizeInMB}MB.`
      );
      return;
    }

    try {
      setUploadError(null);
      setIsUploading(true);
      const uploaded = await mediaApi.uploadImage(file, kind);
      onChange(uploaded.url);
    } catch (error) {
      setUploadError(
        getLocalizedApiErrorMessage(error, {
          ar,
          fallback: ar ? "تعذر رفع الصورة. يرجى المحاولة مرة أخرى." : "Unable to upload the image. Please try again."
        })
      );
    } finally {
      setIsUploading(false);
    }
  };

  const statusTitle = value
    ? ar
      ? "\u062a\u0645 \u062a\u062d\u062f\u064a\u062f \u0635\u0648\u0631\u0629 \u062d\u0627\u0644\u064a\u0629"
      : "Image selected"
    : ar
      ? "\u0627\u062e\u062a\u0631 \u0635\u0648\u0631\u0629 \u0645\u0646 \u0627\u0644\u062c\u0647\u0627\u0632"
      : "Choose an image";

  const statusText =
    helperText ??
    (ar
      ? "\u064a\u062f\u0639\u0645 JPG / PNG / WEBP / GIF / SVG"
      : "Supports JPG / PNG / WEBP / GIF / SVG");

  return (
    <div className="image-upload-field">
      {label ? (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="image-upload-field__input"
        onChange={(event) => {
          void onFileSelected(event);
        }}
        disabled={disabled || isUploading}
      />

      <div className="image-upload-field__panel">
        <div className="image-upload-field__topline">
          <div className="image-upload-field__preview" data-has-image={value ? "true" : "false"}>
            {value ? (
              <img
                src={value}
                alt={previewAlt ?? label}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <ImagePlus className="w-5 h-5" />
            )}
          </div>

          <div className="image-upload-field__meta">
            <strong>{statusTitle}</strong>
            <span>{statusText}</span>
          </div>
        </div>

        <div className="image-upload-field__actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<ImagePlus className="w-4 h-4" />}
            onClick={chooseFile}
            disabled={disabled}
            isLoading={isUploading}
          >
            {value
              ? ar
                ? "\u0627\u0633\u062a\u0628\u062f\u0627\u0644 \u0627\u0644\u0635\u0648\u0631\u0629"
                : "Replace image"
              : ar
                ? "\u0627\u062e\u062a\u064a\u0627\u0631 \u0635\u0648\u0631\u0629"
                : "Choose image"}
          </Button>

          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => {
                if (disabled || isUploading) return;
                setUploadError(null);
                onChange("");
              }}
              disabled={disabled || isUploading}
            >
              {ar ? "\u0625\u0632\u0627\u0644\u0629" : "Remove"}
            </Button>
          ) : null}
        </div>
      </div>

      {uploadError ? (
        <div className="image-upload-field__error" role="alert">
          {uploadError}
        </div>
      ) : null}
    </div>
  );
}
