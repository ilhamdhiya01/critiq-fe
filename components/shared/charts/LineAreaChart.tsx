"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  getNiceScale,
  getPoints,
  toAreaPath,
  toLinePath,
} from "@/lib/helpers/chart.helper";

export interface ChartSeries {
  key: string;
  label: string;
  // Any CSS colour, e.g. "var(--color-danger-light)".
  color: string;
  values: number[];
}

interface LineAreaChartProps {
  series: ChartSeries[];
  labels: string[];
  height?: number;
  // Tooltip heading for an index (defaults to its label).
  formatTooltip?: (index: number) => React.ReactNode;
  ariaLabel: string;
  emptyMessage?: string;
}

const PAD = { top: 12, right: 14, bottom: 30, left: 38 };
const FALLBACK_WIDTH = 640;
// Approximate x-axis label footprint (11px mono glyph + breathing room),
// used to skip labels that would otherwise overlap on narrow charts.
const LABEL_CHAR_WIDTH = 6.6;
const LABEL_GAP = 8;

// Centred on the point but kept inside the chart: percentages in translate
// refer to the tooltip's own width, so no measuring is needed.
const getTooltipStyle = (
  anchor: number,
  width: number,
): React.CSSProperties => ({
  left: anchor,
  transform: `translateX(clamp(${-anchor}px, -50%, calc(${width - anchor}px - 100%)))`,
});

// Plain SVG line/area chart: drawn in pixels from the measured width so text
// and dots never stretch.
const LineAreaChart = React.memo(
  ({
    series,
    labels,
    height = 260,
    formatTooltip,
    ariaLabel,
    emptyMessage,
  }: LineAreaChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(FALLBACK_WIDTH);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    useEffect(() => {
      const element = containerRef.current;
      if (!element || typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(([entry]) => {
        if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
      });
      observer.observe(element);
      return () => observer.disconnect();
    }, []);

    const plotWidth = Math.max(0, width - PAD.left - PAD.right);
    const plotHeight = height - PAD.top - PAD.bottom;
    const maxValue = Math.max(0, ...series.flatMap((item) => item.values));
    const scale = getNiceScale(maxValue);

    const plotted = useMemo(
      () =>
        series.map((item) => ({
          ...item,
          points: getPoints(item.values, {
            width: plotWidth,
            height: plotHeight,
            max: scale.max,
          }),
        })),
      [series, plotWidth, plotHeight, scale.max],
    );

    const xAt = (index: number) => plotted[0]?.points[index]?.x ?? 0;
    const columnWidth =
      labels.length > 1 ? plotWidth / (labels.length - 1) : plotWidth;
    const labelFootprint =
      Math.max(0, ...labels.map((label) => label.length)) * LABEL_CHAR_WIDTH +
      LABEL_GAP;
    // Show every nth label so neighbours never overlap.
    const labelStep =
      columnWidth > 0
        ? Math.max(1, Math.ceil(labelFootprint / columnWidth))
        : 1;

    // Touch: a tap opens the tooltip and dragging sideways scrubs through the
    // points. Releasing the implicit touch capture lets each column receive
    // its own pointermove.
    const handlePointer = (
      event: React.PointerEvent<SVGRectElement>,
      index: number,
    ) => {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      setActiveIndex(index);
    };

    return (
      <div ref={containerRef} className="relative w-full">
        <svg
          role="group"
          aria-label={ariaLabel}
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          // Vertical swipes still scroll the page; horizontal ones scrub.
          className="touch-pan-y"
        >
          <g transform={`translate(${PAD.left},${PAD.top})`}>
            {scale.ticks.map((tick) => {
              const y = plotHeight - (tick / scale.max) * plotHeight;
              return (
                <g key={tick}>
                  <line
                    x1={0}
                    x2={plotWidth}
                    y1={y}
                    y2={y}
                    strokeDasharray="3 5"
                    className="stroke-border-default"
                  />
                  <text
                    x={-12}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-text-muted font-mono text-[11px]"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {labels.map((label, index) =>
              index % labelStep === 0 ? (
                <text
                  key={label}
                  x={xAt(index)}
                  y={plotHeight + 20}
                  textAnchor="middle"
                  className="fill-text-muted font-mono text-[11px]"
                >
                  {label}
                </text>
              ) : null,
            )}

            {activeIndex !== null && (
              <line
                x1={xAt(activeIndex)}
                x2={xAt(activeIndex)}
                y1={0}
                y2={plotHeight}
                className="stroke-border-default"
              />
            )}

            {plotted.map((item) => (
              <g key={item.key}>
                <path
                  d={toAreaPath(item.points, plotHeight)}
                  fill={item.color}
                  fillOpacity={0.12}
                />
                <path
                  d={toLinePath(item.points)}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {item.points.map((point, index) => (
                  <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r={activeIndex === index ? 5.5 : 4}
                    fill={item.color}
                  />
                ))}
              </g>
            ))}

            {/* Transparent hit columns: hover, tap or Tab to inspect a point. */}
            {labels.map((label, index) => (
              <rect
                key={label}
                x={Math.max(0, xAt(index) - columnWidth / 2)}
                y={0}
                width={columnWidth}
                height={plotHeight}
                fill="transparent"
                tabIndex={0}
                aria-label={`${label}: ${series
                  .map((item) => `${item.label} ${item.values[index] ?? 0}`)
                  .join(", ")}`}
                className="outline-none"
                onMouseEnter={() => setActiveIndex(index)}
                onPointerDown={(event) => handlePointer(event, index)}
                onPointerMove={(event) => handlePointer(event, index)}
                onFocus={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onBlur={() => setActiveIndex(null)}
              />
            ))}
          </g>
        </svg>

        {activeIndex !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute top-0 z-10 flex flex-col gap-1 rounded-md border border-border-default bg-raised-alt px-3 py-2 text-[11.5px] shadow-lg"
            style={getTooltipStyle(PAD.left + xAt(activeIndex), width)}
          >
            <span className="font-mono text-text-secondary">
              {formatTooltip?.(activeIndex) ?? labels[activeIndex]}
            </span>
            {series.map((item) => (
              <span key={item.key} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-text-nav">{item.label}</span>
                <span className="ml-auto font-mono font-semibold text-neutral-100">
                  {item.values[activeIndex] ?? 0}
                </span>
              </span>
            ))}
          </div>
        )}

        {maxValue === 0 && emptyMessage && (
          <p className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-[12.5px] text-text-muted">
            {emptyMessage}
          </p>
        )}
      </div>
    );
  },
);

LineAreaChart.displayName = "LineAreaChart";

export default LineAreaChart;
