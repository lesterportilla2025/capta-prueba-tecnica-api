import express from 'express';
import { Request, Response } from 'express';
import * as moment from 'moment-timezone';
import { QueryParams, ApiResponse, ErrorResponse, CalculationOptions } from './types';
import { validateAndParseParams } from './validation';
import { 
    getColombianHolidays, 
    utcToColombia, 
    colombiaToUtc, 
    COLOMBIA_TIMEZONE,
    isWorkingDay,
    isWorkingHour,
    adjustToNextWorkingTime,
    WORKING_HOURS
} from './dateUtils';
import { 
    calculateWorkingDateTime, 
    calculateAdvancedWorkingDateTime,
    addMultipleWorkingHours,
    addWorkingHoursOptimized,
    addWorkingDays
} from './workingTimeCalculator';

const app = express();
const port = 3000;

// Para manejar JSON en las solicitudes
app.use(express.json());

// Endpoint principal para calcular días/horas hábiles (MEJORADO con funcionalidades automáticas)
app.get('/prueba', async (req: Request, res: Response) => {
    try {
        const query: QueryParams = req.query as QueryParams;
        
        // Validar parámetros
        const validation = validateAndParseParams(query);
        if (!validation.isValid) {
            const errorResponse: ErrorResponse = {
                error: validation.error!,
                message: validation.message!
            };
            return res.status(400).json(errorResponse);
        }

        const { days = 0, hours = 0, date } = validation.params!;

        // NUEVA FUNCIONALIDAD: Detectar si 'hours' contiene múltiples valores separados por comas
        let hoursArray: number[] = [];
        let totalHoursFromArray = 0;
        
        if (typeof req.query.hours === 'string' && req.query.hours.includes(',')) {
            // Parsear múltiples horas: "2,1.5,3,0.5"
            try {
                hoursArray = req.query.hours.split(',').map(h => parseFloat(h.trim()));
                totalHoursFromArray = hoursArray.reduce((sum, h) => sum + h, 0);
                console.log(`📊 Detectadas múltiples horas: [${hoursArray.join(', ')}] = ${totalHoursFromArray}h total`);
            } catch (error) {
                console.warn('Error parseando múltiples horas, usando valor simple');
                hoursArray = [];
                totalHoursFromArray = 0;
            }
        }

        // Usar múltiples horas si fueron detectadas, sino usar el valor simple
        const finalHours = hoursArray.length > 0 ? totalHoursFromArray : hours;

        // Obtener días festivos
        const holidays = await getColombianHolidays();

        // Determinar fecha de inicio
        let startDate: moment.Moment;
        if (date) {
            // Convertir UTC a hora de Colombia
            startDate = utcToColombia(date);
        } else {
            // Usar hora actual de Colombia
            startDate = moment.tz(COLOMBIA_TIMEZONE);
        }

        // MEJORAS AUTOMÁTICAS aplicadas según la situación:
        
        // 1. Detectar si necesita aproximación hacia adelante (horarios no laborales)
        const needsForwardApproximation = !isWorkingDay(startDate, holidays) || 
                                         !isWorkingHour(startDate) ||
                                         startDate.hour() >= WORKING_HOURS.lunchStart && startDate.hour() < WORKING_HOURS.lunchEnd;
        
        // 2. Detectar si necesita optimización (grandes cantidades)
        const needsOptimization = days > 30 || finalHours > 240;
        
        // 3. Detectar si las horas forman días completos (suma combinada inteligente)
        const totalHours = finalHours + (days * 8); // Convertir todo a horas para análisis
        const hasMultipleHourComponents = finalHours > 0 && days > 0;
        const hasMultipleHoursInput = hoursArray.length > 0;

        // Aplicar funcionalidades mejoradas automáticamente
        const options: CalculationOptions = {
            approximateToNext: needsForwardApproximation,
            optimize: needsOptimization
        };

        let resultDate: moment.Moment;

        if (hasMultipleHoursInput) {
            // NUEVA FUNCIONALIDAD: Suma de múltiples horas automática
            resultDate = addMultipleWorkingHours(startDate, hoursArray, holidays, options);
            console.log(`➕ Aplicada suma de múltiples horas: [${hoursArray.join(', ')}] = ${totalHoursFromArray}h`);
            
            // Si también hay días, agregarlos después
            if (days > 0) {
                resultDate = addWorkingDays(resultDate, days, holidays);
                console.log(`📅 Agregados ${days} días adicionales`);
            }
        } else if (needsOptimization) {
            // Usar algoritmo optimizado para grandes cantidades
            resultDate = addWorkingHoursOptimized(startDate, totalHours, holidays, options);
            console.log(`🚀 Aplicada optimización automática para ${days} días + ${finalHours} horas`);
        } else if (hasMultipleHourComponents && finalHours >= 8) {
            // Optimizar suma combinada cuando las horas son significativas
            const additionalDays = Math.floor(finalHours / 8);
            const remainingHours = finalHours % 8;
            resultDate = calculateWorkingDateTime(startDate, days + additionalDays, remainingHours, holidays);
            console.log(`📊 Aplicada suma combinada inteligente: ${days}+${additionalDays} días, ${remainingHours} horas`);
        } else if (needsForwardApproximation) {
            // Usar aproximación hacia adelante
            const adjustedStart = adjustToNextWorkingTime(startDate, holidays);
            resultDate = calculateWorkingDateTime(adjustedStart, days, finalHours, holidays);
            console.log(`🎯 Aplicada aproximación hacia adelante desde horario no laboral`);
        } else {
            // Usar algoritmo estándar mejorado
            resultDate = calculateWorkingDateTime(startDate, days, finalHours, holidays);
        }

        // Convertir resultado a UTC
        const utcResult = colombiaToUtc(resultDate);

        // Respuesta en formato requerido (mantiene compatibilidad total)
        const response: ApiResponse = {
            date: utcResult.toISOString()
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error en el cálculo:', error);
        const errorResponse: ErrorResponse = {
            error: 'InternalServerError',
            message: 'Error interno del servidor'
        };
        res.status(503).json(errorResponse);
    }
});

// Endpoint mejorado con opciones avanzadas
app.get('/prueba-avanzada', async (req: Request, res: Response) => {
    try {
        const query: QueryParams = req.query as QueryParams;
        
        // Parámetros adicionales para opciones avanzadas
        const includeSaturday = req.query.includeSaturday === 'true';
        const includeSunday = req.query.includeSunday === 'true';
        const approximateToNext = req.query.approximateToNext === 'true';
        const optimize = req.query.optimize === 'true';
        
        const validation = validateAndParseParams(query);
        if (!validation.isValid) {
            const errorResponse: ErrorResponse = {
                error: validation.error!,
                message: validation.message!
            };
            return res.status(400).json(errorResponse);
        }

        const { days = 0, hours = 0, date } = validation.params!;
        const holidays = await getColombianHolidays();

        let startDate: moment.Moment;
        if (date) {
            startDate = utcToColombia(date);
        } else {
            startDate = moment.tz(COLOMBIA_TIMEZONE);
        }

        const options: CalculationOptions = {
            weekendOptions: {
                includeSaturday,
                includeSunday
            },
            approximateToNext,
            optimize
        };

        const result = calculateAdvancedWorkingDateTime(startDate, days, hours, holidays, options);
        
        res.status(200).json({
            date: moment.utc(result.result).toISOString(),
            metadata: {
                workingDaysAdded: result.workingDaysAdded,
                workingHoursAdded: result.workingHoursAdded,
                weekendsSkipped: result.weekendsSkipped,
                holidaysSkipped: result.holidaysSkipped,
                calculationMethod: result.calculationMethod
            }
        });

    } catch (error) {
        console.error('Error en el cálculo avanzado:', error);
        const errorResponse: ErrorResponse = {
            error: 'InternalServerError',
            message: 'Error interno del servidor'
        };
        res.status(503).json(errorResponse);
    }
});

// Endpoint para sumar múltiples horas
app.post('/suma-horas', async (req: Request, res: Response) => {
    try {
        const { hours, date, optimize = false } = req.body;
        
        if (!Array.isArray(hours) || hours.length === 0) {
            return res.status(400).json({
                error: 'BadRequest',
                message: 'Se requiere un array de horas válido'
            });
        }

        const holidays = await getColombianHolidays();
        
        let startDate: moment.Moment;
        if (date) {
            startDate = utcToColombia(new Date(date));
        } else {
            startDate = moment.tz(COLOMBIA_TIMEZONE);
        }

        const options: CalculationOptions = { optimize };
        const result = addMultipleWorkingHours(startDate, hours, holidays, options);
        
        res.status(200).json({
            date: result.utc().toISOString(),
            totalHours: hours.reduce((sum: number, h: number) => sum + h, 0),
            hoursBreakdown: hours
        });

    } catch (error) {
        console.error('Error en suma de horas:', error);
        res.status(503).json({
            error: 'InternalServerError',
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint para grandes cantidades (optimizado)
app.get('/calculo-optimizado', async (req: Request, res: Response) => {
    try {
        const query: QueryParams = req.query as QueryParams;
        const validation = validateAndParseParams(query);
        
        if (!validation.isValid) {
            return res.status(400).json({
                error: validation.error!,
                message: validation.message!
            });
        }

        const { days = 0, hours = 0, date } = validation.params!;
        
        // Advertencia para grandes cantidades
        if (days > 1000 || hours > 8000) {
            console.warn(`Procesando cantidades muy grandes: ${days} días, ${hours} horas`);
        }

        const holidays = await getColombianHolidays();
        
        let startDate: moment.Moment;
        if (date) {
            startDate = utcToColombia(date);
        } else {
            startDate = moment.tz(COLOMBIA_TIMEZONE);
        }

        const startTime = Date.now();
        const result = addWorkingHoursOptimized(startDate, (days * 8) + hours, holidays, {
            optimize: true,
            approximateToNext: true
        });
        const processingTime = Date.now() - startTime;
        
        res.status(200).json({
            date: result.utc().toISOString(),
            performance: {
                processingTimeMs: processingTime,
                inputDays: days,
                inputHours: hours,
                totalHours: (days * 8) + hours
            }
        });

    } catch (error) {
        console.error('Error en cálculo optimizado:', error);
        res.status(503).json({
            error: 'InternalServerError',
            message: 'Error interno del servidor'
        });
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
    console.log(`Endpoints disponibles:`);
    console.log(`- GET /prueba?days=X&hours=Y&date=Z (original)`);
    console.log(`- GET /prueba-avanzada?days=X&hours=Y&date=Z&includeSaturday=true&approximateToNext=true&optimize=true`);
    console.log(`- POST /suma-horas (body: {hours: [1,2,3], date?: string, optimize?: boolean})`);
    console.log(`- GET /calculo-optimizado?days=X&hours=Y&date=Z (para grandes cantidades)`);
    console.log(`Zona horaria: ${COLOMBIA_TIMEZONE}`);
});
