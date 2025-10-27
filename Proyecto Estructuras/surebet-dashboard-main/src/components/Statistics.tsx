import { useState, useEffect } from "react";
import axios from "axios";
// Si el error persiste, prueba con:
// const axios = require("axios");
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "../supabaseClient"; // 👈 Importa Supabase

const Statistics = () => {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<any[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Cargar ligas desde localhost:3000
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const response = await axios.get("http://localhost:3000/");
        if (Array.isArray(response.data)) {
          setLeagues(response.data);
        } else {
          setLeagues([]);
          toast({ title: "Error", description: "La respuesta del backend no es un array de ligas", variant: "destructive" });
        }
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "No se pudieron cargar las ligas", variant: "destructive" });
      }
    };
    fetchLeagues();
  }, []);

  // 🔹 Al seleccionar liga, consultamos equipos de esa liga
  const handleLeagueSelect = async (league: any) => {
    setSelectedLeague(league.id);
    setLoading(true);

    const { data, error } = await supabase
      .from("equipos")
      .select("*")
      .eq("liga_id", league.id);

    if (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudieron cargar los equipos", variant: "destructive" });
    } else {
      setTeams(data);
      toast({ title: "Liga seleccionada", description: `Equipos de ${league.nombre} cargados` });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8 max-w-6xl mx-auto">
        <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Estadísticas Futbolísticas</h1>
          <p className="text-muted-foreground mt-1">
            Selecciona una liga para ver estadísticas detalladas
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto">
        {/* Ligas */}
        <Card className="mb-8 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-accent" />
              LIGAS
            </CardTitle>
            <CardDescription>
              Selecciona una liga europea para acceder a estadísticas detalladas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leagues.map((league) => (
                <Card
                  key={league.id}
                  className={`cursor-pointer transition-smooth hover:shadow-glow border ${
                    selectedLeague === league.id
                      ? "border-accent shadow-glow"
                      : "border-border hover:border-muted"
                  }`}
                  onClick={() => handleLeagueSelect(league)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{league.nombre}</CardTitle>
                    <CardDescription>Código: {league.codigo}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant={selectedLeague === league.id ? "secondary" : "outline"}
                      className="w-full mt-4"
                    >
                      {selectedLeague === league.id ? "Seleccionada" : "Seleccionar"}
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
              <CardTitle>
                Equipos de {leagues.find((l) => l.id === selectedLeague)?.nombre}
              </CardTitle>
              <CardDescription>
                Selecciona un equipo para ver sus estadísticas detalladas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando equipos...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {teams.map((team) => (
                    <Card
                      key={team.id}
                      className="border-border hover:border-muted transition-smooth"
                    >
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-center mb-3 text-sm">{team.nombre}</h3>
                        <Button
                          variant="betting"
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            toast({
                              title: "Estadísticas del equipo",
                              description: `Estadísticas de ${team.nombre} próximamente disponibles`,
                            })
                          }
                        >
                          Conocer estadísticas
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Statistics;
