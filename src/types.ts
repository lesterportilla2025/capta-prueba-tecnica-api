// Interfaces y tipos para la API de días hábiles

export interface QueryParams {
  days?: string;
  hours?: string;
  date?: string;
}

export interface ParsedParams {
  days?: number;
  hours?: number;
  date?: Date;
}

export interface ApiResponse {
  date: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface WorkingHours {
  start: number; // 8 (8:00 AM)
  lunchStart: number; // 12 (12:00 PM)
  lunchEnd: number; // 13 (1:00 PM)
  end: number; // 17 (5:00 PM)
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  message?: string;
  params?: ParsedParams;
}

export interface WeekendOptions {
  includeSaturday?: boolean;
  includeSunday?: boolean;
}

export interface CalculationOptions {
  weekendOptions?: WeekendOptions;
  approximateToNext?: boolean; // Para aproximaciones hacia adelante
  optimize?: boolean; // Para grandes cantidades
}

export interface WorkingTimeResult {
  result: Date;
  workingDaysAdded: number;
  workingHoursAdded: number;
  weekendsSkipped: number;
  holidaysSkipped: number;
  calculationMethod: 'iterative' | 'optimized';
}