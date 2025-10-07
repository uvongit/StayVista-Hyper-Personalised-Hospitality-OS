import ComingSoonLayout from "./ComingSoonLayout";

const ComingSoonAttractions = () => (
  <ComingSoonLayout
    eyebrow="Attractions"
    title="Immersive local stories en route"
    description="We’re handpicking guides, curators, and rare-access experiences to enrich every StayVista journey with insider narratives."
    eta="Previewing experiences in Summer 2025"
    highlights={[
      "Hosted by historians, chefs, and master artisans",
      "Small-group formats capped at eight guests",
      "Integrated with StayVista concierges for seamless days",
    ]}
    metrics={[
      {
        label: "Destinations scouted",
        value: "40",
        caption: "Cities and towns with curated cultural programmes.",
      },
      {
        label: "Experience curators",
        value: "55",
        caption: "Storytellers, sommeliers, and conservationists onboarded.",
      },
      {
        label: "Access windows",
        value: "Exclusive",
        caption: "Early-morning museum entries and after-hours gallery salons.",
      },
    ]}
    accent="#d946ef"
    accentGradient="linear-gradient(145deg, #ec4899 0%, #d946ef 50%, #a855f7 100%)"
    backgroundImage="https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1980&q=80"
    features={[
      {
        title: "Hosted immersions",
        description: "Heritage walks, culinary ateliers, and artisan studio visits curated for small, private groups.",
      },
      {
        title: "Priority reservations",
        description: "Front-of-the-line access to sought-after restaurants, performances, and wellness sanctuaries.",
      },
      {
        title: "Tailored itineraries",
        description: "Destination designers crafting half-day to multi-day programs around your stay."
      },
    ]}
    primaryAction={{ label: "Preview an itinerary", to: "/register" }}
    secondaryAction={{ label: "Back to home", to: "/" }}
  />
);

export default ComingSoonAttractions;
