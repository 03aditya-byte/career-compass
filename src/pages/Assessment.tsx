import { AppNavbar } from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api } from "@/convex/_generated/api";
import { CAREER_TEMPLATES } from "@/lib/career-data";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const QUESTIONS = [
  {
    id: "interest",
    question: "What do you enjoy doing the most?",
    options: [
      { value: "building", label: "Building things and coding" },
      { value: "analyzing", label: "Analyzing data and finding patterns" },
      { value: "leading", label: "Leading teams and strategy" },
      { value: "designing", label: "Designing visual experiences" },
    ],
  },
  {
    id: "environment",
    question: "What is your ideal work environment?",
    options: [
      { value: "remote", label: "Fully Remote" },
      { value: "office", label: "In Office" },
      { value: "hybrid", label: "Hybrid" },
    ],
  },
  {
    id: "strength",
    question: "What do you consider your key strength?",
    options: [
      { value: "logic", label: "Logical Thinking & Problem Solving" },
      { value: "creativity", label: "Creativity & Visual Eye" },
      { value: "communication", label: "Communication & Empathy" },
    ],
  },
];

export default function Assessment() {
  const navigate = useNavigate();
  const submitAssessment = useMutation(api.assessments.submitAssessment);
  const createRoadmap = useMutation(api.roadmaps.createRoadmap);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [QUESTIONS[currentStep].id]: value }));
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const calculateCareer = () => {
    const { interest, strength } = answers;
    
    if (interest === "building" && strength === "logic") return "Software Engineer";
    if (interest === "analyzing") return "Data Scientist";
    if (interest === "leading") return "Product Manager";
    if (interest === "designing" || strength === "creativity") return "UX Designer";
    
    // Default fallback
    return "Software Engineer";
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const recommendedCareer = calculateCareer();
      
      // 1. Submit Assessment
      await submitAssessment({
        answers: JSON.stringify(answers),
        recommendedCareer,
      });

      // 2. Create Roadmap
      const template = CAREER_TEMPLATES[recommendedCareer as keyof typeof CAREER_TEMPLATES];
      if (template) {
        await createRoadmap({
          title: template.title,
          description: template.description,
          steps: template.steps.map((s) => ({
            id: crypto.randomUUID(),
            title: s.title,
            description: s.description,
            isCompleted: false,
          })),
          skills: template.skills,
        });
      }

      toast.success("Assessment Complete!", {
        description: `We've generated a ${recommendedCareer} roadmap for you.`,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const question = QUESTIONS[currentStep];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-lg"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">
                  Question {currentStep + 1} of {QUESTIONS.length}
                </span>
                <span className="text-sm font-medium text-primary">
                  {Math.round(((currentStep + 1) / QUESTIONS.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mb-6">
                <div 
                  className="h-full bg-primary transition-all duration-300" 
                  style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }} 
                />
              </div>
              <CardTitle className="text-2xl">{question.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup onValueChange={handleAnswer} value={answers[question.id]}>
                {question.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 mb-4">
                    <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                    <Label
                      htmlFor={option.value}
                      className="flex flex-1 items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      {option.label}
                      {answers[question.id] === option.value && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleNext}
                disabled={!answers[question.id] || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : currentStep === QUESTIONS.length - 1 ? (
                  "Complete Assessment"
                ) : (
                  <>
                    Next Question <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
