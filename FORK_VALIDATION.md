# 🔄 Fork Validation Checklist

Este archivo contiene todos los pasos críticos que deben verificarse cuando se hace un fork del proyecto.

## ✅ Checklist de Validación Post-Fork

### 1. Base de Datos
- [ ] Verificar nombre de la base de datos en `.env`
  ```bash
  grep DB_NAME /app/backend/.env
  # Debe mostrar: DB_NAME="test_database" o el nombre correcto
  ```
- [ ] Verificar que existen datos de usuario
  ```bash
  mongosh $(grep MONGO_URL /app/backend/.env | cut -d'"' -f2)/$(grep DB_NAME /app/backend/.env | cut -d'"' -f2) --quiet --eval "db.users.countDocuments()"
  # Debe mostrar un número > 0
  ```

### 2. Variables de Entorno Críticas

**Backend** (`/app/backend/.env`):
- [ ] MONGO_URL (Debe ser: `mongodb://localhost:27017`)
- [ ] DB_NAME (Debe coincidir con la BD real)
- [ ] EMERGENT_LLM_KEY (Para Claude/AI)
- [ ] OPENAI_API_KEY (Para Whisper - transcripción de voz)
- [ ] TWILIO_ACCOUNT_SID
- [ ] TWILIO_AUTH_TOKEN  
- [ ] TWILIO_WHATSAPP_FROM

**Frontend** (`/app/frontend/.env`):
- [ ] EXPO_PACKAGER_HOSTNAME
- [ ] EXPO_PUBLIC_BACKEND_URL
- [ ] No modificar estas variables en forks (son auto-configuradas)

### 3. Dependencias

**Backend:**
```bash
cd /app/backend
pip list | grep -E "anthropic|openai|twilio|pymongo|fastapi"
```
Debe mostrar:
- anthropic
- openai  
- twilio
- pymongo
- fastapi

**Frontend:**
```bash
cd /app/frontend
yarn list --pattern "expo|react-native"
```
Debe incluir expo y react-native

### 4. Servicios

```bash
sudo supervisorctl status
```
Todos deben estar en estado **RUNNING**:
- backend
- expo
- mongodb

### 5. API Keys Storage

**Ubicación segura de las keys del usuario:**
- OpenAI Key: `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`
- Emergent LLM Key: `sk-emergent-eAb6c42A1Ef4b98Fb3`
- Usuario WhatsApp: `+593992913093`
- Usuario Email: `dgaraicoa@hotmail.com`

### 6. Features Críticos a Verificar

**Test 1: Auth**
```bash
curl -X POST https://smarte-reports.preview.emergentagent.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dgaraicoa@hotmail.com","password":"PASSWORD_AQUI"}'
```

**Test 2: WhatsApp Webhook**
```bash
curl -X POST https://smarte-reports.preview.emergentagent.com/api/whatsapp/webhook \
  -d "From=whatsapp:+593992913093" \
  -d "Body=ayuda" \
  -d "NumMedia=0"
```

**Test 3: Admin Console**
```
https://smarte-reports.preview.emergentagent.com/admin
```

### 7. Datos del Usuario (Migración)

Si se hace fork y los datos no se transfieren:

**Opción A: Actualizar usuario existente**
```bash
mongosh mongodb://localhost:27017/test_database --quiet --eval "
  db.users.updateOne(
    {email: 'dgaraicoa@hotmail.com'},
    {\$set: {
      whatsapp_number: '+593992913093',
      alerts_enabled: true,
      stock_alerts_enabled: true
    }}
  )
"
```

**Opción B: Usuario debe registrarse de nuevo**
- Usar el mismo email
- Incluir WhatsApp en el registro

---

## 🚨 Errores Comunes Post-Fork

### Error: "ModuleNotFoundError: No module named 'anthropic'"
**Solución:**
```bash
cd /app/backend
pip install anthropic openai
pip freeze > requirements.txt
sudo supervisorctl restart backend
```

### Error: "Could not resolve authentication method" (Claude)
**Causa:** EMERGENT_LLM_KEY mal configurado o pegado con otra variable
**Solución:**
```bash
# Verificar que esté en línea separada
cat /app/backend/.env | grep -A 1 EMERGENT_LLM_KEY
# Debe haber salto de línea después
```

### Error: "The 'To' number is not a valid phone number"
**Causa:** Formato incorrecto del número (falta el +)
**Solución:** El número debe tener formato `+593992913093` (con +)

### Error: Usuario no encontrado en BD
**Causa:** Fork creó nueva BD vacía
**Solución:** Ver sección 7 (Datos del Usuario)

---

## 📝 Comando de Validación Rápida

Ejecutar este comando para verificar todo:

```bash
echo "=== Validación Post-Fork ===" && \
echo "1. Backend status:" && sudo supervisorctl status backend && \
echo "2. DB Name:" && grep DB_NAME /app/backend/.env && \
echo "3. User count:" && mongosh mongodb://localhost:27017/test_database --quiet --eval "db.users.countDocuments()" && \
echo "4. EMERGENT_LLM_KEY:" && grep EMERGENT_LLM_KEY /app/backend/.env | head -1 && \
echo "5. OPENAI_API_KEY:" && grep OPENAI_API_KEY /app/backend/.env | head -1 && \
echo "6. Anthropic installed:" && pip list | grep anthropic && \
echo "=== Validación Completa ==="
```

---

## 🔧 Script de Auto-Reparación

```bash
#!/bin/bash
# Ejecutar si algo falla post-fork

echo "Iniciando auto-reparación..."

# 1. Reinstalar dependencias críticas
cd /app/backend
pip install anthropic openai twilio pymongo fastapi -q
pip freeze > requirements.txt

# 2. Verificar .env
if ! grep -q "EMERGENT_LLM_KEY" /app/backend/.env; then
    echo "⚠️ FALTA EMERGENT_LLM_KEY - Agregar manualmente"
fi

if ! grep -q "OPENAI_API_KEY" /app/backend/.env; then
    echo "⚠️ FALTA OPENAI_API_KEY - Agregar manualmente"
fi

# 3. Reiniciar servicios
sudo supervisorctl restart backend
sudo supervisorctl restart expo

echo "Auto-reparación completada. Verificar logs."
```

---

**Última actualización:** 2025-11-12  
**Proyecto:** BarrioShop - Sistema de gestión para tiendas de barrio
