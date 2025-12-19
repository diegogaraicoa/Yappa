#!/bin/bash

# Script de prueba completo para Admin Ops CRUD
# Prueba todo el flujo: Admin → Merchant → Clerk → KYB

BASE_URL="https://tienda-manager-3.preview.emergentagent.com/api"

echo "=========================================="
echo "🚀 INICIANDO PRUEBAS DE ADMIN OPS"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================
# FASE 1: CREAR ADMIN
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📋 FASE 1: CREAR ADMIN${NC}"
echo -e "${BLUE}========================================${NC}"

ADMIN_DATA='{
  "nombre": "Juan Pérez",
  "email": "juan.perez@empresa.com",
  "telefono": "+593999123456"
}'

echo -e "${YELLOW}Enviando: POST /api/admin-ops/admins${NC}"
echo "$ADMIN_DATA" | jq '.'

ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/admin-ops/admins" \
  -H "Content-Type: application/json" \
  -d "$ADMIN_DATA")

echo -e "${GREEN}Respuesta:${NC}"
echo "$ADMIN_RESPONSE" | jq '.'

ADMIN_ID=$(echo "$ADMIN_RESPONSE" | jq -r '.admin_id')
echo -e "${GREEN}✅ Admin creado con ID: $ADMIN_ID${NC}"
echo ""

# ========================================
# FASE 2: LISTAR ADMINS
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📋 FASE 2: LISTAR TODOS LOS ADMINS${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${YELLOW}Enviando: GET /api/admin-ops/admins${NC}"

ADMINS_LIST=$(curl -s -X GET "$BASE_URL/admin-ops/admins")

echo -e "${GREEN}Respuesta:${NC}"
echo "$ADMINS_LIST" | jq '.'
echo ""

# ========================================
# FASE 3: CREAR MERCHANT
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🏪 FASE 3: CREAR MERCHANT${NC}"
echo -e "${BLUE}========================================${NC}"

MERCHANT_DATA=$(cat <<EOF
{
  "admin_id": "$ADMIN_ID",
  "username": "tienda_prueba_$(date +%s)",
  "password": "MiPassword123!",
  "nombre": "Tienda Prueba Central",
  "direccion": "Av. Principal 456, Quito",
  "telefono": "+593999654321"
}
EOF
)

echo -e "${YELLOW}Enviando: POST /api/admin-ops/merchants${NC}"
echo "$MERCHANT_DATA" | jq '.'

MERCHANT_RESPONSE=$(curl -s -X POST "$BASE_URL/admin-ops/merchants" \
  -H "Content-Type: application/json" \
  -d "$MERCHANT_DATA")

echo -e "${GREEN}Respuesta:${NC}"
echo "$MERCHANT_RESPONSE" | jq '.'

MERCHANT_ID=$(echo "$MERCHANT_RESPONSE" | jq -r '.merchant_id')
echo -e "${GREEN}✅ Merchant creado con ID: $MERCHANT_ID${NC}"
echo ""

# ========================================
# FASE 4: LISTAR MERCHANTS
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🏪 FASE 4: LISTAR TODOS LOS MERCHANTS${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${YELLOW}Enviando: GET /api/admin-ops/merchants${NC}"

MERCHANTS_LIST=$(curl -s -X GET "$BASE_URL/admin-ops/merchants")

echo -e "${GREEN}Respuesta (últimos 3):${NC}"
echo "$MERCHANTS_LIST" | jq '.merchants[-3:]'
echo ""

# ========================================
# FASE 5: CREAR CLERK
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}👤 FASE 5: CREAR CLERK${NC}"
echo -e "${BLUE}========================================${NC}"

CLERK_DATA=$(cat <<EOF
{
  "merchant_id": "$MERCHANT_ID",
  "email": "empleado.prueba.$(date +%s)@test.com",
  "password": "EmpleadoPass123!",
  "nombre": "María Rodríguez",
  "whatsapp_number": "+593999987654",
  "role": "employee"
}
EOF
)

echo -e "${YELLOW}Enviando: POST /api/admin-ops/clerks${NC}"
echo "$CLERK_DATA" | jq '.'

CLERK_RESPONSE=$(curl -s -X POST "$BASE_URL/admin-ops/clerks" \
  -H "Content-Type: application/json" \
  -d "$CLERK_DATA")

echo -e "${GREEN}Respuesta:${NC}"
echo "$CLERK_RESPONSE" | jq '.'

CLERK_ID=$(echo "$CLERK_RESPONSE" | jq -r '.clerk_id')
echo -e "${GREEN}✅ Clerk creado con ID: $CLERK_ID${NC}"
echo ""

# ========================================
# FASE 6: LISTAR CLERKS
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}👤 FASE 6: LISTAR TODOS LOS CLERKS${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${YELLOW}Enviando: GET /api/admin-ops/clerks${NC}"

CLERKS_LIST=$(curl -s -X GET "$BASE_URL/admin-ops/clerks")

echo -e "${GREEN}Respuesta (últimos 3):${NC}"
echo "$CLERKS_LIST" | jq '.clerks[-3:]'
echo ""

# ========================================
# FASE 7: CREAR KYB
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📄 FASE 7: CREAR KYB PARA ADMIN${NC}"
echo -e "${BLUE}========================================${NC}"

KYB_DATA=$(cat <<EOF
{
  "admin_id": "$ADMIN_ID",
  "nombre_legal": "Empresa Test S.A.",
  "ruc_tax_id": "1234567890001",
  "direccion_fiscal": "Calle Empresarial 789, Quito, Ecuador",
  "telefono_contacto": "+593999111222",
  "email_oficial": "legal@empresatest.com",
  "representante_legal": "Juan Pérez Rodríguez",
  "notas": "Cliente premium - Prueba de sistema"
}
EOF
)

echo -e "${YELLOW}Enviando: POST /api/admin-ops/kyb${NC}"
echo "$KYB_DATA" | jq '.'

KYB_RESPONSE=$(curl -s -X POST "$BASE_URL/admin-ops/kyb" \
  -H "Content-Type: application/json" \
  -d "$KYB_DATA")

echo -e "${GREEN}Respuesta:${NC}"
echo "$KYB_RESPONSE" | jq '.'

KYB_ID=$(echo "$KYB_RESPONSE" | jq -r '.kyb_id')
echo -e "${GREEN}✅ KYB creado con ID: $KYB_ID${NC}"
echo ""

# ========================================
# FASE 8: OBTENER ADMIN ESPECÍFICO
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔍 FASE 8: OBTENER ADMIN ESPECÍFICO${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${YELLOW}Enviando: GET /api/admin-ops/admins/$ADMIN_ID${NC}"

ADMIN_DETAIL=$(curl -s -X GET "$BASE_URL/admin-ops/admins/$ADMIN_ID")

echo -e "${GREEN}Respuesta:${NC}"
echo "$ADMIN_DETAIL" | jq '.'
echo ""

# ========================================
# FASE 9: OBTENER MERCHANT ESPECÍFICO
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔍 FASE 9: OBTENER MERCHANT ESPECÍFICO${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${YELLOW}Enviando: GET /api/admin-ops/merchants/$MERCHANT_ID${NC}"

MERCHANT_DETAIL=$(curl -s -X GET "$BASE_URL/admin-ops/merchants/$MERCHANT_ID")

echo -e "${GREEN}Respuesta:${NC}"
echo "$MERCHANT_DETAIL" | jq '.'
echo ""

# ========================================
# FASE 10: OBTENER CLERK ESPECÍFICO
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔍 FASE 10: OBTENER CLERK ESPECÍFICO${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${YELLOW}Enviando: GET /api/admin-ops/clerks/$CLERK_ID${NC}"

CLERK_DETAIL=$(curl -s -X GET "$BASE_URL/admin-ops/clerks/$CLERK_ID")

echo -e "${GREEN}Respuesta:${NC}"
echo "$CLERK_DETAIL" | jq '.'
echo ""

# ========================================
# FASE 11: OBTENER KYB POR ADMIN
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔍 FASE 11: OBTENER KYB POR ADMIN${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${YELLOW}Enviando: GET /api/admin-ops/kyb/$ADMIN_ID${NC}"

KYB_DETAIL=$(curl -s -X GET "$BASE_URL/admin-ops/kyb/$ADMIN_ID")

echo -e "${GREEN}Respuesta:${NC}"
echo "$KYB_DETAIL" | jq '.'
echo ""

# ========================================
# FASE 12: ACTUALIZAR KYB (Cambiar status a approved)
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}✏️  FASE 12: ACTUALIZAR KYB STATUS${NC}"
echo -e "${BLUE}========================================${NC}"

KYB_UPDATE='{
  "status": "approved",
  "notas": "Documentación verificada y aprobada"
}'

echo -e "${YELLOW}Enviando: PATCH /api/admin-ops/kyb/$KYB_ID${NC}"
echo "$KYB_UPDATE" | jq '.'

KYB_UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/admin-ops/kyb/$KYB_ID" \
  -H "Content-Type: application/json" \
  -d "$KYB_UPDATE")

echo -e "${GREEN}Respuesta:${NC}"
echo "$KYB_UPDATE_RESPONSE" | jq '.'
echo ""

# ========================================
# FASE 13: VERIFICAR ACTUALIZACIÓN
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}✅ FASE 13: VERIFICAR KYB ACTUALIZADO${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${YELLOW}Enviando: GET /api/admin-ops/kyb/$ADMIN_ID${NC}"

KYB_UPDATED=$(curl -s -X GET "$BASE_URL/admin-ops/kyb/$ADMIN_ID")

echo -e "${GREEN}Status actual del KYB:${NC}"
echo "$KYB_UPDATED" | jq '.kyb.status'
echo ""

# ========================================
# FASE 14: PRUEBAS DE VALIDACIÓN (Errores esperados)
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}⚠️  FASE 14: PRUEBAS DE VALIDACIÓN${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${YELLOW}Test 1: Intentar crear Merchant con admin_id inexistente (debe fallar)${NC}"
INVALID_MERCHANT='{
  "admin_id": "000000000000000000000000",
  "username": "test_fail",
  "password": "test123",
  "nombre": "Test Fail"
}'

INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/admin-ops/merchants" \
  -H "Content-Type: application/json" \
  -d "$INVALID_MERCHANT")

echo "$INVALID_RESPONSE" | jq '.'
echo ""

echo -e "${YELLOW}Test 2: Intentar eliminar Admin con Merchants asociados (debe fallar)${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/admin-ops/admins/$ADMIN_ID")
echo "$DELETE_RESPONSE" | jq '.'
echo ""

# ========================================
# RESUMEN FINAL
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 RESUMEN FINAL${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✅ Admin ID: $ADMIN_ID${NC}"
echo -e "${GREEN}✅ Merchant ID: $MERCHANT_ID${NC}"
echo -e "${GREEN}✅ Clerk ID: $CLERK_ID${NC}"
echo -e "${GREEN}✅ KYB ID: $KYB_ID${NC}"
echo ""
echo -e "${GREEN}🎉 TODAS LAS PRUEBAS COMPLETADAS${NC}"
echo -e "${YELLOW}Los IDs generados puedes usarlos para pruebas adicionales${NC}"
echo ""
