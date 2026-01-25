import Link from "next/link"

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 overflow-hidden">
      {/* Animated background accent shapes */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 opacity-40"></div>
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -z-10 opacity-30"></div>
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-slate-600/5 rounded-full blur-3xl -z-10 opacity-20"></div>

      {/* Header */}
      <header className="relative w-full border-b border-slate-800/50 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
            Learning Through Analogies
          </h1>
          <span className="hidden sm:inline text-xs sm:text-sm text-slate-400 font-light">
            MSc Dissertation · Alan Moran
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
        <div className="w-full max-w-4xl">
          {/* Hero content */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-4 sm:mb-6">
              Master concepts through{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                AI-generated analogies
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed">
              Transform how you learn and teach. Generate personalized analogies that make complex ideas instantly understandable.
            </p>
            
            {/* Value proposition bullets */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                <span>Input your concept</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                <span>AI generates analogies</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                <span>Learn faster, retain longer</span>
              </div>
            </div>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-16 sm:mb-20">
            {/* Student Card */}
            <Link href="/student" className="group">
              <div className="h-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 hover:border-indigo-500/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-colors">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.753 2 16.5S6.5 26.747 12 26.747s10-4.5 10-10.247S17.5 6.253 12 6.253z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-100">For Students</h3>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  Explore AI-generated analogies that clarify complex concepts. Deepen your understanding through interactive learning.
                </p>
                <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 group-hover:shadow-lg group-hover:shadow-indigo-500/20">
                  Continue as Student
                </button>
              </div>
            </Link>

            {/* Lecturer Card */}
            <Link href="/lecturer" className="group">
              <div className="h-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 hover:border-purple-500/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 group-hover:bg-purple-500/30 transition-colors">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-100">For Lecturers</h3>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  Generate powerful analogies to enhance your lectures. Create personalized content that resonates with your students.
                </p>
                <button className="w-full border-2 border-slate-600 hover:border-purple-500/50 text-slate-100 hover:text-purple-200 font-medium py-3 px-4 rounded-xl transition-all duration-200 group-hover:shadow-lg group-hover:shadow-purple-500/10">
                  Continue as Lecturer
                </button>
              </div>
            </Link>
          </div>

          {/* How it works section */}
          <div className="max-w-3xl mx-auto">
            <h3 className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wide mb-8">How it works</h3>
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-4 text-white font-bold text-lg border-4 border-slate-800">
                    1
                  </div>
                  <h4 className="text-lg font-semibold text-slate-100 mb-2">Input</h4>
                  <p className="text-sm text-slate-400">
                    Describe the concept you want to understand better.
                  </p>
                </div>
                {/* Connector line */}
                <div className="hidden md:block absolute top-7 left-[60%] w-[calc(100%-60%+20px)] h-0.5 bg-gradient-to-r from-indigo-500/30 to-transparent"></div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 text-white font-bold text-lg border-4 border-slate-800">
                    2
                  </div>
                  <h4 className="text-lg font-semibold text-slate-100 mb-2">Generate</h4>
                  <p className="text-sm text-slate-400">
                    AI creates tailored analogies in seconds.
                  </p>
                </div>
                {/* Connector line */}
                <div className="hidden md:block absolute top-7 left-[60%] w-[calc(100%-60%+20px)] h-0.5 bg-gradient-to-r from-purple-500/30 to-transparent"></div>
              </div>

              {/* Step 3 */}
              <div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4 text-white font-bold text-lg border-4 border-slate-800">
                    3
                  </div>
                  <h4 className="text-lg font-semibold text-slate-100 mb-2">Learn</h4>
                  <p className="text-sm text-slate-400">
                    Master concepts faster and remember longer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-800/50 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-500 gap-3">
          <span>MSc Software Development · Dissertation</span>
          <span>Alan Moran</span>
        </div>
      </footer>
    </main>
  )
}
