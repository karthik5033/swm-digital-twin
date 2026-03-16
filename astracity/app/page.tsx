import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
      <h1 className="text-5xl font-bold mb-4 tracking-tight">AstraCity</h1>
      <p className="text-xl text-gray-300 mb-12">
        A policy simulation AI platform that maps Bengaluru&apos;s waste ecosystem using satellite intelligence, predicts illegal dumping, models methane emissions, and quantifies ₹ crores in government savings.
      </p>
      
      <div className="flex flex-wrap justify-center gap-8 mb-16">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-semibold">₹4.2Cr</span>
          <span className="text-gray-400 text-sm mt-1 uppercase tracking-wider">Saved Annually</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-semibold">847</span>
          <span className="text-gray-400 text-sm mt-1 uppercase tracking-wider">Dumps Detected</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-semibold">23%</span>
          <span className="text-gray-400 text-sm mt-1 uppercase tracking-wider">Methane Reduced</span>
        </div>
      </div>

      <Link 
        href="/map" 
        className="px-8 py-4 bg-white text-[#0a0f1e] text-lg font-semibold rounded hover:bg-gray-200 transition-colors"
      >
        Enter AstraCity &rarr;
      </Link>
    </div>
  );
}
