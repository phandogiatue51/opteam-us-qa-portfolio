import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";
import {
  FolderKanban,
  Layers,
  ListChecks,
  Shield,
  Users,
  Building2,
  ArrowRight,
  Check,
  Star,
} from "lucide-react";

const features = [
  { icon: FolderKanban, title: "Workspace Management", desc: "Create and organize multiple workspaces for every team and initiative." },
  { icon: Layers, title: "Project Organization", desc: "Structure projects within workspaces with clear ownership and visibility." },
  { icon: ListChecks, title: "Task Boards", desc: "Track tasks with status columns — to do, in progress, and done." },
  { icon: Shield, title: "Secure Authentication", desc: "Enterprise-grade JWT auth keeps your team's data safe and private." },
  { icon: Users, title: "Role-Based Access", desc: "Assign permissions so the right people see the right things." },
  { icon: Building2, title: "Scalable Structure", desc: "From a 2-person startup to a 200-person org — OpTeamUs scales with you." },
];

const testimonials = [
  { name: "Sarah Chen", role: "Engineering Lead, Velora", quote: "OpTeamUs replaced three different tools for us. Our sprint velocity increased by 40% in the first month.", rating: 5 },
  { name: "Marcus Johnson", role: "Product Manager, Nexaflow", quote: "The workspace → project → task hierarchy is exactly how our brain works. Finally, a tool that gets it.", rating: 5 },
  { name: "Priya Sharma", role: "CTO, BuildStack", quote: "Clean, fast, and zero learning curve. We onboarded the entire team in a single afternoon.", rating: 5 },
];

const pricingPlans = [
  { name: "Starter", price: "R0", period: "/month", desc: "For small teams getting started", features: ["Up to 3 workspaces", "Unlimited tasks", "Basic task boards", "Email support"], cta: "Get Started", highlighted: false },
  { name: "Pro", price: "R12", period: "/user/mo", desc: "For growing teams that need more", features: ["Unlimited workspaces", "Advanced analytics", "Priority support", "Custom integrations", "Role-based access"], cta: "Start Free Trial", highlighted: true },
  { name: "Enterprise", price: "Custom", period: "", desc: "For organizations at scale", features: ["Everything in Pro", "SSO & SAML", "Dedicated account manager", "SLA guarantee", "Audit logs"], cta: "Contact Sales", highlighted: false },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Floating Pill Navigation */}
      <nav className="sticky top-4 z-50 mx-auto max-w-3xl px-4">
        <div className="flex items-center justify-between rounded-full border border-border bg-card/80 px-6 py-3 shadow-sm backdrop-blur-md">
          <span className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <Logo size={24} />
            OpTeamUs
          </span>
          <div className="hidden items-center gap-6 sm:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
            <a href="#testimonials" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Testimonials</a>
            <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm" className="rounded-full">Log in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="rounded-full">Sign up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-4xl px-4 pb-24 pt-28 text-center">
        <div className="dark-hero-glow" />
        <div className="animate-fade-in-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border dark:border-emerald-500/20 bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Now in public beta
          </div>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-foreground dark:text-emerald-50 dark-text-glow sm:text-6xl lg:text-7xl">
            Organize work.<br />Ship faster.<br />Stay aligned.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            OpTeamUs is a modern workspace and project management platform built for teams that value clarity, ownership, and measurable progress.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="rounded-full px-8 text-base">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="lg" className="rounded-full px-8 text-base">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24">
        <div className="mb-16 text-center animate-fade-in-up">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Everything your team needs</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            A complete toolkit for modern teams — from workspace setup to task completion.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Card key={f.title} className={`border-border bg-card shadow-sm transition-all hover:shadow-md animate-fade-in-up-delay-${Math.min(i, 3)}`}>
              <CardContent className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary dark:bg-emerald-500/10">
                  <f.icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="mx-auto max-w-6xl px-4 py-24">
        <div className="mb-16 text-center animate-fade-in-up">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Loved by productive teams</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Hear from teams that transformed how they work with OpTeamUs.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-foreground">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="mx-auto max-w-5xl px-4 py-24">
        <div className="mb-16 text-center animate-fade-in-up">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Simple, transparent pricing</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Start free. Upgrade when your team grows.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={`border-border shadow-sm transition-all hover:shadow-md ${plan.highlighted ? "ring-2 ring-foreground" : "bg-card"}`}
            >
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-muted-foreground" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className={`mt-6 w-full rounded-full ${plan.highlighted ? "" : "variant-outline"}`} variant={plan.highlighted ? "default" : "outline"}>
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                <Logo size={22} />
                OpTeamUs
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground">Modern team workspace management. Built for clarity, ownership, and progress.</p>
            </div>
            <div>
              <h5 className="mb-4 text-sm font-semibold text-foreground">Product</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h5 className="mb-4 text-sm font-semibold text-foreground">Company</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h5 className="mb-4 text-sm font-semibold text-foreground">Legal</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} OpTeamUs. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
