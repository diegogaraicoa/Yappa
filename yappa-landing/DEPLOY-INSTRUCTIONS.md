# 🚀 Instrucciones de Deploy - YAPPA Landing Page

## Paso 1: Crear Repositorio en GitHub

1. Ve a: **https://github.com/new**
2. Configura así:
   - **Repository name:** `yappa-landing`
   - **Description:** Landing page de YAPPA - Digitalización para tiendas de barrio
   - **Visibility:** Public (o Private si prefieres)
   - **NO marques** "Add a README file"
   - **NO marques** "Add .gitignore"
   - **NO marques** "Choose a license"
3. Click en **"Create repository"**

---

## Paso 2: Conectar tu Código Local

Después de crear el repo, GitHub te mostrará comandos. **Usa estos en su lugar:**

```bash
cd /app/yappa-landing
git remote add origin https://github.com/TU-USUARIO/yappa-landing.git
git branch -M main
git push -u origin main
```

⚠️ **IMPORTANTE:** Reemplaza `TU-USUARIO` con tu username de GitHub

Si te pide autenticación:
- Username: tu usuario de GitHub
- Password: usa un **Personal Access Token** (no tu contraseña)
  - Créalo aquí: https://github.com/settings/tokens
  - Permisos necesarios: `repo` (marcar todo)

---

## Paso 3: Deploy en Vercel

1. Ve a: **https://vercel.com**
2. Click en **"Sign Up"** o **"Log In"**
3. Usa tu cuenta de GitHub para entrar
4. Click en **"Add New"** → **"Project"**
5. Busca y selecciona **`yappa-landing`**
6. Vercel detectará Next.js automáticamente
7. **NO cambies ninguna configuración**
8. Click en **"Deploy"**

⏱️ Esperando... (2-3 minutos)

---

## 🎉 ¡LISTO!

Vercel te dará una URL como:
- `https://yappa-landing.vercel.app`
- o `https://yappa-landing-tu-usuario.vercel.app`

---

## 🌐 Conectar Dominio Propio (Opcional)

Si compras un dominio (ejemplo: yappa.ec):

1. En Vercel → Settings → Domains
2. Agrega tu dominio
3. Copia los DNS records
4. Configúralos en tu proveedor de dominios
5. Espera 24-48 horas para propagación

---

## 🔄 Actualizaciones Futuras

Cada vez que hagas cambios:

```bash
cd /app/yappa-landing
git add .
git commit -m "Descripción de los cambios"
git push
```

Vercel hará deploy automático! 🚀
