export default function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-br from-[#082E72] via-[#0A3A8F] to-[#00D2FF] min-h-screen flex items-center">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      
      <div className="container mx-auto px-6 lg:px-12 py-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8 inline-block">
            <h1 className="text-6xl md:text-8xl font-black text-[#00D2FF] tracking-tight">
              YAPPA
            </h1>
          </div>

          {/* Tagline */}
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Digitaliza tu negocio.<br />Crece sin límites.
          </h2>

          <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed">
            La app todo-en-uno que transforma tiendas de barrio en negocios digitales exitosos
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#demo" 
              className="bg-[#00D2FF] text-[#082E72] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#00B8E6] transform hover:scale-105 transition-all shadow-2xl"
            >
              Solicitar Demo Gratis
            </a>
            <a 
              href="#for-stores" 
              className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
            >
              Registrar mi Tienda
            </a>
          </div>

          {/* Social Proof */}
          <div className="mt-16 flex items-center justify-center gap-8 text-blue-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#00D2FF]">500+</div>
              <div className="text-sm">Tiendas Activas</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#00D2FF]">Ecuador</div>
              <div className="text-sm">Cobertura Nacional</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#00D2FF]">100%</div>
              <div className="text-sm">Gratis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}
