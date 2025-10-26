import { QueryParams, ValidationResult, ParsedParams } from './types';

/**
 * Valida y parsea los parámetros de entrada
 */
export function validateAndParseParams(query: QueryParams): ValidationResult {
  const { days, hours, date } = query;
  
  // Verificar que al menos un parámetro sea enviado
  if (!days && !hours) {
    return {
      isValid: false,
      error: 'InvalidParameters',
      message: 'Debe enviar al menos el parámetro "days" o "hours"'
    };
  }

  const parsed: ParsedParams = {};

  // Validar y parsear days
  if (days !== undefined) {
    const daysNum = parseInt(days, 10);
    if (isNaN(daysNum) || daysNum < 0) {
      return {
        isValid: false,
        error: 'InvalidParameters',
        message: 'El parámetro "days" debe ser un entero positivo'
      };
    }
    parsed.days = daysNum;
  }

  // Validar y parsear hours
  if (hours !== undefined) {
    const hoursNum = parseInt(hours, 10);
    if (isNaN(hoursNum) || hoursNum < 0) {
      return {
        isValid: false,
        error: 'InvalidParameters',
        message: 'El parámetro "hours" debe ser un entero positivo'
      };
    }
    parsed.hours = hoursNum;
  }

  // Validar y parsear date (opcional)
  if (date !== undefined) {
    // Verificar formato ISO 8601 con Z
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    if (!iso8601Regex.test(date)) {
      return {
        isValid: false,
        error: 'InvalidParameters',
        message: 'El parámetro "date" debe estar en formato UTC ISO 8601 con sufijo Z (ej: 2025-08-01T14:00:00Z)'
      };
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return {
        isValid: false,
        error: 'InvalidParameters',
        message: 'El parámetro "date" contiene una fecha inválida'
      };
    }
    
    parsed.date = parsedDate;
  }

  return {
    isValid: true,
    params: parsed
  };
}