import { faBed, faCalendarDays, faPerson } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./header.css";
import { DateRange } from "react-date-range";
import { useContext, useMemo, useState } from "react";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { SearchContext } from "../../context/SearchContext";
import { AuthContext } from "../../context/AuthContext";
import HeroNav from "./HeroNav";

const listHighlights = ["Handpicked stays", "Transparent pricing", "Travel concierge"];

const Header = ({ type, onPlanClick, variant }) => {
  const [destination, setDestination] = useState("");
  const [openDate, setOpenDate] = useState(false);
  const [dates, setDates] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [openOptions, setOpenOptions] = useState(false);
  const [options, setOptions] = useState({
    adult: 1,
    children: 0,
    room: 1,
  });

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { dispatch } = useContext(SearchContext);

  const dateLabel = useMemo(
    () =>
      `${format(dates[0].startDate, "MMM dd, yyyy")} – ${format(
        dates[0].endDate,
        "MMM dd, yyyy"
      )}`,
    [dates]
  );

  const optionsLabel = useMemo(
    () =>
      `${options.adult} adult${options.adult > 1 ? "s" : ""} · ${
        options.children
      } children · ${options.room} room${options.room > 1 ? "s" : ""}`,
    [options]
  );

  const handleOption = (name, operation) => {
    setOptions((prev) => {
      const nextValue =
        operation === "i" ? prev[name] + 1 : Math.max(0, prev[name] - 1);
      return {
        ...prev,
        [name]: nextValue,
      };
    });
  };

  const handleSearch = () => {
    const payload = {
      city: destination,
      destination,
      dates,
      options,
    };
    dispatch({ type: "NEW_SEARCH", payload });
    navigate("/hotels", { state: { destination, dates, options } });
  };

  const isList = type === "list";

  const isMinimal = variant === "minimal";

  return (
    <section className={`hero ${isList ? "hero--compact" : ""} ${isMinimal ? "hero--minimal" : ""}`}>
      <div className="hero__background" aria-hidden="true" />
      <div className={`hero__content container ${isList ? "hero__content--wide" : "hero__content--compact"}`}>
        {isList ? (
          <div className="hero__list-surface">
            <div className="hero__list-top">
              <div className="hero__list-heading">
                <span className="hero__list-eyebrow">Curated getaways</span>
                <h1 className="hero__list-title">Signature stays crafted for discerning journeys</h1>
                <p className="hero__list-subtitle">
                  Explore private villas, design-forward hotels, and concierge-led residences across our global collection.
                </p>
                <div className="hero__list-highlights">
                  {listHighlights.map((highlight) => (
                    <span className="hero__list-highlight" key={highlight}>
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
              {onPlanClick ? (
                <button type="button" className="hero__list-plan" onClick={onPlanClick}>
                  <span>Plan your stay</span>
                  <span aria-hidden="true" className="hero__list-plan-icon">↓</span>
                </button>
              ) : null}
            </div>
            <HeroNav variant="list" />
          </div>
        ) : (
          <>
            <div className="hero__top">
              <div className="hero__meta">
                <span className="badge">Curated getaways</span>
                <div className="chip-set hero__chip-set">
                  <span className="chip">Handpicked stays</span>
                  <span className="chip">Transparent pricing</span>
                  <span className="chip">Travel concierge</span>
                </div>
              </div>
              <h1 className="hero__title">Welcome to StayVista</h1>
              <p className="hero__subtitle">
                Discover boutique stays, luxury villas, and immersive experiences tailored to the way you travel.
              </p>
              {!user && (
                <div className="hero__actions">
                  <button type="button" className="btn-primary">
                    Unlock member rates
                  </button>
                  <button type="button" className="btn-outline">
                    Explore benefits
                  </button>
                </div>
              )}
            </div>
            <HeroNav />
            <div className="hero__search shadow-card">
              <div className="hero__search-grid">
                <label className="hero__field">
                  <span className="hero__field-label">Destination</span>
                  <div className="hero__field-input">
                    <FontAwesomeIcon icon={faBed} className="hero__field-icon" />
                    <input
                      type="text"
                      placeholder="Where are you going?"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>
                </label>
                <button
                  type="button"
                  className="hero__field hero__field--button"
                  onClick={() => setOpenDate((prev) => !prev)}
                >
                  <span className="hero__field-label">Dates</span>
                  <div className="hero__field-input">
                    <FontAwesomeIcon icon={faCalendarDays} className="hero__field-icon" />
                    <span>{dateLabel}</span>
                  </div>
                </button>
                <button
                  type="button"
                  className="hero__field hero__field--button"
                  onClick={() => setOpenOptions((prev) => !prev)}
                >
                  <span className="hero__field-label">Guests & rooms</span>
                  <div className="hero__field-input">
                    <FontAwesomeIcon icon={faPerson} className="hero__field-icon" />
                    <span>{optionsLabel}</span>
                  </div>
                </button>
                <div className="hero__cta">
                  <button type="button" className="btn-primary hero__submit" onClick={handleSearch}>
                    Search stays
                  </button>
                </div>
              </div>

              {openDate && (
                <div className="hero__popover hero__popover--dates" role="dialog">
                  <DateRange
                    editableDateInputs
                    onChange={(item) => setDates([item.selection])}
                    moveRangeOnFirstSelection={false}
                    ranges={dates}
                    className="hero__date-picker"
                    minDate={new Date()}
                  />
                  <button type="button" className="btn-outline hero__popover-close" onClick={() => setOpenDate(false)}>
                    Done
                  </button>
                </div>
              )}

              {openOptions && (
                <div className="hero__popover hero__popover--options" role="dialog">
                  {[
                    { key: "adult", label: "Adults", min: 1 },
                    { key: "children", label: "Children", min: 0 },
                    { key: "room", label: "Rooms", min: 1 },
                  ].map(({ key, label, min }) => (
                    <div className="hero__option-row" key={key}>
                      <span className="hero__option-label">{label}</span>
                      <div className="hero__option-counter">
                        <button
                          type="button"
                          className="hero__option-button"
                          onClick={() => handleOption(key, "d")}
                          disabled={options[key] <= min}
                          aria-label={`Decrease ${label}`}
                        >
                          −
                        </button>
                        <span className="hero__option-value">{options[key]}</span>
                        <button
                          type="button"
                          className="hero__option-button"
                          onClick={() => handleOption(key, "i")}
                          aria-label={`Increase ${label}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Header;
