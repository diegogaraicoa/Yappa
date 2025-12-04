import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, storeName, type } = body;

    // Construct email content
    const subject = type === 'demo' 
      ? `Nueva Solicitud de Demo - ${storeName}`
      : `Nuevo Registro de Tienda - ${storeName}`;

    const htmlContent = `
      <h2>${type === 'demo' ? 'Nueva Solicitud de Demo' : 'Nuevo Registro de Tienda'}</h2>
      <p><strong>Nombre:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Teléfono:</strong> ${phone}</p>
      <p><strong>Nombre de Tienda:</strong> ${storeName}</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-EC')}</p>
    `;

    // Send email using fetch to a simple email service
    // For now, we'll use a simple mailto approach or you can integrate with SendGrid, etc.
    
    // Simple implementation: Log to console and return success
    // In production, integrate with an email service
    console.log('Email to send:', {
      to: 'dgaraicoa@hotmail.com',
      subject,
      html: htmlContent
    });

    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    // For now, we simulate success
    
    return NextResponse.json({ 
      success: true, 
      message: 'Formulario recibido exitosamente'
    });

  } catch (error) {
    console.error('Error processing form:', error);
    return NextResponse.json(
      { success: false, message: 'Error al procesar el formulario' },
      { status: 500 }
    );
  }
}
