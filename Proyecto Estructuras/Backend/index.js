import express from "express";
import sql from './conection.js';
import cors from 'cors';
import morgan from 'morgan';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;
const PYTHON_API_URL = 'http://localhost:5000';

// Middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Import de rutas existentes
import authRoute from './routes/routes.js';

// ==========================================
// MAPEO DE LIGAS
// ==========================================
const LEAGUE_MAPPING = {
  'laliga': 'spain',
  'premier': 'england',
  'ligue1': 'france',
  'bundesliga': 'germany',
  'seriea': 'italy'
};

// ==========================================
// RUTA PRINCIPAL DE ESTADÍSTICAS
// ==========================================
app.get('/api/stats/team/:league/:team', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { league, team } = req.params;
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 PETICIÓN RECIBIDA`);
    console.log(`   Liga: ${league}`);
    console.log(`   Equipo: ${team}`);
    console.log(`${'='.repeat(70)}`);
    
    // Validar parámetros
    if (!league || !team) {
      console.log('❌ Parámetros faltantes');
      return res.status(400).json({
        success: false,
        message: 'Liga y equipo son requeridos'
      });
    }
    
    // Convertir código de liga
    const soccerStatsLeague = LEAGUE_MAPPING[league.toLowerCase()] || league;
    console.log(`🔄 Liga convertida: ${league} → ${soccerStatsLeague}`);
    
    // Construir URL para Python API
    const pythonUrl = `${PYTHON_API_URL}/api/scrape/team/${soccerStatsLeague}/${encodeURIComponent(team)}`;
    console.log(`📡 Consultando Python API: ${pythonUrl}`);
    
    // Hacer petición al microservicio Python
    const response = await axios.get(pythonUrl, {
      timeout: 35000, // 35 segundos para el scraping
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`✅ Respuesta recibida de Python API`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.data.success}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error en Python API');
    }
    
    const stats = response.data.data;
    const duration = Date.now() - startTime;
    
    console.log(`📊 Datos obtenidos:`);
    console.log(`   Equipo: ${stats.teamName}`);
    console.log(`   Posición: ${stats.position}`);
    console.log(`   Puntos: ${stats.points}`);
    console.log(`   Partidos: ${stats.matchesPlayed}`);
    console.log(`⏱️  Duración total: ${duration}ms`);
    console.log(`${'='.repeat(70)}\n`);
    
    // Enviar respuesta al frontend
    res.json({
      success: true,
      data: stats,
      duration: `${duration}ms`,
      source: 'Python Scraper (SoccerStats.com)',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`\n${'='.repeat(70)}`);
    console.error(`❌ ERROR`);
    console.error(`   Mensaje: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`   Causa: El microservicio Python no está disponible`);
      console.error(`   Solución: Asegúrate de que Python esté corriendo en puerto 5000`);
      console.error(`   Comando: python scraper_api.py`);
    } else if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    } else {
      console.error(`   Stack:`, error.stack);
    }
    
    console.error(`⏱️  Duración: ${duration}ms`);
    console.error(`${'='.repeat(70)}\n`);
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Error al obtener estadísticas del equipo',
      error: error.message,
      duration: `${duration}ms`,
      details: error.code === 'ECONNREFUSED' 
        ? 'Microservicio Python no disponible. Ejecuta: python scraper_api.py'
        : error.response?.data?.message || 'Error desconocido'
    });
  }
});

// ==========================================
// RUTA TABLA DE POSICIONES
// ==========================================
app.get('/api/stats/league/:league/standings', async (req, res) => {
  try {
    const { league } = req.params;
    
    console.log(`📋 Obteniendo tabla de: ${league}`);
    
    if (!league) {
      return res.status(400).json({
        success: false,
        message: 'Liga no especificada'
      });
    }
    
    const soccerStatsLeague = LEAGUE_MAPPING[league.toLowerCase()] || league;
    const pythonUrl = `${PYTHON_API_URL}/api/scrape/league/${soccerStatsLeague}`;
    
    console.log(`📡 Consultando: ${pythonUrl}`);
    
    const response = await axios.get(pythonUrl, {
      timeout: 35000
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error en Python API');
    }
    
    console.log(`✅ Tabla obtenida: ${response.data.data.length} equipos`);
    
    res.json({
      success: true,
      data: response.data.data
    });
    
  } catch (error) {
    console.error(`❌ Error obteniendo tabla: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener tabla de posiciones',
      error: error.message
    });
  }
});

// ==========================================
// RUTA DE SALUD
// ==========================================
app.get('/api/health', async (req, res) => {
  let pythonHealth = { status: 'UNKNOWN' };
  
  try {
    const response = await axios.get(`${PYTHON_API_URL}/api/health`, {
      timeout: 5000
    });
    pythonHealth = response.data;
  } catch (error) {
    pythonHealth = {
      status: 'ERROR',
      error: error.message,
      message: 'Microservicio Python no disponible'
    };
  }
  
  res.json({ 
    status: 'OK',
    service: 'Node.js Backend',
    pythonScraper: pythonHealth,
    pythonUrl: PYTHON_API_URL,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// RUTAS EXISTENTES
// ==========================================
app.use('/', authRoute);

// ==========================================
// MANEJO DE ERRORES
// ==========================================

// 404
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({ 
    success: false, 
    message: 'Ruta no encontrada',
    path: req.url
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, async () => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 NODE.JS BACKEND CON PYTHON SCRAPER`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📍 Backend URL: http://localhost:${PORT}`);
  console.log(`🐍 Python Scraper: ${PYTHON_API_URL}`);
  console.log(`📊 Ejemplo: http://localhost:${PORT}/api/stats/team/laliga/Barcelona`);
  console.log(`${'='.repeat(70)}\n`);
  
  // Verificar PostgreSQL
  try {
    const result = await sql`SELECT NOW()`;
    console.log('✅ PostgreSQL: Conectado');
    console.log(`   Timestamp: ${result[0].now}`);
  } catch (err) {
    console.error('❌ PostgreSQL: Error de conexión');
    console.error(`   ${err.message}`);
  }
  
  // Verificar Python API
  try {
    const response = await axios.get(`${PYTHON_API_URL}/api/health`, {
      timeout: 5000
    });
    
    if (response.data.status === 'OK') {
      console.log('✅ Python Scraper: Conectado');
      console.log(`   Service: ${response.data.service}`);
    } else {
      console.log('⚠️  Python Scraper: Respuesta inesperada');
    }
  } catch (error) {
    console.error('❌ Python Scraper: NO DISPONIBLE');
    console.error(`   Error: ${error.message}`);
    console.error(`\n   ⚡ SOLUCIÓN:`);
    console.error(`   1. Abre otra terminal`);
    console.error(`   2. cd PythonScraper`);
    console.error(`   3. venv\\Scripts\\activate`);
    console.error(`   4. python scraper_api.py\n`);
  }
  
  console.log(`${'='.repeat(70)}`);
  console.log(`⏳ Esperando peticiones...\n`);
});

export default app;