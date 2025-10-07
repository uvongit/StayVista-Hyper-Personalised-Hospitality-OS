import ComingSoonLayout from "./ComingSoonLayout";

const ComingSoonFlights = () => (
  <ComingSoonLayout
    eyebrow="Flights"
    title="Private skies and curated cabins"
    description="We are crafting a flight desk that negotiates business-class upgrades, private charters, and seamless mileage redemptions for StayVista guests."
    eta="Beta experience rolling out Winter 2025"
    highlights={[
      "Priority upgrade path with partner airlines",
      "Bespoke miles and rewards advisory",
      "Coordinated villa and airport transfers",
    ]}
    metrics={[
      {
        label: "Airline partners",
        value: "20",
        caption: "Preferred carriers across premium cabins globally.",
      },
      {
        label: "Private charters",
        value: "150+",
        caption: "Fleet access ranging from turboprops to long-range jets.",
      },
      {
        label: "Upgrade success",
        value: "82%",
        caption: "Projected success rate for elite member upgrade requests.",
      },
    ]}
    accent="#6366f1"
    accentGradient="linear-gradient(145deg, #4f46e5 0%, #6366f1 50%, #a855f7 100%)"
    backgroundImage="https://images.unsplash.com/photo-1490106411907-57e2d3acd9bb?auto=format&fit=crop&w=1980&q=80"
    features={[
      {
        title: "Preferred cabin upgrades",
        description: "Partner airlines with pre-negotiated fare classes, upgrade waitlists, and lounge access bundles.",
      },
      {
        title: "Private charters",
        description: "On-demand turboprop and jet charters mapped to remote villas and multi-destination getaways.",
      },
      {
        title: "Flight concierge",
        description: "Dedicated specialists managing seat selection, meal preferences, and travel documentation."
      },
    ]}
    primaryAction={{ label: "Request charter quotes", to: "/register" }}
    secondaryAction={{ label: "Discover stays", to: "/hotels" }}
  />
);

export default ComingSoonFlights;
