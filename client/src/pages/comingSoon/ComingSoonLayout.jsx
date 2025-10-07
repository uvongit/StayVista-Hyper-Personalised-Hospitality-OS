import "./comingSoon.css";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import { Link } from "react-router-dom";
import HeroNav from "../../components/header/HeroNav";

const ComingSoonLayout = ({
  eyebrow,
  title,
  description,
  eta,
  features = [],
  highlights = [],
  metrics = [],
  accent = "#2563eb",
  accentGradient = "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
  backgroundImage = "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=2000&q=80",
  primaryAction,
  secondaryAction,
}) => {
  const primary = primaryAction ?? { label: "Browse stays", to: "/hotels" };
  const secondary = secondaryAction ?? { label: "Return home", to: "/" };

  const themeStyles = {
    "--coming-accent": accent,
    "--coming-accent-gradient": accentGradient,
    "--coming-bg-image": `url('${backgroundImage}')`,
  };

  return (
    <div className="coming-soon" style={themeStyles}>
      <Navbar />
      <main className="coming-soon__hero">
        <div className="coming-soon__background" aria-hidden="true" />
        <div className="coming-soon__content container">
          <HeroNav variant="list" className="coming-soon__nav" />
          <section className="coming-soon__panel shadow-card">
            <span className="coming-soon__eyebrow">{eyebrow}</span>
            <h1 className="coming-soon__title">{title}</h1>
            <p className="coming-soon__description">{description}</p>
            {eta ? <span className="coming-soon__eta">{eta}</span> : null}
            {highlights.length > 0 && (
              <ul className="coming-soon__highlights">
                {highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            )}
            <div className="coming-soon__actions">
              <Link to={primary.to} className="coming-soon__btn coming-soon__btn--primary">
                {primary.label}
              </Link>
              {secondary && secondary.to ? (
                <Link to={secondary.to} className="coming-soon__btn coming-soon__btn--ghost">
                  {secondary.label}
                </Link>
              ) : null}
            </div>
          </section>

          {metrics.length > 0 && (
            <section className="coming-soon__metrics">
              {metrics.map(({ label: metricLabel, value, caption }) => (
                <article className="coming-soon__metric-card" key={metricLabel}>
                  <span className="coming-soon__metric-value">{value}</span>
                  <span className="coming-soon__metric-label">{metricLabel}</span>
                  {caption ? <p>{caption}</p> : null}
                </article>
              ))}
            </section>
          )}

          {features.length > 0 && (
            <section className="coming-soon__features">
              {features.map(({ title: featureTitle, description: featureDesc }) => (
                <article className="coming-soon__feature-card" key={featureTitle}>
                  <h3>{featureTitle}</h3>
                  <p>{featureDesc}</p>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ComingSoonLayout;
