'use client';
import { useState } from 'react';

export default function ForStores() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    storeName: ''
  });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, type: 'register' })
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', storeName: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <section id="for-stores" className="py-24 bg-gradient-to-br from-[#082E72] to-[#0A3A8F]">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              🛍️ Registra tu Tienda
            </h2>
            <p className="text-xl text-blue-100">
              Únete a cientos de tiendas que ya usan YAPPA
            </p>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="font-bold text-[#082E72] mb-1">100% Gratis</h3>
                    <p className="text-gray-600 text-sm">Sin costos, sin letras pequeñas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="font-bold text-[#082E72] mb-1">Fácil de Usar</h3>
                    <p className="text-gray-600 text-sm">Empieza a vender en minutos</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="font-bold text-[#082E72] mb-1">Soporte en Español</h3>
                    <p className="text-gray-600 text-sm">Estamos para ayudarte</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="font-bold text-[#082E72] mb-1">Reportes por WhatsApp</h3>
                    <p className="text-gray-600 text-sm">Recibe tu resumen diario</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#00D2FF] focus:outline-none transition-colors"
                    placeholder="Tu Nombre *"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    value={formData.storeName}
                    onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#00D2FF] focus:outline-none transition-colors"
                    placeholder="Nombre de tu Tienda *"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#00D2FF] focus:outline-none transition-colors"
                    placeholder="Email *"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#00D2FF] focus:outline-none transition-colors"
                    placeholder="Teléfono *"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full bg-[#00D2FF] text-[#082E72] py-4 rounded-xl font-bold text-lg hover:bg-[#00B8E6] transform hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50"
              >
                {status === 'sending' ? 'Registrando...' : '🚀 Registrar mi Tienda Ahora'}
              </button>

              {status === 'success' && (
                <div className="bg-green-100 border-2 border-green-500 text-green-800 px-4 py-3 rounded-xl text-center font-semibold">
                  ✅ ¡Registro exitoso! Te contactaremos pronto.
                </div>
              )}

              {status === 'error' && (
                <div className="bg-red-100 border-2 border-red-500 text-red-800 px-4 py-3 rounded-xl text-center font-semibold">
                  ❌ Hubo un error. Inténtalo de nuevo.
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
