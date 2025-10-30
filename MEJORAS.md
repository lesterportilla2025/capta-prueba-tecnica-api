# Calculadora de Tiempo de Trabajo - Funcionalidades Mejoradas

Esta versión mejorada de la API incluye todas las funcionalidades solicitadas por la empresa:

## ✨ Nuevas Funcionalidades

### 1. 🎯 Aproximaciones en Horarios No Laborales

**Problema resuelto:** Manejo inteligente cuando la fecha inicial está fuera del horario laboral.

**Nuevas funciones:**
- `adjustToNextWorkingTime()`: Aproxima hacia el siguiente momento laboral válido
- Opción `approximateToNext: true` en los endpoints

**Comportamientos:**
- **Antes de 8am:** Se aproxima a las 8:00am del mismo día
- **Horario de almuerzo (12-1pm):** Se aproxima a la 1:00pm
- **Después de 5pm:** Se aproxima a las 8:00am del siguiente día hábil
- **Fines de semana:** Se aproxima al lunes a las 8:00am

### 2. ➕ Suma de Múltiples Horas

**Problema resuelto:** Capacidad de sumar arrays de horas de manera eficiente.

**Nuevas funciones:**
- `addMultipleWorkingHours()`: Suma arrays de horas
- Endpoint POST `/suma-horas`

**Características:**
- Acepta arrays de números (incluyendo decimales)
- Optimización automática para grandes cantidades
- Manejo de fracciones de hora (ej: 1.5, 2.25)

**Ejemplo de uso:**
```typescript
const horas = [1, 2.5, 0.5, 3, 1.5]; // Total: 8.5 horas
const resultado = addMultipleWorkingHours(fechaInicio, horas, feriados);
```

### 3. 📅 Suma Combinada de Días y Horas

**Problema resuelto:** Manejo inteligente cuando las horas suman más de un día laboral.

**Mejoras implementadas:**
- Conversión automática de horas excedentes a días
- Optimización cuando las horas > 8 (un día laboral)
- Cálculo preciso respetando horarios de almuerzo

**Lógica mejorada:**
- Si horas ≥ 8: Se convierte a días + horas restantes
- Manejo correcto de horarios fraccionados
- Preservación de la hora exacta del resultado

### 4. 🌅 Manejo de Horarios Durante Fines de Semana

**Problema resuelto:** Capacidad de incluir sábados y/o domingos como días laborales.

**Nuevas funciones:**
- `isWorkingDayWithWeekend()`: Evaluación de días hábiles extendida
- `addWorkingDaysWithWeekend()` y `addWorkingHoursWithWeekend()`

**Opciones de configuración:**
```typescript
const opciones = {
  weekendOptions: {
    includeSaturday: true,  // Incluir sábados
    includeSunday: true     // Incluir domingos
  }
};
```

### 5. ⚡ Manejo de Grandes Cantidades de Días y Horas

**Problema resuelto:** Optimización para grandes volúmenes sin impacto en rendimiento.

**Algoritmos implementados:**
- **Método iterativo:** Para cantidades pequeñas (< 30 días o < 240 horas)
- **Método optimizado:** Para grandes cantidades usando cálculos matemáticos

**Optimizaciones:**
- Salto en bloques de semanas completas
- Cálculo matemático vs. iteración día por día
- Detección automática del mejor método

**Umbrales de optimización:**
- Días > 30 o Horas > 240: Activación automática
- Días > 1000 o Horas > 8000: Advertencias de rendimiento

## 🔧 API Endpoints

### Endpoint Original (Mejorado)
```
GET /prueba?days=X&hours=Y&date=Z
```

### Nuevo Endpoint Avanzado
```
GET /prueba-avanzada?days=X&hours=Y&date=Z&includeSaturday=true&approximateToNext=true&optimize=true
```

**Parámetros adicionales:**
- `includeSaturday`: Incluir sábados como días hábiles
- `includeSunday`: Incluir domingos como días hábiles  
- `approximateToNext`: Aproximar hacia adelante en horarios no laborales
- `optimize`: Forzar optimización para grandes cantidades

### Endpoint para Suma de Múltiples Horas
```
POST /suma-horas
Content-Type: application/json

{
  "hours": [1, 2.5, 0.5, 3],
  "date": "2025-10-30T14:00:00Z",
  "optimize": true
}
```

### Endpoint Optimizado para Grandes Cantidades
```
GET /calculo-optimizado?days=1000&hours=500&date=Z
```

## 📊 Respuestas Mejoradas

### Respuesta Estándar
```json
{
  "date": "2025-11-05T17:00:00.000Z"
}
```

### Respuesta Avanzada (con metadatos)
```json
{
  "date": "2025-11-15T17:00:00.000Z",
  "metadata": {
    "workingDaysAdded": 10,
    "workingHoursAdded": 25,
    "weekendsSkipped": 4,
    "holidaysSkipped": 1,
    "calculationMethod": "optimized"
  }
}
```

### Respuesta de Suma de Horas
```json
{
  "date": "2025-11-05T15:30:00.000Z",
  "totalHours": 8.5,
  "hoursBreakdown": [1, 2.5, 0.5, 3, 1.5]
}
```

### Respuesta de Cálculo Optimizado
```json
{
  "date": "2025-12-15T17:00:00.000Z",
  "performance": {
    "processingTimeMs": 15,
    "inputDays": 1000,
    "inputHours": 500,
    "totalHours": 8500
  }
}
```

## 🧪 Pruebas y Validación

### Ejecutar Pruebas
```bash
# Compilar y ejecutar las pruebas
npx tsc src/tests.ts --outDir dist
node dist/tests.js
```

### Casos de Prueba Incluidos

1. **Aproximaciones en horarios no laborales:**
   - Fechas en fin de semana
   - Horarios después de 5pm
   - Horarios de almuerzo (12-1pm)

2. **Suma de múltiples horas:**
   - Arrays pequeños con decimales
   - Arrays grandes (activación de optimización)

3. **Suma combinada:**
   - Días + horas normales
   - Horas que exceden días laborales
   - Cantidades muy grandes

4. **Manejo de fines de semana:**
   - Solo días de semana (comportamiento estándar)
   - Incluyendo sábados
   - Incluyendo sábados y domingos

5. **Grandes cantidades:**
   - Comparación de rendimiento (estándar vs optimizado)
   - Manejo de cantidades extremas (2000+ horas)

## ⚙️ Configuración y Uso

### Opciones de Configuración
```typescript
interface CalculationOptions {
  weekendOptions?: {
    includeSaturday?: boolean;
    includeSunday?: boolean;
  };
  approximateToNext?: boolean;
  optimize?: boolean;
}
```

### Ejemplos de Uso Programático

```typescript
import { calculateAdvancedWorkingDateTime } from './workingTimeCalculator';

// Caso 1: Aproximación hacia adelante con fines de semana
const resultado1 = calculateAdvancedWorkingDateTime(
  fechaInicio, 
  5, // días
  10, // horas
  feriados,
  {
    approximateToNext: true,
    weekendOptions: { includeSaturday: true },
    optimize: false
  }
);

// Caso 2: Grandes cantidades con optimización
const resultado2 = calculateAdvancedWorkingDateTime(
  fechaInicio,
  100, // días  
  500, // horas
  feriados,
  { optimize: true }
);
```

## 🎯 Casos de Uso Empresariales

1. **Planificación de Proyectos:** Cálculo preciso de fechas de entrega considerando horarios reales
2. **Gestión de SLAs:** Aproximaciones inteligentes para compromisos de servicio
3. **Recursos Humanos:** Cálculo de horas trabajadas incluyendo fines de semana
4. **Facturación:** Suma precisa de múltiples períodos de trabajo
5. **Cronogramas Largos:** Planificación eficiente de proyectos de gran escala

## 🚀 Rendimiento

- **Pequeñas cantidades (< 30 días):** ~1-5ms
- **Cantidades medianas (30-100 días):** ~5-20ms  
- **Grandes cantidades (100+ días):** ~10-50ms (optimizado)
- **Cantidades extremas (1000+ días):** ~20-100ms (optimizado)

La optimización automática garantiza rendimiento consistente independientemente del volumen de cálculo.