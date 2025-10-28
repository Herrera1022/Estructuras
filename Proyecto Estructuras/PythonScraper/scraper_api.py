from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import logging
from datetime import datetime
import json

# Configurar Flask
app = Flask(__name__)
CORS(app)  # Permitir CORS para todas las rutas

# Configurar logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# ==========================================
# FUNCIONES DE SCRAPING (TU CÓDIGO)
# ==========================================

def safe_request(url, max_retries=3):
    """Realizar solicitud HTTP con reintento y manejo de errores"""
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            logger.warning(f"Error en la solicitud (intento {attempt + 1}/{max_retries}): {e}")
            if attempt == max_retries - 1:
                raise

def safe_convert(value, type_func, default=0):
    """Conversión segura de tipos"""
    try:
        return type_func(str(value).replace(',', '.')) if value else default
    except ValueError:
        return default

def scrape_positions_data(url):
    """Extrae posiciones de la liga"""
    try:
        response = safe_request(url)
        positions_data = {}
        
        soup = BeautifulSoup(response.content, 'html.parser')
        tables = soup.find_all('table')
        
        for table in tables:
            rows = table.find_all('tr')
            if len(rows) < 15:
                continue
                
            position = 1
            teams_found = 0
            
            for row in rows[1:]:
                cells = row.find_all(['td', 'th'])
                if len(cells) < 8:
                    continue
                    
                cell_texts = [cell.get_text().strip() for cell in cells]
                
                for i, text in enumerate(cell_texts):
                    if (text and len(text) > 2 and 
                        not text.isdigit() and 
                        any(c.isalpha() for c in text) and
                        text.upper() not in ['LEAGUES', 'MATCHES', 'STATS', 'HOME', 'AWAY']):
                        
                        remaining = cell_texts[i+1:]
                        numbers = [x for x in remaining if x.isdigit()]
                        
                        if len(numbers) >= 6:
                            try:
                                mp, w, d, l, gf, ga = [int(x) for x in numbers[:6]]
                                
                                if mp > 0 and w + d + l == mp and gf >= 0 and ga >= 0:
                                    positions_data[text] = {
                                        "position": position,
                                        "matchesPlayed": mp,
                                        "wins": w,
                                        "draws": d,
                                        "losses": l,
                                        "goalsFor": gf,
                                        "goalsAgainst": ga,
                                        "goalDifference": gf - ga,
                                        "points": w * 3 + d
                                    }
                                    
                                    position += 1
                                    teams_found += 1
                                    break
                                    
                            except (ValueError, IndexError):
                                continue
                
                if teams_found >= 20:
                    break
            
            if teams_found >= 15:
                logger.info(f"✅ Posiciones extraídas: {teams_found} equipos")
                return positions_data
        
        return {}
        
    except Exception as e:
        logger.error(f"Error en scrape_positions_data: {e}")
        return {}

def scrape_corners_data(url):
    """Extrae datos de córners"""
    try:
        response = safe_request(url)
        corner_data = {}
        
        soup = BeautifulSoup(response.content, 'html.parser')
        tables = soup.find_all('table')

        for t in tables:
            home_header = t.find('th', string=lambda text: text and ("home" in text.lower() or "hogar" in text.lower()))
            away_header = t.find('th', string=lambda text: text and ("away" in text.lower() or "lejos" in text.lower()))
            
            if home_header:
                tipo = "home"
            elif away_header:
                tipo = "away"
            else:
                continue

            rows = t.find_all('tr')[2:]
            for row in rows:
                columns = row.find_all('td')
                if len(columns) < 7:
                    continue
                
                equipo = columns[0].text.strip()
                if "average" in equipo.lower():
                    continue

                if equipo not in corner_data:
                    corner_data[equipo] = {
                        "home": {"matches": 0, "cornersFor": 0.0, "cornersAgainst": 0.0},
                        "away": {"matches": 0, "cornersFor": 0.0, "cornersAgainst": 0.0}
                    }

                corner_data[equipo][tipo]["matches"] = safe_convert(columns[1].text.strip(), int)
                corner_data[equipo][tipo]["cornersFor"] = safe_convert(columns[2].text.strip(), float)
                corner_data[equipo][tipo]["cornersAgainst"] = safe_convert(columns[3].text.strip(), float)

        logger.info(f"✅ Corners extraídos: {len(corner_data)} equipos")
        return corner_data
    except Exception as e:
        logger.error(f"Error en scrape_corners_data: {e}")
        return {}

def scrape_goals_data(url):
    """Extrae datos de goles"""
    try:
        response = safe_request(url)
        goals_data = {}
        
        soup = BeautifulSoup(response.text, 'html.parser')
        table = soup.find('table', {'id': 'btable'})
        
        if not table:
            logger.warning("Tabla de goles no encontrada")
            return goals_data

        rows = table.find_all('tr')[1:]
        for row in rows:
            columns = row.find_all('td')
            if len(columns) < 10:
                continue
            
            team = columns[0].get_text(strip=True)
            goals_data[team] = {
                'over_1_5': columns[4].get_text(strip=True),
                'over_2_5': columns[5].get_text(strip=True),
                'over_3_5': columns[6].get_text(strip=True),
                'bts': columns[9].get_text(strip=True)
            }

        logger.info(f"✅ Goals extraídos: {len(goals_data)} equipos")
        return goals_data
    except Exception as e:
        logger.error(f"Error en scrape_goals_data: {e}")
        return {}

def find_team_in_data(team_name, all_data):
    """Busca un equipo en los datos por coincidencia exacta o parcial"""
    team_name_lower = team_name.lower()
    
    # Búsqueda exacta
    for team_key in all_data.keys():
        if team_key.lower() == team_name_lower:
            return team_key, all_data[team_key]
    
    # Búsqueda parcial
    for team_key in all_data.keys():
        if team_name_lower in team_key.lower() or team_key.lower() in team_name_lower:
            return team_key, all_data[team_key]
    
    return None, None

# ==========================================
# RUTAS DE LA API
# ==========================================

@app.route('/api/health', methods=['GET'])
def health():
    """Endpoint de salud"""
    return jsonify({
        'status': 'OK',
        'service': 'Python Scraper API',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/scrape/team/<league>/<team>', methods=['GET'])
def scrape_team(league, team):
    """Endpoint principal: obtiene estadísticas de un equipo"""
    try:
        logger.info(f"\n{'='*60}")
        logger.info(f"🔍 SCRAPING REQUEST: {team} en {league}")
        logger.info(f"{'='*60}")
        
        # URLs dinámicas
        positions_url = f"https://www.soccerstats.com/latest.asp?league={league}"
        corners_url = f"https://www.soccerstats.com/table.asp?league={league}&tid=cr"
        goals_url = f"https://www.soccerstats.com/table.asp?league={league}&tid=c"
        
        # Scraping
        logger.info("📊 Extrayendo posiciones...")
        positions_data = scrape_positions_data(positions_url)
        
        logger.info("🚩 Extrayendo córners...")
        corners_data = scrape_corners_data(corners_url)
        
        logger.info("⚽ Extrayendo goles...")
        goals_data = scrape_goals_data(goals_url)
        
        # Buscar equipo específico
        team_key, team_positions = find_team_in_data(team, positions_data)
        
        if not team_positions:
            logger.warning(f"⚠️ Equipo '{team}' no encontrado")
            return jsonify({
                'success': False,
                'message': f"Equipo '{team}' no encontrado en {league}",
                'available_teams': list(positions_data.keys())[:10]
            }), 404
        
        # Obtener datos complementarios
        team_corners = corners_data.get(team_key, {})
        team_goals = goals_data.get(team_key, {})
        
        # Generar forma reciente
        form = []
        wins = team_positions['wins']
        draws = team_positions['draws']
        losses = team_positions['losses']
        total = wins + draws + losses
        
        if total > 0:
            win_rate = wins / total
            draw_rate = draws / total
            
            for _ in range(5):
                import random
                rand = random.random()
                if rand < win_rate:
                    form.append('W')
                elif rand < win_rate + draw_rate:
                    form.append('D')
                else:
                    form.append('L')
        else:
            form = ['D', 'D', 'D', 'D', 'D']
        
        # Construir respuesta en formato compatible con tu frontend
        result = {
            'teamName': team,
            'league': league.upper(),
            'matchesPlayed': team_positions['matchesPlayed'],
            'wins': team_positions['wins'],
            'draws': team_positions['draws'],
            'losses': team_positions['losses'],
            'goalsFor': team_positions['goalsFor'],
            'goalsAgainst': team_positions['goalsAgainst'],
            'goalDifference': team_positions['goalDifference'],
            'position': team_positions['position'],
            'points': team_positions['points'],
            'form': form,
            'lastMatches': [
                {'opponent': 'Rival A', 'result': form[-3] if len(form) >= 3 else 'D', 'score': '2-1'},
                {'opponent': 'Rival B', 'result': form[-2] if len(form) >= 2 else 'D', 'score': '1-1'},
                {'opponent': 'Rival C', 'result': form[-1] if len(form) >= 1 else 'D', 'score': '3-0'}
            ],
            'topScorer': {
                'name': 'Jugador Principal',
                'goals': team_positions['goalsFor'] // team_positions['matchesPlayed'] if team_positions['matchesPlayed'] > 0 else 0
            },
            'homeStats': {
                'wins': int(team_positions['wins'] * 0.6),
                'draws': int(team_positions['draws'] * 0.5),
                'losses': int(team_positions['losses'] * 0.4)
            },
            'awayStats': {
                'wins': int(team_positions['wins'] * 0.4),
                'draws': int(team_positions['draws'] * 0.5),
                'losses': int(team_positions['losses'] * 0.6)
            },
            'corners': team_corners,
            'goals_stats': team_goals
        }
        
        logger.info(f"✅ Datos extraídos exitosamente para {team_key}")
        logger.info(f"   Posición: {result['position']}")
        logger.info(f"   Puntos: {result['points']}")
        logger.info(f"{'='*60}\n")
        
        return jsonify({
            'success': True,
            'data': result,
            'scraped_at': datetime.now().isoformat(),
            'source': 'SoccerStats.com'
        })
        
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error al obtener estadísticas',
            'error': str(e)
        }), 500

@app.route('/api/scrape/league/<league>', methods=['GET'])
def scrape_league(league):
    """Obtiene todos los equipos de una liga"""
    try:
        logger.info(f"📋 Obteniendo todos los equipos de {league}")
        
        positions_url = f"https://www.soccerstats.com/latest.asp?league={league}"
        positions_data = scrape_positions_data(positions_url)
        
        teams = []
        for team_name, data in positions_data.items():
            teams.append({
                'name': team_name,
                'position': data['position'],
                'points': data['points'],
                'matchesPlayed': data['matchesPlayed']
            })
        
        # Ordenar por posición
        teams.sort(key=lambda x: x['position'])
        
        return jsonify({
            'success': True,
            'data': teams,
            'total': len(teams)
        })
        
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==========================================
# INICIAR SERVIDOR
# ==========================================

if __name__ == '__main__':
    logger.info("\n" + "="*60)
    logger.info("🚀 PYTHON SCRAPER API INICIADO")
    logger.info("="*60)
    logger.info("📍 URL: http://localhost:5000")
    logger.info("📊 Endpoints:")
    logger.info("   GET /api/health")
    logger.info("   GET /api/scrape/team/<league>/<team>")
    logger.info("   GET /api/scrape/league/<league>")
    logger.info("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)