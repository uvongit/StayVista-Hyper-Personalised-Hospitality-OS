import { useEffect, useState } from "react";
import { getHotelCountsByCity } from "../../api/hotels";
import "./featured.css";

const Featured = () => {
  const [counts, setCounts] = useState([0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCounts = async () => {
      setLoading(true);
      try {
        const data = await getHotelCountsByCity(["berlin", "madrid", "london"]);
        if (!isMounted) return;
        setCounts(Array.isArray(data) ? data : []);
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
    fetchCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="featured container">
      {loading ? (
        <div className="featured__loading">Loading curated destinations…</div>
      ) : error ? (
        <div className="featured__error">We couldn’t load featured destinations. Please try again shortly.</div>
      ) : (
        <div className="featured__grid">
          {["Berlin", "Madrid", "London"].map((city, index) => (
            <article className="featured__card" key={city}>
              <div className="featured__overlay" />
              <img
                src={
                  [
                    "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1200&q=80",
                    "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1200&q=80",
                    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80",
                  ][index]
                }
                alt={`${city} skyline`}
                className="featured__image"
              />
              <div className="featured__content">
                <span className="featured__eyebrow">City spotlight</span>
                <h3 className="featured__title">{city}</h3>
                <p className="featured__meta">{counts[index] ?? 0} curated stays</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Featured;
