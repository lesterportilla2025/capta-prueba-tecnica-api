import axios from 'axios';
import * as moment from 'moment-timezone';
import { WorkingHours } from './types';

// Configuración de Colombia
export const COLOMBIA_TIMEZONE = 'America/Bogota';
export const HOLIDAYS_URL = 'https://content.capta.co/Recruitment/WorkingDays.json';

// Horario laboral en Colombia
export const WORKING_HOURS: WorkingHours = {
  start: 8,      // 8:00 AM
  lunchStart: 12, // 12:00 PM
  lunchEnd: 13,   // 1:00 PM
  end: 17        // 5:00 PM
};

// Cache para días festivos
let holidaysCache: string[] | null = null;

/**
 * Obtiene los días festivos colombianos
 */
export async function getColombianHolidays(): Promise<string[]> {
  if (holidaysCache) {
    return holidaysCache;
  }

  try {
    const response = await axios.get<string[]>(HOLIDAYS_URL);
    holidaysCache = response.data;
    return holidaysCache;
  } catch (error) {
    console.error('Error fetching holidays:', error);
    // Fallback con algunos días festivos conocidos para 2025
    holidaysCache = [
      '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
      '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-08-07',
      '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17', '2025-12-08',
      '2025-12-25'
    ];
    return holidaysCache;
  }
}

/**
 * Verifica si una fecha es día festivo en Colombia
 */
export function isHoliday(date: moment.Moment, holidays: string[]): boolean {
  const dateString = date.format('YYYY-MM-DD');
  return holidays.includes(dateString);
}

/**
 * Verifica si es un día hábil (lunes a viernes, no festivo)
 */
export function isWorkingDay(date: moment.Moment, holidays: string[]): boolean {
  const dayOfWeek = date.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Lunes a viernes
  return isWeekday && !isHoliday(date, holidays);
}

/**
 * Verifica si es un día hábil considerando opciones de fin de semana
 */
export function isWorkingDayWithWeekend(
  date: moment.Moment, 
  holidays: string[], 
  weekendOptions?: { includeSaturday?: boolean; includeSunday?: boolean }
): boolean {
  const dayOfWeek = date.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  let isValidDay = dayOfWeek >= 1 && dayOfWeek <= 5; // Lunes a viernes por defecto
  
  // Incluir sábado si está habilitado
  if (weekendOptions?.includeSaturday && dayOfWeek === 6) {
    isValidDay = true;
  }
  
  // Incluir domingo si está habilitado
  if (weekendOptions?.includeSunday && dayOfWeek === 0) {
    isValidDay = true;
  }
  
  return isValidDay && !isHoliday(date, holidays);
}

/**
 * Verifica si está en horario laboral (8am-12pm, 1pm-5pm)
 */
export function isWorkingHour(date: moment.Moment): boolean {
  const hour = date.hour();
  return (hour >= WORKING_HOURS.start && hour < WORKING_HOURS.lunchStart) ||
         (hour >= WORKING_HOURS.lunchEnd && hour < WORKING_HOURS.end);
}

/**
 * Ajusta una fecha al próximo momento laboral válido
 * Si está fuera de horario o en día no hábil, ajusta hacia atrás (comportamiento original)
 */
export function adjustToWorkingTime(date: moment.Moment, holidays: string[]): moment.Moment {
  const adjusted = date.clone();

  // Si no es día hábil, retroceder al día hábil anterior
  while (!isWorkingDay(adjusted, holidays)) {
    adjusted.subtract(1, 'day');
  }

  // Ajustar hora si está fuera del horario laboral
  const hour = adjusted.hour();
  const minute = adjusted.minute();
  
  if (hour < WORKING_HOURS.start) {
    // Antes de las 8am -> ir al final del día anterior hábil
    adjusted.subtract(1, 'day');
    while (!isWorkingDay(adjusted, holidays)) {
      adjusted.subtract(1, 'day');
    }
    adjusted.hour(WORKING_HOURS.end - 1).minute(59).second(59);
  } else if (hour >= WORKING_HOURS.end) {
    // Después de las 5pm -> ir al final del mismo día si es hábil
    adjusted.hour(WORKING_HOURS.end - 1).minute(59).second(59);
  } else if (hour >= WORKING_HOURS.lunchStart && hour < WORKING_HOURS.lunchEnd) {
    // En horario de almuerzo -> ir a las 11:59am
    adjusted.hour(WORKING_HOURS.lunchStart - 1).minute(59).second(59);
  }

  return adjusted;
}

/**
 * Ajusta una fecha al próximo momento laboral válido hacia adelante
 * Si está fuera de horario o en día no hábil, aproxima hacia el siguiente momento laboral
 */
export function adjustToNextWorkingTime(date: moment.Moment, holidays: string[]): moment.Moment {
  const adjusted = date.clone();

  // Si no es día hábil, avanzar al siguiente día hábil
  while (!isWorkingDay(adjusted, holidays)) {
    adjusted.add(1, 'day');
  }

  const hour = adjusted.hour();
  
  if (hour < WORKING_HOURS.start) {
    // Antes de las 8am -> ir a las 8am del mismo día
    adjusted.hour(WORKING_HOURS.start).minute(0).second(0);
  } else if (hour >= WORKING_HOURS.lunchStart && hour < WORKING_HOURS.lunchEnd) {
    // En horario de almuerzo -> ir a la 1pm
    adjusted.hour(WORKING_HOURS.lunchEnd).minute(0).second(0);
  } else if (hour >= WORKING_HOURS.end) {
    // Después de las 5pm -> ir a las 8am del siguiente día hábil
    adjusted.add(1, 'day');
    while (!isWorkingDay(adjusted, holidays)) {
      adjusted.add(1, 'day');
    }
    adjusted.hour(WORKING_HOURS.start).minute(0).second(0);
  }

  return adjusted;
}

/**
 * Convierte fecha UTC a hora de Colombia
 */
export function utcToColombia(utcDate: Date): moment.Moment {
  return moment.tz(utcDate, COLOMBIA_TIMEZONE);
}

/**
 * Convierte fecha de Colombia a UTC
 */
export function colombiaToUtc(colombiaDate: moment.Moment): moment.Moment {
  return colombiaDate.clone().utc();
}