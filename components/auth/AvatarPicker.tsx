"use client";

import { motion } from "framer-motion";
import { AVATARS, ClayAvatar } from "@/components/ui/ClayAvatar";
import { CheckIcon } from "@/components/ui/Icons";
import { springSnappy } from "@/lib/animations";
import { feedback } from "@/lib/feedback";

export function AvatarPicker({
  value,
  onChange,
  size = 56,
  columns = "grid-cols-6",
}: {
  value: string;
  onChange: (id: string) => void;
  size?: number;
  columns?: string;
}) {
  return (
    <div className={`grid ${columns} gap-2.5`}>
      {AVATARS.map((avatar) => {
        const active = avatar.id === value;

        return (
          <motion.button
            key={avatar.id}
            type="button"
            whileHover={{ y: -4, scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={springSnappy}
            onClick={() => {
              feedback("toggleOn");
              onChange(avatar.id);
            }}
            aria-pressed={active}
            aria-label={avatar.label}
            title={avatar.label}
            className="relative flex items-center justify-center rounded-full"
          >
            <ClayAvatar id={avatar.id} size={size} />
            {active && (
              <>
                <motion.span
                  layoutId="avatar-ring"
                  transition={springSnappy}
                  className="pointer-events-none absolute inset-[-5px] rounded-full ring-4 ring-clay-tangerine"
                />
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={springSnappy}
                  className="pointer-events-none absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-clay-jade text-white shadow-clay-xs"
                >
                  <CheckIcon size={11} />
                </motion.span>
              </>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
