import ComingSoonLayout from "./ComingSoonLayout";

const ComingSoonTaxis = () => (
  <ComingSoonLayout
    eyebrow="Airport taxis"
    title="Premier airport taxi network"
    description="We’re partnering with luxury mobility providers to deliver uniform chauffeur standards across major Indian and international hubs."
    eta="Piloting mid 2025"
    highlights={[
      "On-call chauffeurs in 30+ cities",
      "Uniform vehicle and amenity standards",
      "Live-tracked arrivals with ETA sharing",
    ]}
    metrics={[
      {
        label: "Cities onboard",
        value: "30",
        caption: "Launch coverage across India and Southeast Asia.",
      },
      {
        label: "Fleet partners",
        value: "18",
        caption: "Handpicked chauffeurs trained in hospitality protocols.",
      },
      {
        label: "Guest rating goal",
        value: "4.9/5",
        caption: "Sustained ride satisfaction benchmark for the programme.",
      },
    ]}
    accent="#16a34a"
    accentGradient="linear-gradient(145deg, #22c55e 0%, #10b981 100%)"
    backgroundImage="https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1980&q=80"
    features={[
      {
        title: "Guaranteed wait time",
        description: "Reserved chauffeurs monitoring arrival status for zero-delay pickups day or night.",
      },
      {
        title: "Signature fleet",
        description: "Sedans and SUVs outfitted with Wi-Fi, still & sparkling refreshments, and device charging.",
      },
      {
        title: "On-the-go concierge",
        description: "In-ride concierge coordination for villa access, restaurant reservations, and itinerary tweaks.",
      },
    ]}
    primaryAction={{ label: "Get notified", to: "/register" }}
    secondaryAction={{ label: "View curated stays", to: "/hotels" }}
  />
);

export default ComingSoonTaxis;
