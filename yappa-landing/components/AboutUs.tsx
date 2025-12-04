export default function AboutUs() {
  return (
    <section id="about" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#082E72] mb-4">
              Sobre YAPPA
            </h2>
            <div className="w-24 h-1 bg-[#00D2FF] mx-auto mb-8"></div>
          </div>

          <div className="bg-white p-12 rounded-3xl shadow-lg">
            <p className="text-xl text-gray-700 leading-relaxed mb-6">
              YAPPA nació en <span className="font-bold text-[#082E72]">Ecuador</span> con una visión clara: <span className="font-bold">ayudar a las tiendas de barrio a competir en la era digital</span>.
            </p>

            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              Sabemos que muchos dueños de negocios pequeños llevan sus cuentas en cuadernos, pierden ventas por no saber qué productos se venden más, y no tienen tiempo ni recursos para sistemas complicados.
            </p>

            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Por eso creamos YAPPA: una app que se aprende en minutos, que funciona desde cualquier celular, y que es <span className="font-bold text-[#00D2FF]">completamente gratis</span>. Sin letras pequeñas, sin cargos sorpresa.
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border-l-4 border-[#00D2FF]">
              <p className="text-lg font-semibold text-[#082E72] italic">
                "Queremos que cada tienda de barrio pueda crecer, prosperar y modernizarse sin barreras."
              </p>
              <p className="text-sm text-gray-600 mt-2">- Equipo YAPPA</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
