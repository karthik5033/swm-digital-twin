import os

def fix_navbar(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add isHome variable
    content = content.replace(
        "const isFeaturesActive = FEATURES_LINKS.some(l => pathname === l.href);",
        "const isFeaturesActive = FEATURES_LINKS.some(l => pathname === l.href);\n  const isHome = pathname === '/';"
    )

    # 2. Update nav wrapper
    content = content.replace(
        '<nav className="relative flex items-center justify-between p-4 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50">',
        '''<nav className={`relative flex items-center justify-between p-4 border-b sticky top-0 z-50 transition-colors ${
      isHome 
        ? 'border-white/10 bg-[#000814]/80 backdrop-blur-md' 
        : 'border-slate-200 bg-white/95 backdrop-blur-md'
    }`}>'''
    )

    # 3. Update Logo
    content = content.replace(
        '''<Link href="/" onClick={() => setIsOpen(false)} className="font-extrabold text-2xl tracking-tight text-teal-600 hover:text-teal-500 transition-colors flex items-center gap-2">''',
        '''<Link href="/" onClick={() => setIsOpen(false)} className={`font-extrabold text-2xl tracking-tight transition-colors flex items-center gap-2 ${
          isHome ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-500'
        }`}>'''
    )

    # 4. Update Desktop Links container
    content = content.replace(
        '<div className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-500">',
        '''<div className={`hidden md:flex items-center gap-1 text-sm font-medium ${isHome ? 'text-white/70' : 'text-slate-500'}`}>'''
    )

    # 5. Update Desktop regular links
    content = content.replace(
        '''className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${isActive(link.href) ? 'text-slate-900 font-bold bg-slate-100/60' : 'hover:text-slate-900 hover:bg-slate-100/40'}`}''',
        '''className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                isActive(link.href) 
                  ? (isHome ? 'text-white font-bold bg-white/10' : 'text-slate-900 font-bold bg-slate-100/60') 
                  : (isHome ? 'hover:text-white hover:bg-white/5' : 'hover:text-slate-900 hover:bg-slate-100/40')
              }`}'''
    )

    # 6. Update Features dropdown button
    content = content.replace(
        '''className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                isFeaturesActive || featuresOpen 
                  ? 'text-slate-900 font-bold bg-slate-100/60' 
                  : 'hover:text-slate-900 hover:bg-slate-100/40'
              }`}''',
        '''className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                isFeaturesActive || featuresOpen 
                  ? (isHome ? 'text-white font-bold bg-white/10' : 'text-slate-900 font-bold bg-slate-100/60') 
                  : (isHome ? 'hover:text-white hover:bg-white/5' : 'hover:text-slate-900 hover:bg-slate-100/40')
              }`}'''
    )

    # 7. Update Info Button
    content = content.replace(
        '''className="ml-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors text-sm font-bold text-slate-600 hover:bg-slate-100"
            style={{ border: '1.5px solid #cbd5e1', fontSize: '14px', width: '28px', height: '28px' }}''',
        '''className={`ml-2 rounded-full flex items-center justify-center transition-colors text-sm font-bold ${
              isHome 
                ? 'text-white/70 hover:bg-white/10 hover:text-white' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            style={{ border: isHome ? '1.5px solid rgba(255,255,255,0.2)' : '1.5px solid #cbd5e1', fontSize: '14px', width: '28px', height: '28px' }}'''
    )

    # 8. Update Hamburger
    content = content.replace(
        '<button className="md:hidden text-slate-600 p-2" onClick={() => setIsOpen(!isOpen)}>',
        '<button className={`md:hidden p-2 ${isHome ? \'text-white\' : \'text-slate-600\'}`} onClick={() => setIsOpen(!isOpen)}>'
    )
    
    # 9. In mobile view, make dropdown dark if isHome? No, the mobile menu dropdown can remain white so we don't need to rebuild it entirely.

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_navbar('d:/coding_files/Projects/AstraSky/components/layout/Navbar.tsx')
print("Successfully updated Navbar.tsx to be dynamic on the homepage.")
