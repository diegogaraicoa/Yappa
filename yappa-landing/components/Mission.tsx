export default function Mission() {
  return (
    <section className="py-24 bg-gradient-to-br from-[#082E72] to-[#0A3A8F] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
      
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-6 py-2 bg-[#00D2FF]/20 rounded-full">
            <span className="text-[#00D2FF] font-bold">Nuestra Misión</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
            Democratizar la inclusión digital para comercios pequeños e informales del Ecuador
          </h2>

          <p className="text-xl text-blue-100 leading-relaxed mb-12">
            Creemos que cada tienda de barrio merece las mismas herramientas tecnológicas que usan las grandes empresas. Por eso creamos YAPPA: una plataforma 100% gratuita, fácil de usar, y diseñada especialmente para negociantes ecuatorianos.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-5xl mb-4">🇪🇨</div>
              <div className="text-3xl font-bold text-[#00D2FF] mb-2">Ecuador</div>
              <div className="text-blue-200">Hecho en Ecuador,<br />para Ecuador</div>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">👥</div>
              <div className="text-3xl font-bold text-[#00D2FF] mb-2">Comunidad</div>
              <div className="text-blue-200">Apoyamos tiendas<br />de barrio</div>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🚀</div>
              <div className="text-3xl font-bold text-[#00D2FF] mb-2">Innovación</div>
              <div className="text-blue-200">Tecnología accesible<br />para todos</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
