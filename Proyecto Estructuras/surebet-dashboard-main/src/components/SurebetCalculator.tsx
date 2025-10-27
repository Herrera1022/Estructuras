import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calculator, TrendingUp, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SurebetCalculator = () => {
  const navigate = useNavigate();
  const [odds, setOdds] = useState<number[]>([0, 0]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [results, setResults] = useState<any>(null);

  const handleOddChange = (index: number, value: string) => {
    const newOdds = [...odds];
    newOdds[index] = parseFloat(value) || 0;
    setOdds(newOdds);
  };


  const calculateSurebet = () => {
    // Paso 1: Convertir cuotas a probabilidades implícitas
    const probabilities = odds.map(odd => odd > 0 ? 1 / odd : 0);
    
    // Paso 2: Comprobar si hay arbitraje
    const S = probabilities.reduce((sum, p) => sum + p, 0);
    const isSurebet = S < 1;
    
    if (!isSurebet) {
      setResults({
        isSurebet: false,
        message: "No existe oportunidad de surebet con estas cuotas"
      });
      return;
    }

    // Paso 3: Calcular las cantidades a apostar (redondeadas a enteros)
    const stakes = probabilities.map(p => Math.round((totalAmount * p) / S));
    
    // Paso 4: Calcular ganancia garantizada
    const returns = stakes.map((stake, i) => odds[i] * stake);
    const profit = returns[0] - totalAmount;
    const profitPercentage = ((1 / S) - 1) * 100;

    setResults({
      isSurebet: true,
      S,
      probabilities,
      stakes,
      returns: returns[0],
      profit,
      profitPercentage
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calculadora de Surebet</h1>
            <p className="text-muted-foreground">Calcula arbitraje en apuestas deportivas</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Configuración
            </CardTitle>
            <CardDescription>
              Ingresa las cuotas de diferentes casas de apuestas y el monto total a invertir
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="space-y-4">
              <Label>Cuotas (Odds)</Label>
              {odds.map((odd, index) => (
                <div key={index} className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Resultado {index + 1} {index === 0 ? "(Opción A)" : "(Opción B)"}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 2.10"
                    value={odd || ""}
                    onChange={(e) => handleOddChange(index, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Monto total a invertir (COP)</Label>
              <Input
                type="number"
                placeholder="Ej: 100000"
                value={totalAmount || ""}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <Button
              className="w-full"
              onClick={calculateSurebet}
              disabled={odds.some(o => o <= 0) || totalAmount <= 0}
            >
              Calcular Surebet
            </Button>
          </CardContent>
        </Card>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.isSurebet ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    ¡Surebet Detectada!
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Sin Oportunidad
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.isSurebet ? (
                <>
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      Ganancia garantizada: <strong>{results.profitPercentage.toFixed(2)}%</strong>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Distribución de apuestas:</h3>
                    {results.stakes.map((stake: number, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="font-medium">
                          Resultado {index + 1} (Cuota: {odds[index]})
                        </span>
                        <span className="font-bold text-lg">
                          ${Math.round(stake).toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-lg">
                      <span>Retorno garantizado:</span>
                      <span className="font-bold">
                        ${results.returns.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP
                      </span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span>Ganancia neta:</span>
                      <span className="font-bold text-green-600">
                        ${results.profit.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP
                      </span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span>Porcentaje de ganancia:</span>
                      <span className="font-bold text-green-600">
                        {results.profitPercentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    <p><strong>Índice S:</strong> {results.S.toFixed(4)} (menor a 1 = surebet válida)</p>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{results.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default SurebetCalculator;