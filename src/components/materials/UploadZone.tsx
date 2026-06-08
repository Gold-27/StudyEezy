"use client";

import React, { useState, useRef, useTransition } from "react";
import { Upload, Camera, Check, AlertCircle, RefreshCw, X } from "lucide-react";
import { uploadStudyMaterial } from "@/actions/upload";

interface UploadZoneProps {
  onUploadSuccess?: (material: any) => void;
}

export default function UploadZone({ onUploadSuccess }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Camera capture states
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const startCamera = async () => {
    setError(null);
    setSuccess(null);
    setFile(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera permissions check failed:", err);
      setError("Unable to access camera. Please check your camera permissions.");
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File(
              [blob],
              `camera_capture_${Date.now()}.jpg`,
              { type: "image/jpeg" }
            );
            setFile(capturedFile);
            setTitle(`Camera Capture - ${new Date().toLocaleDateString()}`);
          }
        }, "image/jpeg");
      }
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
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

      {cameraActive ? (
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden border border-outline/20">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <button
              onClick={stopCamera}
              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={capturePhoto}
              className="flex-1 py-2.5 bg-primary text-primary-on font-semibold rounded-md shadow-2 hover:opacity-95 transition-opacity"
            >
              Capture Note
            </button>
            <button
              onClick={stopCamera}
              className="px-4 py-2.5 bg-surface-variant text-on-surface-variant font-medium rounded-md border border-outline/20 hover:bg-surface-variant/90 transition-colors"
            >
              Cancel
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : (
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

              <div className="text-center text-body-small text-on-surface-variant/50">— OR —</div>

              <button
                type="button"
                onClick={startCamera}
                className="w-full py-3 bg-surface-variant text-on-surface-variant font-semibold rounded-md border border-outline/20 flex items-center justify-center gap-2 hover:bg-surface-variant/90 transition-colors"
              >
                <Camera className="w-5 h-5 text-primary" /> Take Picture of Notes
              </button>
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
      )}
    </div>
  );
}
