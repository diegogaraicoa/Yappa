#!/usr/bin/env python3
"""
Debug Claude Test - Check what Claude is actually returning
"""

import asyncio
import os
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Load environment variables
load_dotenv('/app/backend/.env')

async def test_claude_responses():
    """Test Claude responses for sale conversation"""
    
    # Get API key
    llm_key = os.environ.get("EMERGENT_LLM_KEY", "")
    print(f"Using LLM Key: {llm_key[:10]}...")
    
    # System prompt for sale
    system_prompt = """Eres un asistente para registrar ventas en una tienda. DEBES responder SIEMPRE en formato JSON válido.

Información requerida:
1. products: [{"name": string, "quantity": number, "price": number}]
2. customer: string (nombre del cliente o "Sin cliente")
3. payment_method: "Efectivo" | "Transferencia" | "Tarjeta" | "DeUna"
4. paid: boolean (true si ya pagó, false si es deuda)
5. total: number

FORMATO DE RESPUESTA OBLIGATORIO:
{
  "message": "Tu respuesta al usuario en español, breve y directa",
  "data": {
    "products": [...],
    "customer": "...",
    "payment_method": "...",
    "paid": true/false,
    "total": 0
  },
  "ready": true/false
}

REGLAS:
- "message": Lo que le dirás al usuario
- "data": Extrae TODA la información que el usuario haya proporcionado hasta ahora
- "ready": true SOLO cuando tengas TODA la información necesaria
- Sé breve, haz UNA pregunta a la vez
- Cuando ready=true, genera un resumen completo y pide confirmación con "Confirma con SÍ"
- Si faltan datos, pregunta específicamente por ellos
- SIEMPRE responde en formato JSON válido"""

    # Initialize LlmChat
    chat = LlmChat(
        api_key=llm_key,
        session_id="debug_test",
        system_message=system_prompt
    ).with_model("anthropic", "claude-4-sonnet-20250514")
    
    # Test messages
    test_messages = [
        "vendí 2 aguas a Juan por $2 total",
        "efectivo y ya pagó",
        "sí"
    ]
    
    for i, message in enumerate(test_messages):
        print(f"\n{'='*60}")
        print(f"TEST MESSAGE {i+1}: '{message}'")
        print('='*60)
        
        try:
            user_message = UserMessage(text=message)
            response = await chat.send_message(user_message)
            
            print(f"CLAUDE RESPONSE:")
            print(response)
            print(f"\nRESPONSE LENGTH: {len(response)} characters")
            
            # Try to parse as JSON
            import json
            try:
                # Remove markdown code blocks if present
                json_text = response.strip()
                if json_text.startswith("```json"):
                    json_text = json_text[7:]  # Remove ```json
                if json_text.endswith("```"):
                    json_text = json_text[:-3]  # Remove ```
                json_text = json_text.strip()
                
                parsed = json.loads(json_text)
                print(f"\nPARSED JSON:")
                print(json.dumps(parsed, indent=2, ensure_ascii=False))
                
                # Check if ready
                if parsed.get("ready"):
                    print(f"\n🎯 READY FLAG: {parsed.get('ready')}")
                    print(f"📊 DATA EXTRACTED: {parsed.get('data')}")
                    
            except json.JSONDecodeError as e:
                print(f"\n❌ JSON PARSE ERROR: {str(e)}")
                print(f"Raw response: {repr(response)}")
                
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    asyncio.run(test_claude_responses())