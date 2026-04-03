'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { events, typeColors, typeLabels, regionLabels, type HistoricalEvent, type EventType, type Region } from '../data/events';

const MIN_YEAR = -500;
const MAX_YEAR = 2025;
const MARGIN = { top: 40, right: 40, bottom: 60, left: 60 };

interface TooltipData {
  event: HistoricalEvent;
  x: number;
  y: number;
}

interface Filters {
  types: Set<EventType>;
  regions: Set<Region>;
}

export default function ArcDiagram() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [filters, setFilters] = useState<Filters>({
    types: new Set(Object.keys(typeColors) as EventType[]),
    regions: new Set(Object.keys(regionLabels) as Region[]),
  });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filteredEvents = events.filter(
    (e) => filters.types.has(e.type) && filters.regions.has(e.region)
  );

  const drawChart = useCallback(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const totalWidth = container.clientWidth;
    const totalHeight = Math.max(500, container.clientHeight - 20);
    const width = totalWidth - MARGIN.left - MARGIN.right;
    const height = totalHeight - MARGIN.top - MARGIN.bottom;

    d3.select(svg).selectAll('*').remove();

    const root = d3
      .select(svg)
      .attr('width', totalWidth)
      .attr('height', totalHeight)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const xScale = d3.scaleLinear().domain([MIN_YEAR, MAX_YEAR]).range([0, width]);

    const xTicks = xScale.ticks(20);
    root
      .selectAll('.grid-line')
      .data(xTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 0.5);

    root
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', height)
      .attr('y2', height)
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5);

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(20)
      .tickFormat((d) => {
        const year = d as number;
        return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
      });

    root
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('transform', 'rotate(-40)')
      .style('text-anchor', 'end');

    root.select('.domain').attr('stroke', '#334155');
    root.selectAll('.tick line').attr('stroke', '#334155');

    const sorted = [...filteredEvents].sort(
      (a, b) => b.endYear - b.startYear - (a.endYear - a.startYear)
    );

    sorted.forEach((event) => {
      const x1 = xScale(event.startYear);
      const x2 = xScale(event.endYear);
      const midX = (x1 + x2) / 2;
      const span = x2 - x1;
      const arcHeight = Math.min(span * 0.45, height * 0.9);
      const cy = height - arcHeight;
      const pathData = `M ${x1},${height} C ${x1},${cy} ${x2},${cy} ${x2},${height}`;

      const isHovered = hoveredId === event.id;
      const isAnyHovered = hoveredId !== null;
      const color = typeColors[event.type];

      root
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', isHovered ? 3 : 1.5)
        .attr('opacity', isAnyHovered ? (isHovered ? 1 : 0.15) : 0.65)
        .attr('stroke-linecap', 'round')
        .style('cursor', 'pointer')
        .on('mouseenter', function (event_mouse: MouseEvent) {
          setHoveredId(event.id);
          const svgRect = svg.getBoundingClientRect();
          setTooltip({
            event,
            x: event_mouse.clientX - svgRect.left,
            y: event_mouse.clientY - svgRect.top,
          });
        })
        .on('mousemove', function (event_mouse: MouseEvent) {
          const svgRect = svg.getBoundingClientRect();
          setTooltip((prev) =>
            prev ? { ...prev, x: event_mouse.clientX - svgRect.left, y: event_mouse.clientY - svgRect.top } : null
          );
        })
        .on('mouseleave', function () {
          setHoveredId(null);
          setTooltip(null);
        });

      root
        .append('circle')
        .attr('cx', midX)
        .attr('cy', cy + 2)
        .attr('r', isHovered ? 5 : 3)
        .attr('fill', color)
        .attr('opacity', isAnyHovered ? (isHovered ? 1 : 0.1) : 0.7)
        .style('pointer-events', 'none');
    });

    const adX = xScale(0);
    root
      .append('line')
      .attr('x1', adX).attr('x2', adX)
      .attr('y1', 0).attr('y2', height)
      .attr('stroke', '#475569')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '6,4');

    root.append('text').attr('x', adX + 5).attr('y', 14).attr('fill', '#64748b').attr('font-size', '11px').text('CE →');
    root.append('text').attr('x', adX - 5).attr('y', 14).attr('fill', '#64748b').attr('font-size', '11px').attr('text-anchor', 'end').text('← BCE');
  }, [filteredEvents, hoveredId]);

  useEffect(() => {
    drawChart();
    const observer = new ResizeObserver(() => drawChart());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [drawChart]);

  const toggleType = (type: EventType) => {
    setFilters((prev) => {
      const next = new Set(prev.types);
      next.has(type) ? next.delete(type) : next.add(type);
      return { ...prev, types: next };
    });
  };

  const toggleRegion = (region: Region) => {
    setFilters((prev) => {
      const next = new Set(prev.regions);
      next.has(region) ? next.delete(region) : next.add(region);
      return { ...prev, regions: next };
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap gap-6 px-2">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Event Type</p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(typeLabels) as [EventType, string][]).map(([type, label]) => {
              const active = filters.types.has(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    active ? 'border-transparent text-white' : 'border-slate-700 text-slate-500 bg-transparent'
                  }`}
                  style={active ? { backgroundColor: typeColors[type], borderColor: typeColors[type] } : {}}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: active ? 'rgba(255,255,255,0.6)' : typeColors[type] }}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Region</p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(regionLabels) as [Region, string][]).map(([region, label]) => {
              const active = filters.regions.has(region);
              return (
                <button
                  key={region}
                  onClick={() => toggleRegion(region)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    active ? 'bg-slate-600 border-slate-500 text-white' : 'border-slate-700 text-slate-500'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full" style={{ height: '520px' }}>
        <svg ref={svgRef} className="w-full h-full" />
        {tooltip && (
          <div
            className="absolute z-50 pointer-events-none max-w-xs"
            style={{
              left: tooltip.x + 16,
              top: Math.max(8, tooltip.y - 60),
              transform: tooltip.x > (containerRef.current?.clientWidth ?? 0) / 1.5 ? 'translateX(-110%)' : 'none',
            }}
          >
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-2xl text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: typeColors[tooltip.event.type] }} />
                <span className="text-white font-semibold leading-tight">{tooltip.event.name}</span>
              </div>
              <div className="text-slate-400 text-xs mb-2">
                {tooltip.event.startYear < 0 ? `${Math.abs(tooltip.event.startYear)} BCE` : `${tooltip.event.startYear} CE`}
                {' — '}
                {tooltip.event.endYear < 0 ? `${Math.abs(tooltip.event.endYear)} BCE` : `${tooltip.event.endYear} CE`}
                {' · '}
                <span style={{ color: typeColors[tooltip.event.type] }}>{typeLabels[tooltip.event.type]}</span>
                {' · '}
                {regionLabels[tooltip.event.region]}
              </div>
              <p className="text-slate-300 text-xs leading-relaxed mb-2">{tooltip.event.description}</p>
              {tooltip.event.casualties && (
                <div className="text-xs text-red-400">
                  <span className="text-slate-500">Casualties / Affected: </span>
                  {tooltip.event.casualties}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 px-2 text-xs text-slate-500">
        <span>Showing <strong className="text-slate-300">{filteredEvents.length}</strong> of <strong className="text-slate-300">{events.length}</strong> events</span>
        <span>·</span>
        <span>Hover an arc to see details</span>
        <span>·</span>
        <span>Arc span = duration of event</span>
      </div>
    </div>
  );
}
