'use client'

import { useState } from 'react'

export function CodeBlock({
  code,
  language = 'bash',
}: {
  code:     string
  language?: string
}) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative group">
      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700 bg-slate-800/50">
          <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
            {language}
          </span>
          <button
            onClick={copy}
            className="text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <pre className="px-4 py-3 text-[12px] leading-relaxed text-slate-100 font-mono overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}
