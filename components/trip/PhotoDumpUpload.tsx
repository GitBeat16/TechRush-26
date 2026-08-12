"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayCard } from "@/components/ui/ClayCard";
import { SparkIcon, CameraIcon } from "@/components/ui/Icons";
import { uploadPhotoDumpImages, createPhotoDump, type UploadProgress } from "@/lib/photo-dumps";
import type { PhotoDump } from "@/types/photo-dump";
import { fadeUp, springSnappy } from "@/lib/animations";
import { useFeedback } from "@/lib/feedback";

export function PhotoDumpUpload({
  tripId,
  userId,
  onCancel,
  onPosted,
}: {
  tripId: string;
  userId: string;
  onCancel: () => void;
  onPosted: (dump: PhotoDump) => void;
}) {
  const { play } = useFeedback();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files).slice(0, 10)); // limit to 10 for safety
    }
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setError(null);
    play("press");

    try {
      const images = await uploadPhotoDumpImages(files, userId, tripId, setProgress);
      const dump = await createPhotoDump(tripId, {
        images: images.map(img => ({ path: img.path, width: img.width, height: img.height })),
        caption,
        location,
      });
      play("success");
      onPosted(dump);
    } catch (err) {
      console.error(err);
      setError("Failed to post memories. Please try again.");
      play("toggleOff");
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
      transition={springSnappy}
      className="mb-4 origin-top"
    >
      <ClayCard tone="surface" radius="lg" depth="sm" className="p-4 sm:p-5">
        <h3 className="font-display text-lg font-semibold mb-4">New Photo Dump</h3>
        
        <div className="space-y-4">
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          
          <div 
            onClick={() => {
              if (!uploading) fileInputRef.current?.click();
              play("tap");
            }}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-clay-muted/30 rounded-clay-sm cursor-pointer hover:bg-clay-raised transition-colors"
          >
            <CameraIcon size={24} className="text-clay-muted mb-2" />
            <span className="font-body text-sm font-semibold text-clay-ink-soft">
              {files.length > 0 ? `${files.length} photo${files.length === 1 ? '' : 's'} selected` : "Tap to select photos"}
            </span>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={uploading}
              className="w-full bg-clay-sunken shadow-clay-inset-sm rounded-clay-sm px-4 py-2.5 font-body text-sm placeholder:text-clay-muted focus:outline-none"
            />
            <input
              type="text"
              placeholder="Location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={uploading}
              className="w-full bg-clay-sunken shadow-clay-inset-sm rounded-clay-sm px-4 py-2.5 font-body text-sm placeholder:text-clay-muted focus:outline-none"
            />
          </div>

          {error && <p className="font-body text-sm text-clay-blush">{error}</p>}
          {uploading && progress && (
            <p className="font-body text-sm text-clay-muted text-center">
              Uploading {progress.done} of {progress.total}…
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <ClayButton
              size="sm"
              tone="surface"
              className="flex-1"
              disabled={uploading}
              onClick={() => { play("tap"); onCancel(); }}
            >
              Cancel
            </ClayButton>
            <ClayButton
              size="sm"
              tone="mint"
              className="flex-1"
              disabled={files.length === 0 || uploading}
              onClick={handleUpload}
            >
              {uploading ? "Posting…" : "Post memories"}
            </ClayButton>
          </div>
        </div>
      </ClayCard>
    </motion.div>
  );
}
