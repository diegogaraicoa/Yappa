export default function Contact() {
  return (
    <section id="contact" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[#082E72] mb-6">
            ¿Tienes preguntas?
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Estamos aquí para ayudarte
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <a 
              href="mailto:soporte@yappa.app" 
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-5xl mb-4">📧</div>
              <h3 className="text-xl font-bold text-[#082E72] mb-2">Email</h3>
              <p className="text-gray-600">soporte@yappa.app</p>
            </a>

            <a 
              href="https://wa.me/593999999999" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-5xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-[#082E72] mb-2">WhatsApp</h3>
              <p className="text-gray-600">+593 99 999 9999</p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
