import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="w-full border-b border-slate-800">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">
            Learning Through Analogies
          </h1>
          <span className="text-sm text-slate-400">
            CSC7058: Individual Software Development Project 
          </span>
        </div>
      </header>

      {/* Main content */}
      <section className="flex-1 flex items-center">
        <div className="mx-auto max-w-5xl px-4 py-10 grid gap-10 md:grid-cols-2 items-center">
          {/* Text on left side */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              Log in to explore{" "}
              <span className="text-indigo-400">AI-generated analogies</span>
            </h2>
            <p className="text-slate-300 mb-6">
              Lecturers can generate analogies to supplement learning.
              Students can log in to review concepts and take quizzes
              tailored to their modules.
            </p>
            
          </div>

          {/* Sign in form on right side */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl shadow-xl p-6 md:p-8">
            <h3 className="text-xl font-semibold mb-1">Sign in</h3>
            <p className="text-sm text-slate-400 mb-6">
              Enter your details and choose your role to continue
            </p>

            <form className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-200"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  placeholder="JohnDoe@email.com"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-200"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  placeholder="••••••••"
                />
              </div>

              {/* Role buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Link href="/student" className="w-full">
                  <button
                    type="button"
                    className="w-full rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition"
                  >
                    Continue as Student
                  </button>
                </Link>

                <Link href="/lecturer" className="w-full">
                  <button
                    type="button"
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 hover:border-indigo-400 hover:text-indigo-200 transition"
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
      <footer className="border-t border-slate-800">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>MSc Software Development · Dissertation</span>
          <span>Alan Moran</span>
        </div>
      </footer>
    </main>
  )
}
