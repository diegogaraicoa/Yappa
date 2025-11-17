# 🧪 Cómo Probar WhatsApp AI (Placeholder mientras se activa Twilio)

## 📱 Opción 1: Simulador Interactivo (Recomendado)

```bash
cd /app/backend
python3 whatsapp_test_interface.py
```

### Uso:
1. El simulador inicia automáticamente
2. Escribe tus mensajes como si estuvieras en WhatsApp
3. El AI responderá en tiempo real
4. Puedes ver las ventas/gastos registrados al final

### Ejemplo de Conversación:

```
📱 TÚ: venta
🤖 AI: ¡Perfecto! Vamos a registrar una venta...

📱 TÚ: vendí 3 coca colas a María por $7.50 total
🤖 AI: Entiendo. ¿Cómo pagó? (Efectivo, Transferencia, Tarjeta, DeUna)

📱 TÚ: efectivo y ya pagó
🤖 AI: Resumen de la venta:
      • 3 coca colas
      • Cliente: María
      • Total: $7.50
      • Pago: Efectivo (Pagado)
      Confirma con SÍ

📱 TÚ: sí
🤖 AI: ✅ ¡Venta registrada exitosamente!

💰 VENTAS REGISTRADAS:
✅ Venta ID: 691xxxxx
   Total: $7.50
   Cliente: María
   ...
```

### Comandos Especiales:
- `salir` - Terminar simulación
- `nuevo` - Empezar nueva conversación
- `ver` - Ver ventas/gastos recientes

---

## 📱 Opción 2: Prueba Rápida con Script

```bash
cd /app/backend
python3 << 'EOF'
import sys
sys.path.append('/app/backend')
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from services.whatsapp_conversation_service import WhatsAppConversationService

async def quick_test():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    service = WhatsAppConversationService(db)
    
    messages = [
        "venta",
        "vendí 2 aguas a Juan por $2 total",
        "efectivo y ya pagó",
        "sí"
    ]
    
    for msg in messages:
        print(f"\n📱 TÚ: {msg}")
        response = await service.process_message("+593992913093", "690e264929f0c385565b3a1b", msg)
        print(f"🤖 AI: {response}")

asyncio.run(quick_test())
EOF
```

---

## 🔧 Verificar Resultados

Después de una conversación exitosa, verifica la venta en la base de datos:

```bash
cd /app
python3 check_my_sales.py
```

O desde la Admin Console web:
https://streetbiz.preview.emergentagent.com/admin

---

## 📝 Notas Importantes

1. **El AI funciona perfectamente** - Solo falta que Twilio active tu upgrade
2. **Las ventas/gastos SE REGISTRAN** - Aunque Twilio no envíe respuestas
3. **Mañana todo funcionará por WhatsApp** - Una vez que se active tu upgrade

---

## 🚀 Una vez que Twilio se active:

1. Abre WhatsApp
2. Envía al +1 415 523 8886: `join [tu-código-sandbox]`
3. Envía: `venta`
4. ¡Disfruta la conversación con el AI!

---

## 🆘 Soporte

Si tienes problemas:
1. Verifica que el backend esté corriendo: `sudo supervisorctl status backend`
2. Reinicia si es necesario: `sudo supervisorctl restart backend`
3. Revisa logs: `tail -f /var/log/supervisor/backend.err.log`
