'use client';
import { useState } from 'react';

export default function Demo() {
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
        body: JSON.stringify({ ...formData, type: 'demo' })
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
    <section id="demo" className="py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-[#082E72] mb-4">
              Solicita un Demo Gratis
            </h2>
            <p className="text-xl text-gray-600">
              Te mostraremos cómo YAPPA puede transformar tu negocio
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 md:p-12 rounded-3xl shadow-xl border border-blue-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#082E72] mb-2">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#00D2FF] focus:outline-none transition-colors"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#082E72] mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#00D2FF] focus:outline-none transition-colors"
                  placeholder="juan@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#082E72] mb-2">Teléfono *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#00D2FF] focus:outline-none transition-colors"
                  placeholder="+593 99 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#082E72] mb-2">Nombre de tu Tienda *</label>
                <input
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#00D2FF] focus:outline-none transition-colors"
                  placeholder="Mi Tiendita"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full bg-[#00D2FF] text-[#082E72] py-4 rounded-xl font-bold text-lg hover:bg-[#00B8E6] transform hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50"
              >
                {status === 'sending' ? 'Enviando...' : 'Solicitar Demo Ahora'}
              </button>

              {status === 'success' && (
                <div className="bg-green-100 border-2 border-green-500 text-green-800 px-4 py-3 rounded-xl text-center font-semibold">
                  ✅ ¡Solicitud enviada! Te contactaremos pronto.
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
