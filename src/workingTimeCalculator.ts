import * as moment from 'moment-timezone';
import { 
  isWorkingDay, 
  isWorkingHour, 
  adjustToWorkingTime, 
  WORKING_HOURS, 
  COLOMBIA_TIMEZONE 
} from './dateUtils';

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