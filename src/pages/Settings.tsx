import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Settings = () => {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("railsync_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("railsync_theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-16 pt-20 md:pt-8 px-4 md:px-8 pb-8">
        <div className="border-b border-border pb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage application preferences</p>
        </div>

        <div className="mt-8 max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <Label className="text-base">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Toggle between light and dark theme</p>
                  </div>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="font-display text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-base">Sign Out</Label>
                  <p className="text-sm text-muted-foreground">
                    {employee ? `Signed in as ${employee.name}` : "End your current session"}
                  </p>
                </div>
                <Button variant="destructive" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
