import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy, TrendingUp, Target, Activity, BarChart3, Calendar, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "../supabaseClient";

// 📊 Interfaz para las estadísticas del equipo
interface TeamStats {
  teamName: string;
  league: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  position: number;
  points: number;
  form: string[];
  lastMatches: Array<{
    opponent: string;
    result: string;
    score: string;
  }>;
  topScorer: {
    name: string;
    goals: number;
  } | null;
  homeStats: {
    wins: number;
    draws: number;
    losses: number;
  };
  awayStats: {
    wins: number;
    draws: number;
    losses: number;
  };
}

// 📊 Interfaz para la respuesta de la API
interface ApiResponse {
  success: boolean;
  data: TeamStats;
  message?: string;
}

const Statistics = () => {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<any[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [selectedLeagueCode, setSelectedLeagueCode] = useState<string>("");
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  // 🔹 Cargar ligas desde localhost:3000
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const response = await axios.get("http://localhost:3000/");
        if (Array.isArray(response.data)) {
          setLeagues(response.data);
        } else {
          setLeagues([]);
          toast({ 
            title: "Error", 
            description: "La respuesta del backend no es un array de ligas", 
            variant: "destructive" 
          });
        }
      } catch (error) {
        console.error(error);
        toast({ 
          title: "Error", 
          description: "No se pudieron cargar las ligas", 
          variant: "destructive" 
        });
      }
    };
    fetchLeagues();
  }, []);

  // 🔹 Al seleccionar liga, consultamos equipos de esa liga
  const handleLeagueSelect = async (league: any) => {
    setSelectedLeague(league.id);
    setSelectedLeagueCode(league.codigo);
    setLoading(true);
    setTeamStats(null);
    setSelectedTeam("");

    const { data, error } = await supabase
      .from("equipos")
      .select("*")
      .eq("liga_id", league.id);

    if (error) {
      console.error(error);
      toast({ 
        title: "Error", 
        description: "No se pudieron cargar los equipos", 
        variant: "destructive" 
      });
    } else {
      setTeams(data);
      toast({ 
        title: "Liga seleccionada", 
        description: `${data.length} equipos de ${league.nombre} cargados` 
      });
    }

    setLoading(false);
  };

  // 🔹 Obtener estadísticas de un equipo específico
  const handleTeamSelect = async (team: any) => {
    setSelectedTeam(team.nombre);
    setLoadingStats(true);
    
    try {
      console.log(`📊 Obteniendo stats de: ${team.nombre} en liga: ${selectedLeagueCode}`);
      
      const response = await axios.get<ApiResponse>(
        `http://localhost:3000/api/stats/team/${selectedLeagueCode}/${encodeURIComponent(team.nombre)}`
      );

      console.log('✅ Respuesta recibida:', response.data);

      if (response.data.success) {
        setTeamStats(response.data.data);
        
        // Hacer scroll hacia las estadísticas
        setTimeout(() => {
          const statsElement = document.getElementById('team-statistics');
          if (statsElement) {
            statsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        
        toast({
          title: "✅ Estadísticas cargadas",
          description: `Datos de ${team.nombre} obtenidos correctamente`,
        });
      } else {
        throw new Error('Respuesta sin éxito');
      }
    } catch (error: any) {
      console.error("❌ Error al obtener estadísticas:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
    } finally {
      setLoadingStats(false);
    }
  };

  // 🎨 Función para obtener el color según la forma del equipo
  const getFormColor = (result: string) => {
    switch (result) {
      case 'W': return 'bg-green-500';
      case 'D': return 'bg-yellow-500';
      case 'L': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getFormLabel = (result: string) => {
    switch (result) {
      case 'W': return 'Victoria';
      case 'D': return 'Empate';
      case 'L': return 'Derrota';
      default: return result;
    }
  };

  return (
    <div className="min-h-screen p-4 bg-background">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8 max-w-7xl mx-auto">
        <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Estadísticas Futbolísticas</h1>
          <p className="text-muted-foreground mt-1">
            Análisis detallado de ligas europeas y equipos
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto space-y-6">
        {/* Ligas */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-accent" />
              LIGAS DISPONIBLES
            </CardTitle>
            <CardDescription>
              Selecciona una liga europea para ver sus equipos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leagues.map((league) => (
                <Card
                  key={league.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                    selectedLeague === league.id
                      ? "border-accent shadow-glow bg-accent/5"
                      : "border-border hover:border-accent/50"
                  }`}
                  onClick={() => handleLeagueSelect(league)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{league.nombre}</CardTitle>
                    <CardDescription>Código: {league.codigo}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant={selectedLeague === league.id ? "default" : "outline"}
                      className="w-full"
                    >
                      {selectedLeague === league.id ? "✓ Seleccionada" : "Seleccionar"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Equipos */}
        {selectedLeague && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Equipos de {leagues.find((l) => l.id === selectedLeague)?.nombre}
              </CardTitle>
              <CardDescription>
                Haz clic en "Ver stats" para ver estadísticas detalladas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {teams.map((team) => (
                    <Card
                      key={team.id}
                      className={`border-2 hover:border-accent transition-all duration-300 ${
                        selectedTeam === team.nombre 
                          ? "border-accent shadow-glow bg-accent/5" 
                          : "border-border"
                      }`}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-center mb-3 text-sm line-clamp-2 min-h-[40px]">
                          {team.nombre}
                        </h3>
                        <Button
                          variant={selectedTeam === team.nombre ? "default" : "outline"}
                          size="sm"
                          className="w-full"
                          disabled={loadingStats && selectedTeam === team.nombre}
                          onClick={() => handleTeamSelect(team)}
                        >
                          {loadingStats && selectedTeam === team.nombre ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Cargando...
                            </>
                          ) : (
                            <>
                              <BarChart3 className="h-4 w-4 mr-1" />
                              Ver stats
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Estadísticas Detalladas del Equipo */}
        {teamStats && (
          <div id="team-statistics" className="space-y-6 scroll-mt-4">
            {/* Header del equipo */}
            <Card className="border-accent shadow-glow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{teamStats.teamName}</CardTitle>
                    <CardDescription className="text-lg mt-1">
                      {teamStats.league} • Posición: #{teamStats.position} • {teamStats.points} puntos
                    </CardDescription>
                  </div>
                  <Trophy className="h-12 w-12 text-accent" />
                </div>
              </CardHeader>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    Partidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{teamStats.matchesPlayed}</div>
                  <p className="text-xs text-muted-foreground mt-1">Jugados en total</p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Victorias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">{teamStats.wins}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((teamStats.wins / teamStats.matchesPlayed) * 100).toFixed(1)}% efectividad
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    Goles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{teamStats.goalsFor}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {teamStats.goalsAgainst} recibidos • Dif: {teamStats.goalDifference > 0 ? '+' : ''}{teamStats.goalDifference}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-accent" />
                    Puntos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">{teamStats.points}</div>
                  <p className="text-xs text-muted-foreground mt-1">Posición #{teamStats.position}</p>
                </CardContent>
              </Card>
            </div>

            {/* Forma y Local/Visitante */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Forma Reciente</CardTitle>
                  <CardDescription>Últimos 5 partidos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    {teamStats.form.map((result, index) => (
                      <div
                        key={index}
                        className={`${getFormColor(result)} w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold shadow-lg`}
                        title={getFormLabel(result)}
                      >
                        {result}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 mt-4">
                    <h4 className="font-semibold text-sm mb-3">Últimos resultados:</h4>
                    {teamStats.lastMatches.map((match, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <span className="text-sm">{match.opponent}</span>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                          match.result === 'W' ? 'bg-green-500/20 text-green-500' :
                          match.result === 'D' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {match.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Local vs Visitante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">🏠 Como Local</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-green-500/10 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-500">{teamStats.homeStats.wins}</div>
                        <div className="text-xs text-muted-foreground">Victorias</div>
                      </div>
                      <div className="bg-yellow-500/10 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-500">{teamStats.homeStats.draws}</div>
                        <div className="text-xs text-muted-foreground">Empates</div>
                      </div>
                      <div className="bg-red-500/10 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-500">{teamStats.homeStats.losses}</div>
                        <div className="text-xs text-muted-foreground">Derrotas</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">✈️ Como Visitante</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-green-500/10 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-500">{teamStats.awayStats.wins}</div>
                        <div className="text-xs text-muted-foreground">Victorias</div>
                      </div>
                      <div className="bg-yellow-500/10 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-500">{teamStats.awayStats.draws}</div>
                        <div className="text-xs text-muted-foreground">Empates</div>
                      </div>
                      <div className="bg-red-500/10 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-500">{teamStats.awayStats.losses}</div>
                        <div className="text-xs text-muted-foreground">Derrotas</div>
                      </div>
                    </div>
                  </div>

                  {teamStats.topScorer && (
                    <div className="bg-accent/10 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 text-sm">⚽ Máximo Goleador</h4>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{teamStats.topScorer.name}</span>
                        <span className="text-2xl font-bold text-accent">{teamStats.topScorer.goals}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Resumen Global */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Resumen General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Victorias</div>
                    <div className="text-2xl font-bold text-green-500">{teamStats.wins}</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Empates</div>
                    <div className="text-2xl font-bold text-yellow-500">{teamStats.draws}</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Derrotas</div>
                    <div className="text-2xl font-bold text-red-500">{teamStats.losses}</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Promedio Goles</div>
                    <div className="text-2xl font-bold text-accent">
                      {(teamStats.goalsFor / teamStats.matchesPlayed).toFixed(1)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Statistics;