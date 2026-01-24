import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DevUserProvider } from "@/hooks/useDevUser";
import { SecurityProvider } from "@/components/SecurityProvider";
import AdminBypassGate from "@/components/AdminBypassGate";
import DevModeIndicator from "@/components/DevModeIndicator";
import Portal from "./pages/Portal";
import CVPage from "./pages/CVPage";
import Auth from "./pages/Auth";
import MeusCVs from "./pages/MeusCVs";
import MinhasCartas from "./pages/MinhasCartas";
import StagePage from "./pages/StagePage";
import Stage1Page from "./pages/Stage1Page";
import Stage3Page from "./pages/Stage3Page";
import Stage4Page from "./pages/Stage4Page";
import Stage5Page from "./pages/Stage5Page";
import Stage6Page from "./pages/Stage6Page";
import Stage7Page from "./pages/Stage7Page";
import Admin from "./pages/Admin";
import ActivatePlatform from "./pages/ActivatePlatform";
import SupportPage from "./pages/SupportPage";
import SettingsPage from "./pages/SettingsPage";
import GiftPage from "./pages/GiftPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DevUserProvider>
        <SecurityProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Portal />} />
                <Route path="/cv" element={<CVPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/ativar" element={<AdminBypassGate><ActivatePlatform /></AdminBypassGate>} />
                <Route path="/meus-cvs" element={<MeusCVs />} />
                <Route path="/minhas-cartas" element={<MinhasCartas />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/suporte" element={<SupportPage />} />
                <Route path="/configuracoes" element={<SettingsPage />} />
                <Route path="/presente" element={<AdminBypassGate><GiftPage /></AdminBypassGate>} />
                <Route path="/etapa/1" element={<Stage1Page />} />
                <Route path="/etapa/3" element={<Stage3Page />} />
                <Route path="/etapa/4" element={<Stage4Page />} />
                <Route path="/etapa/5" element={<Stage5Page />} />
                <Route path="/etapa/6" element={<Stage6Page />} />
                <Route path="/etapa/7" element={<Stage7Page />} />
                <Route path="/etapa/:stageNumber" element={<StagePage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              {/* Dev mode indicator - only visible to dev users */}
              <DevModeIndicator />
            </BrowserRouter>
          </TooltipProvider>
        </SecurityProvider>
      </DevUserProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
