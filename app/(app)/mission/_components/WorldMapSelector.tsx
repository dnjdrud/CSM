"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MISSION_COUNTRIES, type MissionCountry } from "@/lib/mission/countries";

/* ─── Simplified continent SVG paths (viewBox 0 0 1000 480) ──────────── */

const CONTINENT_PATHS = [
  // North America
  {
    id: "na",
    d: "M 60 80 L 200 70 L 240 90 L 260 130 L 230 160 L 250 200 L 220 230 L 200 210 L 170 240 L 140 250 L 110 230 L 80 200 L 60 170 L 40 130 Z",
  },
  // Central America / Caribbean
  {
    id: "ca",
    d: "M 140 250 L 160 260 L 155 290 L 140 300 L 125 280 Z",
  },
  // South America
  {
    id: "sa",
    d: "M 130 295 L 160 280 L 200 290 L 230 310 L 250 360 L 240 420 L 210 450 L 180 450 L 150 420 L 130 380 L 120 340 Z",
  },
  // Europe
  {
    id: "eu",
    d: "M 430 60 L 490 55 L 530 70 L 540 100 L 510 120 L 480 130 L 450 120 L 420 100 Z",
  },
  // Africa
  {
    id: "af",
    d: "M 430 130 L 510 120 L 540 145 L 545 200 L 530 260 L 510 320 L 480 370 L 450 380 L 420 360 L 400 310 L 390 250 L 400 190 L 415 150 Z",
  },
  // Middle East
  {
    id: "me",
    d: "M 540 120 L 600 110 L 640 130 L 650 165 L 620 190 L 580 200 L 545 195 L 530 175 L 535 145 Z",
  },
  // Central / South Asia
  {
    id: "csa",
    d: "M 600 110 L 680 105 L 730 120 L 760 150 L 750 200 L 720 230 L 680 260 L 640 260 L 610 240 L 580 200 L 610 170 L 620 140 Z",
  },
  // East / Southeast Asia
  {
    id: "esa",
    d: "M 730 120 L 820 110 L 880 130 L 900 165 L 870 200 L 850 230 L 820 270 L 790 300 L 760 300 L 730 270 L 720 240 L 740 200 L 760 150 Z",
  },
  // Oceania / Australia
  {
    id: "oc",
    d: "M 800 320 L 870 310 L 920 330 L 930 370 L 900 405 L 850 415 L 800 390 L 780 360 Z",
  },
  // Papua New Guinea (small island)
  {
    id: "png",
    d: "M 860 295 L 905 290 L 910 315 L 875 320 Z",
  },
];

/* ─── Component ──────────────────────────────────────────────────────── */

export function WorldMapSelector() {
  const router = useRouter();
  const [hovered, setHovered] = useState<MissionCountry | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  function handlePinEnter(country: MissionCountry, e: React.MouseEvent<SVGElement>) {
    setHovered(country);
    // Position tooltip relative to the SVG element
    const svg = (e.currentTarget as SVGElement).closest("svg");
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const viewBox = { w: 1000, h: 480 };
    const scaleX = rect.width / viewBox.w;
    const scaleY = rect.height / viewBox.h;
    setTooltipPos({
      x: country.mapX * scaleX,
      y: country.mapY * scaleY - 14,
    });
  }

  return (
    <div className="relative w-full rounded-2xl border border-theme-border bg-theme-surface overflow-hidden">
      <svg
        viewBox="0 0 1000 480"
        className="w-full h-auto"
        aria-label="세계 선교지도"
        role="img"
      >
        {/* Ocean background */}
        <rect width="1000" height="480" fill="var(--color-surface-2, #f0f4f8)" />

        {/* Continent fills */}
        {CONTINENT_PATHS.map((c) => (
          <path
            key={c.id}
            d={c.d}
            fill="var(--color-border, #d1d5db)"
            stroke="var(--color-surface, #ffffff)"
            strokeWidth="1.5"
          />
        ))}

        {/* Country pins */}
        {MISSION_COUNTRIES.map((country) => {
          const isHov = hovered?.code === country.code;
          return (
            <g
              key={country.code}
              onClick={() => router.push(`/mission/${country.code}`)}
              onMouseEnter={(e) => handlePinEnter(country, e)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
              aria-label={`${country.name} 선교 피드 보기`}
            >
              {/* Pulsing ring */}
              <circle
                cx={country.mapX}
                cy={country.mapY}
                r={isHov ? 12 : 8}
                fill="none"
                stroke={isHov ? "#2563eb" : "#3b82f6"}
                strokeWidth="1.5"
                opacity={isHov ? 0.6 : 0.35}
                style={{ transition: "all 0.2s ease" }}
              />
              {/* Dot */}
              <circle
                cx={country.mapX}
                cy={country.mapY}
                r={isHov ? 5.5 : 4}
                fill={isHov ? "#1d4ed8" : "#3b82f6"}
                style={{ transition: "all 0.2s ease" }}
              />
              {/* Animated pulse ring */}
              <circle
                cx={country.mapX}
                cy={country.mapY}
                r="10"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1"
                opacity="0"
              >
                <animate
                  attributeName="r"
                  from="5"
                  to="16"
                  dur="2s"
                  repeatCount="indefinite"
                  begin={`${(country.mapX % 7) * 0.3}s`}
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="2s"
                  repeatCount="indefinite"
                  begin={`${(country.mapX % 7) * 0.3}s`}
                />
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface shadow-md px-2.5 py-1.5 text-[12px] font-medium text-theme-text whitespace-nowrap"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span>{hovered.flag}</span>
          <span>{hovered.name}</span>
        </div>
      )}

      {/* Instruction */}
      <div className="absolute bottom-2 right-3 text-[10px] text-theme-muted pointer-events-none">
        국가 핀을 클릭하세요
      </div>
    </div>
  );
}
