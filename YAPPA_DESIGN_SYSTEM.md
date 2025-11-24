# YAPPA Design System 🎨
## Sistema de Diseño Completo para Rediseño UI/UX

**Fecha:** Diciembre 2024
**Versión:** 1.0
**Proyecto:** YAPPA - Super Dashboard & Mobile App
**Inspiración:** Nubank, Square POS, RappiPay

---

## 📋 ÍNDICE

1. [Investigación y Hallazgos](#investigación)
2. [Paleta de Colores](#colores)
3. [Tipografía](#tipografía)
4. [Espaciado y Grid System](#espaciado)
5. [Componentes Reutilizables](#componentes)
6. [Patrones de Interfaz](#patrones)
7. [Microinteracciones](#microinteracciones)
8. [Guías de Implementación](#implementación)

---

## 🔍 INVESTIGACIÓN Y HALLAZGOS {#investigación}

### Apps de Referencia Analizadas

#### 1. **Nubank** - Líder en Fintech UI
**Características Clave:**
- **Color Principal:** Purple (morado vibrante) como identidad de marca
- **Sistema:** NuDS (Nubank Design System) con tokens de diseño
- **Ilustraciones:** Sistema de transparencia y claridad con opacidad
- **Accesibilidad:** Ratios de contraste estrictos, soporte para lectores de pantalla
- **Arquitectura:** Server-driven UI para consistencia del 80% de pantallas
- **Modos:** Dark y Light mode con tokens flexibles
- **UI:** Layouts simples y modulares que reducen carga cognitiva

**Lecciones Aplicables:**
- Usar un color de marca fuerte y distintivo
- Sistema de tokens para consistencia
- Ilustraciones con transparencia
- Priorizar accesibilidad desde el diseño

#### 2. **Square POS** - Experto en Mobile UX
**Características Clave:**
- **Navegación:** Bottom navigation bar customizable
- **Tipografía:** Line-height 1.5x, letter-spacing 0.12x font size
- **Espaciado:** 44px mínimo para elementos táctiles, 8-12px entre relacionados, 16-24px entre grupos
- **Botones Primarios:** 20-24px de espaciado generoso
- **Modos:** Modulares para diferentes tipos de negocio
- **Tokens:** Para colores, tipografía y espaciado cross-platform
- **Touch Targets:** Optimizados para uso con una mano

**Lecciones Aplicables:**
- Espaciado generoso y consistente (8pt grid)
- Touch targets grandes (mínimo 44px)
- Navegación bottom-bar para móvil
- Layouts adaptables para diferentes contextos

#### 3. **RappiPay** - Fintech Lifestyle
**Características Clave:**
- **Colores:** Cálidos, pasteles suaves, gradientes sutiles
- **Estilo:** Menos corporativo, más lifestyle y cercano
- **Dashboard:** Streamlined con balance, transacciones recientes, shortcuts
- **Layouts:** Minimalistas, reducción de clutter
- **Tarjetas:** Color-coded para categorizar datos financieros
- **Dark Mode:** Disponible con accesibilidad
- **Microinteracciones:** Simplifican flujos complejos
- **Personalización:** AI-driven, contenido dinámico

**Lecciones Aplicables:**
- Colores cálidos y cercanos (no fríos corporativos)
- Minimalismo y reducción de clutter visual
- Tarjetas con color coding para categorización
- Microinteracciones para feedback inmediato

### Tendencias Fintech 2024-2025

**Componentes:**
- ✅ Botones en "thumb zones" (zonas de alcance del pulgar)
- ✅ Cards interactivas con tap-to-expand
- ✅ Inputs con biométricos y OCR auto-fill
- ✅ Feedback en tiempo real (push alerts, confirmaciones)
- ✅ Personalización AI-driven
- ✅ Security-first (indicadores visibles de seguridad)
- ✅ Dark mode y minimalismo
- ✅ Accesibilidad (contraste, escalabilidad, screen readers)

---

## 🎨 PALETA DE COLORES {#colores}

### Colores Primarios

```javascript
// Primary Brand Color - Verde Vibrante (inspirado en éxito/crecimiento)
primary: {
  50: '#E8F5E9',   // Muy claro (backgrounds)
  100: '#C8E6C9',  // Claro (hover states)
  200: '#A5D6A7',  
  300: '#81C784',
  400: '#66BB6A',
  500: '#4CAF50',  // Principal - Verde Material Success
  600: '#43A047',  // Hover/Active
  700: '#388E3C',  // Pressed
  800: '#2E7D32',
  900: '#1B5E20',  // Más oscuro
}

// Secondary - Azul Confianza (para información, links)
secondary: {
  50: '#E3F2FD',
  100: '#BBDEFB',
  200: '#90CAF9',
  300: '#64B5F6',
  400: '#42A5F5',
  500: '#2196F3',  // Principal - Azul Material
  600: '#1E88E5',  // Hover
  700: '#1976D2',  // Pressed
  800: '#1565C0',
  900: '#0D47A1',
}

// Accent - Morado Sofisticación (inspirado Nubank)
accent: {
  50: '#F3E5F5',
  100: '#E1BEE7',
  200: '#CE93D8',
  300: '#BA68C8',
  400: '#AB47BC',
  500: '#9C27B0',  // Principal - Morado Material
  600: '#8E24AA',  // Hover
  700: '#7B1FA2',  // Pressed
  800: '#6A1B9A',
  900: '#4A148C',
}
```

### Colores Semánticos

```javascript
// Success - Verde (confirmaciones, success states)
success: {
  light: '#81C784',
  main: '#4CAF50',
  dark: '#388E3C',
  bg: '#E8F5E9',
}

// Warning - Naranja/Amarillo (alertas, precauciones)
warning: {
  light: '#FFB74D',
  main: '#FF9800',
  dark: '#F57C00',
  bg: '#FFF3E0',
}

// Error - Rojo (errores, peligro, eliminar)
error: {
  light: '#E57373',
  main: '#F44336',
  dark: '#D32F2F',
  bg: '#FFEBEE',
}

// Info - Azul (información neutral)
info: {
  light: '#64B5F6',
  main: '#2196F3',
  dark: '#1976D2',
  bg: '#E3F2FD',
}
```

### Colores Neutrales (Grises)

```javascript
// Neutral - Escala de grises
neutral: {
  50: '#FAFAFA',   // Backgrounds muy claros
  100: '#F5F5F5',  // Backgrounds claros
  200: '#EEEEEE',  // Borders suaves
  300: '#E0E0E0',  // Dividers
  400: '#BDBDBD',  // Disabled text
  500: '#9E9E9E',  // Secondary text
  600: '#757575',  // Body text secundario
  700: '#616161',  // Body text
  800: '#424242',  // Headings
  900: '#212121',  // Headings importantes
  white: '#FFFFFF',
  black: '#000000',
}
```

### Dark Mode

```javascript
// Dark Mode Palette
dark: {
  background: {
    primary: '#121212',     // Fondo principal
    secondary: '#1E1E1E',   // Cards, elevated surfaces
    tertiary: '#2C2C2C',    // Inputs, dropdowns
  },
  text: {
    primary: '#FFFFFF',     // Títulos
    secondary: '#B3B3B3',   // Texto secundario
    disabled: '#666666',    // Texto deshabilitado
  },
  border: '#333333',
  divider: '#2C2C2C',
}
```

### Aplicación de Colores

**Reglas:**
1. **Primary (Verde):** Botones principales, CTAs, elementos activos, éxitos
2. **Secondary (Azul):** Links, información, estados informativos
3. **Accent (Morado):** Highlights especiales, badges importantes, premium features
4. **Semantic Colors:** Estados específicos (success, warning, error, info)
5. **Neutrals:** Texto, backgrounds, borders, dividers

**Contraste:**
- Ratio mínimo: 4.5:1 para texto normal (WCAG AA)
- Ratio mínimo: 3:1 para texto grande y elementos UI (WCAG AA)
- Ratio ideal: 7:1 para máxima accesibilidad (WCAG AAA)

---

## 📝 TIPOGRAFÍA {#tipografía}

### Font Family

```javascript
// React Native / Expo
fonts: {
  primary: 'System',  // iOS: San Francisco, Android: Roboto
  // Alternativa: 'Inter', 'Poppins', 'Nunito' (si se instalan custom fonts)
}
```

### Escalas de Tamaño

```javascript
fontSize: {
  // Display (Títulos grandes, pantallas de inicio)
  display1: 40,  // Line height: 48px (1.2x)
  display2: 32,  // Line height: 40px (1.25x)
  
  // Headings (Títulos de secciones)
  h1: 28,        // Line height: 36px (1.28x)
  h2: 24,        // Line height: 32px (1.33x)
  h3: 20,        // Line height: 28px (1.4x)
  h4: 18,        // Line height: 24px (1.33x)
  h5: 16,        // Line height: 22px (1.37x)
  h6: 14,        // Line height: 20px (1.42x)
  
  // Body (Texto principal)
  body1: 16,     // Line height: 24px (1.5x) - Texto principal
  body2: 14,     // Line height: 20px (1.42x) - Texto secundario
  
  // Small (Captions, labels)
  caption: 12,   // Line height: 16px (1.33x)
  overline: 10,  // Line height: 14px (1.4x)
  
  // Button
  button: 16,    // Line height: 24px (1.5x)
  buttonSmall: 14, // Line height: 20px (1.42x)
}
```

### Pesos de Fuente

```javascript
fontWeight: {
  light: '300',      // Para textos sutiles, poco énfasis
  regular: '400',    // Default, body text
  medium: '500',     // Énfasis medio, subtítulos
  semibold: '600',   // Botones, headings importantes
  bold: '700',       // Headings, números importantes
  extrabold: '800',  // Displays, KPIs grandes
}
```

### Espaciado de Letras (Letter Spacing)

```javascript
letterSpacing: {
  tight: -0.5,       // Display, headings grandes
  normal: 0,         // Body text
  wide: 0.5,         // Buttons, labels
  wider: 1,          // Overlines, all-caps
}
```

### Guías de Uso

**Display (40px, 32px):**
- Pantallas de bienvenida
- Números grandes de KPIs
- Pantallas de éxito/error importantes

**Headings (28px - 14px):**
- h1: Título de pantalla principal
- h2: Títulos de secciones
- h3: Títulos de cards
- h4: Subtítulos
- h5: Labels importantes
- h6: Labels secundarios

**Body (16px, 14px):**
- body1: Texto principal de lectura
- body2: Descripciones, texto secundario

**Small (12px, 10px):**
- caption: Hints, timestamps, metadata
- overline: Labels pequeños, categorías

**Accesibilidad:**
- Nunca usar menos de 12px para texto legible
- Line-height mínimo 1.5x para texto de lectura
- Mantener buen contraste (ver sección colores)

---

## 📐 ESPACIADO Y GRID SYSTEM {#espaciado}

### Sistema de Espaciado (8pt Grid)

```javascript
spacing: {
  0: 0,      // Sin espacio
  1: 4,      // 0.5 unidad (casos excepcionales)
  2: 8,      // 1 unidad base
  3: 12,     // 1.5 unidades
  4: 16,     // 2 unidades
  5: 20,     // 2.5 unidades
  6: 24,     // 3 unidades
  7: 28,     // 3.5 unidades
  8: 32,     // 4 unidades
  10: 40,    // 5 unidades
  12: 48,    // 6 unidades
  14: 56,    // 7 unidades
  16: 64,    // 8 unidades
  20: 80,    // 10 unidades
  24: 96,    // 12 unidades
}
```

### Reglas de Aplicación

**Entre Elementos Relacionados:**
- 8px: Elementos muy relacionados (icon + text en botón)
- 12px: Elementos relacionados (items en lista vertical)
- 16px: Separación estándar entre componentes

**Entre Grupos No Relacionados:**
- 24px: Separación entre secciones relacionadas
- 32px: Separación entre secciones principales
- 40px+: Separación de contextos completamente diferentes

**Padding de Contenedores:**
- Cards pequeñas: 16px
- Cards estándar: 20px - 24px
- Screens: 20px horizontal, 16px vertical

**Márgenes de Pantalla:**
- Mobile: 16px - 20px a los lados
- Tablet: 24px - 32px a los lados

### Touch Targets

```javascript
touchTargets: {
  minimum: 44,       // Tamaño mínimo iOS/Android
  comfortable: 48,   // Tamaño recomendado Material Design
  generous: 56,      // Para botones primarios importantes
}
```

**Reglas:**
- Botones principales: 48px - 56px de altura
- Botones secundarios: 44px - 48px de altura
- Iconos táctiles: 44x44px mínimo
- Espaciado entre touch targets: mínimo 8px

### Border Radius

```javascript
borderRadius: {
  none: 0,
  sm: 4,        // Inputs, tags pequeños
  md: 8,        // Botones, cards pequeñas
  lg: 12,       // Cards estándar
  xl: 16,       // Cards grandes, modals
  '2xl': 20,    // Elementos destacados
  '3xl': 24,    // Elementos muy destacados
  full: 9999,   // Pills, badges circulares
}
```

### Elevación (Shadows)

```javascript
// iOS Shadows
shadows: {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
}
```

**Aplicación:**
- `none`: Elementos planos, dividers
- `sm`: Inputs, tags
- `md`: Cards estándar, botones elevados
- `lg`: Modals, dropdowns, tooltips
- `xl`: Navigation bars, bottom sheets

---

## 🧩 COMPONENTES REUTILIZABLES {#componentes}

### 1. Buttons

#### Variantes

**Primary Button:**
```typescript
// Uso: Acción principal de la pantalla
<Button 
  variant="primary"
  size="large"
  onPress={handleSubmit}
>
  Guardar Cambios
</Button>

// Styles
primaryButton: {
  backgroundColor: colors.primary[500],  // Verde
  paddingVertical: 16,                   // 48px altura total con texto
  paddingHorizontal: 24,
  borderRadius: 12,
  shadowColor: colors.primary[600],
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 2,
}

primaryButtonText: {
  color: colors.neutral.white,
  fontSize: 16,
  fontWeight: '600',
  textAlign: 'center',
  letterSpacing: 0.5,
}

// States
- hover: backgroundColor primary[600]
- pressed: backgroundColor primary[700], elevation 0
- disabled: backgroundColor neutral[300], opacity 0.5
```

**Secondary Button:**
```typescript
// Uso: Acciones secundarias
<Button 
  variant="secondary"
  onPress={handleCancel}
>
  Cancelar
</Button>

// Styles
secondaryButton: {
  backgroundColor: 'transparent',
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: colors.primary[500],
}

secondaryButtonText: {
  color: colors.primary[500],
  fontSize: 16,
  fontWeight: '600',
  letterSpacing: 0.5,
}

// States
- hover: backgroundColor primary[50]
- pressed: backgroundColor primary[100]
- disabled: borderColor neutral[300], text neutral[400]
```

**Tertiary/Ghost Button:**
```typescript
// Uso: Acciones terciarias, links
<Button 
  variant="tertiary"
  onPress={handleEdit}
>
  Editar
</Button>

// Styles
tertiaryButton: {
  backgroundColor: 'transparent',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 8,
}

tertiaryButtonText: {
  color: colors.primary[500],
  fontSize: 16,
  fontWeight: '500',
}

// States
- hover: backgroundColor primary[50]
- pressed: backgroundColor primary[100]
```

**Destructive Button:**
```typescript
// Uso: Acciones destructivas (eliminar)
<Button 
  variant="destructive"
  onPress={handleDelete}
>
  Eliminar
</Button>

// Usa la paleta error (rojo) en lugar de primary (verde)
```

#### Sizes

```javascript
sizes: {
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    minHeight: 36,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    minHeight: 44,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    fontSize: 16,
    minHeight: 56,
  },
}
```

#### Icon Buttons

```typescript
// Botón solo con ícono
<IconButton 
  icon="trash-outline"
  onPress={handleDelete}
  color={colors.error.main}
  size={24}
/>

// Styles
iconButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: 'transparent',
  justifyContent: 'center',
  alignItems: 'center',
}

// States
- hover: backgroundColor neutral[100]
- pressed: backgroundColor neutral[200]
```

---

### 2. Cards

#### Standard Card

```typescript
<Card elevation="md">
  <CardHeader>
    <Title>Título del Card</Title>
    <Subtitle>Subtítulo opcional</Subtitle>
  </CardHeader>
  <CardContent>
    <Text>Contenido del card...</Text>
  </CardContent>
  <CardActions>
    <Button variant="tertiary">Acción 1</Button>
    <Button variant="primary">Acción 2</Button>
  </CardActions>
</Card>

// Styles
card: {
  backgroundColor: colors.neutral.white,
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
  // Shadow según elevation prop
}

cardHeader: {
  marginBottom: 16,
}

cardTitle: {
  fontSize: 20,
  fontWeight: '600',
  color: colors.neutral[900],
  marginBottom: 4,
}

cardSubtitle: {
  fontSize: 14,
  fontWeight: '400',
  color: colors.neutral[600],
}

cardContent: {
  marginBottom: 16,
}

cardActions: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  gap: 12,
}
```

#### KPI Card (Dashboard)

```typescript
// Card especial para mostrar KPIs
<KPICard
  title="Merchants Activos"
  value="156"
  change="+12%"
  changeType="positive"
  icon="storefront-outline"
  onPress={() => navigate('/merchants-active')}
/>

// Styles
kpiCard: {
  backgroundColor: colors.neutral.white,
  borderRadius: 16,
  padding: 20,
  minHeight: 140,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
}

kpiValue: {
  fontSize: 32,
  fontWeight: '800',
  color: colors.neutral[900],
  marginBottom: 4,
}

kpiTitle: {
  fontSize: 14,
  fontWeight: '500',
  color: colors.neutral[600],
  marginBottom: 8,
}

kpiChange: {
  fontSize: 14,
  fontWeight: '600',
  // color: positive = success.main, negative = error.main
}
```

#### List Item Card

```typescript
// Card para items en listas (merchants, admins, clerks)
<ListItemCard
  title="Admin Company ABC"
  subtitle="admin@company.com"
  status="active"
  statusLabel="Activo"
  onPress={handlePress}
  actions={[
    { icon: 'pencil', onPress: handleEdit },
    { icon: 'trash', onPress: handleDelete, color: 'error' },
  ]}
/>

// Styles
listItemCard: {
  backgroundColor: colors.neutral.white,
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  flexDirection: 'row',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
}

// Inactive state
listItemCardInactive: {
  opacity: 0.6,
  backgroundColor: colors.neutral[50],
}
```

---

### 3. Inputs

#### Text Input

```typescript
<TextInput
  label="Nombre de la empresa"
  placeholder="Ej: Mi Empresa S.A."
  value={value}
  onChangeText={setValue}
  helperText="Este nombre aparecerá en todos los documentos"
  error={error}
  errorText="Este campo es obligatorio"
  icon="business"
/>

// Styles
inputContainer: {
  marginBottom: 20,
}

inputLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: colors.neutral[800],
  marginBottom: 8,
}

inputWrapper: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.neutral[50],
  borderWidth: 2,
  borderColor: colors.neutral[200],
  borderRadius: 12,
  paddingHorizontal: 16,
  minHeight: 56,
}

input: {
  flex: 1,
  fontSize: 16,
  color: colors.neutral[900],
  paddingVertical: 16,
}

// States
- focus: borderColor primary[500], backgroundColor white
- error: borderColor error.main, backgroundColor error.bg
- disabled: backgroundColor neutral[100], color neutral[400]

inputHelperText: {
  fontSize: 12,
  color: colors.neutral[600],
  marginTop: 6,
}

inputErrorText: {
  fontSize: 12,
  color: colors.error.main,
  marginTop: 6,
}
```

#### Search Input

```typescript
<SearchInput
  placeholder="Buscar merchants..."
  value={searchQuery}
  onChangeText={setSearchQuery}
  onClear={() => setSearchQuery('')}
/>

// Styles
searchInput: {
  backgroundColor: colors.neutral[100],
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 16,
}

searchIcon: {
  marginRight: 12,
  color: colors.neutral[600],
}

searchInputField: {
  flex: 1,
  fontSize: 16,
  color: colors.neutral[900],
}

clearButton: {
  padding: 4,
}
```

---

### 4. Badges & Status Indicators

#### Badge

```typescript
<Badge 
  variant="success"
  size="medium"
>
  Activo
</Badge>

<Badge 
  variant="error"
  size="medium"
>
  Inactivo
</Badge>

<Badge 
  variant="warning"
  size="medium"
>
  Pendiente
</Badge>

// Styles
badge: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
  alignSelf: 'flex-start',
}

// Variants
badgeSuccess: {
  backgroundColor: colors.success.bg,
  borderWidth: 1,
  borderColor: colors.success.light,
}

badgeSuccessText: {
  color: colors.success.dark,
  fontSize: 12,
  fontWeight: '600',
}

badgeError: {
  backgroundColor: colors.error.bg,
  borderWidth: 1,
  borderColor: colors.error.light,
}

badgeErrorText: {
  color: colors.error.dark,
  fontSize: 12,
  fontWeight: '600',
}

// Sizes
small: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 10 }
medium: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12 }
large: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 }
```

#### Status Dot

```typescript
// Dot para indicar estado
<StatusDot status="active" />

// Styles
statusDot: {
  width: 10,
  height: 10,
  borderRadius: 5,
  marginRight: 8,
}

statusActive: { backgroundColor: colors.success.main }
statusInactive: { backgroundColor: colors.neutral[400] }
statusPending: { backgroundColor: colors.warning.main }
```

---

### 5. Modals & Bottom Sheets

#### Modal

```typescript
<Modal
  visible={isVisible}
  onClose={handleClose}
  title="Crear Nuevo Admin"
  actions={[
    { label: 'Cancelar', onPress: handleClose, variant: 'secondary' },
    { label: 'Guardar', onPress: handleSave, variant: 'primary' },
  ]}
>
  {/* Contenido del modal */}
</Modal>

// Styles
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
}

modalContainer: {
  backgroundColor: colors.neutral.white,
  borderRadius: 20,
  width: '100%',
  maxWidth: 500,
  maxHeight: '80%',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.15,
  shadowRadius: 16,
  elevation: 8,
}

modalHeader: {
  padding: 24,
  borderBottomWidth: 1,
  borderBottomColor: colors.neutral[200],
}

modalTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: colors.neutral[900],
}

modalContent: {
  padding: 24,
}

modalActions: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  gap: 12,
  padding: 24,
  borderTopWidth: 1,
  borderTopColor: colors.neutral[200],
}
```

#### Bottom Sheet

```typescript
// Para acciones rápidas en mobile
<BottomSheet
  visible={isVisible}
  onClose={handleClose}
  snapPoints={['50%', '90%']}
>
  {/* Contenido */}
</BottomSheet>

// Styles
bottomSheet: {
  backgroundColor: colors.neutral.white,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 8,
}

bottomSheetHandle: {
  width: 40,
  height: 4,
  backgroundColor: colors.neutral[300],
  borderRadius: 2,
  alignSelf: 'center',
  marginBottom: 20,
}
```

---

### 6. Toggle Switch

```typescript
<Switch
  value={isActive}
  onValueChange={setIsActive}
  label="Activar notificaciones"
/>

// Styles (usar componente nativo Switch de React Native)
switchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: 12,
}

switchLabel: {
  fontSize: 16,
  fontWeight: '500',
  color: colors.neutral[800],
  flex: 1,
}

// Props del Switch nativo
trackColor: {
  false: colors.neutral[300],
  true: colors.primary[300],
}
thumbColor: isActive ? colors.primary[500] : colors.neutral.white
```

---

### 7. Filter Chips

```typescript
// Para filtros en listas (Todos, Activos, Inactivos, etc.)
<FilterChip
  label="Todos"
  selected={selectedFilter === 'all'}
  onPress={() => setSelectedFilter('all')}
/>

// Styles
filterChip: {
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 20,
  marginRight: 8,
  borderWidth: 2,
  borderColor: colors.neutral[300],
  backgroundColor: 'transparent',
}

filterChipSelected: {
  backgroundColor: colors.primary[500],
  borderColor: colors.primary[500],
}

filterChipText: {
  fontSize: 14,
  fontWeight: '600',
  color: colors.neutral[700],
}

filterChipTextSelected: {
  color: colors.neutral.white,
}
```

---

### 8. Empty States

```typescript
<EmptyState
  icon="folder-open-outline"
  title="No hay merchants activos"
  description="Los merchants que actives aparecerán aquí"
  action={{
    label: 'Crear Nuevo Merchant',
    onPress: handleCreate,
  }}
/>

// Styles
emptyState: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 40,
}

emptyStateIcon: {
  marginBottom: 24,
  color: colors.neutral[400],
  // size: 64
}

emptyStateTitle: {
  fontSize: 20,
  fontWeight: '600',
  color: colors.neutral[800],
  textAlign: 'center',
  marginBottom: 8,
}

emptyStateDescription: {
  fontSize: 14,
  color: colors.neutral[600],
  textAlign: 'center',
  marginBottom: 24,
  maxWidth: 300,
}
```

---

## 🎭 PATRONES DE INTERFAZ {#patrones}

### 1. Dashboard Layout

**Estructura:**
```
┌─────────────────────────────────────────┐
│ Header con título y acciones            │
├─────────────────────────────────────────┤
│ Grid de KPI Cards (2 columnas móvil)    │
│ ┌──────────────┐  ┌──────────────┐     │
│ │  KPI Card 1  │  │  KPI Card 2  │     │
│ └──────────────┘  └──────────────┘     │
│ ┌──────────────┐  ┌──────────────┐     │
│ │  KPI Card 3  │  │  KPI Card 4  │     │
│ └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────┤
│ Secciones adicionales (opcional)        │
└─────────────────────────────────────────┘
```

**Características:**
- Scroll vertical
- KPI Cards clickeables
- Pull-to-refresh
- Valores grandes y legibles
- Cambios porcentuales con colores semánticos

---

### 2. List View Layout

**Estructura:**
```
┌─────────────────────────────────────────┐
│ Header con título                        │
├─────────────────────────────────────────┤
│ Search bar + Filters                     │
│ [🔍 Buscar...]  [Todos▼] [Estado▼]     │
├─────────────────────────────────────────┤
│ Lista de Items                           │
│ ┌─────────────────────────────────────┐ │
│ │ Item Card 1                         │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Item Card 2                         │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│             [FAB: + Crear]              │
└─────────────────────────────────────────┘
```

**Características:**
- Search en la parte superior
- Filtros horizontales scrollable
- Lista scrollable vertical
- Pull-to-refresh
- FAB (Floating Action Button) para crear
- Empty state cuando no hay resultados
- Loading state con skeleton

---

### 3. Form Layout (Modal/Screen)

**Estructura:**
```
┌─────────────────────────────────────────┐
│ ← Título del Formulario            [X]  │
├─────────────────────────────────────────┤
│ [Input Field 1]                         │
│                                          │
│ [Input Field 2]                         │
│                                          │
│ [Select / Dropdown]                     │
│                                          │
│ [Switch: Activar]                       │
│                                          │
│                                          │
├─────────────────────────────────────────┤
│         [Cancelar]  [Guardar]           │
└─────────────────────────────────────────┘
```

**Características:**
- Inputs con labels claros
- Helper text cuando es necesario
- Validación inline
- Error messages debajo del input
- Botones en la parte inferior
- Primary button a la derecha
- Scroll si el formulario es largo

---

### 4. Detail View Layout

**Estructura:**
```
┌─────────────────────────────────────────┐
│ ← Título                    [Editar] [X]│
├─────────────────────────────────────────┤
│ Status Badge                             │
│                                          │
│ Section: Información Básica              │
│ • Campo 1: Valor                        │
│ • Campo 2: Valor                        │
│                                          │
│ Section: Métricas                       │
│ • Métrica 1: 123                        │
│ • Métrica 2: 456                        │
│                                          │
│ Section: Acciones                       │
│ [Botón Acción 1]  [Botón Acción 2]     │
└─────────────────────────────────────────┘
```

---

### 5. Navigation Patterns

**Bottom Tab Navigation (Mobile App):**
```javascript
// Usar expo-router con (tabs) layout
tabs: [
  { name: 'Home', icon: 'home' },
  { name: 'Ventas', icon: 'cash' },
  { name: 'Inventario', icon: 'cube' },
  { name: 'Balance', icon: 'stats-chart' },
  { name: 'Más', icon: 'ellipsis-horizontal' },
]

// Styles
tabBarStyle: {
  height: 65,
  paddingBottom: 10,
  paddingTop: 10,
  backgroundColor: colors.neutral.white,
  borderTopWidth: 1,
  borderTopColor: colors.neutral[200],
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 4,
}

tabBarLabelStyle: {
  fontSize: 12,
  fontWeight: '600',
}

tabBarActiveTintColor: colors.primary[500]
tabBarInactiveTintColor: colors.neutral[500]
```

**Stack Navigation (Super Dashboard):**
- Header con back button
- Título centrado o alineado izquierda
- Acciones en la derecha (editar, cerrar, etc.)

---

## ⚡ MICROINTERACCIONES {#microinteracciones}

### 1. Button Press Animation

```typescript
// Usar Animated API de React Native
import { Animated, TouchableOpacity } from 'react-native';

const ButtonWithAnimation = ({ onPress, children }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};
```

### 2. Card Tap Feedback

```typescript
// Highlight sutil al tocar card
<TouchableOpacity
  activeOpacity={0.7}
  style={styles.card}
  onPress={handlePress}
>
  {/* Contenido del card */}
</TouchableOpacity>
```

### 3. Loading States

```typescript
// Skeleton Loading
<SkeletonPlaceholder>
  <SkeletonPlaceholder.Item>
    <SkeletonPlaceholder.Item width="100%" height={80} borderRadius={12} marginBottom={16} />
    <SkeletonPlaceholder.Item width="100%" height={80} borderRadius={12} marginBottom={16} />
  </SkeletonPlaceholder.Item>
</SkeletonPlaceholder>

// Spinner Overlay
<View style={styles.loadingOverlay}>
  <ActivityIndicator size="large" color={colors.primary[500]} />
  <Text style={styles.loadingText}>Cargando...</Text>
</View>
```

### 4. Success Feedback

```typescript
// Toast notification para confirmaciones
import Toast from 'react-native-toast-message';

Toast.show({
  type: 'success',
  text1: '¡Éxito!',
  text2: 'Los cambios se guardaron correctamente',
  visibilityTime: 3000,
  position: 'top',
});

// Checkmark animation al completar acción
```

### 5. Pull to Refresh

```typescript
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary[500]}
      colors={[colors.primary[500]]}
    />
  }
>
  {/* Contenido */}
</ScrollView>
```

### 6. Swipe Actions (Opcional)

```typescript
// Para acciones rápidas en lista (archivar, eliminar)
import Swipeable from 'react-native-gesture-handler/Swipeable';

const renderRightActions = () => (
  <View style={styles.swipeActions}>
    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
      <Icon name="trash" size={24} color="#fff" />
    </TouchableOpacity>
  </View>
);

<Swipeable renderRightActions={renderRightActions}>
  <ListItem />
</Swipeable>
```

---

## 🛠️ GUÍAS DE IMPLEMENTACIÓN {#implementación}

### Estructura de Archivos Recomendada

```
/frontend
  /app
    /super-dashboard
      index.tsx
      admins.tsx
      merchants.tsx
      ...
  /components
    /ui
      Button.tsx
      Card.tsx
      Input.tsx
      Badge.tsx
      Modal.tsx
      ...
    /layout
      Header.tsx
      Container.tsx
      ...
  /theme
    colors.ts
    typography.ts
    spacing.ts
    shadows.ts
    index.ts
  /hooks
    useTheme.ts
  /utils
    ...
```

### Theme Provider Setup

```typescript
// /theme/index.ts
export const theme = {
  colors: {
    primary: { /* ... */ },
    secondary: { /* ... */ },
    // ... resto de colores
  },
  typography: {
    fontSize: { /* ... */ },
    fontWeight: { /* ... */ },
  },
  spacing: { /* ... */ },
  borderRadius: { /* ... */ },
  shadows: { /* ... */ },
};

export type Theme = typeof theme;

// /hooks/useTheme.ts
import { theme } from '../theme';
export const useTheme = () => theme;

// Uso en componentes
import { useTheme } from '@/hooks/useTheme';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <View style={{
      backgroundColor: theme.colors.primary[500],
      padding: theme.spacing[4],
      borderRadius: theme.borderRadius.lg,
    }}>
      {/* ... */}
    </View>
  );
};
```

### Component Creation Template

```typescript
// /components/ui/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  onPress,
  children,
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
}) => {
  const theme = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: theme.borderRadius.lg,
      ...(fullWidth && { width: '100%' }),
    };

    const sizeStyles = {
      small: {
        paddingVertical: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
        minHeight: 36,
      },
      medium: {
        paddingVertical: theme.spacing[3],
        paddingHorizontal: theme.spacing[5],
        minHeight: 44,
      },
      large: {
        paddingVertical: theme.spacing[4],
        paddingHorizontal: theme.spacing[6],
        minHeight: 56,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: theme.colors.primary[500],
        ...theme.shadows.md,
      },
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary[500],
      },
      tertiary: {
        backgroundColor: 'transparent',
      },
      destructive: {
        backgroundColor: theme.colors.error.main,
        ...theme.shadows.md,
      },
    };

    return [baseStyle, sizeStyles[size], variantStyles[variant]];
  };

  const getTextStyle = () => {
    const textColor = {
      primary: theme.colors.neutral.white,
      secondary: theme.colors.primary[500],
      tertiary: theme.colors.primary[500],
      destructive: theme.colors.neutral.white,
    };

    return {
      color: textColor[variant],
      fontSize: size === 'small' ? 14 : 16,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
    };
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'tertiary' ? theme.colors.primary[500] : theme.colors.neutral.white}
        />
      ) : (
        <>
          {icon && <View style={{ marginRight: theme.spacing[2] }}>{icon}</View>}
          <Text style={getTextStyle()}>{children}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
```

---

## 📱 APLICACIÓN A PANTALLAS ESPECÍFICAS

### Super Dashboard (KPIs) - Pantalla Principal

**Prioridad:** 🔥 MÁS IMPORTANTE - Simple, informativa, pocas miradas

**Diseño:**
```
┌────────────────────────────────────────────┐
│ YAPPA                            [👤][🔔]  │  ← Header simple
├────────────────────────────────────────────┤
│                                             │
│ 📊 Dashboard                                │  ← Título grande
│                                             │
│ ┌──────────────┐  ┌──────────────┐        │
│ │    156       │  │     234      │        │  ← KPI Cards
│ │ Merchants    │  │  Clerks      │        │    Valores grandes
│ │ +12% ↑       │  │  +8% ↑       │        │    Cambios claros
│ └──────────────┘  └──────────────┘        │
│                                             │
│ ┌──────────────┐  ┌──────────────┐        │
│ │   $45.2K     │  │    3.2%      │        │
│ │ Ventas Hoy   │  │  Churn       │        │
│ │ +15% ↑       │  │  -0.5% ↓     │        │
│ └──────────────┘  └──────────────┘        │
│                                             │
├────────────────────────────────────────────┤
│        [Ver Admin Ops]                     │  ← CTA secundario
└────────────────────────────────────────────┘
```

**Características Clave:**
- KPI Cards grandes y legibles
- Números destacados (fontSize: 32, fontWeight: 800)
- Colores semánticos para cambios (verde = positivo, rojo = negativo)
- Iconos minimalistas
- Mucho whitespace
- Clickeable para detalles

---

### Admin Ops - Gestión Completa

**Diseño Accordion:**
```
┌────────────────────────────────────────────┐
│ ← Admin Ops                      [Buscar]  │
├────────────────────────────────────────────┤
│                                             │
│ ▼ Admins (12)                    [+ Crear] │  ← Sección expandida
│   ┌─────────────────────────────────────┐ │
│   │ Admin Company ABC         [●Activo] │ │  ← Item con status
│   │ admin@company.com                   │ │
│   │ 5 Merchants                         │ │
│   │                   [✏️ Editar] [🗑️]   │ │  ← Acciones
│   └─────────────────────────────────────┘ │
│   ┌─────────────────────────────────────┐ │
│   │ Inactive Admin      [○ Desactivado] │ │  ← Inactive visualmente
│   │ inactive@test.com                   │ │    diferente
│   │ 0 Merchants                         │ │
│   │                   [✏️ Editar] [🗑️]   │ │
│   └─────────────────────────────────────┘ │
│                                             │
│ ▶ Merchants (156)                           │  ← Sección colapsada
│                                             │
│ ▶ Clerks (234)                              │  ← Sección colapsada
│                                             │
└────────────────────────────────────────────┘
```

**Características:**
- Accordion sections expandibles
- Search global
- Status badges visibles
- Cards con opacidad reducida para inactivos
- Acciones inline (edit, delete, activate/deactivate)
- FAB para crear nuevo

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Foundation (2-3 horas)
- [ ] Crear estructura `/theme` con archivos de colores, tipografía, espaciado
- [ ] Crear hook `useTheme`
- [ ] Crear componentes base:
  - [ ] Button (todas las variantes)
  - [ ] Card (estándar, KPI, list item)
  - [ ] Input (text, search)
  - [ ] Badge & Status
  - [ ] Modal
- [ ] Documentar uso de cada componente

### Fase 2: Super Dashboard - Inicio (2-3 horas)
- [ ] Rediseñar `super-dashboard.tsx` (pantalla principal)
- [ ] Implementar KPI Cards grandes y legibles
- [ ] Aplicar nueva paleta de colores
- [ ] Aplicar nueva tipografía
- [ ] Aplicar espaciado correcto
- [ ] Microinteracciones (press, loading)
- [ ] Pull-to-refresh
- [ ] Screenshot para aprobación

### Fase 3: Admin Ops (3-4 horas)
- [ ] Rediseñar `super-dashboard-admin-ops.tsx`
- [ ] Implementar accordion UI
- [ ] Aplicar nueva UI a cards de items
- [ ] Implementar search mejorado
- [ ] Mejorar modales de CRUD
- [ ] Status indicators consistentes
- [ ] Screenshot para aprobación

### Fase 4: Listas Detalladas (4-5 horas)
- [ ] Rediseñar `super-dashboard-admins.tsx`
- [ ] Rediseñar `super-dashboard-all-merchants.tsx`
- [ ] Rediseñar `super-dashboard-all-clerks.tsx`
- [ ] Rediseñar listas de activos/nuevos/churn
- [ ] Implementar filtros chip mejorados
- [ ] Empty states consistentes
- [ ] Screenshot para aprobación

### Fase 5: Forms & Modals (2-3 horas)
- [ ] Rediseñar todos los modales de creación/edición
- [ ] Inputs consistentes
- [ ] Validación inline
- [ ] Buttons layout correcto
- [ ] Screenshot para aprobación

### Fase 6: Testing & Polish (2-3 horas)
- [ ] Testing completo de navegación
- [ ] Testing de todos los estados (loading, error, empty)
- [ ] Testing de dark mode (si aplica)
- [ ] Testing de accesibilidad
- [ ] Ajustes finales de espaciado
- [ ] Performance optimization

---

## 🎯 REGLAS DE ORO

1. **Consistencia es Rey:** Usar siempre los componentes del Design System, no crear estilos inline custom
2. **8pt Grid:** Todo el espaciado debe ser múltiplo de 8 (excepto casos especiales de 4px)
3. **Touch Targets:** Mínimo 44px de altura/ancho para elementos interactivos
4. **Colores Semánticos:** Usar success, warning, error, info según corresponda
5. **Accesibilidad:** Mantener contraste mínimo de 4.5:1 siempre
6. **Tipografía:** Line-height de 1.5x para texto de lectura
7. **Feedback:** Siempre dar feedback visual a interacciones del usuario
8. **Simplicidad:** Si puede ser más simple, hazlo más simple

---

**NOTA:** Este Design System es la base para todas las pantallas del rediseño. Cualquier componente nuevo debe seguir estos principios y patrones establecidos.
