import { AppNavbar } from "@/components/AppNavbar";
import { RoadmapDisplay } from "@/components/RoadmapDisplay";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { CAREER_TEMPLATES } from "@/lib/career-data";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
  const createRoadmap = useMutation(api.roadmaps.createRoadmap);

  const [newGoal, setNewGoal] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [generatingCareer, setGeneratingCareer] = useState<string | null>(null);

  const templateEntries = useMemo(
    () => Object.entries(CAREER_TEMPLATES),
    [],
  );

  const allSkills = useMemo(() => {
    const uniqueSkills = new Set<string>();
    templateEntries.forEach(([, template]) => {
      (template.skills ?? []).forEach((skill) => uniqueSkills.add(skill));
    });
    return Array.from(uniqueSkills).sort();
  }, [templateEntries]);

  const filteredTemplates = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return templateEntries.filter(([, template]) => {
      const matchesSearch =
        !search ||
        template.title.toLowerCase().includes(search) ||
        template.description.toLowerCase().includes(search);
      const matchesSkills =
        selectedSkills.length === 0 ||
        selectedSkills.every((skill) => template.skills?.includes(skill));
      return matchesSearch && matchesSkills;
    });
  }, [searchTerm, selectedSkills, templateEntries]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const handleGenerateRoadmap = async (careerKey: string) => {
    const template =
      CAREER_TEMPLATES[careerKey as keyof typeof CAREER_TEMPLATES];
    if (!template) return;

    try {
      setGeneratingCareer(careerKey);
      await createRoadmap({
        title: template.title,
        description: template.description,
        steps: template.steps.map((step) => ({
          id: crypto.randomUUID(),
          title: step.title,
          description: step.description,
          isCompleted: false,
        })),
        skills: template.skills,
      });
      toast.success("Roadmap updated", {
        description: `${template.title} is now your active path.`,
      });
    } catch (error) {
      console.error(error);
      toast.error("Unable to switch roadmap right now.");
    } finally {
      setGeneratingCareer(null);
    }
  };

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
                skills={activeRoadmap.skills ?? []}
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

        <section className="mt-12 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Explore Career Paths
              </h2>
              <p className="text-muted-foreground">
                Search and filter by skills to switch paths anytime.
              </p>
            </div>
            <div className="w-full md:w-80 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search careers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {!!allSkills.length && (
            <div className="flex flex-wrap gap-2">
              {allSkills.map((skill) => (
                <Button
                  key={skill}
                  type="button"
                  size="sm"
                  variant={selectedSkills.includes(skill) ? "default" : "outline"}
                  onClick={() => toggleSkill(skill)}
                  className="rounded-full"
                >
                  {skill}
                </Button>
              ))}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {filteredTemplates.length ? (
              filteredTemplates.map(([key, template], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>{template.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {(template.skills ?? []).map((skill) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleGenerateRoadmap(key)}
                        disabled={generatingCareer === key}
                      >
                        {generatingCareer === key
                          ? "Updating..."
                          : "Switch to this path"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No career paths match your current filters.
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}