import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFeaturedHotels } from "../../api/hotels";
import ImageCarousel from "../carousel/ImageCarousel";
import "./featuredProperties.css";

const FeaturedProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFeatured = async () => {
      setLoading(true);
      try {
        const data = await getFeaturedHotels();
        if (!isMounted) return;
        setProperties(Array.isArray(data) ? data : []);
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

    fetchFeatured();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredList = properties;

  const getImages = (item) => {
    if (!Array.isArray(item?.photos) || !item.photos.length) {
      return [
        "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80",
      ];
    }
    const filtered = item.photos.filter(Boolean);
    return filtered.length
      ? filtered
      : [
          "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80",
        ];
  };

  return (
    <section className="featured-properties container">
      {loading ? (
        <div className="featured-properties__status">Showcasing elevated stays…</div>
      ) : error ? (
        <div className="featured-properties__status featured-properties__status--error">
          Unable to load featured properties at this moment.
        </div>
      ) : featuredList.length === 0 ? (
        <div className="featured-properties__status">No featured properties available.</div>
      ) : (
        <div className="featured-properties__grid">
          {featuredList.map((item) => (
            <article className="fp-card" key={item._id}>
              <div className="fp-card__media">
                <ImageCarousel
                  images={getImages(item)}
                  altPrefix={item.name}
                  className="fp-card__carousel"
                  aspect="4 / 3"
                />
                {typeof item.rating === "number" && !Number.isNaN(item.rating) && (
                  <span className="fp-card__rating">
                    {item.rating.toFixed(1)}
                    <small>Guest score</small>
                  </span>
                )}
              </div>
              <div className="fp-card__content">
                <h3 className="fp-card__title">{item.name}</h3>
                <span className="fp-card__location">{item.city}</span>
                <p className="fp-card__desc">
                  {item.desc || "An elevated stay curated by StayVista."}
                </p>
                <div className="fp-card__footer">
                  <div>
                    <span className="fp-card__price-label">From</span>
                    <span className="fp-card__price">₹{item.cheapestPrice}</span>
                    <span className="fp-card__price-note">per night</span>
                  </div>
                  <Link to={`/hotels/${item._id}`} className="btn-outline fp-card__action">
                    View stay
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedProperties;
