import React from 'react';
import { GemType, SpecialType } from '../types/game';

interface GemGraphicProps {
  type: GemType;
  special?: SpecialType;
  className?: string;
  isHint?: boolean;
  isSelected?: boolean;
}

export const GemGraphic: React.FC<GemGraphicProps> = ({
  type,
  special = 'none',
  className = '',
  isHint = false,
  isSelected = false,
}) => {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none pointer-events-none transition-transform duration-150 ${
        isSelected ? 'scale-110 drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]' : ''
      } ${isHint ? 'scale-105 drop-shadow-[0_0_14px_rgba(255,255,255,1)] animate-pulse' : ''} ${className}`}
    >
      {/* Base Gem SVG */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
      >
        <defs>
          {/* Ruby Gradients */}
          <radialGradient id="rubyCenter" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="25%" stopColor="#ef4444" />
            <stop offset="70%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
          <linearGradient id="rubyEdgeTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <linearGradient id="rubyEdgeBottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>

          {/* Diamond Gradients */}
          <radialGradient id="diamondCenter" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#f1f5f9" />
            <stop offset="70%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
          <linearGradient id="diamondFacet1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="diamondFacet2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Amber Hexagon Gradients */}
          <radialGradient id="amberCenter" cx="38%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="25%" stopColor="#fb923c" />
            <stop offset="70%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </radialGradient>
          <linearGradient id="amberFacetTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="amberFacetBottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>

          {/* Sapphire Teardrop Gradients */}
          <radialGradient id="sapphireCenter" cx="40%" cy="30%" r="68%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="25%" stopColor="#38bdf8" />
            <stop offset="65%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#172554" />
          </radialGradient>
          <linearGradient id="sapphireTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="sapphireBottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Topaz Rhombus Gradients */}
          <radialGradient id="topazCenter" cx="42%" cy="36%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="30%" stopColor="#facc15" />
            <stop offset="75%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#713f12" />
          </radialGradient>
          <linearGradient id="topazFacetLeft" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
          <linearGradient id="topazFacetRight" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>

          {/* Emerald Octagon Gradients */}
          <radialGradient id="emeraldCenter" cx="38%" cy="34%" r="65%">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="25%" stopColor="#4ade80" />
            <stop offset="70%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#052e16" />
          </radialGradient>
          <linearGradient id="emeraldTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          <linearGradient id="emeraldBottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#166534" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>

          {/* Amethyst Triangle Gradients */}
          <radialGradient id="amethystCenter" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#f5d0fe" />
            <stop offset="30%" stopColor="#c084fc" />
            <stop offset="70%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#3b0764" />
          </radialGradient>
          <linearGradient id="amethystFacetLeft" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
          <linearGradient id="amethystFacetRight" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#581c87" />
          </linearGradient>

          {/* Hypercube Rainbow Gradient */}
          <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="20%" stopColor="#ff7f00" />
            <stop offset="40%" stopColor="#ffff00" />
            <stop offset="60%" stopColor="#00ff00" />
            <stop offset="80%" stopColor="#0000ff" />
            <stop offset="100%" stopColor="#8b00ff" />
          </linearGradient>
        </defs>

        {/* 1. RUBY (Red Square Cut with beveled edges and 4-square cross facets) */}
        {type === 'ruby' && (
          <g>
            {/* Outer beveled boundary */}
            <polygon points="18,12 82,12 88,18 88,82 82,88 18,88 12,82 12,18" fill="url(#rubyEdgeBottom)" />
            {/* Outer top facet */}
            <polygon points="18,12 82,12 74,24 26,24" fill="url(#rubyEdgeTop)" />
            {/* Outer bottom facet */}
            <polygon points="18,88 82,88 74,76 26,76" fill="#580f0f" />
            {/* Outer left facet */}
            <polygon points="12,18 26,24 26,76 12,82" fill="#ef4444" opacity="0.6" />
            {/* Outer right facet */}
            <polygon points="88,18 74,24 74,76 88,82" fill="#7f1d1d" />
            {/* Center table */}
            <polygon points="26,24 74,24 74,76 26,76" fill="url(#rubyCenter)" stroke="#fee2e2" strokeWidth="1" />
            {/* 4-square cross facets in ruby center matching screenshot */}
            <line x1="50" y1="24" x2="50" y2="76" stroke="#fecaca" strokeWidth="1.5" opacity="0.75" />
            <line x1="26" y1="50" x2="74" y2="50" stroke="#fecaca" strokeWidth="1.5" opacity="0.75" />
            {/* Top-left inner shine square */}
            <rect x="30" y="28" width="16" height="18" fill="#ffffff" opacity="0.45" rx="1" />
            {/* High sparkle dot */}
            <circle cx="34" cy="32" r="3" fill="#ffffff" opacity="0.9" />
          </g>
        )}

        {/* 2. DIAMOND (White Brilliant Octagonal/Circular Cut) */}
        {type === 'diamond' && (
          <g>
            {/* Outer octagonal perimeter */}
            <polygon points="30,12 70,12 88,30 88,70 70,88 30,88 12,70 12,30" fill="#334155" />
            {/* Brilliant cut bezel facets */}
            <polygon points="30,12 70,12 62,28 38,28" fill="url(#diamondFacet1)" />
            <polygon points="70,12 88,30 72,38 62,28" fill="#cbd5e1" />
            <polygon points="88,30 88,70 72,62 72,38" fill="url(#diamondFacet2)" />
            <polygon points="88,70 70,88 62,72 72,62" fill="#64748b" />
            <polygon points="70,88 30,88 38,72 62,72" fill="#475569" />
            <polygon points="30,88 12,70 28,62 38,72" fill="#94a3b8" />
            <polygon points="12,70 12,30 28,38 28,62" fill="#e2e8f0" />
            <polygon points="12,30 30,12 38,28 28,38" fill="#ffffff" />
            {/* Center table */}
            <polygon points="38,28 62,28 72,38 72,62 62,72 38,72 28,62 28,38" fill="url(#diamondCenter)" stroke="#ffffff" strokeWidth="1.2" />
            {/* Geometric diamond facet lines (Cross & Rhombus table highlight instead of star shape) */}
            <polygon points="50,34 64,50 50,66 36,50" fill="#ffffff" opacity="0.35" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="42" cy="42" r="3" fill="#ffffff" opacity="0.95" />
          </g>
        )}

        {/* 3. AMBER (Orange Hexagonal Cut) */}
        {type === 'amber' && (
          <g>
            {/* Outer hexagon */}
            <polygon points="26,14 74,14 88,50 74,86 26,86 12,50" fill="url(#amberFacetBottom)" />
            {/* Top facet */}
            <polygon points="26,14 74,14 66,28 34,28" fill="url(#amberFacetTop)" />
            {/* Top-left facet */}
            <polygon points="26,14 34,28 26,50 12,50" fill="#fed7aa" opacity="0.8" />
            {/* Top-right facet */}
            <polygon points="74,14 88,50 74,50 66,28" fill="#ea580c" />
            {/* Bottom-right facet */}
            <polygon points="88,50 74,86 66,72 74,50" fill="#9a3412" />
            {/* Bottom facet */}
            <polygon points="74,86 26,86 34,72 66,72" fill="#7c2d12" />
            {/* Bottom-left facet */}
            <polygon points="26,86 12,50 26,50 34,72" fill="#c2410c" />
            {/* Inner table */}
            <polygon points="34,28 66,28 74,50 66,72 34,72 26,50" fill="url(#amberCenter)" stroke="#fef08a" strokeWidth="1" />
            {/* Gloss highlight */}
            <ellipse cx="45" cy="38" rx="14" ry="7" fill="#ffffff" opacity="0.4" transform="rotate(-10 45 38)" />
            <circle cx="40" cy="35" r="3" fill="#ffffff" opacity="0.9" />
          </g>
        )}

        {/* 4. SAPPHIRE (Blue Pointed Teardrop / Shield Cut) */}
        {type === 'sapphire' && (
          <g>
            {/* Pointed-down shield cut */}
            <polygon points="20,16 80,16 88,32 50,88 12,32" fill="url(#sapphireBottom)" />
            {/* Top facet */}
            <polygon points="20,16 80,16 70,30 30,30" fill="url(#sapphireTop)" />
            {/* Left facet */}
            <polygon points="20,16 12,32 32,46 30,30" fill="#60a5fa" />
            {/* Right facet */}
            <polygon points="80,16 88,32 68,46 70,30" fill="#1d4ed8" />
            {/* Lower-left pointed facet */}
            <polygon points="12,32 50,88 50,62 32,46" fill="#2563eb" />
            {/* Lower-right pointed facet */}
            <polygon points="88,32 50,88 50,62 68,46" fill="#1e3a8a" />
            {/* Center table */}
            <polygon points="30,30 70,30 68,46 50,62 32,46" fill="url(#sapphireCenter)" stroke="#bae6fd" strokeWidth="1" />
            {/* Gloss arc */}
            <polygon points="32,32 68,32 60,38 36,38" fill="#ffffff" opacity="0.6" />
            <circle cx="42" cy="38" r="3" fill="#ffffff" opacity="0.95" />
          </g>
        )}

        {/* 5. TOPAZ (Yellow Rhombus / 45° Diamond Cut) */}
        {type === 'topaz' && (
          <g>
            {/* 45-degree diamond outline */}
            <polygon points="50,10 90,50 50,90 10,50" fill="#713f12" />
            {/* Top-left kite facet */}
            <polygon points="50,10 50,50 10,50" fill="url(#topazFacetLeft)" />
            {/* Top-right kite facet */}
            <polygon points="50,10 90,50 50,50" fill="#facc15" />
            {/* Bottom-left kite facet */}
            <polygon points="10,50 50,50 50,90" fill="#eab308" />
            {/* Bottom-right kite facet */}
            <polygon points="50,50 90,50 50,90" fill="url(#topazFacetRight)" />
            {/* Inner diamond table */}
            <polygon points="50,26 74,50 50,74 26,50" fill="url(#topazCenter)" stroke="#fef9c3" strokeWidth="1" />
            {/* Bright gleam */}
            <polygon points="50,28 62,50 50,46 38,50" fill="#ffffff" opacity="0.6" />
            <circle cx="45" cy="40" r="3" fill="#ffffff" opacity="0.9" />
          </g>
        )}

        {/* 6. EMERALD (Green Octagonal Emerald Cut) */}
        {type === 'emerald' && (
          <g>
            {/* Octagonal rectangle boundary */}
            <polygon points="26,14 74,14 88,28 88,72 74,86 26,86 12,72 12,28" fill="url(#emeraldBottom)" />
            {/* Top facet */}
            <polygon points="26,14 74,14 66,26 34,26" fill="url(#emeraldTop)" />
            {/* Bottom facet */}
            <polygon points="26,86 74,86 66,74 34,74" fill="#064e3b" />
            {/* Left facet */}
            <polygon points="12,28 12,72 24,66 24,34" fill="#4ade80" opacity="0.8" />
            {/* Right facet */}
            <polygon points="88,28 88,72 76,66 76,34" fill="#14532d" />
            {/* Corner step facets */}
            <polygon points="12,28 26,14 34,26 24,34" fill="#86efac" />
            <polygon points="74,14 88,28 76,34 66,26" fill="#22c55e" />
            <polygon points="88,72 74,86 66,74 76,66" fill="#052e16" />
            <polygon points="26,86 12,72 24,66 34,74" fill="#166534" />
            {/* Center table */}
            <polygon points="34,26 66,26 76,34 76,66 66,74 34,74 24,66 24,34" fill="url(#emeraldCenter)" stroke="#dcfce7" strokeWidth="1" />
            {/* Step cut inner line */}
            <rect x="36" y="36" width="28" height="28" fill="none" stroke="#86efac" strokeWidth="1" opacity="0.6" />
            {/* Top-left glare */}
            <rect x="28" y="30" width="16" height="12" fill="#ffffff" opacity="0.4" rx="1" />
            <circle cx="34" cy="34" r="3" fill="#ffffff" opacity="0.9" />
          </g>
        )}

        {/* 7. AMETHYST (Purple Triangle Cut) */}
        {type === 'amethyst' && (
          <g>
            {/* Equilateral triangle pointing UP */}
            <polygon points="50,12 88,84 12,84" fill="#3b0764" />
            {/* Left face */}
            <polygon points="50,12 50,56 12,84" fill="url(#amethystFacetLeft)" />
            {/* Right face */}
            <polygon points="50,12 88,84 50,56" fill="url(#amethystFacetRight)" />
            {/* Bottom face */}
            <polygon points="12,84 50,56 88,84" fill="#4c1d95" />
            {/* Inner table triangle */}
            <polygon points="50,28 72,74 28,74" fill="url(#amethystCenter)" stroke="#f5d0fe" strokeWidth="1" />
            {/* Glint line */}
            <polygon points="50,30 58,54 44,54" fill="#ffffff" opacity="0.5" />
            <circle cx="46" cy="46" r="3" fill="#ffffff" opacity="0.9" />
          </g>
        )}
      </svg>

      {/* SPECIAL GEM OVERLAYS */}

      {/* 1. Flame Gem (4-match): Pulsing Flame effect */}
      {special === 'flame' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 rounded-full animate-ping opacity-60 bg-gradient-to-tr from-amber-500 via-red-500 to-yellow-300 blur-sm" />
          <div className="absolute inset-[-4px] rounded-full animate-pulse border-2 border-amber-300 opacity-90 shadow-[0_0_15px_#f59e0b]" />
          <svg viewBox="0 0 40 40" className="w-6 h-6 z-10 drop-shadow-[0_0_8px_#f97316]">
            <path
              d="M20 4 C22 10 28 14 28 22 C28 28 24 34 20 36 C16 34 12 28 12 22 C12 16 16 12 20 4 Z"
              fill="#fbbf24"
              className="animate-pulse"
            />
            <path
              d="M20 14 C21 17 24 20 24 25 C24 29 22 31 20 33 C18 31 16 29 16 25 C16 21 19 18 20 14 Z"
              fill="#ef4444"
            />
          </svg>
        </div>
      )}

      {/* 2. Star Gem (T/L match): Sparkling Cross Beams */}
      {special === 'star' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 rounded-full animate-spin [animation-duration:6s] opacity-75">
            <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_8px_#fff]" />
            <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-gradient-to-b from-transparent via-white to-transparent shadow-[0_0_8px_#fff]" />
          </div>
          <div className="absolute w-5 h-5 rounded-full bg-white opacity-90 blur-[2px] animate-pulse" />
          <svg viewBox="0 0 24 24" className="w-5 h-5 z-10 text-white fill-white drop-shadow-[0_0_8px_#38bdf8]">
            <polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" />
          </svg>
        </div>
      )}

      {/* 3. Hypercube (5-match): Cosmic Rainbow Cube */}
      {special === 'hypercube' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-[82%] h-[82%] rounded-xl animate-spin [animation-duration:4s] border-2 border-white shadow-[0_0_16px_rgba(255,255,255,0.9)] bg-gradient-to-tr from-rose-500 via-amber-400 via-emerald-400 via-sky-500 to-purple-600 opacity-90 flex items-center justify-center">
            <div className="w-[60%] h-[60%] rounded-lg bg-white/40 backdrop-blur-xs flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white animate-ping" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
