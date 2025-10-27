import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Calculator, TrendingUp, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("betmaster_user") || "Usuario";

  const handleLogout = () => {
    localStorage.removeItem("betmaster_user");
    toast({
      title: "Sesión cerrada",
      description: "Has salido exitosamente",
    });
    navigate("/");
  };

  const navigationButtons = [
    {
      title: "Surebets",
      description: "Encuentra oportunidades de apuestas seguras",
      icon: TrendingUp,
      onClick: () => toast({ title: "Próximamente", description: "Función en desarrollo" }),
      variant: "secondary" as const,
    },
    {
      title: "Estadísticas Futbolísticas",
      description: "Análisis detallado de ligas europeas",
      icon: BarChart3,
      onClick: () => navigate("/statistics"),
      variant: "default" as const,
    },
    {
      title: "Calculadora de Surebet",
      description: "Calcula distribución óptima de apuestas",
      icon: Calculator,
      onClick: () => navigate("/surebet-calculator"),
      variant: "betting" as const,
    },
  ];

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">
            Bienvenido a <span className="gradient-accent bg-clip-text text-transparent">BetMaster</span>
          </h1>
          <p className="text-muted-foreground mt-1">Hola {username}, gestiona tus análisis deportivos</p>
        </div>
        
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Salir
        </Button>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationButtons.map((button, index) => {
            const IconComponent = button.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-glow transition-smooth cursor-pointer border-border"
                onClick={button.onClick}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <IconComponent className="h-6 w-6 text-accent" />
                    </div>
                    <CardTitle className="text-lg">{button.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {button.description}
                  </CardDescription>
                  <Button variant={button.variant} className="w-full">
                    Acceder
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ligas Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">5</div>
              <p className="text-xs text-muted-foreground">Ligas europeas principales</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Herramientas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">3</div>
              <p className="text-xs text-muted-foreground">Módulos de análisis</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">Activo</div>
              <p className="text-xs text-muted-foreground">Sistema operativo</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;