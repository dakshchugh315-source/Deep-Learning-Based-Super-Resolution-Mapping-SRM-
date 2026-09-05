'use client'

import dynamic from 'next/dynamic'

const EarthCanvas = dynamic(() => import('@/components/EarthCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex size-full min-h-[480px] items-center justify-center font-mono text-xs uppercase tracking-widest text-cyan">
      <span className="mr-2 size-2 animate-ping rounded-full bg-cyan" />
      Loading 3D Earth Observation...
    </div>
  ),
})

export function HeroEarthView() {
  return <EarthCanvas />
}
