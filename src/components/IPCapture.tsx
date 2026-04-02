'use client'
// src/components/IPCapture.tsx
// Drop this in your (app)/layout.tsx — fires once per session silently

import { useEffect } from 'react'

export default function IPCapture() {
  useEffect(() => {
    // Only capture once per session
    if (sessionStorage.getItem('ip_captured')) return
    fetch('/api/capture-ip', { method: 'POST' })
      .then(() => sessionStorage.setItem('ip_captured', '1'))
      .catch(() => {})
  }, [])

  return null
}
