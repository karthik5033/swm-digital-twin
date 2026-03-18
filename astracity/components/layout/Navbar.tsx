import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shadow-sm sticky top-0 z-50">
      <Link href="/" className="font-extrabold text-2xl tracking-tight text-teal-600 hover:text-teal-500 transition-colors">
        AstraCity
      </Link>
      <div className="flex gap-8 text-sm font-semibold text-slate-500">
        <Link href="/" className="hover:text-teal-600 transition-colors">Home</Link>
        <Link href="/map" className="hover:text-teal-600 transition-colors">Map</Link>
        <Link href="/simulation" className="hover:text-teal-600 transition-colors">Simulation</Link>
        <Link href="/impact" className="hover:text-teal-600 transition-colors">Impact</Link>
        <Link href="/wards" className="hover:text-teal-600 transition-colors">Wards</Link>
        <Link href="/report" className="hover:text-teal-600 transition-colors">Report</Link>
      </div>
    </nav>
  );
}
