/**
 * src/app/(corporate)/portal/not-found/page.tsx
 * Shown for any path that the corporate middleware doesn't allow.
 */
export default function NotFound() {
  return (
    <div className="max-w-[1280px] mx-auto py-16 text-center">
      <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">404</h1>
      <p className="text-[13px] text-slate-500 mt-2">
        That page isn't available on the corporate portal.
      </p>
      <a href="/portal" className="inline-block mt-6 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold transition-colors">
        Back to Overview →
      </a>
    </div>
  )
}
