'use client';

import dynamic from 'next/dynamic';

const ArcDiagram = dynamic(() => import('./ArcDiagram'), { ssr: false });

export default function ChartWrapper() {
  return <ArcDiagram />;
}
