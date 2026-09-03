import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { Navbar } from '@/components/platform/Navbar'
import { BeforeAfterSlider } from '@/components/sections/BeforeAfterSlider'
import { HeroEarthView } from '@/components/hero/HeroEarthView'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const features = [
  ['01', 'FIELD BOUNDARIES', 'Inferable edges emerge from the spectral signal.'],
  ['02', 'ROAD NETWORKS', 'Linear patterns become easier to inspect.'],
  ['03', 'WATER SYSTEMS', 'Trace coastlines, channels, and reservoirs.'],
  ['04', 'BUILT FORM', 'Review reconstructed structure with care.'],
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.22em] text-cyan">
      <span className="size-1.5 bg-cyan" />
      {children}
    </div>
  )
}

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="overflow-x-clip">
        {/* HERO SECTION WITH REALISTIC 3D EARTH CANVAS */}
        <section className="relative min-h-[780px] border-b border-line px-6 pt-32">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
            {/* Left Hero Text Content (With Smooth Scroll Reveal) */}
            <div className="relative z-10">
              <ScrollReveal delay={0}>
                <SectionLabel>Earth observation / 01</SectionLabel>
                <h1 className="max-w-4xl text-balance font-mono text-5xl font-medium uppercase leading-[.95] tracking-[-.08em] text-foreground sm:text-7xl lg:text-[8.2rem]">
                  See beyond
                  <br />
                  <span className="text-cyan">the pixel.</span>
                </h1>
              </ScrollReveal>

              <ScrollReveal delay={120}>
                <p className="mt-8 max-w-lg text-pretty text-base leading-7 text-muted-foreground">
                  Deep learning based super-resolution mapping from medium-resolution satellite imagery. Reconstruct detail. Preserve the signal. Validate every inference.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={240}>
                <div className="mt-10 flex flex-wrap gap-3">
                  <Link
                    href="/upload"
                    className="flex items-center gap-3 bg-cyan px-5 py-3 font-mono text-xs uppercase tracking-widest text-ink hover:bg-foreground"
                  >
                    <span>Enter platform</span>
                    <ArrowUpRight className="size-4" />
                  </Link>
                  <a
                    href="#story"
                    className="flex items-center gap-3 border border-line px-5 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:border-cyan hover:text-cyan"
                  >
                    Explore method <ArrowDownRight className="size-4" />
                  </a>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Side: Realistic 3D Earth Observation Scene (Unwrapped to preserve 3D render) */}
            <div className="relative flex h-full min-h-[560px] w-full items-center justify-center lg:min-h-[660px]">
              <HeroEarthView />
            </div>
          </div>

          <div className="absolute bottom-8 left-6 right-6 mx-auto flex max-w-7xl justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>10m Sentinel-2 input</span>
            <span>Scroll to inspect ↓</span>
          </div>
        </section>

        {/* SECTION 02: THE LIMITATION */}
        <section id="story" className="mx-auto max-w-7xl px-6 py-32">
          <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr]">
            <ScrollReveal delay={0}>
              <SectionLabel>02 / The limitation</SectionLabel>
              <h2 className="max-w-md font-mono text-4xl uppercase leading-tight tracking-[-.05em] sm:text-6xl">
                A pixel is not the whole picture.
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={140}>
              <div className="grid gap-8 text-muted-foreground lg:grid-cols-2">
                <p className="leading-7">
                  At 10 metres, a single pixel can contain roads, roofs, soil, and vegetation at once. The image is useful—but its edges are unresolved.
                </p>
                <p className="leading-7">
                  SRM reconstructs high-frequency structure from learned spatial and spectral relationships. It does not create ground truth. It creates a hypothesis for review.
                </p>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={240}>
            <div className="mt-20 border border-line bg-panel p-3">
              <div className="relative aspect-[2.2/1] overflow-hidden bg-[#18252a]">
                <div className="scanlines" />
                <div className="pixel-noise" />
                <div className="absolute inset-0 flex items-center justify-center font-mono text-xs uppercase tracking-[.3em] text-cyan/80">
                  10 m observation field / zoom boundary
                </div>
              </div>
              <div className="flex justify-between px-3 py-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>Native resolution</span>
                <span>Spatial ambiguity increases at zoom</span>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* SECTION 03: THE TRANSFORMATION */}
        <section className="border-y border-line bg-panel px-6 py-32">
          <div className="mx-auto max-w-7xl">
            <ScrollReveal delay={0}>
              <SectionLabel>03 / The transformation</SectionLabel>
            </ScrollReveal>

            <div className="grid gap-10 lg:grid-cols-3">
              {['Input / Sentinel-2', 'SRM / Reconstruction', 'Output / Review'].map((item, i) => (
                <ScrollReveal key={item} delay={i * 140}>
                  <div className="border-t border-line pt-5">
                    <span className="font-mono text-xs text-cyan">0{i + 1}</span>
                    <h3 className="mt-8 font-mono text-2xl uppercase tracking-tight">{item}</h3>
                    <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
                      {[
                        'Multispectral observation at 10 m ground sampling distance.',
                        'Model infers plausible high-frequency detail while preserving bands.',
                        'Sub-4 m target output, pending validation against reference imagery.',
                      ][i]}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 04: THE WOW MOMENT */}
        <section className="mx-auto max-w-7xl px-6 py-32">
          <ScrollReveal delay={0}>
            <SectionLabel>04 / The wow moment</SectionLabel>
            <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <h2 className="max-w-xl font-mono text-4xl uppercase leading-tight tracking-[-.05em] sm:text-6xl">
                Same observation.<br />
                <span className="text-cyan">Different read.</span>
              </h2>
              <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                Drag the divider to inspect a demo comparison. The output is an illustrative reconstruction, not validated scientific data.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={140}>
            <BeforeAfterSlider />
          </ScrollReveal>
        </section>

        {/* SECTION 05: WHAT BECOMES VISIBLE */}
        <section className="border-y border-line px-6 py-32">
          <div className="mx-auto max-w-7xl">
            <ScrollReveal delay={0}>
              <SectionLabel>05 / What becomes visible</SectionLabel>
            </ScrollReveal>

            <div className="grid md:grid-cols-2">
              {features.map(([n, t, d], i) => (
                <ScrollReveal key={n} delay={i * 100}>
                  <article className="group border-b border-line p-6 first:border-t md:nth-[odd]:border-r">
                    <span className="font-mono text-xs text-cyan">{n}</span>
                    <h3 className="mt-12 font-mono text-2xl uppercase group-hover:text-cyan">{t}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{d}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 06: SCIENTIFIC VALIDATION */}
        <section className="mx-auto max-w-7xl px-6 py-32">
          <ScrollReveal delay={0}>
            <SectionLabel>06 / Scientific validation</SectionLabel>
            <div className="flex flex-col justify-between gap-8 border border-line p-8 md:flex-row md:items-end">
              <div>
                <h2 className="font-mono text-4xl uppercase tracking-[-.05em]">Evidence before confidence.</h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                  Quality metrics remain intentionally unpopulated until a reference image is available. The platform makes uncertainty visible.
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-cyan">
                <ShieldCheck className="size-4" /> Awaiting validation
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <div className="mt-6 grid gap-px bg-line sm:grid-cols-4">
              {['PSNR / dB', 'SSIM / 0–1', 'RMSE / error', 'SAM / degrees'].map((x) => (
                <div key={x} className="bg-ink p-6">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{x}</p>
                  <p className="mt-8 font-mono text-xl text-cyan">Awaiting validation</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* PLATFORM ENTRY POINT */}
        <section className="bg-cyan px-6 py-24 text-ink">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-12 md:flex-row md:items-end">
            <ScrollReveal delay={0}>
              <SectionLabel>Platform entry point</SectionLabel>
              <h2 className="max-w-3xl font-mono text-5xl uppercase leading-none tracking-[-.07em] sm:text-7xl">
                Make the next pass clearer.
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={140}>
              <Link
                href="/upload"
                className="flex items-center gap-3 border border-ink px-5 py-3 font-mono text-xs uppercase tracking-widest hover:bg-ink hover:text-cyan"
              >
                Open workspace <ArrowUpRight className="size-4" />
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </>
  )
}
