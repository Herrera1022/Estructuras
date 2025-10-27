import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Statistics from "./components/Statistics"; // 👈 aquí conectamos ligas
import ProtectedRoute from "./components/ProtectedRoute";
import SurebetCalculator from "./components/SurebetCalculator";
import NotFound from "./pages/NotFound";
import { supabase } from "./supabaseClient"; 

const queryClient = new QueryClient();

const App = () => {
  const [connectionMessage, setConnectionMessage] = useState("Checking Supabase...");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // 👇 puedes dejar esto solo como prueba con usuarios
        const { data, error } = await supabase.from("usuarios").select("*");

        if (error) {
          console.error("❌ Supabase error:", error.message);
          setConnectionMessage("❌ Error connecting to Supabase: " + error.message);
        } else {
          console.log("✅ Supabase connected, rows:", data.length);
          setConnectionMessage("✅ Supabase connected! Rows in usuarios: " + data.length);
        }
      } catch (err) {
        setConnectionMessage("⚠️ Unexpected error: " + (err as Error).message);
      }
    };

    checkConnection();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistics"
              element={
                <ProtectedRoute>
                  <Statistics /> {/* 👈 aquí ya irá la consulta a ligas */}
                </ProtectedRoute>
              }
            />
            <Route 
              path="/surebet-calculator" 
              element={
                <ProtectedRoute>
                  <SurebetCalculator />
                </ProtectedRoute>
              } 
            />
            <Route path="/check-connection" element={<p>{connectionMessage}</p>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
