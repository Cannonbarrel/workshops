export default function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Paste your URL',
      description: 'Enter the link and a title in the form below. Both fields are validated instantly.',
    },
    {
      step: '02',
      title: 'Hit Save',
      description: 'Your bookmark is sent to the Lambda API, stored in DynamoDB, and returned in milliseconds.',
    },
    {
      step: '03',
      title: 'Access anywhere',
      description: 'Your bookmarks are fetched from the cloud on every page load. Always in sync.',
    },
  ];

  return (
    <section id="how-it-works" className="bg-zinc-50 py-24 border-b border-zinc-100">
      <div className="section-container">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100
                          border border-zinc-200 text-xs font-semibold text-zinc-600 uppercase
                          tracking-widest mb-4">
            How it works
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight mb-4">
            Three steps. Done.
          </h2>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            No accounts, no setup, no complexity. Just save and go.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px bg-gradient-to-r
                          from-transparent via-indigo-200 to-transparent" />

          {steps.map((s, i) => (
            <div key={s.step} className="relative flex flex-col items-center text-center p-8
                                          rounded-2xl bg-white border border-zinc-100 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600
                              flex items-center justify-center text-white font-bold text-lg
                              shadow-lg shadow-indigo-500/30 mb-5">
                {s.step}
              </div>
              <h3 className="font-semibold text-zinc-900 text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
