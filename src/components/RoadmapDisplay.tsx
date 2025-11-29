import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface Step {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
}

interface RoadmapDisplayProps {
  roadmapId: Id<"roadmaps">;
  title: string;
  description: string;
  steps: Step[];
  skills?: string[];
}

export function RoadmapDisplay({ roadmapId, title, description, steps, skills = [] }: RoadmapDisplayProps) {
  const toggleStep = useMutation(api.roadmaps.toggleStep);

  const handleToggle = async (stepId: string) => {
    await toggleStep({ roadmapId, stepId });
  };

  const completedSteps = steps.filter((s) => s.isCompleted).length;
  const progress = steps.length ? Math.round((completedSteps / steps.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
          {skills.length ? (
            <div className="flex flex-wrap gap-2 mt-4 md:mt-2">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="bg-primary/5 border-primary/20 text-primary"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-4 bg-card border p-4 rounded-xl">
          <div className="text-sm font-medium">Progress</div>
          <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <div className="text-sm font-bold text-primary">{progress}%</div>
        </div>
      </div>

      <div className="grid gap-4 relative">
        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-border -z-10 hidden md:block" />
        
        {steps.map((step, index) => {
          const isLocked = index > 0 && !steps[index - 1].isCompleted;
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`transition-colors ${step.isCompleted ? 'bg-primary/5 border-primary/20' : ''}`}>
                <CardContent className="p-6 flex items-start gap-4">
                  <button
                    onClick={() => !isLocked && handleToggle(step.id)}
                    disabled={isLocked}
                    className={`mt-1 rounded-full p-1 transition-colors ${
                      step.isCompleted 
                        ? "text-primary hover:text-primary/80" 
                        : isLocked 
                          ? "text-muted-foreground cursor-not-allowed" 
                          : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    {step.isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : isLocked ? (
                      <Lock className="h-6 w-6" />
                    ) : (
                      <Circle className="h-6 w-6" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${step.isCompleted ? 'text-primary' : ''}`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
