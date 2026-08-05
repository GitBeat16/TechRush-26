"use client";

import { useRive } from "@rive-app/react-canvas";
import { motion } from "framer-motion";
import { breathe, floatY, springSoft } from "@/lib/animations";

/* ------------------------------------------------------------------ */
/* Travel assistant character.                                         */
/*                                                                     */
/* Drop a .riv file in /public and pass `src` (plus artboard /          */
/* stateMachine) to swap the hand-modelled clay mascot below for the    */
/* real Rive rig — no other component needs to change.                  */
/* ------------------------------------------------------------------ */

export interface RiveCharacterProps {
  /** e.g. "/rive/wanderly-guide.riv" */
  src?: string;
  artboard?: string;
  stateMachine?: string;
  size?: number;
  className?: string;
}

export function RiveCharacter({
  src,
  artboard,
  stateMachine = "State Machine 1",
  size = 220,
  className = "",
}: RiveCharacterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...springSoft, delay: 0.25 }}
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* soft clay pedestal so the character always sits in the scene */}
      <div className="absolute bottom-2 left-1/2 h-5 w-[62%] -translate-x-1/2 rounded-full bg-clay-bg-deep opacity-70 blur-[6px]" />

      {src ? (
        <RiveStage
          src={src}
          artboard={artboard}
          stateMachine={stateMachine}
          size={size}
        />
      ) : (
        <ClayGuide size={size} />
      )}
    </motion.div>
  );
}

function RiveStage({
  src,
  artboard,
  stateMachine,
  size,
}: {
  src: string;
  artboard?: string;
  stateMachine: string;
  size: number;
}) {
  const { RiveComponent } = useRive({
    src,
    artboard,
    stateMachines: stateMachine,
    autoplay: true,
  });

  return <RiveComponent style={{ width: size, height: size }} />;
}

/* ------------------------------------------------------------------ */
/* The stand-in: a chunky clay travel guide with a backpack.           */
/* ------------------------------------------------------------------ */

function ClayGuide({ size }: { size: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      aria-hidden="true"
      {...floatY(9, 5.2)}
    >
      {/* backpack */}
      <rect x="52" y="96" width="46" height="58" rx="20" fill="#8fb6ee" />
      <rect x="60" y="112" width="30" height="20" rx="9" fill="#6f9ee6" />

      {/* body */}
      <motion.g {...breathe(1.03, 4.2)} style={{ originX: "110px", originY: "170px" }}>
        <path
          d="M74 168c0-26 16-44 36-44s36 18 36 44a10 10 0 0 1-10 10H84a10 10 0 0 1-10-10Z"
          fill="#ffd7b3"
        />
        <path
          d="M110 124c20 0 36 18 36 44a10 10 0 0 1-10 10h-14c8-20 2-42-12-54Z"
          fill="#f2b283"
          opacity="0.7"
        />
        {/* scarf */}
        <path d="M84 132c14 10 38 10 52 0l4 12c-18 12-42 12-60 0Z" fill="#f7a8b8" />
      </motion.g>

      {/* waving arm */}
      <motion.g
        animate={{ rotate: [0, -16, 4, -12, 0] }}
        transition={{
          type: "tween",
          duration: 3.4,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 1.6,
        }}
        style={{ originX: "148px", originY: "142px" }}
      >
        <rect x="140" y="128" width="18" height="42" rx="9" fill="#ffd7b3" />
        <circle cx="149" cy="124" r="12" fill="#ffcfa4" />
      </motion.g>

      {/* head */}
      <motion.g {...floatY(4, 3.4, 0.3)}>
        <circle cx="110" cy="86" r="40" fill="#ffd7b3" />
        <path d="M110 46a40 40 0 0 1 0 80c14-22 14-58 0-80Z" fill="#f2b283" opacity="0.55" />
        {/* hat */}
        <path d="M64 74c6-24 24-38 46-38s40 14 46 38Z" fill="#7fcfae" />
        <rect x="52" y="70" width="116" height="14" rx="7" fill="#5fbd98" />
        <ellipse cx="92" cy="56" rx="14" ry="6" fill="#ffffff" opacity="0.45" transform="rotate(-18 92 56)" />

        {/* eyes — blink loop */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
          transition={{
            type: "tween",
            duration: 4.6,
            repeat: Infinity,
            times: [0, 0.72, 0.77, 0.82, 1],
          }}
          style={{ originY: "94px" }}
        >
          <circle cx="96" cy="94" r="5.2" fill="#4a3a30" />
          <circle cx="126" cy="94" r="5.2" fill="#4a3a30" />
          <circle cx="97.6" cy="92.2" r="1.8" fill="#ffffff" />
          <circle cx="127.6" cy="92.2" r="1.8" fill="#ffffff" />
        </motion.g>

        {/* cheeks + smile */}
        <ellipse cx="86" cy="106" rx="7" ry="4.6" fill="#f7a8b8" opacity="0.75" />
        <ellipse cx="136" cy="106" rx="7" ry="4.6" fill="#f7a8b8" opacity="0.75" />
        <path
          d="M102 108c4 5 12 5 16 0"
          stroke="#4a3a30"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      </motion.g>
    </motion.svg>
  );
}
