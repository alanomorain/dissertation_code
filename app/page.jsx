import Link from "next/link"
import * as ui from "./styles/ui"

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col bg-stone-50 text-stone-950 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-teal-50/70 -z-10"></div>

      {/* Header */}
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
            Learning Through Analogies
          </h1>
          <span className="hidden sm:inline text-xs sm:text-sm text-stone-600 font-light">
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
              <span className="text-teal-700">
                AI-generated analogies
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-stone-700 mb-6 max-w-2xl mx-auto leading-relaxed">
              Transform how you learn and teach. Generate personalized analogies that make complex ideas instantly understandable.
            </p>
            
            {/* Value proposition bullets */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-stone-600 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                <span>Input your concept</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                <span>AI generates analogies</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                <span>Learn faster, retain longer</span>
              </div>
            </div>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-16 sm:mb-20">
            {/* Student Card */}
            <Link href="/student/login" className="group">
              <div className="h-full rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-teal-200 hover:bg-teal-50 sm:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100 group-hover:bg-white transition-colors">
                    <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.753 2 16.5S6.5 26.747 12 26.747s10-4.5 10-10.247S17.5 6.253 12 6.253z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-stone-950">For Students</h3>
                <p className="text-stone-600 mb-6 leading-relaxed">
                  Explore AI-generated analogies that clarify complex concepts. Deepen your understanding through interactive learning.
                </p>
                <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
                  Continue as Student
                </button>
              </div>
            </Link>

            {/* Lecturer Card */}
            <Link href="/lecturer/login" className="group">
              <div className="h-full rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-teal-200 hover:bg-teal-50 sm:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100 group-hover:bg-white transition-colors">
                    <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-stone-950">For Lecturers</h3>
                <p className="text-stone-600 mb-6 leading-relaxed">
                  Generate powerful analogies to enhance your lectures. Create personalized content that resonates with your students.
                </p>
                <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
                  Continue as Lecturer
                </button>
              </div>
            </Link>
          </div>

          {/* How it works section */}
          <div className="max-w-3xl mx-auto">
            <h3 className="text-center text-sm font-semibold text-stone-600 uppercase tracking-wide mb-8">How it works</h3>
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center mb-4 text-white font-bold text-lg border-4 border-white shadow-sm">
                    1
                  </div>
                  <h4 className="text-lg font-semibold text-stone-950 mb-2">Input</h4>
                  <p className="text-sm text-stone-600">
                    Describe the concept you want to understand better.
                  </p>
                </div>
                {/* Connector line */}
                <div className="hidden md:block absolute top-7 left-[60%] w-[calc(100%-60%+20px)] h-0.5 bg-gradient-to-r from-teal-200 to-transparent"></div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center mb-4 text-white font-bold text-lg border-4 border-white shadow-sm">
                    2
                  </div>
                  <h4 className="text-lg font-semibold text-stone-950 mb-2">Generate</h4>
                  <p className="text-sm text-stone-600">
                    AI creates tailored analogies in seconds.
                  </p>
                </div>
                {/* Connector line */}
                <div className="hidden md:block absolute top-7 left-[60%] w-[calc(100%-60%+20px)] h-0.5 bg-gradient-to-r from-teal-200 to-transparent"></div>
              </div>

              {/* Step 3 */}
              <div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center mb-4 text-white font-bold text-lg border-4 border-white shadow-sm">
                    3
                  </div>
                  <h4 className="text-lg font-semibold text-stone-950 mb-2">Learn</h4>
                  <p className="text-sm text-stone-600">
                    Master concepts faster and remember longer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
