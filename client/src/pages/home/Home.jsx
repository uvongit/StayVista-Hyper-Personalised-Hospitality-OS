import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import FeaturedProperties from "../../components/featuredProperties/FeaturedProperties";
import Featured from "../../components/featured/Featured";
import PropertyList from "../../components/propertyList/PropertyList";
import Footer from "../../components/footer/Footer";
import Header from "../../components/header/Header";
import Navbar from "../../components/navbar/Navbar";
import "./home.css";

const statHighlights = [
  { value: "150+", label: "Private residences" },
  { value: "40", label: "Global destinations" },
  { value: "4.9/5", label: "Guest satisfaction" },
];

const lifestyleCollections = [
  {
    badge: "Curated escapes",
    title: "Reserve signature villas with discreet concierge teams",
    description:
      "From sunrise yoga decks to in-residence sommeliers, every itinerary is arranged the way you imagine your getaway.",
    cta: "Explore concierge stays",
  },
  {
    badge: "Reset & renew",
    title: "Design-led sanctuaries for wellness-forward journeys",
    description:
      "Meditation pavilions, on-call therapists, and bespoke spa rituals create space for reflection and calm.",
    cta: "View restorative collection",
  },
  {
    badge: "Executive retreats",
    title: "Work, host, and celebrate from residences with boardroom amenities",
    description:
      "Private screening rooms, hybrid-ready lounges, and chefs who tailor menus for every gathering.",
    cta: "Book executive villas",
  },
];

const editorialStories = [
  {
    quote:
      "The concierge staged a candlelit dinner on the terrace within hours of our arrival—every request felt anticipated.",
    guest: "Nikita Rao",
    role: "Design Producer, Singapore",
  },
  {
    quote:
      "Their heritage palace in Jaipur felt like a private hotel—the morning chai ritual alone is worth returning for.",
    guest: "Hugo Laurent",
    role: "Brand Director, Paris",
  },
];

const Home = () => {
  return (
    <>
      <Navbar />
      <Header variant="minimal" />
      <main className="home">
        <section className="home__hero">
          <div className="home__hero-container">
            <div className="home__hero-copy">
              <h1>Discover hospitality shaped around your rituals</h1>
              <p>
                Immerse yourself in residences curated for restoration, celebration, and seamless moments of togetherness across
                the StayVista collection.
              </p>
              <div className="home__hero-actions">
                <Link to="/hotels" className="btn-primary">
                  Curate your stay
                </Link>
                <Link to="/hotels" className="btn-outline">
                  View destinations
                </Link>
              </div>
              <div className="home__hero-stats">
                {statHighlights.map((stat) => (
                  <article className="home__hero-stat" key={stat.label}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </article>
                ))}
              </div>
            </div>
            <div className="home__hero-media">
              <div className="home__hero-media-card">
                <img 
                  src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80" 
                  alt="Luxury villa with infinity pool"
                  className="home__hero-media-image"
                />
                <div className="home__hero-media-content">
                  <div className="home__hero-media-eyebrow">Curated villa · Goa</div>
                  <h3>Casa Horizon</h3>
                  <p>Three-tier infinity pool, seafront pavilion, and sommeliers on call.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home__section home__section--featured">
          <div className="home__section-header">
            <h2>Homes guests love</h2>
            <p>
              Discover our most celebrated residences—from design-led penthouses to heritage estates—each reviewed for impeccable
              service and thoughtful amenities.
            </p>
          </div>
          <FeaturedProperties />
        </section>

        <section className="home__section home__section--collections">
          <div className="home__collections">
            {lifestyleCollections.map((item, index) => (
              <article className="home__collection-card" key={item.title}>
                <div className="home__collection-image-wrapper">
                  <img 
                    src={[
                      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
                      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
                      "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80"
                    ][index]}
                    alt={item.title}
                    className="home__collection-image"
                  />
                  <div className="home__collection-overlay" />
                </div>
                <div className="home__collection-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <Link to="/hotels" className="btn-text">
                    {item.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="home__section home__section--destinations">
          <div className="home__section-header">
            <h2>City spotlights curated for the season</h2>
            <p>
              From alpine escapes to coastal enclaves, preview itineraries our concierge recommends booking now before they sell
              out.
            </p>
          </div>
          <Featured />
        </section>

        <section className="home__section home__section--categories">
          <div className="home__section-header">
            <h2>Browse by property type</h2>
            <p>Signature lofts, countryside manors, or eco-retreats—select the architecture that reflects your travel style.</p>
          </div>
          <PropertyList />
        </section>

        <section className="home__stories">
          <div className="home__stories-container">
            <div className="home__stories-header">
              <h2>Journal entries from the StayVista circle</h2>
              <p>
                Read how design aficionados, founders, and storytellers reconnect with their circles through crafted experiences
                across our residencies.
              </p>
            </div>
            <div className="home__stories-grid">
              {editorialStories.map((story) => (
                <figure className="home__story-card" key={story.guest}>
                  <blockquote>{story.quote}</blockquote>
                  <figcaption>
                    <strong>{story.guest}</strong>
                    <span>{story.role}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default Home;
