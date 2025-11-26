// components/Navbar.tsx
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Left side logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/favicon-removebg.png"
            alt="TJK Spices Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="text-lg font-bold text-slate-900 tracking-wide">
            TJK Spices
          </span>
        </Link>

        {/* Navigation links */}
        <div className="flex items-center gap-6 text-sm font-medium text-slate-700">
          <Link href="/" className="hover:text-emerald-700">Home</Link>
          <Link href="/gallery" className="hover:text-emerald-700">Gallery</Link>
          <Link href="/admin" className="hover:text-emerald-700">Admin</Link>
          <Link href="https://wa.me/7012460066" target="_blank" className="hover:text-emerald-700">
            Contact
          </Link>
        </div>

      </div>
    </nav>
  );
}
