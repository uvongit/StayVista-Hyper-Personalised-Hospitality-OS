import "./footer.css";

const navigation = [
  {
    title: "Company",
    links: ["About", "Leadership", "Careers", "Press"],
  },
  {
    title: "Collections",
    links: [
      "Signature residences",
      "Boutique escapes",
      "Wellness retreats",
      "Urban penthouses",
    ],
  },
  {
    title: "Services",
    links: [
      "Concierge",
      "Event staging",
      "Travel design",
      "Corporate stays",
    ],
  },
];

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__glow" aria-hidden="true" />
      <div className="footer__inner container">
        <section className="footer__main">
          <div className="footer__brand">
            <div className="footer__logo-wrap">
              <img src="/Icon.ico" alt="StayVista logo" className="footer__logo" />
            </div>
            <div className="footer__brand-copy">
              <span className="footer__eyebrow">StayVista Collective</span>
              <h2 className="footer__title">Signature stays, refined for modern travelers.</h2>
              <p className="footer__subtitle">
                Bespoke villas and curated experiences, orchestrated by our concierge teams across 40+ destinations.
              </p>
              <form className="footer__newsletter-inline">
                <input type="email" placeholder="you@example.com" aria-label="Email" required />
                <button type="submit" className="btn-primary btn-primary--compact">
                  Join
                </button>
              </form>
            </div>
          </div>

          <div className="footer__nav-groups">
            {navigation.map((group) => (
              <div className="footer__column" key={group.title}>
                <h3 className="footer__column-title">{group.title}</h3>
                <ul className="footer__link-list">
                  {group.links.map((link) => (
                    <li key={link}>
                      <button type="button" className="footer__link footer__link--button">
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="footer__meta">
            <div className="footer__contact">
              <h3>Concierge desk</h3>
              <p>Speak with our travel designers any time.</p>
              <span>+91 98765 43210</span>
              <span>concierge@stayvista.com</span>
            </div>
            <div className="footer__chips">
              <span className="footer__chip">24/7 concierge</span>
              <span className="footer__chip">Global hosts</span>
            </div>
          </div>
        </section>

        <section className="footer__base">
          <div className="footer__legal">
            <span>© {new Date().getFullYear()} StayVista. All rights reserved.</span>
            <div className="footer__policies">
              <button type="button" className="footer__link footer__link--button">
                Privacy
              </button>
              <button type="button" className="footer__link footer__link--button">
                Terms
              </button>
              <button type="button" className="footer__link footer__link--button">
                Cookies
              </button>
            </div>
          </div>
          <div className="footer__badge-list">
            <span className="footer__badge-item">Global concierge collective</span>
            <span className="footer__badge-item">Forbes Travel Guide Partner</span>
            <span className="footer__badge-item">Carbon-neutral operations</span>
          </div>
          <div className="footer__signature" aria-label="Signature">
            <span className="footer__signature-text">UtkarshV</span>
          </div>
        </section>
      </div>
    </footer>
  );
};

export default Footer;
