import * as moment from 'moment-timezone';
import { 
    calculateWorkingDateTime, 
    calculateAdvancedWorkingDateTime,
    addMultipleWorkingHours,
    addWorkingHoursOptimized
} from './workingTimeCalculator';
import { COLOMBIA_TIMEZONE } from './dateUtils';

// Días festivos de prueba para 2025
const testHolidays = [
    '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
    '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-08-07',
    '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17', '2025-12-08',
    '2025-12-25'
];

/**
 * Pruebas para aproximaciones en horarios no laborales
 */
export function testNonWorkingHourApproximations() {
    console.log('\n=== PRUEBAS DE APROXIMACIONES EN HORARIOS NO LABORALES ===');
    
    // Prueba 1: Fecha en fin de semana
    const weekendDate = moment.tz('2025-11-01 15:30:00', COLOMBIA_TIMEZONE); // Sábado
    const result1 = calculateAdvancedWorkingDateTime(weekendDate, 0, 2, testHolidays, {
        approximateToNext: true
    });
    console.log(`Fin de semana (sáb 15:30) + 2h aprox. adelante:`);
    console.log(`Resultado: ${moment.utc(result1.result).tz(COLOMBIA_TIMEZONE).format('dddd YYYY-MM-DD HH:mm:ss')}`);
    
    // Prueba 2: Fecha después de horario laboral
    const afterHours = moment.tz('2025-10-30 19:00:00', COLOMBIA_TIMEZONE); // Jueves 7pm
    const result2 = calculateAdvancedWorkingDateTime(afterHours, 0, 1, testHolidays, {
        approximateToNext: true
    });
    console.log(`Después de horario (jue 19:00) + 1h aprox. adelante:`);
    console.log(`Resultado: ${moment.utc(result2.result).tz(COLOMBIA_TIMEZONE).format('dddd YYYY-MM-DD HH:mm:ss')}`);
    
    // Prueba 3: Fecha en horario de almuerzo
    const lunchTime = moment.tz('2025-10-30 12:30:00', COLOMBIA_TIMEZONE); // Jueves 12:30pm
    const result3 = calculateAdvancedWorkingDateTime(lunchTime, 0, 1, testHolidays, {
        approximateToNext: true
    });
    console.log(`Horario almuerzo (jue 12:30) + 1h aprox. adelante:`);
    console.log(`Resultado: ${moment.utc(result3.result).tz(COLOMBIA_TIMEZONE).format('dddd YYYY-MM-DD HH:mm:ss')}`);
}

/**
 * Pruebas para suma de múltiples horas
 */
export function testMultipleHoursSum() {
    console.log('\n=== PRUEBAS DE SUMA DE MÚLTIPLES HORAS ===');
    
    const startDate = moment.tz('2025-10-30 08:00:00', COLOMBIA_TIMEZONE); // Jueves 8am
    
    // Prueba 1: Array de horas pequeñas
    const hoursArray1 = [1, 2, 0.5, 3, 1.5];
    const result1 = addMultipleWorkingHours(startDate, hoursArray1, testHolidays);
    const totalHours1 = hoursArray1.reduce((sum, h) => sum + h, 0);
    console.log(`Suma de horas ${hoursArray1.join(' + ')} = ${totalHours1}h:`);
    console.log(`Resultado: ${result1.tz(COLOMBIA_TIMEZONE).format('dddd YYYY-MM-DD HH:mm:ss')}`);
    
    // Prueba 2: Array de horas grandes (activar optimización)
    const hoursArray2 = [8, 8, 8, 8, 8, 4]; // 44 horas (más de una semana)
    const result2 = addMultipleWorkingHours(startDate, hoursArray2, testHolidays, { optimize: true });
    const totalHours2 = hoursArray2.reduce((sum, h) => sum + h, 0);
    console.log(`Suma optimizada de ${totalHours2}h (${hoursArray2.length} valores):`);
    console.log(`Resultado: ${result2.tz(COLOMBIA_TIMEZONE).format('dddd YYYY-MM-DD HH:mm:ss')}`);
}

/**
 * Pruebas para suma combinada de días y horas
 */
export function testCombinedDaysAndHours() {
    console.log('\n=== PRUEBAS DE SUMA COMBINADA DE DÍAS Y HORAS ===');
    
    const startDate = moment.tz('2025-10-30 14:00:00', COLOMBIA_TIMEZONE); // Jueves 2pm
    
    // Prueba 1: Días y horas que no rebasan un día
    const result1 = calculateAdvancedWorkingDateTime(startDate, 2, 3, testHolidays);
    console.log(`Desde jue 14:00 + 2 días + 3 horas:`);
    console.log(`Resultado: ${moment.utc(result1.result).tz(COLOMBIA_TIMEZONE).format('dddd YYYY-MM-DD HH:mm:ss')}`);
    console.log(`Método: ${result1.calculationMethod}`);
    
    // Prueba 2: Horas que suman más de un día laboral
    const result2 = calculateAdvancedWorkingDateTime(startDate, 1, 12, testHolidays);
    console.log(`Desde jue 14:00 + 1 día + 12 horas (1.5 días laborales en horas):`);
    console.log(`Resultado: ${moment.utc(result2.result).tz(COLOMBIA_TIMEZONE).format('dddd YYYY-MM-DD HH:mm:ss')}`);
    
    // Prueba 3: Grandes cantidades (activar optimización)
    const result3 = calculateAdvancedWorkingDateTime(startDate, 50, 100, testHolidays, { optimize: true });
    console.log(`Desde jue 14:00 + 50 días + 100 horas (optimizado):`);
    console.log(`Resultado: ${moment.utc(result3.result).tz(COLOMBIA_TIMEZONE).format('dddd YYYY-MM-DD HH:mm:ss')}`);
    console.log(`Método: ${result3.calculationMethod}`);
}

/**
 * Pruebas para manejo de fines de semana
 */
export function testWeekendHandling() {
    console.log('\n=== PRUEBAS DE MANEJO DE FINES DE SEMANA ===');
    
    const startDate = moment.tz('2025-10-30 10:00:00', COLOMBIA_TIMEZONE); // Jueves 10am
    
    // Prueba 1: Sin incluir fines de semana (comportamiento estándar)
    const result1 = calculateAdvancedWorkingDateTime(startDate, 3, 0, testHolidays);
    console.log(`Desde jue 10:00 + 3 días (sin fines de semana):`);
    console.log(`Resultado: ${moment.utc(result1.result).tz(COLOMBIA_TIMEZONE).format('dddd YYYY-MM-DD HH:mm:ss')}`);
    
    // Prueba 2: Incluyendo sábados
    const result2 = calculateAdvancedWorkingDateTime(startDate, 3, 0, testHolidays, {
        weekendOptions: { includeSaturday: true }
    });
    console.log(`Desde jue 10:00 + 3 días (incluyendo sábados):`);
    console.log(`Resultado: ${moment.utc(result2.result).tz(COLOMBIA_TIMEZONE).format('dddd YYYY-MM-DD HH:mm:ss')}`);
    
    // Prueba 3: Incluyendo sábados y domingos
    const result3 = calculateAdvancedWorkingDateTime(startDate, 3, 0, testHolidays, {
        weekendOptions: { includeSaturday: true, includeSunday: true }
    });
    console.log(`Desde jue 10:00 + 3 días (incluyendo sáb y dom):`);
    console.log(`Resultado: ${moment.utc(result3.result).tz(COLOMBIA_TIMEZONE).format('dddd YYYY-MM-DD HH:mm:ss')}`);
}

/**
 * Pruebas para grandes cantidades
 */
export function testLargeQuantities() {
    console.log('\n=== PRUEBAS DE GRANDES CANTIDADES ===');
    
    const startDate = moment.tz('2025-10-30 08:00:00', COLOMBIA_TIMEZONE);
    
    // Prueba 1: Método estándar vs optimizado (días)
    const startTime1 = Date.now();
    const result1 = calculateAdvancedWorkingDateTime(startDate, 100, 0, testHolidays, { optimize: false });
    const time1 = Date.now() - startTime1;
    
    const startTime2 = Date.now();
    const result2 = calculateAdvancedWorkingDateTime(startDate, 100, 0, testHolidays, { optimize: true });
    const time2 = Date.now() - startTime2;
    
    console.log(`100 días - Método estándar: ${time1}ms`);
    console.log(`Resultado: ${moment.utc(result1.result).tz(COLOMBIA_TIMEZONE).format('YYYY-MM-DD')}`);
    console.log(`100 días - Método optimizado: ${time2}ms`);
    console.log(`Resultado: ${moment.utc(result2.result).tz(COLOMBIA_TIMEZONE).format('YYYY-MM-DD')}`);
    console.log(`Mejora: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
    
    // Prueba 2: Cantidades muy grandes
    const startTime3 = Date.now();
    const result3 = addWorkingHoursOptimized(startDate, 2000, testHolidays, { optimize: true });
    const time3 = Date.now() - startTime3;
    
    console.log(`2000 horas (250 días laborales) optimizado: ${time3}ms`);
    console.log(`Resultado: ${result3.tz(COLOMBIA_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')}`);
}

/**
 * Ejecutar todas las pruebas
 */
export function runAllTests() {
    console.log('🧪 EJECUTANDO PRUEBAS DE FUNCIONALIDADES MEJORADAS');
    console.log('=' .repeat(60));
    
    try {
        testNonWorkingHourApproximations();
        testMultipleHoursSum();
        testCombinedDaysAndHours();
        testWeekendHandling();
        testLargeQuantities();
        
        console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
        console.log('=' .repeat(60));
        
    } catch (error) {
        console.error('\n❌ ERROR EN LAS PRUEBAS:', error);
        console.log('=' .repeat(60));
    }
}

// Ejecutar pruebas si este archivo se ejecuta directamente
if (require.main === module) {
    runAllTests();
}