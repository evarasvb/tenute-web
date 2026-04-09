'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <svg
            width="32" height="32" viewBox="0 0 32 32"
            fill="none" aria-label="Tenute logo"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="8" fill="#2563eb" />
            <path d="M8 10h16M16 10v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="font-bold text-lg text-gray-900 tracking-tight">Tenute</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/#categorias" className="hover:text-blue-600 transition-colors">Categorías</Link>
          <Link href="/#mayorista" className="hover:text-blue-600 transition-colors">Mayorista</Link>
          <Link href="/contacto" className="hover:text-blue-600 transition-colors">Contacto</Link>
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/catalogo" className="btn-primary text-sm">Ver catálogo</Link>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menú"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open
              ? <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              : <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4">
          <nav className="flex flex-col gap-3 pt-3 text-sm font-medium text-gray-700">
            <Link href="/#categorias" onClick={() => setOpen(false)}>Categorías</Link>
            <Link href="/#mayorista" onClick={() => setOpen(false)}>Mayorista</Link>
            <Link href="/contacto" onClick={() => setOpen(false)}>Contacto</Link>
            <Link href="/catalogo" className="btn-primary mt-2 w-full text-center">Ver catálogo</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
