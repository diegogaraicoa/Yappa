# 🚨 CHECKLIST CRÍTICO ANTES DE PRODUCCIÓN

## ⚠️ PENDIENTES OBLIGATORIOS ANTES DE LAUNCH

### 1. ☁️ WhatsApp Business API - CRÍTICO
**Estado:** ❌ Pendiente  
**Costo:** ~$20-40 USD/mes

**Requisitos:**
- [ ] Cuenta de Facebook Business Manager verificada
- [ ] Comprar número de WhatsApp Business en Twilio (~$1-2 USD/mes)
- [ ] Habilitar WhatsApp Business API
- [ ] Crear y aprobar plantillas de mensajes (24-48 hrs)
- [ ] Actualizar variables de entorno en backend:
  - `TWILIO_WHATSAPP_FROM=whatsapp:+XXXXXXXXXXX`
- [ ] Remover el código "join cake-husband" del tutorial

**Documentación:** Ver `/app/TWILIO_WHATSAPP_SETUP.md`

**Consecuencia si no se hace:** Los usuarios NO podrán usar la funcionalidad de WhatsApp sin enviar primero "join cake-husband" - BLOQUEADOR TOTAL del feature.

---

### 2. ✉️ Servicio de Email - CRÍTICO
**Estado:** ✅ COMPLETADO  
**Costo:** Gratis hasta 100 emails/día, ~$15 USD/mes (SendGrid Pro)

**Requisitos:**
- [x] Crear cuenta en SendGrid (o alternativa)
- [ ] Verificar dominio de email (@yappa.app) - Usando dgaraicoa@hotmail.com temporalmente
- [x] Obtener API Key de SendGrid
- [x] Actualizar código en `/app/backend/routes/onboarding_routes.py`:
  - Reemplazar `print("[EMAIL]...")` con llamada real a SendGrid
- [x] Crear plantillas de email:
  - [x] Email de bienvenida
  - [x] Email con PIN para clerks
  - [ ] Email de recuperación de contraseña (pendiente)
  - [ ] Email de resumen diario/semanal (pendiente)

**Código a actualizar:**
```python
# Línea 194 en onboarding_routes.py
# ANTES:
print(f"[EMAIL] Enviando PIN a {clerk_data.email}: Tu PIN es {clerk_data.pin}")

# DESPUÉS:
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

message = Mail(
    from_email='noreply@yappa.app',
    to_emails=clerk_data.email,
    subject='Tu PIN de acceso a YAPPA',
    html_content=f'<strong>Tu PIN es: {clerk_data.pin}</strong>'
)
sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
response = sg.send(message)
```

**Consecuencia si no se hace:** Los clerks NO recibirán sus PINs - BLOQUEADOR TOTAL del nuevo flujo de onboarding.

---

### 3. 🔐 Recuperación de Contraseña
**Estado:** ❌ NO implementado  
**Prioridad:** Alta

**Requisitos:**
- [ ] Endpoint backend `/api/auth/forgot-password`
- [ ] Endpoint backend `/api/auth/reset-password`
- [ ] Pantalla frontend "Olvidé mi contraseña"
- [ ] Integración con servicio de email (ver punto 2)

**Consecuencia si no se hace:** Usuarios que olviden su contraseña quedarán bloqueados.

---

### 4. 📊 Filtros en Admin Console
**Estado:** ❌ NO implementado  
**Prioridad:** Alta (para Casolette)

**Requisitos:**
- [ ] Dropdown de merchants en Admin Console
- [ ] Date pickers (inicio/fin)
- [ ] Actualizar todos los endpoints para soportar filtros:
  - `?merchant_id=xxx`
  - `?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

**Consecuencia si no se hace:** Casolette NO podrá analizar datos por tienda individual.

---

### 5. 💾 CSV Downloads
**Estado:** ❌ NO implementado  
**Prioridad:** Media

**Requisitos:**
- [ ] Endpoints `/api/*/export/csv` para cada sección
- [ ] Botones de descarga en Admin Console

**Consecuencia si no se hace:** No podrán exportar datos para análisis externo.

---

## 📝 NOTAS IMPORTANTES

### Variables de Entorno a Configurar:
```bash
# Email
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx

# WhatsApp (una vez configurado)
TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
```

### Testing Antes de Launch:
- [ ] Probar registro completo (Admin → Merchants → Clerks)
- [ ] Verificar que los PINs lleguen por email
- [ ] Probar login con clerk + PIN
- [ ] Probar funcionalidad de WhatsApp sin código de activación
- [ ] Probar filtros en Admin Console (con Casolette)

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### Semana 1 (Pre-Casolette):
1. Configurar WhatsApp Business API
2. Configurar SendGrid
3. Implementar envío real de emails
4. Implementar filtros en Admin Console

### Semana 2 (Post-Casolette Feedback):
1. Recuperación de contraseña
2. CSV Downloads
3. Refinamientos basados en feedback

---

## 📞 CONTACTOS DE SOPORTE

**Twilio:** https://support.twilio.com/  
**SendGrid:** https://support.sendgrid.com/  
**Meta/Facebook Business:** https://business.facebook.com/business/help

---

**Última actualización:** 2025-12-08  
**Creado por:** AI Agent durante sesión de desarrollo
