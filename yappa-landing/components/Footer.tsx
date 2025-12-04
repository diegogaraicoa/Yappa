export default function Footer() {
  return (
    <footer className="bg-[#082E72] text-white py-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-3xl font-black text-[#00D2FF] mb-4">YAPPA</h3>
            <p className="text-blue-200 text-sm">
              Digitalizando tiendas de barrio en todo Ecuador
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Producto</h4>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li><a href="#" className="hover:text-[#00D2FF] transition-colors">Funcionalidades</a></li>
              <li><a href="#demo" className="hover:text-[#00D2FF] transition-colors">Solicitar Demo</a></li>
              <li><a href="#for-stores" className="hover:text-[#00D2FF] transition-colors">Registrar Tienda</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Compañía</h4>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li><a href="#about" className="hover:text-[#00D2FF] transition-colors">Sobre Nosotros</a></li>
              <li><a href="#contact" className="hover:text-[#00D2FF] transition-colors">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Contacto</h4>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li>📧 soporte@yappa.app</li>
              <li>📱 +593 99 999 9999</li>
              <li>🇪🇨 Ecuador</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-800 pt-8 text-center text-blue-200 text-sm">
          <p>© {new Date().getFullYear()} YAPPA. Todos los derechos reservados.</p>
          <p className="mt-2">Hecho con ❤️ en Ecuador</p>
        </div>
      </div>
    </footer>
  );
}
