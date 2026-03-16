import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0a0f1e]">
      <Link href="/" className="font-bold text-xl tracking-tight text-white hover:opacity-80 transition-opacity">
        AstraCity
      </Link>
      <div className="flex gap-6 text-sm text-gray-300">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <Link href="/map" className="hover:text-white transition-colors">Map</Link>
        <Link href="/simulation" className="hover:text-white transition-colors">Simulation</Link>
        <Link href="/impact" className="hover:text-white transition-colors">Impact</Link>
        <Link href="/wards" className="hover:text-white transition-colors">Wards</Link>
        <Link href="/report" className="hover:text-white transition-colors">Report</Link>
      </div>
    </nav>
  );
}
