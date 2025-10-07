import ComingSoonLayout from "./ComingSoonLayout";

const ComingSoonAirports = () => (
  <ComingSoonLayout
    eyebrow="Airport transfers"
    title="Airport concierge arrivals, coming soon"
    description="We’re choreographing seamless airport experiences with dedicated lounges, fast-track immigration, and private chauffeur transfers."
    eta="Launching Q4 2025"
    highlights={[
      "Priority lanes at 12+ international hubs",
      "Dedicated guest experience managers",
      "Integrated villa arrival briefings",
    ]}
    metrics={[
      {
        label: "Global gateways",
        value: "12",
        caption: "Partner airports confirmed for the first phase rollout.",
      },
      {
        label: "Concierge experts",
        value: "30+",
        caption: "Specialists trained in multilingual hosting and immigration assistance.",
      },
      {
        label: "Minute promise",
        value: "15 mins",
        caption: "Average time from aircraft door to private car departure.",
      },
    ]}
    accent="#0284c7"
    accentGradient="linear-gradient(140deg, #38bdf8 0%, #0ea5e9 100%)"
    backgroundImage="https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1980&q=80"
    features={[
      {
        title: "VIP lounge access",
        description: "Curated spaces with refreshments, wellness pods, and concierge desk for last-minute travel needs.",
      },
      {
        title: "Private runway transfers",
        description: "Chauffeur-driven luxury vehicles paired with real-time flight coordination.",
      },
      {
        title: "Arrival hosting",
        description: "Personal greeters ensuring luggage handling, customs formalities, and onward itinerary briefing.",
      },
    ]}
    primaryAction={{ label: "Join the priority list", to: "/register" }}
    secondaryAction={{ label: "Explore stays", to: "/hotels" }}
  />
);

export default ComingSoonAirports;
