import ChartWrapper from './components/ChartWrapper';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-8 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-3 mb-4">
            <span className="mt-1 text-2xl">🌍</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                The Human Record
              </h1>
              <p className="text-slate-400 text-lg mt-1">
                2,500 Years of War, Conquest, Slavery &amp; Atrocity — Worldwide
              </p>
            </div>
          </div>
          <div className="max-w-4xl mt-6 space-y-3 text-slate-300 text-sm md:text-base leading-relaxed border-l-2 border-slate-700 pl-4">
            <p>
              When we discuss dark chapters of history — stolen land, slavery, ethnic cleansing — the
              conversation often narrows to a single nation or era. But these patterns are not
              exceptions. They are the <em>rule</em> of human civilization for the last 2,500+ years,
              on every continent, under every flag.
            </p>
            <p>
              This visualization maps documented conflicts, conquests, genocides, and slavery systems
              across world history. Every arc represents a real event. Every color a category of human
              suffering. The goal is not to excuse any individual atrocity, but to place them in the
              full context of the human story — a story that belongs to all of us.
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 py-8 md:px-12">
        <div className="max-w-7xl mx-auto">
          <ChartWrapper />
        </div>
      </div>

      {/* Context cards */}
      <div className="px-6 py-8 md:px-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-semibold text-white mb-6">Perspective</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ContextCard
              title="Before America"
              body="For over 2,000 years before the United States existed, the world was consumed by empires built on conquest. Rome, the Mongols, the Ottomans, the Mughals — all expanded by force, enslaved conquered peoples, and reshaped the map through war."
            />
            <ContextCard
              title="Slavery Was Universal"
              body="Chattel slavery existed on every inhabited continent throughout recorded history. The Arab slave trade lasted 1,200+ years. The Mongols enslaved millions. European feudal serfdom bound peasants to land for generations. American slavery was uniquely brutal — and it was not unique in existing."
            />
            <ContextCard
              title="The Shift"
              body="What makes the last 150 years remarkable is not that atrocities ended — they didn't — but that humanity began, for the first time, to build legal and moral frameworks to condemn them. International law, human rights, abolition, and war crimes tribunals represent a genuinely new development in the human story."
            />
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-800 px-6 py-6 text-xs text-slate-600 text-center">
        Data compiled from historical records, academic sources, and publicly available research.
        Casualty figures are estimates and vary across sources. This visualization is intended for
        educational purposes.
      </footer>
    </main>
  );
}

function ContextCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{body}</p>
    </div>
  );
}
