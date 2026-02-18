import DemoRoleSwitcher from "./components/DemoRoleSwitcher";
import "./globals.css";

export const metadata = {
  title: "Learning Through Analogies",
  description: "Master concepts through AI-generated analogies",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className="antialiased relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col"
      >
        {/* Animated background accent shapes */}
        <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 opacity-40 pointer-events-none"></div>
        <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -z-10 opacity-30 pointer-events-none"></div>
        <div className="fixed top-1/2 right-0 w-72 h-72 bg-slate-600/5 rounded-full blur-3xl -z-10 opacity-20 pointer-events-none"></div>

        {/* Main content */}
        <div className="flex-1 relative z-0">
          {children}
        </div>

        <DemoRoleSwitcher />


        {/* Global footer */}
        <footer className="relative z-10 border-t border-slate-800/50 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-500 gap-3">
            <span>MSc Software Development · Dissertation</span>
            <span>Alan Moran</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
