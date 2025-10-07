import "./mailList.css";

const MailList = () => {
  return (
    <section className="mail">
      <div className="mail__background" aria-hidden="true" />
      <div className="mail__inner container shadow-card">
        <div className="mail__content">
          <span className="badge">Insider access</span>
          <h2 className="mail__title">Stay in the know with curated travel intel.</h2>
          <p className="mail__subtitle">
            Join our newsletter for seasonal inspiration, exclusive launch offers, and white-glove concierge guidance.
          </p>
          <div className="mail__perks">
            <span className="mail__perk">Handpicked destination guides</span>
            <span className="mail__perk">Flash offers up to 30% off</span>
            <span className="mail__perk">Personal travel concierge</span>
          </div>
        </div>
        <form className="mail__form" onSubmit={(event) => event.preventDefault()}>
          <label className="mail__label" htmlFor="newsletter-email">
            Email address
          </label>
          <div className="mail__input-group">
            <input
              id="newsletter-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              aria-label="Email address"
            />
            <button type="submit" className="btn-primary mail__submit">
              Subscribe
            </button>
          </div>
          <p className="mail__disclaimer">
            We respect your inbox. Expect one thoughtfully designed dispatch each month.
          </p>
        </form>
      </div>
    </section>
  );
};

export default MailList;