import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Contracts from "./pages/Contracts";
import CreateContract from "./pages/CreateContract";
import ContractDetails from "./pages/ContractDetails";
import EditContract from "./pages/EditContract";
import ContractQuery from "./pages/ContractQuery";
import BillingAccounts from "./pages/BillingAccounts";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import { Layout } from "@/components/Layout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Index />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/contracts/new" element={<CreateContract />} />
          <Route path="/contracts/:id" element={<ContractDetails />} />
          <Route path="/contracts/:id/edit" element={<EditContract />} />
          <Route path="/contracts/query" element={<ContractQuery />} />
          <Route path="/billing" element={<BillingAccounts />} />
          <Route path="/users" element={<Users />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
