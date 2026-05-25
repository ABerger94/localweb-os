import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";
import {
  Globe,
  TrendingUp,
  Users,
  Star,
  Search,
  PhoneOff,
  MapPin,
  ShoppingCart,
  Clock,
  CheckCircle,
  ArrowRight,
  Smartphone,
  BarChart2,
  Shield,
} from "lucide-react";

const missedOpportunities = [
  {
    icon: Search,
    title: "No Online Presence",
    description:
      "97% of people search online before choosing a business. Without a website, you simply don't exist to them.",
  },
  {
    icon: PhoneOff,
    title: "Lost After-Hours Leads",
    description:
      "A website or booking tool works 24/7. When you're closed, potential customers can still reach you.",
  },
  {
    icon: ShoppingCart,
    title: "Manual Processes Eating Time",
    description:
      "From intake forms to scheduling to client portals — manual work costs time and money. Custom tools fix this.",
  },
  {
    icon: Star,
    title: "Credibility Gap",
    description:
      "84% of consumers trust a business with a professional web presence more than one without. First impressions matter.",
  },
  {
    icon: MapPin,
    title: "Missing from Local Searches",
    description:
      '"Near me" searches have grown 500% in recent years. A fast, SEO-optimized site puts you on the map.',
  },
  {
    icon: Users,
    title: "Competitors Moving Faster",
    description:
      "Your competitors are automating and building tools. Every day without a digital edge, they pull further ahead.",
  },
];

const howWeHelp = [
  {
    icon: Globe,
    title: "Custom Websites",
    description:
      "We design and build professional websites tailored to your brand, services, and local market — no templates.",
  },
  {
    icon: Smartphone,
    title: "Custom Apps & Tools",
    description:
      "Need a client portal, booking system, internal dashboard, or automation? We build custom tools that fit your workflow.",
  },
  {
    icon: Search,
    title: "SEO-Optimized from Day One",
    description:
      "We build your site to rank on Google so local customers searching for your services find you first.",
  },
  {
    icon: BarChart2,
    title: "Ongoing Growth Support",
    description:
      "We don't just build and disappear. Monthly retainers keep your site and tools fresh, fast, and effective.",
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    description:
      "From mockup to launch in days, not months. We move at the speed your business needs.",
  },
  {
    icon: Shield,
    title: "Dedicated Client Portal",
    description:
      "Track your project, review invoices, and communicate with our team — all in one place.",
  },
];

export default function ClientPortalLanding() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      setIsAuthenticated(authed);
      setAuthChecked(true);
    });
  }, []);

  // Redirect logged-in users straight to the portal dashboard
  if (authChecked && isAuthenticated) {
    return <Navigate to="/client-portal/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg text-foreground">Local Web Connect</span>
          </div>
          <Button onClick={() => base44.auth.redirectToLogin("/client-portal/dashboard")} className="gap-2">
            Client Login <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-secondary to-secondary/90 text-white py-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-block bg-primary/20 text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-primary/30">
            Websites, Apps & Custom Tools for Local Businesses
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Your Business Deserves{" "}
            <span className="text-primary">Custom Solutions</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Every day without a web presence is revenue walking out the door. Local Web
            Connect builds fast, beautiful websites and custom apps to solve your business needs — turning prospects into customers and streamlining your operations. Starting with a <strong className="text-white">free mockup</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8"
              onClick={() => base44.auth.redirectToLogin("/client-portal/dashboard")}
            >
              Access Your Portal <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-white/40 text-white hover:bg-white/10 text-base px-8"
              onClick={() => document.getElementById("how-we-help").scrollIntoView({ behavior: "smooth" })}
            >
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { value: "97%", label: "of consumers search online first" },
            { value: "84%", label: "trust businesses with a web presence" },
            { value: "10x", label: "faster with the right custom tools" },
            { value: "24/7", label: "your site and tools work while you sleep" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-sm text-white/80 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Missed Opportunities */}
      <section className="py-20 px-4 sm:px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What's Holding Your Business Back?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Without the right digital tools and web presence, you're leaving money and time on the table. Here's what's slipping through the cracks.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {missedOpportunities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-6 rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How We Help */}
      <section id="how-we-help" className="py-20 px-4 sm:px-6 bg-secondary text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How Local Web Connect Builds Your Edge
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              From custom websites to powerful business tools — we handle everything so you can focus on running your business.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {howWeHelp.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-6 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Getting Started Is Simple
            </h2>
            <p className="text-muted-foreground text-lg">
              From first contact to a live website or custom tool — here's how it works.
            </p>
          </div>
          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "We Scope Your Needs",
                desc: "We learn your business, goals, and challenges — then propose the right solution, whether that's a website, a custom app, or both.",
              },
              {
                step: "02",
                title: "We Build a Free Mockup",
                desc: "We create a custom mockup or prototype tailored to your brand and workflow — no commitment required.",
              },
              {
                step: "03",
                title: "We Review & Refine",
                desc: "You give feedback, we refine. We won't launch until you love what you see.",
              },
              {
                step: "04",
                title: "We Launch & Keep Growing",
                desc: "Your solution goes live and we stay on to keep it updated, optimized, and evolving with your business.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-5 items-start">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {item.step}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-foreground text-lg">{item.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-primary to-primary/80 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Build Something That Works for You?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Already a client? Log in to your portal to track your project, view
            invoices, and communicate with our team.
          </p>
          <Button
            size="lg"
            onClick={() => base44.auth.redirectToLogin("/client-portal/dashboard")}
            className="bg-white text-primary hover:bg-white/90 font-semibold text-base px-10 gap-2"
          >
            Log In to Your Portal <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-white/60 text-center py-6 text-sm px-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-primary" />
          <span className="font-semibold text-white">Local Web Connect</span>
        </div>
        <p>Building websites, apps, and custom tools for local businesses.</p>
      </footer>
    </div>
  );
}