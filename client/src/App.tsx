import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ContentManager from "@/pages/ContentManager";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/not-found";
import PDFAnalysis from "@/pages/PDFAnalysis";
import Admin from "@/pages/Admin";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/products" component={Products} />
          <Route path="/content-manager" component={ContentManager} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/pdf-analysis" component={PDFAnalysis} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;