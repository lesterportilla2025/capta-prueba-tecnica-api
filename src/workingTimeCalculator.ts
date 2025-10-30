import * as moment from 'moment-timezone';
import { 
  isWorkingDay, 
  isWorkingDayWithWeekend,
  isWorkingHour, 
  adjustToWorkingTime,
  adjustToNextWorkingTime, 
  WORKING_HOURS, 
  COLOMBIA_TIMEZONE 
} from './dateUtils';
import { CalculationOptions, WorkingTimeResult, WeekendOptions } from './types';

/**
 * Añade días hábiles a una fecha
 */
export function addWorkingDays(startDate: moment.Moment, daysToAdd: number, holidays: string[]): moment.Moment {
  if (daysToAdd <= 0) return startDate.clone();
  
  let currentDate = startDate.clone();
  let addedDays = 0;

  while (addedDays < daysToAdd) {
    currentDate.add(1, 'day');
    
    if (isWorkingDay(currentDate, holidays)) {
      addedDays++;
    }
  }

  return currentDate;
}

/**
 * Añade horas hábiles a una fecha
 */
export function addWorkingHours(startDate: moment.Moment, hoursToAdd: number, holidays: string[]): moment.Moment {
  if (hoursToAdd <= 0) return startDate.clone();
  
  let currentDate = adjustToWorkingTime(startDate, holidays);
  let remainingHours = hoursToAdd;

  while (remainingHours > 0) {
    // Si no es día hábil, avanzar al siguiente día hábil
    if (!isWorkingDay(currentDate, holidays)) {
      currentDate.add(1, 'day');
      currentDate.hour(WORKING_HOURS.start).minute(0).second(0);
      continue;
    }

    const currentHour = currentDate.hour();
    
    // Si estamos antes del horario laboral
    if (currentHour < WORKING_HOURS.start) {
      currentDate.hour(WORKING_HOURS.start).minute(0).second(0);
      continue;
    }
    
    // Si estamos en horario de almuerzo
    if (currentHour >= WORKING_HOURS.lunchStart && currentHour < WORKING_HOURS.lunchEnd) {
      currentDate.hour(WORKING_HOURS.lunchEnd).minute(0).second(0);
      continue;
    }
    
    // Si estamos después del horario laboral
    if (currentHour >= WORKING_HOURS.end) {
      currentDate.add(1, 'day').hour(WORKING_HOURS.start).minute(0).second(0);
      continue;
    }

    // Calcular cuántas horas podemos añadir antes del almuerzo o final del día
    let hoursUntilBreak: number;
    
    if (currentHour < WORKING_HOURS.lunchStart) {
      // Estamos en la mañana
      hoursUntilBreak = WORKING_HOURS.lunchStart - currentHour;
    } else {
      // Estamos en la tarde
      hoursUntilBreak = WORKING_HOURS.end - currentHour;
    }

    const hoursToAddNow = Math.min(remainingHours, hoursUntilBreak);
    currentDate.add(hoursToAddNow, 'hours');
    remainingHours -= hoursToAddNow;

    // Si llegamos al almuerzo, saltar a las 1pm
    if (currentDate.hour() === WORKING_HOURS.lunchStart && remainingHours > 0) {
      currentDate.hour(WORKING_HOURS.lunchEnd);
    }
    
    // Si llegamos al final del día, avanzar al siguiente día hábil
    if (currentDate.hour() >= WORKING_HOURS.end && remainingHours > 0) {
      currentDate.add(1, 'day').hour(WORKING_HOURS.start).minute(0).second(0);
    }
  }

  return currentDate;
}

/**
 * Calcula fecha resultante añadiendo días y/o horas hábiles
 */
export function calculateWorkingDateTime(
  startDate: moment.Moment, 
  days: number = 0, 
  hours: number = 0, 
  holidays: string[]
): moment.Moment {
  // Ajustar fecha inicial al horario laboral
  let result = adjustToWorkingTime(startDate, holidays);
  
  // Primero añadir días hábiles
  if (days > 0) {
    result = addWorkingDays(result, days, holidays);
  }
  
  // Luego añadir horas hábiles
  if (hours > 0) {
    result = addWorkingHours(result, hours, holidays);
  }
  
  return result;
}

/**
 * Suma múltiples cantidades de horas de trabajo
 */
export function addMultipleWorkingHours(
  startDate: moment.Moment,
  hoursArray: number[],
  holidays: string[],
  options?: CalculationOptions
): moment.Moment {
  const totalHours = hoursArray.reduce((sum, hours) => sum + hours, 0);
  
  if (options?.optimize && totalHours > 40) {
    return addWorkingHoursOptimized(startDate, totalHours, holidays, options);
  }
  
  return addWorkingHours(startDate, totalHours, holidays);
}

/**
 * Versión optimizada para agregar grandes cantidades de horas
 */
export function addWorkingHoursOptimized(
  startDate: moment.Moment,
  hoursToAdd: number,
  holidays: string[],
  options?: CalculationOptions
): moment.Moment {
  if (hoursToAdd <= 0) return startDate.clone();
  
  // Horas de trabajo por día (8am-12pm + 1pm-5pm = 8 horas)
  const DAILY_WORKING_HOURS = 8;
  
  // Calcular días completos
  const completeDays = Math.floor(hoursToAdd / DAILY_WORKING_HOURS);
  const remainingHours = hoursToAdd % DAILY_WORKING_HOURS;
  
  let result = options?.approximateToNext 
    ? adjustToNextWorkingTime(startDate, holidays)
    : adjustToWorkingTime(startDate, holidays);
  
  // Agregar días completos de trabajo
  if (completeDays > 0) {
    result = addWorkingDays(result, completeDays, holidays);
    // Asegurar que estamos al final del día laboral
    result.hour(WORKING_HOURS.end - 1).minute(59).second(59);
  }
  
  // Agregar horas restantes
  if (remainingHours > 0) {
    result = addWorkingHours(result, remainingHours, holidays);
  }
  
  return result;
}

/**
 * Calcula fecha resultante con opciones avanzadas
 */
export function calculateAdvancedWorkingDateTime(
  startDate: moment.Moment,
  days: number = 0,
  hours: number = 0,
  holidays: string[],
  options?: CalculationOptions
): WorkingTimeResult {
  const startTime = Date.now();
  let workingDaysAdded = 0;
  let workingHoursAdded = 0;
  let weekendsSkipped = 0;
  let holidaysSkipped = 0;
  
  // Ajustar fecha inicial
  let result = options?.approximateToNext
    ? adjustToNextWorkingTime(startDate, holidays)
    : adjustToWorkingTime(startDate, holidays);
  
  // Determinar método de cálculo
  const shouldOptimize = options?.optimize && (days > 30 || hours > 240);
  
  if (shouldOptimize) {
    // Método optimizado para grandes cantidades
    result = calculateLargeQuantities(result, days, hours, holidays, options);
    workingDaysAdded = days;
    workingHoursAdded = hours;
  } else {
    // Método iterativo estándar
    if (days > 0) {
      result = options?.weekendOptions
        ? addWorkingDaysWithWeekend(result, days, holidays, options.weekendOptions)
        : addWorkingDays(result, days, holidays);
      workingDaysAdded = days;
    }
    
    if (hours > 0) {
      result = options?.weekendOptions
        ? addWorkingHoursWithWeekend(result, hours, holidays, options.weekendOptions)
        : addWorkingHours(result, hours, holidays);
      workingHoursAdded = hours;
    }
  }
  
  return {
    result: result.toDate(),
    workingDaysAdded,
    workingHoursAdded,
    weekendsSkipped,
    holidaysSkipped,
    calculationMethod: shouldOptimize ? 'optimized' : 'iterative'
  };
}

/**
 * Método optimizado para grandes cantidades usando cálculos matemáticos
 */
function calculateLargeQuantities(
  startDate: moment.Moment,
  days: number,
  hours: number,
  holidays: string[],
  options?: CalculationOptions
): moment.Moment {
  // Convertir todo a horas para cálculo unificado
  const DAILY_WORKING_HOURS = 8;
  const totalHours = (days * DAILY_WORKING_HOURS) + hours;
  
  // Estimar días calendario necesarios (asumiendo ~5 días hábiles por semana)
  const estimatedCalendarDays = Math.ceil(totalHours / DAILY_WORKING_HOURS * 1.4);
  
  let result = startDate.clone();
  let remainingHours = totalHours;
  
  // Saltar en bloques grandes
  if (estimatedCalendarDays > 30) {
    const weeksToSkip = Math.floor(estimatedCalendarDays / 7);
    result.add(weeksToSkip, 'weeks');
    remainingHours -= weeksToSkip * 5 * DAILY_WORKING_HOURS; // 5 días hábiles por semana
  }
  
  // Completar con método estándar
  return addWorkingHours(result, Math.max(0, remainingHours), holidays);
}

/**
 * Añade días hábiles considerando opciones de fin de semana
 */
function addWorkingDaysWithWeekend(
  startDate: moment.Moment,
  daysToAdd: number,
  holidays: string[],
  weekendOptions: WeekendOptions
): moment.Moment {
  if (daysToAdd <= 0) return startDate.clone();
  
  let currentDate = startDate.clone();
  let addedDays = 0;

  while (addedDays < daysToAdd) {
    currentDate.add(1, 'day');
    
    if (isWorkingDayWithWeekend(currentDate, holidays, weekendOptions)) {
      addedDays++;
    }
  }

  return currentDate;
}

/**
 * Añade horas hábiles considerando opciones de fin de semana
 */
function addWorkingHoursWithWeekend(
  startDate: moment.Moment,
  hoursToAdd: number,
  holidays: string[],
  weekendOptions: WeekendOptions
): moment.Moment {
  if (hoursToAdd <= 0) return startDate.clone();
  
  let currentDate = startDate.clone();
  let remainingHours = hoursToAdd;

  while (remainingHours > 0) {
    // Usar la función con opciones de fin de semana
    if (!isWorkingDayWithWeekend(currentDate, holidays, weekendOptions)) {
      currentDate.add(1, 'day');
      currentDate.hour(WORKING_HOURS.start).minute(0).second(0);
      continue;
    }

    const currentHour = currentDate.hour();
    
    // Lógica similar a addWorkingHours pero con días hábiles extendidos
    if (currentHour < WORKING_HOURS.start) {
      currentDate.hour(WORKING_HOURS.start).minute(0).second(0);
      continue;
    }
    
    if (currentHour >= WORKING_HOURS.lunchStart && currentHour < WORKING_HOURS.lunchEnd) {
      currentDate.hour(WORKING_HOURS.lunchEnd).minute(0).second(0);
      continue;
    }
    
    if (currentHour >= WORKING_HOURS.end) {
      currentDate.add(1, 'day').hour(WORKING_HOURS.start).minute(0).second(0);
      continue;
    }

    let hoursUntilBreak: number;
    
    if (currentHour < WORKING_HOURS.lunchStart) {
      hoursUntilBreak = WORKING_HOURS.lunchStart - currentHour;
    } else {
      hoursUntilBreak = WORKING_HOURS.end - currentHour;
    }

    const hoursToAddNow = Math.min(remainingHours, hoursUntilBreak);
    currentDate.add(hoursToAddNow, 'hours');
    remainingHours -= hoursToAddNow;

    if (currentDate.hour() === WORKING_HOURS.lunchStart && remainingHours > 0) {
      currentDate.hour(WORKING_HOURS.lunchEnd);
    }
    
    if (currentDate.hour() >= WORKING_HOURS.end && remainingHours > 0) {
      currentDate.add(1, 'day').hour(WORKING_HOURS.start).minute(0).second(0);
    }
  }

  return currentDate;
}