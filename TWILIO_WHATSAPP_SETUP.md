# 📱 Guía Paso a Paso: Configurar WhatsApp Business en Twilio

## 🎯 ¿Por qué hacer esto?

Actualmente estás usando **Twilio Sandbox** (modo de prueba), que requiere que cada usuario envíe el código "join cake-husband" antes de poder usar WhatsApp. Esto es una barrera enorme.

Con **WhatsApp Business API**, tus usuarios podrán escribir directamente sin códigos.

---

## 📋 Requisitos Previos

1. **Cuenta de Twilio** con método de pago configurado
2. **Cuenta de Facebook Business Manager** (gratis)
3. **Número de teléfono** para tu negocio (puede ser el mismo que ya usas)
4. **Presupuesto:** ~$15-25 USD/mes para el número

---

## ✅ Paso 1: Crear/Verificar Facebook Business Manager

### 1.1 Ve a Facebook Business Manager
- URL: https://business.facebook.com/
- Inicia sesión con tu cuenta de Facebook personal

### 1.2 Crea un Business Manager (si no tienes)
- Click en **"Crear cuenta"**
- Nombre del negocio: **YAPPA**
- Tu nombre completo
- Email del negocio: **tu-email@ejemplo.com**
- Click en **"Enviar"**

### 1.3 Verificar tu negocio
- Facebook te pedirá documentos (licencia, factura de servicios, etc.)
- Sube los documentos solicitados
- Espera aprobación (1-3 días hábiles)

---

## ✅ Paso 2: Conectar Meta WhatsApp Business API con Twilio

### 2.1 En Twilio Console
1. Ve a: https://console.twilio.com/
2. Click en **"Messaging"** en el menú lateral
3. Click en **"Try it out"** → **"Send a WhatsApp message"**

### 2.2 Solicitar Acceso a WhatsApp
1. Click en **"Get Started"** en la sección de WhatsApp
2. Selecciona **"Enable WhatsApp Business API"**
3. Te pedirá conectar con tu cuenta de Facebook Business Manager
4. Click en **"Connect Facebook Business Manager"**

### 2.3 Autorizar Twilio en Facebook
1. Se abrirá una ventana de Facebook
2. Inicia sesión y selecciona tu Business Manager (**YAPPA**)
3. Acepta los permisos que solicita Twilio
4. Confirma la conexión

---

## ✅ Paso 3: Configurar tu Número de WhatsApp Business

### 3.1 Comprar un Número (Opción A - Más Fácil)
1. En Twilio Console → **"Phone Numbers"** → **"Buy a number"**
2. Filtros:
   - País: **Ecuador** (o el país de tu negocio)
   - Capabilities: Marca **"SMS"** y **"MMS"**
3. Selecciona un número que te guste
4. Click en **"Buy"** (~$1-2 USD/mes)

### 3.2 Habilitar WhatsApp en ese número
1. Ve a **"Messaging"** → **"Senders"** → **"WhatsApp senders"**
2. Click en **"Add a WhatsApp sender"**
3. Selecciona el número que compraste
4. Click en **"Submit for approval"**

---

## ✅ Paso 4: Crear un Perfil de Negocio en WhatsApp

### 4.1 Completar información del negocio
Twilio te pedirá:
- **Nombre del negocio:** YAPPA
- **Descripción:** "Gestión inteligente para tiendas de barrio"
- **Categoría:** Retail / Technology
- **Dirección:** Tu dirección del negocio
- **Sitio web:** https://yappa-landing.vercel.app/
- **Logo:** Sube el logo de YAPPA

### 4.2 Enviar para aprobación de Meta
1. Revisa que toda la información esté correcta
2. Click en **"Submit for review"**
3. **Tiempo de espera:** 1-5 días hábiles

---

## ✅ Paso 5: Configurar Message Templates (Plantillas)

WhatsApp Business requiere **plantillas pre-aprobadas** para enviar mensajes.

### 5.1 Crear plantillas básicas
1. En Twilio Console → **"Messaging"** → **"Content Editor"**
2. Click en **"Create new content"**
3. Crea estas plantillas:

**Plantilla 1: Bienvenida**
- Nombre: `welcome_message`
- Idioma: Español
- Categoría: UTILITY
- Contenido:
```
¡Hola! Bienvenido a YAPPA 🎉

Soy tu asistente de IA para registrar ventas y gastos.

Escribe "venta" o "gasto" para empezar.
```

**Plantilla 2: Alerta de Stock**
- Nombre: `low_stock_alert`
- Idioma: Español
- Categoría: UTILITY
- Contenido:
```
⚠️ Alerta de Stock Bajo

Los siguientes productos tienen stock bajo:
{{1}}

Considera reabastecer pronto.
```

**Plantilla 3: Reporte Diario**
- Nombre: `daily_summary`
- Idioma: Español
- Categoría: UTILITY
- Contenido:
```
📊 Tu Resumen Diario

{{1}}

Gracias por usar YAPPA 🙌
```

### 5.2 Enviar para aprobación
- Cada plantilla debe ser aprobada por Meta
- Tiempo: 24-48 horas

---

## ✅ Paso 6: Actualizar tu Backend de YAPPA

### 6.1 Obtener tus credenciales
1. En Twilio Console, copia:
   - **Account SID**
   - **Auth Token**
   - **Tu número de WhatsApp** (con formato: `whatsapp:+1234567890`)

### 6.2 Actualizar archivo `.env` en backend
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
```

### 6.3 Actualizar el código del webhook
El webhook actual (`/api/whatsapp/webhook`) ya está configurado correctamente.

**No necesitas cambiar nada en el código** - solo las variables de entorno.

---

## ✅ Paso 7: Probar la Integración

### 7.1 Configurar el webhook en Twilio
1. Ve a **"Messaging"** → **"Settings"** → **"WhatsApp sandbox settings"**
2. En **"When a message comes in"**, pega:
```
https://tu-dominio.com/api/whatsapp/webhook
```
3. Método: **POST**
4. Click en **"Save"**

### 7.2 Probar enviando un mensaje
1. Desde tu teléfono, envía un WhatsApp a tu nuevo número
2. Escribe: `venta`
3. Deberías recibir la respuesta del asistente de IA

---

## 💰 Costos Esperados

### Costos Mensuales de Twilio:
- **Número de teléfono:** $1-2 USD/mes
- **Mensajes WhatsApp:**
  - Primeros 1,000 mensajes de conversación: **GRATIS**
  - Después: ~$0.005 - $0.01 por mensaje
  
### Ejemplo con 100 usuarios activos:
- Promedio 50 mensajes/usuario/mes = 5,000 mensajes
- Primeros 1,000: Gratis
- Siguientes 4,000: $20-40 USD
- **Total: ~$22-42 USD/mes**

---

## 🚨 Problemas Comunes

### "Mi solicitud fue rechazada"
- **Solución:** Verifica que tu Facebook Business Manager esté verificado
- Contacta a Twilio Support para entender el motivo

### "No puedo enviar plantillas personalizadas"
- **Solución:** Durante las primeras 24 horas con un usuario, puedes enviar mensajes libres (sin plantillas)
- Después de 24 horas de inactividad, DEBES usar plantillas aprobadas

### "Los mensajes no llegan"
- **Solución:** Verifica que el webhook esté configurado correctamente
- Revisa los logs de Twilio Console

---

## 📞 Soporte

Si necesitas ayuda en cualquier paso:

**Twilio Support:**
- https://support.twilio.com/
- Chat en vivo disponible

**Meta/Facebook Support:**
- https://business.facebook.com/business/help

---

## ✅ Checklist Final

- [ ] Facebook Business Manager creado y verificado
- [ ] Cuenta de Twilio con método de pago
- [ ] Número de teléfono comprado en Twilio
- [ ] WhatsApp Business API habilitado
- [ ] Plantillas de mensajes creadas y aprobadas
- [ ] Variables de entorno actualizadas en backend
- [ ] Webhook configurado en Twilio
- [ ] Prueba exitosa enviando "venta"

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tus usuarios podrán usar WhatsApp **sin códigos de activación**.

**Tiempo total estimado:** 3-7 días (esperando aprobaciones)

**¿Necesitas ayuda?** Déjame saber en qué paso estás y te ayudo.
