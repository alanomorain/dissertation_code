import "./globals.css";

export const metadata = {
  title: "Learning Through Analogies",
  description: "Master concepts through AI-generated analogies",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className="antialiased relative min-h-screen bg-stone-50 text-stone-950 flex flex-col"
      >
        <div className="fixed inset-x-0 top-0 -z-10 h-64 bg-teal-50/60 pointer-events-none"></div>

        {/* Main content */}
        <div className="flex-1 relative z-0">
          {children}
        </div>

        {/* Global footer */}
        <footer className="relative z-10 border-t border-stone-200 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-stone-500 gap-3">
            <span>MSc Software Development · Dissertation</span>
            <span>Alan Moran</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
