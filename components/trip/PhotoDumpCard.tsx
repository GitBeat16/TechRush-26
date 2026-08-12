"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { ClayCard } from "@/components/ui/ClayCard";
import { 
  HeartIcon, 
  MapPinIcon, 
  TrashIcon, 
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@/components/ui/Icons";
import { 
  togglePhotoDumpLike, 
  togglePhotoDumpSave, 
  deletePhotoDump 
} from "@/lib/photo-dumps";
import type { PhotoDump } from "@/types/photo-dump";
import { useFeedback } from "@/lib/feedback";

// simple date formatter instead of date-fns
function formatDistanceToNow(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function PhotoDumpCard({
  tripId,
  dump,
  viewerId,
  onChange,
  onRemoved,
}: {
  tripId: string;
  dump: PhotoDump;
  viewerId: string;
  onChange: (dump: PhotoDump) => void;
  onRemoved: () => void;
}) {
  const { play } = useFeedback();
  const [deleting, setDeleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleLike = async () => {
    if (!viewerId) return;
    play("toggleOn");
    
    // Optimistic update
    onChange({
      ...dump,
      likedByMe: !dump.likedByMe,
      likeCount: dump.likedByMe ? dump.likeCount - 1 : dump.likeCount + 1,
    });
    
    try {
      await togglePhotoDumpLike(tripId, dump.id);
    } catch {
      // Revert if error (simple implementation)
      onChange(dump);
    }
  };

  const handleSave = async () => {
    if (!viewerId) return;
    play("toggleOn");
    
    // Optimistic update
    onChange({
      ...dump,
      savedByMe: !dump.savedByMe,
    });
    
    try {
      await togglePhotoDumpSave(tripId, dump.id);
    } catch {
      onChange(dump);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this memory?")) {
      setDeleting(true);
      play("toggleOff");
      try {
        await deletePhotoDump(tripId, dump.id);
        onRemoved();
      } catch {
        setDeleting(false);
      }
    }
  };

  const isOwner = viewerId === dump.ownerId;

  const nextImage = () => {
    if (currentIndex < dump.images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      play("tap");
    }
  };

  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      play("tap");
    }
  };

  return (
    <ClayCard tone="surface" radius="lg" depth="sm" className="flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-clay-muted/15">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-clay-sunken flex items-center justify-center text-clay-muted">
             <UserIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm font-semibold text-clay-ink">
              {dump.ownerName || "Traveler"}
            </span>
            <span className="font-body text-[10px] text-clay-muted">
              {dump.createdAt ? formatDistanceToNow(dump.createdAt) : "recently"}
            </span>
          </div>
        </div>
        {isOwner && (
          <button 
            onClick={handleDelete}
            disabled={deleting}
            className="text-clay-muted hover:text-clay-blush transition-colors p-1"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Images Carousel */}
      <div className="relative aspect-square w-full bg-clay-sunken overflow-hidden group">
        {dump.images && dump.images.length > 0 ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = offset.x;
                  if (swipe < -50 || velocity.x < -500) {
                    nextImage();
                  } else if (swipe > 50 || velocity.x > 500) {
                    prevImage();
                  }
                }}
              >
                <Image
                  src={dump.images[currentIndex].url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14px' fill='%239ca3af'%3EMissing Image%3C/text%3E%3C/svg%3E"}
                  alt={dump.caption || "Travel memory"}
                  fill
                  className="object-cover pointer-events-none"
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {dump.images.length > 1 && (
              <>
                {currentIndex > 0 && (
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                )}
                {currentIndex < dump.images.length - 1 && (
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                )}
              </>
            )}

            {/* Dots Indicator */}
            {dump.images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                {dump.images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                      idx === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-clay-muted">
            No images
          </div>
        )}
      </div>

      {/* Actions & Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button onClick={handleLike} className="flex items-center gap-1 group">
              <HeartIcon className={`h-6 w-6 transition-colors ${dump.likedByMe ? 'text-clay-blush' : 'text-clay-ink-soft group-hover:text-clay-blush'}`} />
              {dump.likeCount > 0 && <span className="font-body text-xs font-semibold">{dump.likeCount}</span>}
            </button>
          </div>
          <button onClick={handleSave}>
            <HeartIcon className={`h-6 w-6 transition-colors ${dump.savedByMe ? 'text-clay-ink' : 'text-clay-ink-soft hover:text-clay-ink'}`} />
          </button>
        </div>

        {dump.caption && (
          <p className="font-body text-sm text-clay-ink line-clamp-2 mt-1">
            {dump.caption}
          </p>
        )}
        
        {dump.location && (
          <div className="flex items-center gap-1 mt-2 text-clay-muted">
            <MapPinIcon className="h-3 w-3" />
            <span className="font-body text-xs truncate">{dump.location}</span>
          </div>
        )}
      </div>
    </ClayCard>
  );
}
