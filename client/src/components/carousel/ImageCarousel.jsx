import { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import "./imageCarousel.css";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1600&q=80";

const ImageCarousel = ({
  images,
  altPrefix,
  className = "",
  aspect = "4 / 3",
  showIndicators = true,
  showControls = true,
}) => {
  const media = useMemo(() => {
    if (!Array.isArray(images) || images.length === 0) {
      return [FALLBACK_IMAGE];
    }
    const filtered = images.filter(Boolean);
    return filtered.length ? filtered : [FALLBACK_IMAGE];
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = useCallback(
    (index) => {
      setActiveIndex((prev) => {
        const total = media.length;
        if (!total) return 0;
        if (index < 0) {
          return (total + (index % total)) % total;
        }
        return index % total;
      });
    },
    [media.length]
  );

  const handleNext = useCallback(() => {
    goTo((activeIndex + 1) % media.length);
  }, [activeIndex, goTo, media.length]);

  const handlePrev = useCallback(() => {
    goTo(activeIndex - 1);
  }, [activeIndex, goTo]);

  const containerClass = ["image-carousel", className].filter(Boolean).join(" ");

  return (
    <div className={containerClass} style={{ aspectRatio: aspect }}>
      {showControls && media.length > 1 ? (
        <>
          <button
            type="button"
            className="image-carousel__control image-carousel__control--prev"
            onClick={handlePrev}
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            className="image-carousel__control image-carousel__control--next"
            onClick={handleNext}
            aria-label="Next image"
          >
            ›
          </button>
        </>
      ) : null}

      <div className="image-carousel__viewport">
        {media.map((src, index) => (
          <img
            key={`${src}-${index}`}
            src={src}
            alt={`${altPrefix} view ${index + 1}`}
            className={`image-carousel__slide${index === activeIndex ? " is-active" : ""}`}
            loading={index === 0 ? "eager" : "lazy"}
          />
        ))}
      </div>

      {showIndicators && media.length > 1 ? (
        <div className="image-carousel__indicators">
          {media.map((_, index) => (
            <button
              type="button"
              key={index}
              className={`image-carousel__indicator${index === activeIndex ? " is-active" : ""}`}
              onClick={() => goTo(index)}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

ImageCarousel.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string),
  altPrefix: PropTypes.string.isRequired,
  className: PropTypes.string,
  aspect: PropTypes.string,
  showIndicators: PropTypes.bool,
  showControls: PropTypes.bool,
};

export default ImageCarousel;
