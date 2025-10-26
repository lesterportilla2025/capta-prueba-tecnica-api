# API de Días Hábiles Colombia

Una API REST desarrollada en TypeScript que calcula fechas hábiles en Colombia, considerando días festivos nacionales, horarios laborales y zonas horarias.

## 🚀 Características

- ✅ Cálculo de días y horas hábiles
- ✅ Manejo de días festivos colombianos (API oficial)
- ✅ Horario laboral: 8:00 AM - 5:00 PM (con almuerzo 12:00 PM - 1:00 PM)
- ✅ Conversión automática de zonas horarias (Colombia ↔ UTC)
- ✅ Validación robusta de parámetros
- ✅ Totalmente desarrollado en TypeScript

## 📋 Requisitos

- Node.js (v14 o superior)
- npm o yarn

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd api

# Instalar dependencias
npm install
```

## 🚦 Uso

### Iniciar el servidor de desarrollo:
```bash
npm run dev
```

### Compilar para producción:
```bash
npm run build
npm start
```

## 📡 API Endpoints

### `GET /prueba`

Calcula fechas hábiles sumando días y/o horas a partir de una fecha inicial.

**Parámetros (Query String):**

- `days` (opcional): Número de días hábiles a sumar (entero positivo)
- `hours` (opcional): Número de horas hábiles a sumar (entero positivo)  
- `date` (opcional): Fecha inicial en UTC ISO 8601 con sufijo Z

**Nota:** Debe enviarse al menos `days` o `hours`.

### Ejemplos de uso:

```bash
# Sumar 5 días hábiles desde ahora
curl "http://localhost:3000/prueba?days=5"

# Sumar 8 horas hábiles desde ahora
curl "http://localhost:3000/prueba?hours=8"

# Sumar 2 días y 4 horas hábiles
curl "http://localhost:3000/prueba?days=2&hours=4"

# Usar fecha inicial específica
curl "http://localhost:3000/prueba?days=3&date=2025-12-20T14:00:00Z"
```

### Respuestas:

**✅ Éxito (200 OK):**
```json
{
  "date": "2025-08-01T14:00:00Z"
}
```

**❌ Error (400/503):**
```json
{
  "error": "InvalidParameters",
  "message": "Descripción del error"
}
```

## 🏢 Reglas de Negocio

- **Días hábiles:** Lunes a viernes, excluyendo días festivos colombianos
- **Horario laboral:** 8:00 AM - 5:00 PM (GMT-5, Colombia)
- **Almuerzo:** 12:00 PM - 1:00 PM (se excluye del tiempo laboral)
- **Ajuste automático:** Si la fecha inicial está fuera del horario laboral, se ajusta hacia atrás al momento laboral más cercano
- **Orden de cálculo:** Primero se suman los días, luego las horas
- **Zona horaria:** Cálculos en hora de Colombia, resultado en UTC

## 🗓️ Días Festivos

Los días festivos se obtienen automáticamente de: https://content.capta.co/Recruitment/WorkingDays.json

## 🧪 Scripts Disponibles

```bash
npm run dev    # Iniciar servidor de desarrollo
npm run build  # Compilar TypeScript
npm start      # Ejecutar versión compilada
npm test       # Ejecutar tests (por implementar)
```

## 📁 Estructura del Proyecto

```
src/
├── index.ts                    # Endpoint principal
├── types.ts                   # Interfaces TypeScript
├── dateUtils.ts               # Utilidades de fechas
├── workingTimeCalculator.ts   # Lógica de cálculo
└── validation.ts              # Validación de parámetros
```

## 🔧 Tecnologías

- **TypeScript** - Lenguaje principal
- **Express.js** - Framework web
- **Moment.js/Timezone** - Manejo de fechas y zonas horarias
- **Axios** - Cliente HTTP para API de festivos

## 👨‍💻 Autor

Desarrollado para prueba técnica - Cálculo de días hábiles Colombia