import axios from 'axios';
import * as cheerio from 'cheerio';

class ScraperService {
  constructor() {
    this.baseUrls = {
      'laliga': 'https://www.flashscore.com/football/spain/laliga/',
      'ligue1': 'https://www.flashscore.com/football/france/ligue-1/',
      'premier': 'https://www.flashscore.com/football/england/premier-league/',
      'bundesliga': 'https://www.flashscore.com/football/germany/bundesliga/',
      'seriea': 'https://www.flashscore.com/football/italy/serie-a/'
    };
  }

  async getTeamStats(league, teamName) {
    console.log(`🔍 Scraping stats para: ${teamName} en ${league}`);
    
    try {
      // Por ahora retornamos datos mock
      // Más adelante implementaremos el scraping real
      return this.getMockData(teamName, league);
      
    } catch (error) {
      console.error('❌ Error en scraping:', error.message);
      return this.getMockData(teamName, league);
    }
  }

  async getLeagueStandings(league) {
    console.log(`🔍 Obteniendo tabla de: ${league}`);
    
    try {
      return this.getMockStandings(league);
    } catch (error) {
      console.error('❌ Error obteniendo tabla:', error.message);
      return this.getMockStandings(league);
    }
  }

  // Datos de ejemplo para pruebas
  getMockData(teamName, league) {
    const mockTeams = {
      'Barcelona': {
        matchesPlayed: 15,
        wins: 11,
        draws: 2,
        losses: 2,
        goalsFor: 38,
        goalsAgainst: 15,
        position: 1,
        points: 35,
        form: ['W', 'W', 'D', 'W', 'L'],
        topScorer: { name: 'Robert Lewandowski', goals: 14 },
        homeStats: { wins: 7, draws: 0, losses: 1 },
        awayStats: { wins: 4, draws: 2, losses: 1 }
      },
      'Real Madrid': {
        matchesPlayed: 15,
        wins: 10,
        draws: 3,
        losses: 2,
        goalsFor: 32,
        goalsAgainst: 14,
        position: 2,
        points: 33,
        form: ['W', 'D', 'W', 'W', 'L'],
        topScorer: { name: 'Vinícius Jr', goals: 11 },
        homeStats: { wins: 6, draws: 1, losses: 0 },
        awayStats: { wins: 4, draws: 2, losses: 2 }
      },
      'Atlético de Madrid': {
        matchesPlayed: 15,
        wins: 9,
        draws: 4,
        losses: 2,
        goalsFor: 28,
        goalsAgainst: 16,
        position: 3,
        points: 31,
        form: ['D', 'W', 'W', 'D', 'W'],
        topScorer: { name: 'Antoine Griezmann', goals: 10 },
        homeStats: { wins: 6, draws: 2, losses: 0 },
        awayStats: { wins: 3, draws: 2, losses: 2 }
      },
      'Sevilla': {
        matchesPlayed: 15,
        wins: 8,
        draws: 3,
        losses: 4,
        goalsFor: 25,
        goalsAgainst: 18,
        position: 5,
        points: 27,
        form: ['W', 'L', 'W', 'D', 'W'],
        topScorer: { name: 'Youssef En-Nesyri', goals: 8 },
        homeStats: { wins: 5, draws: 1, losses: 2 },
        awayStats: { wins: 3, draws: 2, losses: 2 }
      }
    };

    const baseData = mockTeams[teamName] || mockTeams['Barcelona'];

    return {
      teamName: teamName,
      league: league.toUpperCase(),
      matchesPlayed: baseData.matchesPlayed,
      wins: baseData.wins,
      draws: baseData.draws,
      losses: baseData.losses,
      goalsFor: baseData.goalsFor,
      goalsAgainst: baseData.goalsAgainst,
      goalDifference: baseData.goalsFor - baseData.goalsAgainst,
      position: baseData.position,
      points: baseData.points,
      form: baseData.form,
      lastMatches: [
        { opponent: 'Atlético Madrid', result: 'W', score: '2-1' },
        { opponent: 'Sevilla', result: 'W', score: '3-0' },
        { opponent: 'Valencia', result: 'D', score: '1-1' }
      ],
      topScorer: baseData.topScorer,
      homeStats: baseData.homeStats,
      awayStats: baseData.awayStats
    };
  }

  getMockStandings(league) {
    return [
      { position: 1, team: 'Barcelona', points: 35, played: 15 },
      { position: 2, team: 'Real Madrid', points: 33, played: 15 },
      { position: 3, team: 'Atlético Madrid', points: 30, played: 15 },
      { position: 4, team: 'Athletic Club', points: 28, played: 15 },
      { position: 5, team: 'Sevilla', points: 27, played: 15 }
    ];
  }
}

export default new ScraperService();