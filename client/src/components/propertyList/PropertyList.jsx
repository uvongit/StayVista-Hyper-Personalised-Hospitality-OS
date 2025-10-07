import { useEffect, useMemo, useState } from "react";
import { getHotelCountsByType } from "../../api/hotels";
import "./propertyList.css";

const gallery = [
  "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80",
];

const displayNames = {
  hotel: "Boutique hotels",
  apartment: "Designer apartments",
  resort: "Coastal resorts",
  villa: "Private villas",
  cabin: "Mountain cabins",
  guesthouse: "Guest houses",
};

const PropertyList = () => {
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCounts = async () => {
      setLoading(true);
      try {
        const data = await getHotelCountsByType();
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

  const propertyTypes = useMemo(() => {
    if (!counts.length) return [];
    return counts.map((item, index) => {
      const typeKey = item?.type?.toLowerCase();
      return {
        ...item,
        displayName: displayNames[typeKey] ?? item?.type ?? "Unique stays",
        image: gallery[index % gallery.length],
      };
    });
  }, [counts]);

  return (
    <section className="property-list container">
      {loading ? (
        <div className="property-list__status">Loading property collections…</div>
      ) : error ? (
        <div className="property-list__status property-list__status--error">
          We couldn’t load property types. Please refresh to try again.
        </div>
      ) : propertyTypes.length === 0 ? (
        <div className="property-list__status">No property collections found.</div>
      ) : (
        <div className="property-list__grid">
          {propertyTypes.map((item) => (
            <article className="property-card" key={item.type}>
              <div className="property-card__media">
                <img
                  src={item.image}
                  alt={`${item.displayName}`}
                  className="property-card__image"
                />
                <span className="property-card__pill">
                  {item.count ?? 0}+ curated stays
                </span>
              </div>
              <div className="property-card__content">
                <h3 className="property-card__title">{item.displayName}</h3>
                <p className="property-card__meta">
                  Explore {item.count ?? 0} {item.type?.toLowerCase() ?? "homes"} designed for restorative escapes.
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default PropertyList;
