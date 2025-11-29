import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Compass, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router";

export function AppNavbar() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => navigate("/dashboard")}
        >
          <div className="bg-primary/10 p-2 rounded-lg">
            <Compass className="h-6 w-6 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">Career Compass</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{user?.name || user?.email || "User"}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}
