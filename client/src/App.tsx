import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { CartProvider } from "./context/CartContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import SalonProfile from "./pages/SalonProfile";
import QueueSummary from "./pages/QueueSummary";
import Queue from "./pages/Queue";
import Dashboard from "./pages/Dashboard";
import NotFound from "@/pages/not-found";
import LoadingScreen from "./components/LoadingScreen";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/salon/:id" component={SalonProfile} />
      <Route path="/queue-summary" component={QueueSummary} />
      <Route path="/queue" component={Queue} />
      <Route path="/dashboard" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading ? <LoadingScreen onComplete={() => setIsLoading(false)} /> : (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <WebSocketProvider>
                <CartProvider>
                  <Layout>
                    <Toaster />
                    <Router />
                  </Layout>
                </CartProvider>
              </WebSocketProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      )}
    </>
  );
}

export default App;