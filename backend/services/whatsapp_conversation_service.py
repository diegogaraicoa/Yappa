import os
import json
from datetime import datetime, timedelta
from typing import Dict, Optional
from openai import OpenAI
from emergentintegrations import get_integration

# Initialize clients
openai_client = None
claude_client = None

def get_openai_client():
    global openai_client
    if openai_client is None:
        openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))
    return openai_client

def get_claude_client():
    global claude_client
    if claude_client is None:
        llm_key = os.environ.get("EMERGENT_LLM_KEY", "")
        claude_client = get_integration("claude", api_key=llm_key)
    return claude_client


class WhatsAppConversationService:
    """Service to handle conversational WhatsApp interactions for sales/expenses"""
    
    def __init__(self, db):
        self.db = db
        self.timeout_minutes = 5
    
    async def transcribe_audio(self, audio_url: str) -> str:
        """Transcribe audio using Whisper API"""
        try:
            import requests
            
            # Download audio
            response = requests.get(audio_url)
            audio_file = "/tmp/voice_message.ogg"
            
            with open(audio_file, "wb") as f:
                f.write(response.content)
            
            # Transcribe
            client = get_openai_client()
            with open(audio_file, "rb") as audio:
                transcription = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio,
                    language="es"
                )
            
            return transcription.text
        except Exception as e:
            print(f"Error transcribing audio: {str(e)}")
            return None
    
    async def get_or_create_conversation(self, user_phone: str, store_id: str) -> Dict:
        """Get existing conversation or create new one"""
        
        # Check for timeout
        timeout_threshold = datetime.utcnow() - timedelta(minutes=self.timeout_minutes)
        
        # Find active conversation
        conversation = await self.db.whatsapp_conversations.find_one({
            "user_phone": user_phone,
            "store_id": store_id,
            "status": "active",
            "last_message_at": {"$gte": timeout_threshold}
        })
        
        if conversation:
            return conversation
        
        # Create new conversation
        new_conversation = {
            "user_phone": user_phone,
            "store_id": store_id,
            "status": "active",
            "intent": None,  # "sale" or "expense"
            "data": {},
            "messages": [],
            "created_at": datetime.utcnow(),
            "last_message_at": datetime.utcnow()
        }
        
        result = await self.db.whatsapp_conversations.insert_one(new_conversation)
        new_conversation["_id"] = result.inserted_id
        
        return new_conversation
    
    async def update_conversation(self, conversation_id, updates: Dict):
        """Update conversation state"""
        updates["last_message_at"] = datetime.utcnow()
        
        await self.db.whatsapp_conversations.update_one(
            {"_id": conversation_id},
            {"$set": updates}
        )
    
    async def add_message(self, conversation_id, role: str, content: str):
        """Add message to conversation history"""
        await self.db.whatsapp_conversations.update_one(
            {"_id": conversation_id},
            {
                "$push": {
                    "messages": {
                        "role": role,
                        "content": content,
                        "timestamp": datetime.utcnow()
                    }
                },
                "$set": {"last_message_at": datetime.utcnow()}
            }
        )
    
    async def process_message(self, user_phone: str, store_id: str, message: str) -> str:
        """Process incoming message and return bot response"""
        
        # Special commands
        message_upper = message.upper().strip()
        
        if message_upper in ["CANCELAR", "CANCEL"]:
            await self.cancel_conversation(user_phone, store_id)
            return "❌ Conversación cancelada. Escribe 'venta' o 'gasto' para comenzar de nuevo."
        
        if message_upper in ["AYUDA", "HELP"]:
            return self.get_help_message()
        
        # Get or create conversation
        conversation = await self.get_or_create_conversation(user_phone, store_id)
        
        # Add user message
        await self.add_message(conversation["_id"], "user", message)
        
        # Detect intent if not set
        if not conversation.get("intent"):
            intent = await self.detect_intent(message)
            if intent:
                conversation["intent"] = intent
                await self.update_conversation(conversation["_id"], {"intent": intent})
            else:
                response = "👋 ¡Hola! ¿Qué deseas registrar?\n\nEscribe:\n• 'venta' para registrar una venta\n• 'gasto' para registrar un gasto\n• 'ayuda' para ver instrucciones"
                await self.add_message(conversation["_id"], "assistant", response)
                return response
        
        # Process based on intent
        if conversation["intent"] == "sale":
            response = await self.process_sale_conversation(conversation, message)
        elif conversation["intent"] == "expense":
            response = await self.process_expense_conversation(conversation, message)
        else:
            response = "❌ No entendí tu solicitud. Escribe 'venta' o 'gasto'."
        
        # Add bot response
        await self.add_message(conversation["_id"], "assistant", response)
        
        return response
    
    async def detect_intent(self, message: str) -> Optional[str]:
        """Detect if user wants to register sale or expense"""
        message_lower = message.lower()
        
        sale_keywords = ["venta", "vendi", "vendí", "vender", "cliente", "compró", "compro"]
        expense_keywords = ["gasto", "compra", "compre", "compré", "pago", "pagué", "proveedor"]
        
        for keyword in sale_keywords:
            if keyword in message_lower:
                return "sale"
        
        for keyword in expense_keywords:
            if keyword in message_lower:
                return "expense"
        
        return None
    
    async def process_sale_conversation(self, conversation: Dict, message: str) -> str:
        """Process sale conversation using Claude"""
        
        store_id = conversation["store_id"]
        data = conversation.get("data", {})
        
        # Build conversation history for Claude
        messages_history = conversation.get("messages", [])
        
        # System prompt
        system_prompt = f"""Eres un asistente para registrar ventas en una tienda.

Datos actuales de la venta:
{json.dumps(data, indent=2, ensure_ascii=False)}

Debes obtener:
1. Producto(s): nombre y cantidad
2. Precio: unitario o total
3. Cliente: nombre (o "sin cliente" si es anónimo)
4. Método de pago: Efectivo, Transferencia, Tarjeta, o DeUna
5. Estado: ¿Ya pagó? (para detectar deudas)

IMPORTANTE:
- Si el usuario menciona un producto que no existe en inventario, responde: "⚠️ El producto '[nombre]' no existe en tu inventario. Por favor créalo primero desde el app o Admin Console."
- Si menciona un cliente que no existe, responde: "⚠️ El cliente '[nombre]' no existe. Por favor créalo primero desde el app o Admin Console."
- Sé breve y directo
- Haz UNA pregunta a la vez
- Cuando tengas toda la información, genera un resumen y pide confirmación con "Confirma con SÍ"

Responde en español, de forma amigable pero profesional."""

        # Call Claude
        try:
            client = get_claude_client()
            
            # Build messages for Claude
            claude_messages = []
            for msg in messages_history[-10:]:  # Last 10 messages
                claude_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
            
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=500,
                system=system_prompt,
                messages=claude_messages
            )
            
            bot_response = response.content[0].text
            
            # Check if user is confirming
            if message.upper().strip() in ["SÍ", "SI", "CONFIRMAR", "OK", "YES"]:
                # Try to register the sale
                result = await self.register_sale(conversation)
                if result["success"]:
                    await self.complete_conversation(conversation["_id"])
                    return result["message"]
                else:
                    return result["message"]
            
            return bot_response
            
        except Exception as e:
            print(f"Error with Claude: {str(e)}")
            return "❌ Error procesando tu mensaje. Intenta de nuevo."
    
    async def process_expense_conversation(self, conversation: Dict, message: str) -> str:
        """Process expense conversation using Claude"""
        
        store_id = conversation["store_id"]
        data = conversation.get("data", {})
        
        messages_history = conversation.get("messages", [])
        
        system_prompt = f"""Eres un asistente para registrar gastos en una tienda.

Datos actuales del gasto:
{json.dumps(data, indent=2, ensure_ascii=False)}

Debes obtener:
1. Concepto: descripción del gasto
2. Monto: cantidad en dólares
3. Proveedor: nombre (o "sin proveedor")
4. Categoría: Compra de productos, Servicios, Salarios, Otros
5. Método de pago: Efectivo, Transferencia, Tarjeta, DeUna
6. Estado: ¿Ya pagó?

IMPORTANTE:
- Si menciona un proveedor que no existe, responde: "⚠️ El proveedor '[nombre]' no existe. Por favor créalo primero desde el app o Admin Console."
- Sé breve y directo
- Haz UNA pregunta a la vez
- Cuando tengas toda la información, genera un resumen y pide confirmación con "Confirma con SÍ"

Responde en español, de forma amigable pero profesional."""

        try:
            client = get_claude_client()
            
            claude_messages = []
            for msg in messages_history[-10:]:
                claude_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
            
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=500,
                system=system_prompt,
                messages=claude_messages
            )
            
            bot_response = response.content[0].text
            
            if message.upper().strip() in ["SÍ", "SI", "CONFIRMAR", "OK", "YES"]:
                result = await self.register_expense(conversation)
                if result["success"]:
                    await self.complete_conversation(conversation["_id"])
                    return result["message"]
                else:
                    return result["message"]
            
            return bot_response
            
        except Exception as e:
            print(f"Error with Claude: {str(e)}")
            return "❌ Error procesando tu mensaje. Intenta de nuevo."
    
    async def register_sale(self, conversation: Dict) -> Dict:
        """Register the sale in database"""
        # This will be implemented to actually create the sale
        # For now, return success
        return {
            "success": True,
            "message": "✅ ¡Venta registrada exitosamente!\n\nEscribe 'venta' para registrar otra."
        }
    
    async def register_expense(self, conversation: Dict) -> Dict:
        """Register the expense in database"""
        # This will be implemented to actually create the expense
        return {
            "success": True,
            "message": "✅ ¡Gasto registrado exitosamente!\n\nEscribe 'gasto' para registrar otro."
        }
    
    async def complete_conversation(self, conversation_id):
        """Mark conversation as completed"""
        await self.db.whatsapp_conversations.update_one(
            {"_id": conversation_id},
            {"$set": {"status": "completed", "completed_at": datetime.utcnow()}}
        )
    
    async def cancel_conversation(self, user_phone: str, store_id: str):
        """Cancel active conversation"""
        await self.db.whatsapp_conversations.update_one(
            {
                "user_phone": user_phone,
                "store_id": store_id,
                "status": "active"
            },
            {"$set": {"status": "cancelled", "cancelled_at": datetime.utcnow()}}
        )
    
    def get_help_message(self) -> str:
        """Return help message"""
        return """📱 *Ayuda - Registro por WhatsApp*

*Ventas:*
Escribe "venta" y luego proporciona:
• Producto y cantidad
• Precio
• Cliente (o di "sin cliente")
• Forma de pago
• Si ya pagó o es deuda

*Gastos:*
Escribe "gasto" y luego proporciona:
• Concepto del gasto
• Monto
• Proveedor (o "sin proveedor")
• Categoría
• Forma de pago
• Si ya pagó

*Comandos:*
• CANCELAR - Abortar conversación
• AYUDA - Ver este mensaje

*Notas de voz:*
Puedes enviar notas de voz en lugar de texto. Se transcribirán automáticamente.

⏱️ Tienes 5 minutos entre mensajes antes de que la conversación se reinicie."""


# Singleton instance
whatsapp_conversation_service = None

def get_whatsapp_conversation_service(db):
    global whatsapp_conversation_service
    if whatsapp_conversation_service is None:
        whatsapp_conversation_service = WhatsAppConversationService(db)
    return whatsapp_conversation_service
