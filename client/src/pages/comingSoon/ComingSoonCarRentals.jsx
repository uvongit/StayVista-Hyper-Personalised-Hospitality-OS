import ComingSoonLayout from "./ComingSoonLayout";

const ComingSoonCarRentals = () => (
  <ComingSoonLayout
    eyebrow="Car rentals"
    title="Signature drives, curated for every itinerary"
    description="Our curated fleet partners will soon offer self-drive and chauffeured cars tailored to villa stays, city exploration, and multi-day journeys."
    eta="In preview early 2026"
    highlights={[
      "Design-led vehicles with wellness amenities",
      "Dedicated route planners for scenic drives",
      "Door-to-door delivery and swap services",
    ]}
    metrics={[
      {
        label: "Fleet styles",
        value: "25",
        caption: "Convertible, executive, SUV and EV options on launch.",
      },
      {
        label: "Route designers",
        value: "15",
        caption: "Experts curating road trip itineraries for each region.",
      },
      {
        label: "Guest coverage",
        value: "24/7",
        caption: "Assistance windows for maintenance and concierge requests.",
      },
    ]}
    accent="#ea580c"
    accentGradient="linear-gradient(145deg, #f97316 0%, #f97316 40%, #facc15 100%)"
    backgroundImage="https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1980&q=80"
    features={[
      {
        title: "Design-led fleet",
        description: "Convertible coupes, executive sedans, and SUVs equipped with ambient wellness kits and digital concierge tablets.",
      },
      {
        title: "Flexible handovers",
        description: "Doorstep delivery, airport swaps, and one-way routes coordinated with StayVista itineraries.",
      },
      {
        title: "Local experts",
        description: "Road trip specialists mapping culinary stops, scenic breaks, and cultural immersions along every route.",
      },
    ]}
    primaryAction={{ label: "Request early access", to: "/register" }}
    secondaryAction={{ label: "Plan a stay", to: "/hotels" }}
  />
);

export default ComingSoonCarRentals;
