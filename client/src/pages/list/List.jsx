import "./list.css";
import Navbar from "../../components/navbar/Navbar";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import ImageCarousel from "../../components/carousel/ImageCarousel";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState, useRef, useContext } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { DateRange } from "react-date-range";
import { getHotels } from "../../api/hotels";
import { SearchContext } from "../../context/SearchContext";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80";

const collectionHighlights = [
  {
    title: "Iconic city penthouses",
    description: "Skyline salons, private mixologists, and rooftop hydrotherapy suites with curated city guides.",
    stat: "18 residences",
  },
  {
    title: "Seaside sanctuaries",
    description: "Clifftop infinity pools, dedicated beach sommeliers, and sunrise wellness rituals on private shores.",
    stat: "26 coastal villas",
  },
  {
    title: "Forest immersion lodges",
    description: "Glass-canopied suites, naturalist-led night safaris, and chef-driven farm-to-table feasts.",
    stat: "12 nature retreats",
  },
];

const List = () => {
  const location = useLocation();
  const locationState = useMemo(() => location.state ?? {}, [location.state]);
  const plannerRef = useRef(null);
  const [destination, setDestination] = useState(locationState.destination ?? "");
  const [dates, setDates] = useState(
    locationState.dates ?? [
      {
        startDate: new Date(),
        endDate: new Date(),
        key: "selection",
      },
    ]
  );
  const [openDate, setOpenDate] = useState(false);
  const [min, setMin] = useState(locationState.min ?? "");
  const [max, setMax] = useState(locationState.max ?? "");
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState({
    city: locationState.destination ?? "",
    min: locationState.min,
    max: locationState.max,
  });
  const [sortOption, setSortOption] = useState("recommended");
  const { dispatch } = useContext(SearchContext);

  useEffect(() => {
    const payload = {
      city: locationState.destination ?? "",
      destination: locationState.destination ?? "",
      dates: locationState.dates ?? dates,
      options: locationState.options,
    };
    dispatch({ type: "NEW_SEARCH", payload });
  }, [locationState.destination, locationState.dates, locationState.options, dates, dispatch]);

  useEffect(() => {
    let isMounted = true;

    const fetchHotels = async () => {
      setLoading(true);
      try {
        const response = await getHotels({
          city: searchParams.city,
          min: searchParams.min,
          max: searchParams.max,
        });
        if (!isMounted) return;
        setHotels(Array.isArray(response) ? response : []);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHotels();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const parseNumber = (value) => {
    if (value === "" || value === null || typeof value === "undefined") return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const handleSearch = () => {
    const payload = {
      city: destination,
      destination,
      dates,
      options: {
        adult: locationState.options?.adult ?? 1,
        children: locationState.options?.children ?? 0,
        room: locationState.options?.room ?? 1,
      },
    };
    dispatch({ type: "NEW_SEARCH", payload });
    setSearchParams({
      city: destination,
      min: parseNumber(min),
      max: parseNumber(max),
    });
    setOpenDate(false);
  };

  const handleResetFilters = () => {
    setDestination("");
    const today = new Date();
    setDates([
      {
        startDate: today,
        endDate: today,
        key: "selection",
      },
    ]);
    setMin("");
    setMax("");
    dispatch({ type: "RESET_SEARCH" });
    setSearchParams({ city: "", min: undefined, max: undefined });
    setOpenDate(false);
  };

  const nights = useMemo(() => {
    const start = dates?.[0]?.startDate ? new Date(dates[0].startDate) : null;
    const end = dates?.[0]?.endDate ? new Date(dates[0].endDate) : null;
    if (!start || !end) return 1;
    const diff = differenceInCalendarDays(end, start);
    return Math.max(diff || 1, 1);
  }, [dates]);

  const dateLabel = useMemo(() => {
    const start = dates?.[0]?.startDate;
    const end = dates?.[0]?.endDate;
    if (!start || !end) {
      return "Select travel dates";
    }
    return `${format(new Date(start), "dd MMM yyyy")} — ${format(new Date(end), "dd MMM yyyy")}`;
  }, [dates]);

  const destinationLabel = useMemo(() => {
    if (destination?.trim()) return destination.trim();
    if (searchParams.city?.trim()) return searchParams.city.trim();
    return "our global collection";
  }, [destination, searchParams.city]);

  const heroStats = useMemo(() => {
    const totalStays = hotels.length;

    const ratingValues = hotels
      .map((hotel) => Number(hotel.rating))
      .filter((rating) => Number.isFinite(rating));
    const averageRating = ratingValues.length
      ? (
          ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length
        ).toFixed(1)
      : null;
    const averageRatingDisplay = averageRating ?? "4.9";

    const formatNumber = new Intl.NumberFormat("en-IN");

    return [
      {
        label: "Stays curated",
        value: formatNumber.format(totalStays),
      },
      {
        label: "Avg. guest rating",
        value: `${averageRatingDisplay}/5`,
        variant: "rating",
        icon: "★",
      },
    ];
  }, [hotels]);

  const sortedHotels = useMemo(() => {
    const hotelsCopy = [...hotels];
    switch (sortOption) {
      case "highestRated":
        return hotelsCopy.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
      case "priceLowHigh":
        return hotelsCopy.sort(
          (a, b) => (Number(a.cheapestPrice) || Infinity) - (Number(b.cheapestPrice) || Infinity)
        );
      case "priceHighLow":
        return hotelsCopy.sort(
          (a, b) => (Number(b.cheapestPrice) || 0) - (Number(a.cheapestPrice) || 0)
        );
      default:
        return hotelsCopy.sort((a, b) => {
          const ratingDiff = (Number(b.rating) || 0) - (Number(a.rating) || 0);
          if (ratingDiff !== 0) return ratingDiff;
          return (Number(a.cheapestPrice) || Infinity) - (Number(b.cheapestPrice) || Infinity);
        });
    }
  }, [hotels, sortOption]);

  const getHotelImages = (hotel) => {
    if (!hotel?.photos?.length) {
      return [FALLBACK_IMAGE];
    }
    const validPhotos = hotel.photos.filter(Boolean);
    return validPhotos.length ? validPhotos : [FALLBACK_IMAGE];
  };

  const scrollToPlanner = () => {
    if (plannerRef.current) {
      plannerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const renderHotelCard = (hotel) => {
    const highlightTags = [
      hotel.type && hotel.type.replace(/^[a-z]/, (char) => char.toUpperCase()),
      hotel.distance && `${hotel.distance} from centre`,
      hotel.city && `Located in ${hotel.city}`,
    ].filter(Boolean);

    const formattedPrice = Number.isFinite(Number(hotel.cheapestPrice))
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(Number(hotel.cheapestPrice))
      : null;

    return (
      <article className="stay-card" key={hotel._id}>
        <div className="stay-card__media">
          <ImageCarousel
            images={getHotelImages(hotel)}
            altPrefix={hotel.name}
            className="stay-card__carousel"
            aspect="4 / 3"
          />
          <div className="stay-card__badges">
            {typeof hotel.rating === "number" && !Number.isNaN(hotel.rating) && (
              <span className="stay-card__badge stay-card__badge--rating">
                {hotel.rating.toFixed(1)}
              </span>
            )}
            {highlightTags[0] && <span className="stay-card__badge">{highlightTags[0]}</span>}
          </div>
        </div>
        <div className="stay-card__body">
          <div>
            <div className="stay-card__top">
              <div className="stay-card__heading">
                <h3>{hotel.name}</h3>
                <span className="stay-card__location">{hotel.city}</span>
              </div>
              {formattedPrice && (
                <span className="stay-card__price-pill">
                  <span className="stay-card__price-label">Starting from</span>
                  <span className="stay-card__price-value">{formattedPrice}</span>
                </span>
              )}
            </div>
            <p className="stay-card__description">
              {hotel.desc || "An immersive StayVista residence with bespoke concierge attention."}
            </p>
            {highlightTags.length > 1 && (
              <div className="stay-card__tags">
                {highlightTags.slice(1).map((tag) => (
                  <span className="stay-card__tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="stay-card__footer">
            <div className="stay-card__pricing">
              <span className="stay-card__note">StayVista concierge & daily rituals included</span>
            </div>
            <Link to={`/hotels/${hotel._id}`} className="stay-card__cta">
              View details
            </Link>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="stays">
      <Navbar />
      <Header type="list" onPlanClick={scrollToPlanner} />

      <section className="stays__hero">
        <div className="stays__hero-background" aria-hidden="true" />
        <div className="stays__hero-content container">
          <div className="stays__hero-text">
            <span className="stays__eyebrow">StayVista Sophisticated Stays</span>
            <h1 className="stays__title">Curated stays in {destinationLabel}</h1>
            <p className="stays__subtitle">
              Discover private villas, refined boutique hotels, and experiences crafted for the way you travel.
            </p>
          </div>
          <div className="stays__hero-stats">
            {heroStats.map((stat) => (
              <div
                className={`stays__hero-card${stat.variant ? ` stays__hero-card--${stat.variant}` : ""}`}
                key={stat.label}
              >
                <span className="stays__hero-value">
                  {stat.icon ? (
                    <span className="stays__hero-icon" aria-hidden="true">
                      {stat.icon}
                    </span>
                  ) : null}
                  {stat.value}
                </span>
                <span className="stays__hero-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="stays__body container">
        <section className="stays__filters stays__filters--inline" ref={plannerRef}>
          <div className="stays__filters-bar">
            <div className="stays__filters-intro">
              <span className="stays__filters-eyebrow">Tailor the collection</span>
              <h2>Plan your stay</h2>
              <p>
                Fine-tune the destination, timing, and investment to reveal residences aligned with your travel rhythm.
              </p>
            </div>
          </div>

          <div className="stays__filters-grid">
            <div className="stays__field stays__field--span2">
              <label htmlFor="destination">Destination</label>
              <input
                id="destination"
                type="text"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="e.g. Goa, Maldives, Tuscany"
                className="stays__input"
              />
            </div>

            <div className="stays__field stays__field--span2 stays__field--with-popover">
              <label>Dates</label>
              <button
                type="button"
                className="stays__date-button"
                onClick={() => setOpenDate((prev) => !prev)}
              >
                {dateLabel}
              </button>
              {openDate && (
                <div className="stays__date-popover">
                  <DateRange
                    onChange={(item) => setDates([item.selection])}
                    minDate={new Date()}
                    ranges={dates}
                    rangeColors={["#1d4ed8"]}
                  />
                  <button
                    type="button"
                    className="stays__popover-close"
                    onClick={() => setOpenDate(false)}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            <div className="stays__field stays__field--inline">
              <div className="stays__field-item">
                <label htmlFor="min-price">Minimum rate (₹)</label>
                <input
                  id="min-price"
                  type="number"
                  value={min}
                  onChange={(event) => setMin(event.target.value)}
                  className="stays__input"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div className="stays__field-item">
                <label htmlFor="max-price">Maximum rate (₹)</label>
                <input
                  id="max-price"
                  type="number"
                  value={max}
                  onChange={(event) => setMax(event.target.value)}
                  className="stays__input"
                  min="0"
                  placeholder="100000"
                />
              </div>
            </div>

            <div className="stays__field stays__field--span2">
              <label>Quick filters</label>
              <div className="stays__chips">
                {[
                  "Private villas",
                  "Design-led hotels",
                  "Seaside escapes",
                  "Wellness sanctuaries",
                ].map((label) => (
                  <button type="button" className="stays__chip" key={label}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="stays__filters-actions stays__filters-actions--inline">
            <button type="button" className="stays__apply" onClick={handleSearch}>
              Apply filters
            </button>
            <button type="button" className="stays__reset" onClick={handleResetFilters}>
              Reset filters
            </button>
          </div>
        </section>

        <section className="stays__results">
          <div className="stays__results-header">
            <div>
              <span className="stays__results-eyebrow">{sortedHotels.length} curated stays</span>
              <h2>Bespoke stays tailored to your journey</h2>
              <p>
                Rates shown are for {nights} night{nights > 1 ? "s" : ""}. Adjust filters to reveal more private homes and design-forward hotels.
              </p>
            </div>
            <div className="stays__results-toolbar">
              <div className="stays__sort">
                <label htmlFor="sort">Sort by</label>
                <select
                  id="sort"
                  value={sortOption}
                  onChange={(event) => setSortOption(event.target.value)}
                >
                  <option value="recommended">Recommended</option>
                  <option value="highestRated">Guest rating</option>
                  <option value="priceLowHigh">Price: low to high</option>
                  <option value="priceHighLow">Price: high to low</option>
                </select>
              </div>
              <div className="stays__legend">
                <span className="stays__legend-dot" />
                <span>Rates inclusive of concierge and daily breakfast amenities.</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="stays__grid stays__grid--loading">
              {[0, 1, 2].map((index) => (
                <div className="stay-card stay-card--skeleton" key={index}>
                  <div className="stay-card__media" />
                  <div className="stay-card__body" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="stays__status stays__status--error">
              We couldn’t load stays right now. Please refresh to try again.
            </div>
          ) : sortedHotels.length === 0 ? (
            <div className="stays__status">
              We couldn’t find stays matching your criteria. Adjust the filters to explore more of the collection.
            </div>
          ) : (
            <div className="stays__grid">
              {sortedHotels.map((hotel) => renderHotelCard(hotel))}
            </div>
          )}

          {sortedHotels.length > 0 && (
            <section className="stays__collections">
              <header className="stays__collections-header">
                <span className="stays__results-eyebrow">Our editor's picks</span>
                <h3>Featured StayVista collections</h3>
                <p>
                  Each collection is meticulously curated by our travel design team to highlight unique architecture, service rituals, and inspiring locales.
                </p>
              </header>
              <div className="stays__collections-grid">
                {collectionHighlights.map((item) => (
                  <article className="stays__collection-card" key={item.title}>
                    <div className="stays__collection-body">
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </div>
                    <span className="stays__collection-stat">{item.stat}</span>
                  </article>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default List;
