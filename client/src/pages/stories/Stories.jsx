import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import "./stories.css";

const STORIES = [
  {
    id: "andermatt-suite",
    title: "Alpine silence above Andermatt",
    author: "Elena Fischer",
    date: "September 14, 2025",
    image:
      "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1400&q=80",
    excerpt:
      "At 2,000 meters, the suite cantilevers over the valley. Sunrise pours across the fir panels while private cellists rehearse in the atrium below.",
    tags: ["Design", "Architecture"],
  },
  {
    id: "kyoto-ryokan",
    title: "Nightfall rituals in northern Kyoto",
    author: "Naomi Watanabe",
    date: "August 28, 2025",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80",
    excerpt:
      "A cedar-framed ryokan, lantern-lit gardens, and a tea master guiding guests through matcha ceremonies that evoke 17th-century Kyoto.",
    tags: ["Culture", "Tradition"],
  },
  {
    id: "patagonia-observatory",
    title: "Stargazing from Patagonia's wild observatory",
    author: "Mateo Alvarez",
    date: "July 19, 2025",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=80",
    excerpt:
      "Perched above the glaciers, ten glass observatory suites invite private astronomer-led salons followed by nocturnal glacier treks at the edge of Patagonia.",
    tags: ["Adventure", "Science"],
  },
  {
    id: "amalfi-residence",
    title: "Living terraces along the Amalfi sapphire",
    author: "Giulia Benedetti",
    date: "June 2, 2025",
    image:
      "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1400&q=80",
    excerpt:
      "Suspended infinity pools, lemon groves, and aperitivo hours curated by local perfumers overlooking Positano's marina.",
    tags: ["Coastal", "Lifestyle"],
  },
];

const Stories = () => {
  return (
    <div className="stories-page">
      <Navbar />
      <main className="stories-content">
        <section className="stories-hero">
          <div className="stories-hero__text">
            <span className="eyebrow">StayVista Journal</span>
            <h1>Field notes from the world's most compelling stays</h1>
            <p>
              Discover firsthand accounts from our design scouts, culinary curators, and resident storytellers.
              Each narrative offers an intimate lens into how luxury hospitality is being reimagined.
            </p>
          </div>
          <figure className="stories-hero__feature">
            <img
              src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80"
              alt="Luxury residence overlooking coastline"
            />
            <figcaption>
              "Every StayVista residence is a stage for local artistry," writes editor-in-chief Mira Laurent.
            </figcaption>
          </figure>
        </section>

        <section className="stories-grid" aria-label="Featured stories">
          {STORIES.map((story) => (
            <article className="story-card" key={story.id}>
              <div className="story-card__media">
                <img src={story.image} alt={story.title} loading="lazy" />
              </div>
              <div className="story-card__body">
                <div className="story-card__meta">
                  <span>{story.author}</span>
                  <span className="divider">•</span>
                  <span>{story.date}</span>
                </div>
                <h2>{story.title}</h2>
                <p>{story.excerpt}</p>
                <div className="story-card__tags">
                  {story.tags.map((tag) => (
                    <span className="chip" key={tag}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="stories-cta">
          <h2>Receive the StayVista brief</h2>
          <p>
            Join our monthly digest for invitations to private openings, architecture previews, and exclusive
            partner itineraries in development.
          </p>
          <form className="stories-cta__form">
            <input type="email" placeholder="you@example.com" aria-label="Email" required />
            <button type="submit" className="btn-primary">
              Subscribe
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Stories;
