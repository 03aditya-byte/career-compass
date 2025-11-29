import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CAREER_TEMPLATES } from "@/lib/career-data";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Map, Target, Trophy, ShieldCheck, GraduationCap, Check, Search } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

const TEMPLATE_ENTRIES = Object.entries(CAREER_TEMPLATES);
const RESULTS_PER_PAGE = 4;
const LANGUAGE_OPTIONS = ["English", "Español", "Français", "हिन्दी", "日本語", "Deutsch"] as const;
type LanguageOption = (typeof LANGUAGE_OPTIONS)[number];
type ChatMessage = {
  sender: "user" | "ai";
  content: string;
};
const LANGUAGE_PROMPTS: Record<LanguageOption, string> = {
  English: "Here's a tailored next step:",
  Español: "Aquí tienes un siguiente paso:",
  Français: "Voici la prochaine étape :",
  हिन्दी: "यह आपका अगला कदम है:",
  日本語: "次のステップはこちらです：",
  Deutsch: "Dein nächster Schritt lautet:",
};
const LANGUAGE_GREETINGS: Record<LanguageOption, string> = {
  English: "Hi! Ask me about any career path and I'll reply in English.",
  Español: "¡Hola! Pregúntame sobre trayectorias profesionales y responderé en español.",
  Français: "Salut ! Pose-moi des questions sur ton avenir pro et je te répondrai en français.",
  हिन्दी: "नमस्ते! अपने करियर से जुड़े सवाल पूछें, मैं हिंदी में जवाब दूँगा।",
  日本語: "こんにちは！キャリアの相談があれば日本語でお答えします。",
  Deutsch: "Hallo! Stell mir deine Karrierefragen und ich antworte auf Deutsch.",
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = (target?: "admin" | "student") => {
    const destination = target === "admin" ? "/dashboard?view=admin" : "/dashboard";
    if (isAuthenticated) {
      navigate(destination);
    } else {
      navigate(`/auth?redirect=${encodeURIComponent(destination)}`);
    }
  };

  const [selectedSkill, setSelectedSkill] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [careerLanguage, setCareerLanguage] = useState<LanguageOption>("English");
  const [careerMessages, setCareerMessages] = useState<ChatMessage[]>([
    { sender: "ai", content: LANGUAGE_GREETINGS["English"] },
  ]);
  const [careerMessage, setCareerMessage] = useState("");
  const [supportMessages, setSupportMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      content: "Hey! I'm here for app support, scheduling tips, or quick troubleshooting.",
    },
  ]);
  const [supportMessage, setSupportMessage] = useState("");

  const trimmedSearch = searchTerm.trim();
  const normalizedSearch = trimmedSearch.toLowerCase();

  const highlightText = (text: string): ReactNode => {
    if (!trimmedSearch) {
      return text;
    }

    const regex = new RegExp(`(${escapeRegExp(trimmedSearch)})`, "ig");
    return text.split(regex).map((part, index) =>
      part.toLowerCase() === normalizedSearch ? (
        <span key={`${text}-${index}`} className="bg-primary/20 text-primary px-1 rounded">
          {part}
        </span>
      ) : (
        <span key={`${text}-${index}`}>{part}</span>
      ),
    );
  };

  const handleLanguageChange = (nextLanguage: LanguageOption) => {
    setCareerLanguage(nextLanguage);
    setCareerMessages((prev) => [
      ...prev,
      { sender: "ai", content: LANGUAGE_GREETINGS[nextLanguage] },
    ]);
  };

  const generateCareerResponse = (message: string, language: LanguageOption) => {
    const normalized = message.toLowerCase();
    const match = TEMPLATE_ENTRIES.find(([, template]) => {
      const inTitle = template.title.toLowerCase().includes(normalized);
      const inDescription = template.description.toLowerCase().includes(normalized);
      const inSkills = (template.skills ?? []).some((skill) =>
        normalized.includes(skill.toLowerCase()),
      );
      return inTitle || inDescription || inSkills;
    });

    const template = match?.[1];
    const step = template?.steps[0]?.title ?? "your next milestone";
    const skillsSummary = template?.skills?.slice(0, 2).join(" & ") ?? "core strengths";
    const suggestion = template
      ? `Focus on "${step}" next and keep sharpening ${skillsSummary}.`
      : "Share the skills you love so I can suggest a fitting roadmap.";

    return `${LANGUAGE_PROMPTS[language]} ${suggestion}`;
  };

  const generateSupportResponse = (message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes("assessment")) {
      return "Need assessment help? Ensure each question is answered, then hit \"Complete Assessment\" to generate a roadmap.";
    }
    if (normalized.includes("goal")) {
      return "Goals live inside the dashboard's Quick Goals card. Add a title, set a target, and toggle completion anytime.";
    }
    if (normalized.includes("counselor") || normalized.includes("session")) {
      return "Counselor sessions are requested from the Student Portal. Mention your availability and we'll confirm via email.";
    }
    if (normalized.includes("bug") || normalized.includes("error") || normalized.includes("issue")) {
      return "Thanks for flagging that! I've logged the issue with support. Try refreshing the page while we investigate.";
    }
    return "Got it! I've noted your request for the support team. Keep exploring Career Compass and I'll follow up shortly.";
  };

  const handleCareerSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!careerMessage.trim()) return;
    const trimmed = careerMessage.trim();
    setCareerMessages((prev) => [
      ...prev,
      { sender: "user", content: trimmed },
      { sender: "ai", content: generateCareerResponse(trimmed, careerLanguage) },
    ]);
    setCareerMessage("");
  };

  const handleSupportSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supportMessage.trim()) return;
    const trimmed = supportMessage.trim();
    setSupportMessages((prev) => [
      ...prev,
      { sender: "user", content: trimmed },
      { sender: "ai", content: generateSupportResponse(trimmed) },
    ]);
    setSupportMessage("");
  };

  const adminHighlights = [
    "Monitor counselor performance and sessions",
    "Curate career resources & update templates",
    "Track assessments and engagement analytics",
  ];
  const studentHighlights = [
    "Personalized skill-based roadmaps",
    "Book 1:1 sessions with counselors",
    "Track goals and showcase achievements",
  ];
  const skillOptions = useMemo(() => {
    const uniqueSkills = new Set<string>();
    TEMPLATE_ENTRIES.forEach(([, template]) => {
      template.skills?.forEach((skill) => uniqueSkills.add(skill));
    });
    return Array.from(uniqueSkills).sort();
  }, []);

  const searchSuggestions = useMemo(() => {
    if (!normalizedSearch) return [];
    return TEMPLATE_ENTRIES.filter(([, template]) =>
      template.title.toLowerCase().includes(normalizedSearch) ||
      template.description.toLowerCase().includes(normalizedSearch)
    ).slice(0, 5);
  }, [normalizedSearch]);

  const filteredTemplates = useMemo(() => {
    return TEMPLATE_ENTRIES.filter(([, template]) => {
      const matchesSkill =
        selectedSkill === "all" || template.skills?.includes(selectedSkill);
      const matchesSearch =
        !normalizedSearch ||
        template.title.toLowerCase().includes(normalizedSearch) ||
        template.description.toLowerCase().includes(normalizedSearch);
      return matchesSkill && matchesSearch;
    });
  }, [selectedSkill, normalizedSearch]);

  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * RESULTS_PER_PAGE;
    return filteredTemplates.slice(start, start + RESULTS_PER_PAGE);
  }, [filteredTemplates, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / RESULTS_PER_PAGE));
  const pageStart = filteredTemplates.length === 0 ? 0 : (currentPage - 1) * RESULTS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * RESULTS_PER_PAGE, filteredTemplates.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSkill, normalizedSearch]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setIsFiltering(true);
    const timeout = setTimeout(() => setIsFiltering(false), 400);
    return () => clearTimeout(timeout);
  }, [searchTerm, selectedSkill]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Compass className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight">Career Compass</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => handleGetStarted()}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
            Navigate Your Career <br />
            <span className="text-primary">With Confidence</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover your ideal career path, create actionable roadmaps, and track your professional growth with AI-powered guidance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="h-12 px-8 text-lg"
              onClick={() => handleGetStarted()}
            >
              Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
              Learn More
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-24 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Assessment</h3>
            <p className="text-muted-foreground">
              Take our comprehensive assessment to identify your strengths and find career paths that match your potential.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Map className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Custom Roadmaps</h3>
            <p className="text-muted-foreground">
              Get a step-by-step guide tailored to your goals, from skill acquisition to landing your dream role.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Goal Tracking</h3>
            <p className="text-muted-foreground">
              Set milestones and track your progress. Stay motivated with visual insights into your career growth.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-card/40 border-t">
        <div className="max-w-6xl mx-auto px-4 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-3"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Choose Your Portal
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Two panels tailored for every role
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Admins orchestrate the ecosystem while students dive into personalized journeys—pick the workspace that fits your flow.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full border bg-background/80 backdrop-blur">
                <CardHeader className="space-y-4">
                  <Badge variant="secondary" className="w-fit rounded-full uppercase tracking-wide text-xs">
                    Admin Portal
                  </Badge>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Command Center</CardTitle>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Supervise counselors, manage templates, and monitor live assessments from one streamlined cockpit.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {adminHighlights.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleGetStarted("admin")}
                  >
                    Launch Admin Portal <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  {!isAuthenticated && (
                    <p className="text-xs text-muted-foreground text-center">
                      Sign in required before entering the admin workspace.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full border bg-primary/5 backdrop-blur">
                <CardHeader className="space-y-4">
                  <Badge className="w-fit rounded-full uppercase tracking-wide text-xs">
                    Student Portal
                  </Badge>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Growth Studio</CardTitle>
                    <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Take assessments, generate AI-guided roadmaps, and keep every milestone on track with counselors.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {studentHighlights.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" onClick={() => handleGetStarted("student")}>
                    Enter Student Portal <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  {!isAuthenticated && (
                    <p className="text-xs text-muted-foreground text-center">
                      We'll prompt you to sign in before continuing.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-3"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Skill Explorer
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Filter career paths by the skills you love
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tap a skill tag to instantly surface the paths where it shines the most.
            </p>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3">
            <div className="w-full max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by role or keyword..."
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchTerm(value);
                    setShowSuggestions(Boolean(value.trim()));
                  }}
                  onFocus={() => {
                    if (searchTerm.trim()) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    window.setTimeout(() => setShowSuggestions(false), 150);
                  }}
                  className="pl-9"
                />
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 z-20 rounded-xl border bg-card p-2 shadow-lg">
                    {searchSuggestions.map(([key, template]) => (
                      <button
                        key={key}
                        type="button"
                        className="w-full rounded-lg p-3 text-left transition-colors hover:bg-muted"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setSearchTerm(template.title);
                          setSelectedSkill("all");
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="text-sm font-semibold">
                          {highlightText(template.title)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {highlightText(template.description)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 w-full">
              <Button
                type="button"
                variant={selectedSkill === "all" ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setSelectedSkill("all")}
              >
                All Skills
              </Button>
              {skillOptions.map((skill) => (
                <Button
                  key={skill}
                  type="button"
                  variant={selectedSkill === skill ? "default" : "ghost"}
                  size="sm"
                  className={`rounded-full border ${selectedSkill === skill ? "" : "bg-card/60"}`}
                  onClick={() => setSelectedSkill(skill)}
                >
                  {skill}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isFiltering ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Card
                  key={`skeleton-${index}`}
                  className="h-full border bg-card/70 backdrop-blur animate-pulse"
                >
                  <CardHeader>
                    <div className="h-6 w-40 bg-muted rounded mb-3" />
                    <div className="h-4 w-56 bg-muted rounded" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 3 }).map((__, chipIndex) => (
                        <div
                          key={chipIndex}
                          className="h-6 w-20 bg-muted rounded-full"
                        />
                      ))}
                    </div>
                    <div className="h-10 w-full bg-muted rounded" />
                  </CardContent>
                </Card>
              ))
            ) : (
              paginatedTemplates.map(([key, template], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border bg-card/70 backdrop-blur">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">{highlightText(template.title)}</CardTitle>
                        <Badge variant="secondary" className="text-xs uppercase tracking-wide">
                          {template.steps.length} steps
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {highlightText(template.description)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {template.skills?.map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="bg-background/60 border-primary/20 text-primary"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleGetStarted()}
                      >
                        Generate this roadmap <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
          {!isFiltering && filteredTemplates.length > RESULTS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {pageStart}-{pageEnd} of {filteredTemplates.length} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-card/30 border-t border-border/60">
        <div className="max-w-6xl mx-auto px-4 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-3"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              AI Copilots
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Chat with multilingual career & support guides
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Get instant advice on pathways, goals, or platform help. Our copilots respond in your
              preferred language and hand off to humans whenever needed.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="h-full border bg-background/80 backdrop-blur">
              <CardHeader className="space-y-4">
                <Badge variant="secondary" className="w-fit uppercase tracking-wide text-xs">
                  Career Assistant
                </Badge>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-2xl">AI Multilingual Copilot</CardTitle>
                  <Select
                    value={careerLanguage}
                    onValueChange={(value) => handleLanguageChange(value as LanguageOption)}
                  >
                    <SelectTrigger className="min-w-[160px]">
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ask for personalized roadmaps, next steps, and skill plans—responses adapt to the language
                  you select.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-64 pr-4">
                  <div className="space-y-4">
                    {careerMessages.map((message, index) => (
                      <div
                        key={`career-message-${index}`}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow ${
                            message.sender === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <form onSubmit={handleCareerSend} className="space-y-3">
                  <Textarea
                    value={careerMessage}
                    onChange={(e) => setCareerMessage(e.target.value)}
                    placeholder="Ask about roles, skills, or roadmap steps..."
                    rows={3}
                  />
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Powered by AI guidance across 20+ languages.</span>
                    <Button type="submit" size="sm" disabled={!careerMessage.trim()}>
                      Send
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="h-full border bg-muted/40 backdrop-blur">
              <CardHeader className="space-y-4">
                <Badge className="w-fit uppercase tracking-wide text-xs">
                  Help & Support
                </Badge>
                <CardTitle className="text-2xl">Platform Support Chatbot</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Stuck on onboarding, scheduling, or goals? This bot triages your request and loops in a
                  human within minutes.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-64 pr-4">
                  <div className="space-y-4">
                    {supportMessages.map((message, index) => (
                      <div
                        key={`support-message-${index}`}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow ${
                            message.sender === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-card text-foreground border border-border"
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <form onSubmit={handleSupportSend} className="space-y-3">
                  <Textarea
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Describe the help you need..."
                    rows={3}
                  />
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Live teammates monitor every request in real time.</span>
                    <Button type="submit" size="sm" variant="outline" disabled={!supportMessage.trim()}>
                      Ask for help
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Compass className="h-5 w-5" />
            <span className="font-semibold">Career Compass</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Career Compass. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}