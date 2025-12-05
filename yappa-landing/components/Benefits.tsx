export default function Benefits() {
  const benefits = [
    {
      icon: '📱',
      title: 'Control Total',
      description: 'Gestiona inventario, ventas y gastos desde tu celular en tiempo real'
    },
    {
      icon: '💰',
      title: 'Aumenta Ventas',
      description: 'Reportes inteligentes te ayudan a tomar mejores decisiones de negocio'
    },
    {
      icon: '⚡',
      title: 'Super Fácil',
      description: 'Diseñado para dueños de tienda. Sin complicaciones, sin capacitaciones largas'
    },
    {
      icon: '📊',
      title: 'Reportes Automáticos',
      description: 'Recibe resúmenes diarios por WhatsApp. Sé siempre cuánto ganas'
    },
    {
      icon: '🔔',
      title: 'Alertas Inteligentes',
      description: 'Te avisamos cuando se acaba el stock o hay deudas pendientes'
    },
    {
      icon: '🆓',
      title: '100% Gratis',
      description: 'Sin costos ocultos, sin límites. Gratis para siempre'
    }
  ];

  return (
    <section id="porque-yappa" className="py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#082E72] mb-4">
            ¿Por qué YAPPA?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Todo lo que necesitas para llevar tu tienda al siguiente nivel
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-2xl hover:shadow-xl transition-all transform hover:-translate-y-1 border border-blue-100"
            >
              <div className="text-5xl mb-4">{benefit.icon}</div>
              <h3 className="text-2xl font-bold text-[#082E72] mb-3">
                {benefit.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
