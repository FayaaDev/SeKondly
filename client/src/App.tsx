import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import AdminPanel from "@/pages/AdminPanel";
import AdminLogin from "@/pages/AdminLogin";
import UserProfile from "@/pages/UserProfile";
import PublicProfile from "@/pages/PublicProfile";
import EditProfile from "@/pages/EditProfile";
import NotificationSettings from "@/pages/NotificationSettings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin-panel" component={AdminPanel} />
      <Route path="/profile/:userId" component={UserProfile} />
      <Route path="/user/:id" component={PublicProfile} />
      <Route path="/edit-profile" component={EditProfile} />
      <Route path="/notification-settings" component={NotificationSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;