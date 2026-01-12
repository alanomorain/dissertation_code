import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-100">
      {/* Header */}
      <header className="w-full border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/50 animate-fade-in">
        <div className="mx-auto max-w-5xl px-4 py-5 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Learning Through Analogies
          </h1>
          <span className="text-sm text-slate-400 hidden sm:block">
            CSC7058: Individual Software Development Project 
          </span>
        </div>
      </header>

      {/* Main content */}
      <section className="flex-1 flex items-center">
        <div className="mx-auto max-w-5xl px-4 py-10 grid gap-12 md:grid-cols-2 items-center">
          {/* Text on left side */}
          <div className="animate-slide-in">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Log in to explore{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI-generated analogies
              </span>
            </h2>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              Lecturers can generate analogies to supplement learning.
              Students can log in to review concepts and take quizzes
              tailored to their modules.
            </p>
            
          </div>

          {/* Sign in form on right side */}
          <div className="glass border border-slate-700/50 rounded-3xl shadow-2xl p-8 md:p-10 animate-scale-in backdrop-blur-xl">
            <h3 className="text-2xl font-bold mb-2">Sign in</h3>
            <p className="text-sm text-slate-400 mb-8">
              Enter your details and choose your role to continue
            </p>

            <form className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-200"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-slate-800"
                  placeholder="JohnDoe@email.com"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-200"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-slate-800"
                  placeholder="••••••••"
                />
              </div>

              {/* Role buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <Link href="/student" className="w-full">
                  <button
                    type="button"
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-200"
                  >
                    Continue as Student
                  </button>
                </Link>

                <Link href="/lecturer" className="w-full">
                  <button
                    type="button"
                    className="w-full rounded-xl border-2 border-slate-600 bg-slate-800/50 px-4 py-3 text-sm font-semibold text-slate-100 hover:border-indigo-400 hover:bg-slate-800 hover:text-indigo-200 hover:scale-105 transition-all duration-200"
                  >
                    Continue as Lecturer
                  </button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm animate-fade-in">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between text-xs text-slate-500">
          <span>MSc Software Development · Dissertation</span>
          <span className="font-medium">Alan Moran</span>
        </div>
      </footer>
    </main>
  )
}
