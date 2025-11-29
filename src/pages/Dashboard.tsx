import { AppNavbar } from "@/components/AppNavbar";
import { RoadmapDisplay } from "@/components/RoadmapDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const activeRoadmap = useQuery(api.roadmaps.getActiveRoadmap);
  const goals = useQuery(api.goals.getGoals);
  const addGoal = useMutation(api.goals.addGoal);
  const toggleGoal = useMutation(api.goals.toggleGoal);
  const deleteGoal = useMutation(api.goals.deleteGoal);

  const [newGoal, setNewGoal] = useState("");

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    
    await addGoal({ title: newGoal });
    setNewGoal("");
    toast.success("Goal added");
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name || "Explorer"}!</h1>
          <p className="text-muted-foreground mt-2">Here's what's happening with your career journey.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Roadmap */}
          <div className="lg:col-span-2 space-y-8">
            {activeRoadmap ? (
              <RoadmapDisplay 
                roadmapId={activeRoadmap._id}
                title={activeRoadmap.title}
                description={activeRoadmap.description}
                steps={activeRoadmap.steps}
              />
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Plus className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Active Roadmap</h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Take our assessment to discover your ideal career path and generate a personalized roadmap.
                  </p>
                  <Button onClick={() => navigate("/assessment")}>
                    Start Assessment
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Goals */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddGoal} className="flex gap-2 mb-6">
                  <Input 
                    placeholder="Add a new goal..." 
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                  />
                  <Button type="submit" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>

                <div className="space-y-3">
                  {goals?.map((goal) => (
                    <div key={goal._id} className="flex items-center gap-3 group">
                      <input 
                        type="checkbox" 
                        checked={goal.isCompleted}
                        onChange={() => toggleGoal({ goalId: goal._id })}
                        className="h-4 w-4 rounded border-primary text-primary focus:ring-primary cursor-pointer"
                      />
                      <span className={`flex-1 text-sm ${goal.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {goal.title}
                      </span>
                      <button 
                        onClick={() => deleteGoal({ goalId: goal._id })}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 p-1 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {goals?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No goals yet. Add one to stay focused!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
