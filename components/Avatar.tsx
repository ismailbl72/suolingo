import React, { useEffect, useRef, useState } from 'react';
import { AvatarMode } from '../types';

interface AvatarProps {
  mode: AvatarMode;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ mode, size = 200 }) => { // Default size increased for detail
  // Refs for animation physics (using refs for performance/smoothness)
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const lastBlinkRef = useRef<number>(Date.now());
  const lastVisemeRef = useRef<number>(Date.now());
  
  // Animation Variables (Mutable for loop)
  const currentMouthOpen = useRef(0);
  const targetMouthOpen = useRef(0);
  const currentHeadY = useRef(0);
  const currentEyeOpen = useRef(1);
  const blinkState = useRef(0); // 0: Open, 1: Closing, 2: Opening
  
  // React State for render trigger (optional if using direct DOM manip, but we use React binding)
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Constants
  const BLINK_INTERVAL_MIN = 2000;
  const BLINK_INTERVAL_VAR = 4000;
  const VISEME_INTERVAL_MIN = 50;
  const VISEME_INTERVAL_VAR = 150;

  const animate = () => {
    const now = Date.now();
    const time = (now - startTimeRef.current) / 1000;

    // --- 1. Head Physics (Breathing/Idle) ---
    // Smooth sine wave for breathing/floating
    const breathFreq = mode === AvatarMode.LISTENING ? 0.5 : 0.8;
    const breathAmp = mode === AvatarMode.SPEAKING ? 2 : 3;
    const targetY = Math.sin(time * breathFreq) * breathAmp;
    currentHeadY.current += (targetY - currentHeadY.current) * 0.1; // Smooth dampening

    // --- 2. Advanced Blinking Logic ---
    if (blinkState.current === 0) {
        // Waiting to blink
        if (now - lastBlinkRef.current > BLINK_INTERVAL_MIN + Math.random() * BLINK_INTERVAL_VAR) {
            blinkState.current = 1; // Start closing
        }
        currentEyeOpen.current = 1;
    } else if (blinkState.current === 1) {
        // Closing
        currentEyeOpen.current -= 0.15; // Speed of closing
        if (currentEyeOpen.current <= 0) {
            currentEyeOpen.current = 0;
            blinkState.current = 2; // Start opening
        }
    } else if (blinkState.current === 2) {
        // Opening
        currentEyeOpen.current += 0.15; // Speed of opening
        if (currentEyeOpen.current >= 1) {
            currentEyeOpen.current = 1;
            blinkState.current = 0; // Done
            lastBlinkRef.current = now;
        }
    }

    // --- 3. Realistic Lip Sync (Physics Based) ---
    if (mode === AvatarMode.SPEAKING) {
        // Change target mouth shape rhythmically (simulating syllables)
        if (now - lastVisemeRef.current > VISEME_INTERVAL_MIN + Math.random() * VISEME_INTERVAL_VAR) {
            // Randomly choose a target openness (0.2 to 1.0)
            // Bias towards 0.4-0.8 for normal speech
            targetMouthOpen.current = 0.2 + Math.random() * 0.7;
            lastVisemeRef.current = now;
        }
    } else if (mode === AvatarMode.LISTENING) {
        targetMouthOpen.current = 0.1; // Slightly open listening
    } else {
        targetMouthOpen.current = 0; // Closed
    }

    // Smoothly interpolate current openness to target (Lerp)
    // Factor 0.2 gives a snappy but smooth muscle movement feel
    currentMouthOpen.current += (targetMouthOpen.current - currentMouthOpen.current) * 0.2;

    // Trigger Re-render
    setRenderTrigger(now);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [mode]);

  // --- Rendering Calculations ---
  
  // Interpolated values
  const mo = currentMouthOpen.current;
  const hy = currentHeadY.current;
  const eo = currentEyeOpen.current;

  // Dynamic Path Calculations
  // Mouth: A quadratic bezier curve for the lower lip that drops with 'mo'
  const mouthWidth = 40;
  const smileFactor = mode === AvatarMode.LISTENING ? 2 : 5; // Slight smile when idle/listening
  
  // Upper Lip (Static-ish)
  const ulY = 110; 
  const ulCurve = 110 + smileFactor; 
  
  // Lower Lip (Dynamic)
  // Drops significantly when opening
  const jawDrop = mo * 25; 
  const llY = 110 + jawDrop; 
  const llCurve = 120 + jawDrop + (mo * 10); 

  // Mouth Interior (Masking)
  const mouthPath = `
    M 75 110 
    m -${mouthWidth/2} 0 
    Q 75 ${ulCurve} 95 110 
    Q 75 ${llCurve} 55 110 
    Z
  `;

  return (
    <div style={{ width: size, height: size }} className="relative drop-shadow-2xl">
      <svg
        width={size}
        height={size}
        viewBox="0 0 150 150"
        className="overflow-visible"
        style={{
            transform: `translateY(${hy}px)`,
        }}
      >
        <defs>
            {/* Realistic Skin Gradient */}
            <radialGradient id="skinGradient" cx="0.4" cy="0.4" r="0.6">
                <stop offset="0%" stopColor="#FFDFC4" />
                <stop offset="60%" stopColor="#E0B094" />
                <stop offset="100%" stopColor="#C89078" />
            </radialGradient>
            
            {/* Eye Gradient */}
            <radialGradient id="irisGradient" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#4A90E2" /> {/* Light Blue */}
                <stop offset="80%" stopColor="#1B3A57" /> {/* Dark Blue rim */}
                <stop offset="100%" stopColor="#0F2030" />
            </radialGradient>

            {/* Hair Gradient */}
            <linearGradient id="hairGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3E2723" />
                <stop offset="100%" stopColor="#1B100E" />
            </linearGradient>

            {/* Drop Shadow for face features */}
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                <feOffset dx="1" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3"/>
                </feComponentTransfer>
                <feMerge> 
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/> 
                </feMerge>
            </filter>
        </defs>

        {/* --- Back Hair --- */}
        <path d="M 35 60 Q 30 140 75 145 Q 120 140 115 60 Z" fill="url(#hairGradient)" />

        {/* --- Neck --- */}
        <path d="M 55 120 L 55 150 L 95 150 L 95 120 Z" fill="#D49A80" />
        <path d="M 55 150 Q 75 160 95 150" fill="#D49A80" />

        {/* --- Face Shape --- */}
        {/* Complex path for jawline and cheeks */}
        <path 
            d="M 30 65 
               Q 25 100 50 125 
               Q 75 145 100 125 
               Q 125 100 120 65 
               Q 115 20 75 20 
               Q 35 20 30 65 Z" 
            fill="url(#skinGradient)" 
        />

        {/* --- Ears --- */}
        <path d="M 28 75 Q 20 60 28 90" fill="#E0B094" stroke="#C89078" strokeWidth="1" />
        <path d="M 122 75 Q 130 60 122 90" fill="#E0B094" stroke="#C89078" strokeWidth="1" />

        {/* --- Eyes Container --- */}
        <g transform="translate(0, 0)">
            {/* Left Eye */}
            <g transform="translate(50, 70)">
                <path d="M -12 0 Q 0 -8 12 0 Q 0 8 -12 0 Z" fill="#FFF" /> {/* Sclera */}
                <circle cx="0" cy="0" r="5.5" fill="url(#irisGradient)" /> {/* Iris */}
                <circle cx="0" cy="0" r="2.5" fill="#000" /> {/* Pupil */}
                <circle cx="2" cy="-2" r="1.5" fill="#FFF" opacity="0.8" /> {/* Highlight */}
                {/* Eyelid */}
                <path d="M -13 0 Q 0 -9 13 0 Q 0 -9 -13 0" fill="#E0B094" stroke="#C89078" strokeWidth="2" opacity={1-eo} />
                <path d="M -13 0 Q 0 -9 13 0 L 13 -10 L -13 -10 Z" fill="#E0B094" transform={`translate(0, ${(1-eo)*8})`} />
            </g>

            {/* Right Eye */}
            <g transform="translate(100, 70)">
                <path d="M -12 0 Q 0 -8 12 0 Q 0 8 -12 0 Z" fill="#FFF" />
                <circle cx="0" cy="0" r="5.5" fill="url(#irisGradient)" />
                <circle cx="0" cy="0" r="2.5" fill="#000" />
                <circle cx="2" cy="-2" r="1.5" fill="#FFF" opacity="0.8" />
                {/* Eyelid */}
                <path d="M -13 0 Q 0 -9 13 0 L 13 -10 L -13 -10 Z" fill="#E0B094" transform={`translate(0, ${(1-eo)*8})`} />
            </g>

            {/* Eyebrows (Detailed) */}
            <path d="M 38 58 Q 50 52 62 58" stroke="#2C1810" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
            <path d="M 88 58 Q 100 52 112 58" stroke="#2C1810" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
        </g>

        {/* --- Nose (Realistic Shading) --- */}
        <path d="M 75 65 L 72 90 L 78 90 Z" fill="#D49A80" opacity="0.6" filter="blur(1px)" />
        <path d="M 70 92 Q 75 96 80 92" stroke="#C89078" strokeWidth="2" fill="none" opacity="0.7" />

        {/* --- Cheeks (Subtle Blush) --- */}
        <ellipse cx="45" cy="95" rx="8" ry="5" fill="#E57373" opacity="0.15" filter="blur(3px)" />
        <ellipse cx="105" cy="95" rx="8" ry="5" fill="#E57373" opacity="0.15" filter="blur(3px)" />

        {/* --- Mouth System (Complex) --- */}
        <g>
            {/* 1. Mouth Cavity (Dark) - Only visible when open */}
            <path d={mouthPath} fill="#5D2E2E" stroke="none" />
            
            {/* 2. Tongue - animated */}
            {mo > 0.3 && (
                <path 
                    d={`M 65 ${110 + jawDrop - 5} Q 75 ${110 + jawDrop - 10} 85 ${110 + jawDrop - 5}`} 
                    stroke="#E57373" strokeWidth="4" strokeLinecap="round" 
                />
            )}

            {/* 3. Upper Teeth - subtle, only visible when talking */}
            {mo > 0.4 && (
                <path d="M 65 112 Q 75 115 85 112" stroke="#FFF" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
            )}

            {/* 4. Lips (Outer Ring) */}
            <path 
                d={`M 55 110 Q 75 ${ulCurve-3} 95 110 Q 75 ${llCurve+3} 55 110`} 
                stroke="#D48C8C" 
                strokeWidth="2.5" 
                fill="none" 
                opacity="0.9"
            />
        </g>

        {/* --- Front Hair --- */}
        {/* Stylish modern cut */}
        <path d="M 30 65 Q 40 30 75 30 Q 110 30 120 65" fill="none" /> {/* Guide */}
        <path d="M 30 65 C 30 30, 60 20, 100 35 C 100 35, 120 40, 120 70 L 122 50 C 120 20, 80 10, 30 50 Z" fill="url(#hairGradient)" />

    </svg>
    </div>
  );
};
