import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import "./experiences.css";

const EXPERIENCES = [
  {
    id: "skyline-escape",
    title: "Skyline Escape",
    location: "New York City, USA",
    image:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1400&q=80",
    description:
      "Private rooftop tastings with Michelin-starred chefs while the Manhattan skyline glows around you.",
    duration: "3 hours",
    tags: ["Gastronomy", "Nightlife"],
  },
  {
    id: "desert-symphony",
    title: "Desert Symphony",
    location: "AlUla, Saudi Arabia",
    image:
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1400&q=80",
    description:
      "Legendary Bedouin storytellers under the stars accompanied by live strings in the sandstone canyon.",
    duration: "Sunset to midnight",
    tags: ["Culture", "Music"],
  },
  {
    id: "aurora-haven",
    title: "Aurora Haven",
    location: "Tromsø, Norway",
    image:
      "https://images.unsplash.com/photo-1579033461380-adb47c3eb938?w=1400&q=80",
    description:
      "Glass-domed chalets, artisan sauna rituals, and astrophotography workshops beneath the northern lights.",
    duration: "2 nights",
    tags: ["Wellness", "Nature"],
  },
  {
    id: "vineyard-reverie",
    title: "Vineyard Reverie",
    location: "Tuscany, Italy",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80",
    description:
      "Helicopter arrival, sunrise hot-air ballooning, and private cellar access with the estate sommelier.",
    duration: "Full day",
    tags: ["Wine", "Adventure"],
  },
  {
    id: "rainforest-atrium",
    title: "Rainforest Atrium",
    location: "Monteverde, Costa Rica",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1400&q=80",
    description:
      "Suspended glass walkways through the cloud forest, guided night safaris, and botanical mixology under bioluminescent canopies.",
    duration: "Twilight series",
    tags: ["Nature", "Wellness"],
  },
  {
    id: "sahara-sonata",
    title: "Sahara Sonata",
    location: "Erg Chebbi, Morocco",
    image:
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1400&q=80",
    description:
      "Sunset camel cavalcades, desert harp symphonies, and celestial navigation masterclasses beneath infinite stars.",
    duration: "Overnight",
    tags: ["Culture", "Music"],
  },
  {
    id: "fjord-resonance",
    title: "Fjord Resonance",
    location: "Sunnmøre Alps, Norway",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80",
    description:
      "Hydrofoil transfers to floating saunas, glacier-fed plunge pools, and private violin recitals echoing across the fjords.",
    duration: "48-hour immersion",
    tags: ["Spa", "Adventure"],
  },
];

const Experiences = () => {
  return (
    <div className="experiences-page">
      <Navbar />
      <main className="experiences-content">
        <section className="experiences-hero">
          <div className="experiences-hero__text">
            <span className="eyebrow">StayVista Signature Experiences</span>
            <h1>Curated moments crafted for the discerning traveler</h1>
            <p>
              From alpine observatories to private chef's tables, each experience is architected to
              immerse you in culture, craft, and the sublime. Our global curators coordinate every detail.
            </p>
            <div className="experiences-hero__meta">
              <div>
                <span className="meta-label">Destinations</span>
                <strong>24 countries</strong>
              </div>
              <div>
                <span className="meta-label">Guest rating</span>
                <strong>4.9 / 5</strong>
              </div>
              <div>
                <span className="meta-label">Concierge</span>
                <strong>24 / 7</strong>
              </div>
            </div>
          </div>
          <figure className="experiences-hero__media">
            <img
              src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1400&q=80"
              alt="Curated travel experience montage"
            />
            <figcaption>
              Private cinematic retreats, coordinated by StayVista concierge teams worldwide.
            </figcaption>
          </figure>
        </section>

        <section className="experiences-grid" aria-label="Featured experiences">
          {EXPERIENCES.map((experience) => (
            <article className="experience-card" key={experience.id}>
              <div className="experience-card__media">
                <img src={experience.image} alt={experience.title} />
                <span className="experience-card__badge">Bespoke</span>
              </div>
              <div className="experience-card__body">
                <div className="experience-card__header">
                  <h2>{experience.title}</h2>
                  <p className="experience-card__location">{experience.location}</p>
                </div>
                <p className="experience-card__description">{experience.description}</p>
                <div className="experience-card__meta">
                  <span>{experience.duration}</span>
                  <div className="experience-card__tags">
                    {experience.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="experiences-cta">
          <div>
            <h2>Design your next signature stay</h2>
            <p>
              Collaborate with our concierge leads to produce unforgettable itineraries, complete with
              chartered travel, local artisans, and immersive storytelling.
            </p>
          </div>
          <button type="button" className="btn-primary">
            Connect with concierge
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Experiences;
