import express from 'express';
import { Request, Response } from 'express';
import * as moment from 'moment-timezone';
import { QueryParams, ApiResponse, ErrorResponse } from './types';
import { validateAndParseParams } from './validation';
import { getColombianHolidays, utcToColombia, colombiaToUtc, COLOMBIA_TIMEZONE } from './dateUtils';
import { calculateWorkingDateTime } from './workingTimeCalculator';

const app = express();
const port = 3000;

// Para manejar JSON en las solicitudes
app.use(express.json());

// Endpoint principal para calcular días/horas hábiles
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

        // Calcular fecha resultante
        const resultDate = calculateWorkingDateTime(startDate, days, hours, holidays);

        // Convertir resultado a UTC
        const utcResult = colombiaToUtc(resultDate);

        // Respuesta en formato requerido
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

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
    console.log(`Endpoint disponible: GET /prueba?days=X&hours=Y&date=Z`);
    console.log(`Zona horaria: ${COLOMBIA_TIMEZONE}`);
});
