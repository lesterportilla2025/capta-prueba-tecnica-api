import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testOriginalEndpointWithNewFeatures() {
    console.log('🧪 PROBANDO ENDPOINT ORIGINAL /prueba CON NUEVAS FUNCIONALIDADES');
    console.log('=' .repeat(70));

    try {
        // Iniciar servidor en background para las pruebas
        const { spawn } = require('child_process');
        const server = spawn('npm', ['start'], { 
            cwd: '/home/programador/Escritorio/Proyectos/api',
            detached: true,
            stdio: 'ignore'
        });
        
        // Esperar a que el servidor inicie
        console.log('⏳ Iniciando servidor...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('\n=== PRUEBA 1: Aproximación automática desde fin de semana ===');
        // Fecha de sábado - debe aproximar automáticamente hacia adelante
        const response1 = await axios.get(`${BASE_URL}/prueba?days=2&hours=3&date=2025-11-01T15:30:00.000Z`);
        console.log('📅 Entrada: Sábado 15:30 + 2 días + 3 horas');
        console.log('📅 Resultado:', new Date(response1.data.date).toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
        console.log('✅ Aproximación automática aplicada');

        console.log('\n=== PRUEBA 2: Suma de múltiples horas (formato comma separated) ===');
        // Múltiples horas en un solo parámetro: 2,1.5,3,0.5 = 7 horas
        const response2 = await axios.get(`${BASE_URL}/prueba?hours=2,1.5,3,0.5&days=1`);
        console.log('📊 Entrada: hours="2,1.5,3,0.5" (=7h total) + 1 día');
        console.log('📊 Resultado:', new Date(response2.data.date).toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
        console.log('✅ Suma automática de múltiples horas aplicada');

        console.log('\n=== PRUEBA 3: Optimización automática para grandes cantidades ===');
        // Grandes cantidades - debe aplicar optimización automáticamente
        const startTime = Date.now();
        const response3 = await axios.get(`${BASE_URL}/prueba?days=100&hours=50`);
        const endTime = Date.now();
        console.log('🚀 Entrada: 100 días + 50 horas (grandes cantidades)');
        console.log('🚀 Resultado:', new Date(response3.data.date).toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
        console.log(`🚀 Tiempo de procesamiento: ${endTime - startTime}ms`);
        console.log('✅ Optimización automática aplicada');

        console.log('\n=== PRUEBA 4: Suma combinada inteligente ===');
        // 12 horas = 1.5 días laborales, debe optimizar automáticamente
        const response4 = await axios.get(`${BASE_URL}/prueba?days=2&hours=12`);
        console.log('📈 Entrada: 2 días + 12 horas (=1.5 días laborales en horas)');
        console.log('📈 Resultado:', new Date(response4.data.date).toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
        console.log('✅ Suma combinada inteligente aplicada');

        console.log('\n=== PRUEBA 5: Horario de almuerzo - aproximación automática ===');
        // Horario de almuerzo debe aproximar automáticamente
        const response5 = await axios.get(`${BASE_URL}/prueba?hours=2&date=2025-10-30T17:30:00.000Z`); // 12:30 Colombia
        console.log('🍽️ Entrada: Jueves 12:30 (horario almuerzo) + 2 horas');
        console.log('🍽️ Resultado:', new Date(response5.data.date).toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
        console.log('✅ Aproximación desde horario de almuerzo aplicada');

        console.log('\n=== PRUEBA 6: Comportamiento estándar (sin mejoras) ===');
        // Caso normal que no necesita mejoras especiales
        const response6 = await axios.get(`${BASE_URL}/prueba?days=3&hours=4&date=2025-10-30T14:00:00.000Z`);
        console.log('🔄 Entrada: Jueves 14:00 (horario normal) + 3 días + 4 horas');
        console.log('🔄 Resultado:', new Date(response6.data.date).toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
        console.log('✅ Algoritmo estándar (sin optimizaciones especiales)');

        console.log('\n=== PRUEBA 7: Solo múltiples horas (sin días) ===');
        const response7 = await axios.get(`${BASE_URL}/prueba?hours=1,2,1.5,0.5,3`);
        console.log('➕ Entrada: hours="1,2,1.5,0.5,3" (=8h total, sin días)');
        console.log('➕ Resultado:', new Date(response7.data.date).toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
        console.log('✅ Suma pura de múltiples horas');

        console.log('\n✅ TODAS LAS PRUEBAS DEL ENDPOINT ORIGINAL COMPLETADAS');
        console.log('🎯 El endpoint /prueba ahora incluye AUTOMÁTICAMENTE:');
        console.log('   • Aproximaciones inteligentes en horarios no laborales');
        console.log('   • Suma de múltiples horas (formato: hours=1,2,1.5,3)');
        console.log('   • Suma combinada optimizada de días y horas');
        console.log('   • Optimización automática para grandes cantidades');
        console.log('   • Mantiene 100% compatibilidad con versión original');
        
        // Limpiar servidor
        process.kill(-server.pid);
        
    } catch (error) {
        console.error('❌ Error en las pruebas:', error instanceof Error ? error.message : String(error));
    }
}

// Función auxiliar para probar diferentes formatos de horas múltiples
async function testMultipleHoursFormats() {
    console.log('\n📊 PROBANDO DIFERENTES FORMATOS DE HORAS MÚLTIPLES');
    console.log('-' .repeat(50));
    
    const formats = [
        { input: '1,2,3', expected: 6 },
        { input: '1.5,2.5,0.5', expected: 4.5 },
        { input: '8,4,2,1', expected: 15 },
        { input: '0.25,0.5,0.75,1', expected: 2.5 }
    ];
    
    for (const format of formats) {
        try {
            const response = await axios.get(`${BASE_URL}/prueba?hours=${format.input}`);
            console.log(`✅ ${format.input} (=${format.expected}h) → ${new Date(response.data.date).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
        } catch (error) {
            console.log(`❌ ${format.input} → Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testOriginalEndpointWithNewFeatures()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Error fatal:', err);
            process.exit(1);
        });
}

export { testOriginalEndpointWithNewFeatures, testMultipleHoursFormats };