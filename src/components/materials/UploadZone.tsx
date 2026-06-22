"use client";

import React, { useState, useTransition } from "react";
import { Upload, Check, AlertCircle, RefreshCw } from "lucide-react";
import { uploadStudyMaterial } from "@/actions/upload";

interface UploadZoneProps {
  onUploadSuccess?: (material: any) => void;
}

export default function UploadZone({ onUploadSuccess }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Auto-populate title if empty
      if (!title) {
        const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf("."));
        setTitle(nameWithoutExt || selectedFile.name);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());

    startTransition(async () => {
      const result = await uploadStudyMaterial(formData);
      if (result.success) {
        setSuccess("Study material processed and text extracted successfully!");
        setFile(null);
        setTitle("");
        if (onUploadSuccess) {
          onUploadSuccess(result.material);
        }
      } else {
        setError(result.error || "Material upload failed.");
      }
    });
  };

  return (
    <div className="w-full bg-surface border border-outline/10 rounded-lg p-5 shadow-1 text-on-surface">
      <h3 className="text-title-medium font-semibold text-primary mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5" /> Add Study Material
      </h3>

      {error && (
        <div className="p-3 mb-4 text-body-small bg-error-container text-on-error-container border border-error/20 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 mb-4 text-body-small bg-success-container text-on-success-container border border-success/20 rounded-md flex items-start gap-2">
          <Check className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="flex flex-col gap-4">
        {!file ? (
            <div className="flex flex-col gap-3">
              <label className="border-2 border-dashed border-outline/30 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 text-on-surface-variant/70 mb-2" />
                <span className="text-body-medium font-medium">Choose a Document</span>
                <span className="text-body-small text-on-surface-variant/60 mt-1">
                  PDF, DOC, DOCX, PNG, JPG, WEBP
                </span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,image/*"
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-surface-variant/50 rounded-md border border-outline/10 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span className="text-body-medium font-medium truncate">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setFile(null); setTitle(""); }}
                  className="text-body-small text-error hover:underline shrink-0 ml-2"
                >
                  Remove
                </button>
              </div>

              <div>
                <label htmlFor="material-title" className="block text-label-large font-medium mb-1">
                  Document Title
                </label>
                <input
                  id="material-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter custom title"
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-surface border border-outline/30 rounded-md text-body-medium focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-primary text-primary-on font-semibold rounded-md shadow-2 flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-opacity mt-2"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Processing OCR & Text...
                  </>
                ) : (
                  "Extract & Process Text"
                )}
              </button>
            </div>
          )}
        </form>
      </div>
  );
}
