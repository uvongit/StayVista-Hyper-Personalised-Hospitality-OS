import "./hotel.css";
import Navbar from "../../components/navbar/Navbar";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleArrowLeft,
  faCircleArrowRight,
  faCircleXmark,
  faCalendarAlt,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SearchContext } from "../../context/SearchContext";
import { AuthContext } from "../../context/AuthContext";
import Reserve from "../../components/reserve/Reserve";
import { getHotelById, getHotelRooms } from "../../api/hotels";
import ImageCarousel from "../../components/carousel/ImageCarousel";

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

const computeRange = (input = {}) => {
  const now = new Date();
  const candidateCheckIn = input.checkIn ? new Date(input.checkIn) : now;
  const checkIn = Number.isNaN(candidateCheckIn.getTime()) ? now : candidateCheckIn;
  const defaultCheckOut = new Date(checkIn.getTime() + MILLISECONDS_PER_DAY);
  const candidateCheckOut = input.checkOut ? new Date(input.checkOut) : defaultCheckOut;
  let checkOut = Number.isNaN(candidateCheckOut.getTime()) ? defaultCheckOut : candidateCheckOut;
  if (checkOut <= checkIn) {
    checkOut = new Date(checkIn.getTime() + MILLISECONDS_PER_DAY);
  }
  return { checkIn, checkOut };
};

const formatDateForInput = (date) => date.toISOString().split("T")[0];

const normalizeGuests = (input = {}) => {
  const adult = Number(input.adult) || 1;
  const children = Number(input.children) || 0;
  const room = Number(input.room) || 1;
  return {
    adult: Math.max(1, adult),
    children: Math.max(0, children),
    room: Math.max(1, room),
  };
};

const guestControlConfig = [
  { key: "adult", label: "Adults", description: "Ages 13+", min: 1 },
  { key: "children", label: "Children", description: "Ages 2-12", min: 0 },
  { key: "room", label: "Rooms", description: "Suites required", min: 1 },
];

const Hotel = () => {
  const location = useLocation();
  const id = location.pathname.split("/")[2];
  const [slideNumber, setSlideNumber] = useState(0);
  const [open, setOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const isMountedRef = useRef(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const { city, dates: contextDates, options: contextOptions, dispatch } = useContext(SearchContext);

  const [selectedDates, setSelectedDates] = useState(() =>
    computeRange({
      checkIn: contextDates?.[0]?.startDate,
      checkOut: contextDates?.[0]?.endDate,
    })
  );

  const [selectedGuests, setSelectedGuests] = useState(() => normalizeGuests(contextOptions));

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [id]);

  useEffect(() => {
    const nextRange = computeRange({
      checkIn: contextDates?.[0]?.startDate,
      checkOut: contextDates?.[0]?.endDate,
    });

    setSelectedDates((prev) => {
      if (
        prev.checkIn.getTime() === nextRange.checkIn.getTime() &&
        prev.checkOut.getTime() === nextRange.checkOut.getTime()
      ) {
        return prev;
      }
      return nextRange;
    });
  }, [contextDates]);

  useEffect(() => {
    setSelectedGuests(normalizeGuests(contextOptions));
  }, [contextOptions]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchHotel = async () => {
      setLoading(true);
      try {
        const result = await getHotelById(id);
        if (!isMounted) return;
        setHotel(result ?? null);
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

    if (id) {
      fetchHotel();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const fetchRooms = useCallback(async () => {
    if (!id || !isMountedRef.current) {
      return;
    }

    setRoomsLoading(true);
    try {
      const params = {};
      if (selectedDates.checkIn) {
        params.checkIn = formatDateForInput(selectedDates.checkIn);
      }
      if (selectedDates.checkOut) {
        params.checkOut = formatDateForInput(selectedDates.checkOut);
      }
      const response = await getHotelRooms(id, params);
      if (!isMountedRef.current) {
        return;
      }
      const roomList = Array.isArray(response?.rooms) ? response.rooms : Array.isArray(response) ? response : [];
      setRooms(roomList);
      setRoomsError(null);
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      setRoomsError(err);
    } finally {
      if (isMountedRef.current) {
        setRoomsLoading(false);
      }
    }
  }, [id, selectedDates.checkIn, selectedDates.checkOut]);

  useEffect(() => {
    if (!id) return undefined;
    fetchRooms();
    return undefined;
  }, [id, fetchRooms]);

  const dayDifference = (date1, date2) => {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / MILLISECONDS_PER_DAY);
  };

  const handleDateChange = (field, value) => {
    const next = computeRange({
      checkIn: field === "checkIn" ? value : formatDateForInput(selectedDates.checkIn),
      checkOut: field === "checkOut" ? value : formatDateForInput(selectedDates.checkOut),
    });
    setSelectedDates(next);
  };

  const handleApplyDates = () => {
    const payloadDates = [
      {
        startDate: selectedDates.checkIn,
        endDate: selectedDates.checkOut,
        key: "selection",
      },
    ];

    dispatch({
      type: "NEW_SEARCH",
      payload: {
        city,
        dates: payloadDates,
        options: selectedGuests,
      },
    });

    setShowDatePicker(false);
    fetchRooms();
  };

  const handleGuestAdjust = (key, delta) => {
    setSelectedGuests((prev) => {
      const config = guestControlConfig.find((item) => item.key === key);
      const min = config?.min ?? 0;
      const nextValue = prev[key] + delta;
      return {
        ...prev,
        [key]: Math.max(min, nextValue),
      };
    });
  };

  const handleApplyGuests = () => {
    const payloadDates = [
      {
        startDate: selectedDates.checkIn,
        endDate: selectedDates.checkOut,
        key: "selection",
      },
    ];

    dispatch({
      type: "NEW_SEARCH",
      payload: {
        city,
        dates: payloadDates,
        options: selectedGuests,
      },
    });

    setShowGuestPicker(false);
  };

  const stayStartDate = selectedDates.checkIn;
  const stayEndDate = selectedDates.checkOut;
  const days = Math.max(dayDifference(stayEndDate, stayStartDate), 1);
  const stayStartLabel = stayStartDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const stayEndLabel = stayEndDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const roomsRequested = selectedGuests.room;
  const adultCount = selectedGuests.adult;
  const childCount = selectedGuests.children;
  const guestSummaryParts = [
    `${adultCount} adult${adultCount > 1 ? "s" : ""}`,
    childCount ? `${childCount} child${childCount > 1 ? "ren" : ""}` : null,
    `${roomsRequested} room${roomsRequested > 1 ? "s" : ""}`,
  ].filter(Boolean);
  const guestSummary = guestSummaryParts.length ? guestSummaryParts.join(" • ") : `${adultCount} adult • ${roomsRequested} room`;
  const guestHighlight = `${adultCount} adult${adultCount > 1 ? "s" : ""}${
    childCount ? `, ${childCount} child${childCount > 1 ? "ren" : ""}` : ""
  }`;

  const handleMove = (direction) => {
    let newSlideNumber;

    if (direction === "l") {
      newSlideNumber = slideNumber === 0 ? 5 : slideNumber - 1;
    } else {
      newSlideNumber = slideNumber === 5 ? 0 : slideNumber + 1;
    }

    setSlideNumber(newSlideNumber);
  };

  const handleClick = () => {
    if (user) {
      fetchRooms();
      setOpenModal(true);
    } else {
      navigate("/login");
    }
  };

  const formatCurrency = (value) =>
    typeof value === "number"
      ? value.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
        })
      : "—";

  const galleryPhotos = useMemo(() => {
    if (!Array.isArray(hotel?.photos) || !hotel.photos.length) {
      return [];
    }
    return hotel.photos.filter(Boolean);
  }, [hotel?.photos]);

  const handleOpen = (index = 0) => {
    if (!galleryPhotos.length) return;
    setSlideNumber(index);
    setOpen(true);
  };

  const primaryImage = galleryPhotos[0] ?? null;
  const secondaryImages = galleryPhotos.slice(1, 5);

  const stayType = hotel?.type ? `${hotel.type.charAt(0).toUpperCase()}${hotel.type.slice(1)}` : null;
  const nightsLabel = `${days} night${days > 1 ? "s" : ""}`;

  const nightlyRate = typeof hotel?.cheapestPrice === "number" ? hotel.cheapestPrice : null;
  const estimatedTotal = (nightlyRate ?? 0) * days * roomsRequested;

  const highlightStats = [
    { label: "Stay length", value: nightsLabel },
    { label: "Guests", value: guestHighlight },
    { label: "Rooms", value: `${roomsRequested} room${roomsRequested > 1 ? "s" : ""}` },
    hotel?.distance ? { label: "From centre", value: `${hotel.distance} m` } : null,
    stayType ? { label: "Stay type", value: stayType } : null,
  ]
    .filter(Boolean)
    .slice(0, 4);

  const roomCards = useMemo(() => {
    if (!Array.isArray(rooms)) return [];
    return rooms.map((room) => {
      const photos = Array.isArray(room?.photos) ? room.photos.filter(Boolean) : [];
      return {
        ...room,
        photos: photos.length ? photos : [
          "https://images.unsplash.com/photo-1542317854-0d6bd4d815e8?auto=format&fit=crop&w=1600&q=80",
        ],
      };
    });
  }, [rooms]);

  return (
    <div className="hotel-page">
      <Navbar />
      <Header type="list" />
      <main className="hotel-main">
        {loading ? (
          <div className="hotel-state hotel-state--loading">Loading your stay…</div>
        ) : error ? (
          <div className="hotel-state hotel-state--error">Failed to load hotel details.</div>
        ) : (
          <>
            {open && galleryPhotos.length > 0 && (
              <div className="hotel-lightbox">
                <button
                  type="button"
                  className="hotel-lightbox__close"
                  onClick={() => setOpen(false)}
                  aria-label="Close gallery"
                >
                  <FontAwesomeIcon icon={faCircleXmark} />
                </button>
                <button
                  type="button"
                  className="hotel-lightbox__arrow hotel-lightbox__arrow--prev"
                  onClick={() => handleMove("l")}
                  aria-label="Previous image"
                >
                  <FontAwesomeIcon icon={faCircleArrowLeft} />
                </button>
                <div className="hotel-lightbox__image">
                  <img src={galleryPhotos[slideNumber]} alt={`Gallery ${slideNumber + 1}`} />
                </div>
                <button
                  type="button"
                  className="hotel-lightbox__arrow hotel-lightbox__arrow--next"
                  onClick={() => handleMove("r")}
                  aria-label="Next image"
                >
                  <FontAwesomeIcon icon={faCircleArrowRight} />
                </button>
              </div>
            )}
            <div className="hotel-shell">
              <section className="hotel-hero-card">
                <div className="hotel-hero-top">
                  <span className="hotel-breadcrumb">StayVista · {hotel?.city || "Destination"}</span>
                  <button type="button" className="hotel-cta" onClick={handleClick}>
                    Reserve your stay
                  </button>
                </div>
                <div className="hotel-hero-body">
                  <section className="hotel-gallery">
                    {primaryImage ? (
                      <>
                        <div className="hotel-gallery__grid">
                          <figure className="hotel-gallery__tile hotel-gallery__tile--primary" onClick={() => handleOpen(0)}>
                            <img src={primaryImage} alt={`${hotel?.name || "StayVista"} primary`} />
                            <div className="hotel-gallery__overlay">
                              <button type="button" className="hotel-gallery__view-btn">
                                <span>View Gallery</span>
                                <small>{galleryPhotos.length} photos</small>
                              </button>
                            </div>
                          </figure>
                          {secondaryImages.slice(0, 4).map((image, index) => (
                            <figure
                              className="hotel-gallery__tile hotel-gallery__tile--secondary"
                              key={image}
                              onClick={() => handleOpen(index + 1)}
                            >
                              <img src={image} alt={`${hotel?.name || "StayVista"} space ${index + 2}`} />
                              {index === 3 && galleryPhotos.length > 5 && (
                                <div className="hotel-gallery__more-overlay">
                                  <span>+{galleryPhotos.length - 5}</span>
                                </div>
                              )}
                            </figure>
                          ))}
                        </div>
                        <div className="hotel-gallery__actions">
                          <button type="button" className="hotel-gallery__view-all" onClick={() => handleOpen(0)}>
                            View All {galleryPhotos.length} Photos
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="hotel-gallery-placeholder">Imagery for this stay is coming soon.</div>
                    )}
                  </section>

                  <section className="hotel-section">
                    <div className="hotel-content-grid">
                      <div className="hotel-content-primary">
                        <h2 className="hotel-section-title">
                          {hotel?.title || "Thoughtful comforts, quietly refined"}
                        </h2>
                        <p className="hotel-overview-text">
                          {hotel?.desc ||
                            "Relax in well-appointed rooms, attentive daily service, and considered amenities designed for work, rest, and time with the people that matter."}
                        </p>
                        {highlightStats.length > 0 && (
                          <div className="hotel-highlights">
                            {highlightStats.map((item) => (
                              <div className="hotel-highlight-card" key={item.label}>
                                <span className="hotel-highlight-label">{item.label}</span>
                                <strong className="hotel-highlight-value">{item.value}</strong>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <aside className="hotel-content-aside">
                        <div className="hotel-booking-card">
                          <span className="hotel-booking-eyebrow">Stay outline</span>
                          <h3 className="hotel-booking-title">
                            {nightsLabel} · {roomsRequested} room{roomsRequested > 1 ? "s" : ""}
                          </h3>
                          <div className="hotel-booking-meta">
                            <div
                              className="hotel-date-selector"
                              onClick={() => {
                                setShowDatePicker((prev) => !prev);
                                setShowGuestPicker(false);
                              }}
                            >
                              <div className="hotel-date-group">
                                <span>Check-in</span>
                                <strong>{stayStartLabel}</strong>
                              </div>
                              <div className="hotel-date-group">
                                <span>Check-out</span>
                                <strong>{stayEndLabel}</strong>
                              </div>
                              <FontAwesomeIcon icon={faCalendarAlt} className="hotel-date-icon" />
                            </div>
                            {showDatePicker && (
                              <div className="hotel-date-picker">
                                <div className="hotel-date-inputs">
                                  <div className="hotel-date-input-group">
                                    <label>Check-in Date</label>
                                    <input
                                      type="date"
                                      value={formatDateForInput(selectedDates.checkIn)}
                                      onChange={(event) => handleDateChange("checkIn", event.target.value)}
                                      min={new Date().toISOString().split("T")[0]}
                                    />
                                  </div>
                                  <div className="hotel-date-input-group">
                                    <label>Check-out Date</label>
                                    <input
                                      type="date"
                                      value={formatDateForInput(selectedDates.checkOut)}
                                      onChange={(event) => handleDateChange("checkOut", event.target.value)}
                                      min={formatDateForInput(selectedDates.checkIn)}
                                    />
                                  </div>
                                </div>
                                <button 
                                  className="hotel-date-apply"
                                  onClick={handleApplyDates}
                                >
                                  Apply Dates
                                </button>
                              </div>
                            )}
                            <div
                              className="hotel-guest-selector"
                              onClick={() => {
                                setShowGuestPicker((prev) => !prev);
                                setShowDatePicker(false);
                              }}
                            >
                              <div className="hotel-guest-group">
                                <span>Guests & rooms</span>
                                <strong>{guestSummary}</strong>
                              </div>
                              <FontAwesomeIcon icon={faUserGroup} className="hotel-guest-icon" />
                            </div>
                            {showGuestPicker && (
                              <div className="hotel-guest-picker">
                                <div className="hotel-guest-grid">
                                  {guestControlConfig.map(({ key, label, description, min }) => (
                                    <div className="hotel-guest-row" key={key}>
                                      <div className="hotel-guest-info">
                                        <span className="hotel-guest-label">{label}</span>
                                        <small>{description}</small>
                                      </div>
                                      <div className="hotel-guest-counter">
                                        <button
                                          type="button"
                                          className="hotel-guest-button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            handleGuestAdjust(key, -1);
                                          }}
                                          disabled={selectedGuests[key] <= min}
                                          aria-label={`Decrease ${label}`}
                                        >
                                          −
                                        </button>
                                        <span className="hotel-guest-count">{selectedGuests[key]}</span>
                                        <button
                                          type="button"
                                          className="hotel-guest-button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            handleGuestAdjust(key, 1);
                                          }}
                                          aria-label={`Increase ${label}`}
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <button type="button" className="hotel-guest-apply" onClick={handleApplyGuests}>
                                  Apply Guests
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="hotel-booking-total">
                            <div className="hotel-booking-total__header">
                              <span className="hotel-booking-total__label">Estimated total</span>
                              <strong className="hotel-booking-total__amount">{formatCurrency(estimatedTotal)}</strong>
                            </div>
                            <p className="hotel-booking-total__note">Taxes and daily concierge included</p>
                          </div>
                          <button type="button" className="hotel-booking-button" onClick={handleClick}>
                            Reserve or Book Now
                          </button>
                          <p className="hotel-note">
                            Final pricing will confirm during checkout once your suites are selected.
                          </p>
                        </div>
                      </aside>
                    </div>
                  </section>

                  <section className="hotel-section hotel-section--rooms">
                    <header className="hotel-section-header">
                      <div>
                        <h2 className="hotel-section-title">Suites & Rooms</h2>
                        <p className="hotel-section-subtitle">
                          Preview every suite, browse imagery, and choose the spaces that fit your stay.
                        </p>
                      </div>
                    </header>
                    {roomsLoading ? (
                      <div className="hotel-rooms-state">Loading suites…</div>
                    ) : roomsError ? (
                      <div className="hotel-rooms-state hotel-rooms-state--error">Unable to load rooms for this stay.</div>
                    ) : roomCards.length === 0 ? (
                      <div className="hotel-rooms-state">Room details will be published soon.</div>
                    ) : (
                      <div className="hotel-rooms-grid">
                        {roomCards.map((room) => (
                          <article className="hotel-room-card" key={room._id}>
                            <div className="hotel-room-card__media">
                              <ImageCarousel
                                images={room.photos}
                                altPrefix={room.title || "Suite"}
                                className="hotel-room-card__carousel"
                                aspect="16 / 9"
                              />
                              <span className="hotel-room-card__badge">Sleeps {room.maxPeople || "—"}</span>
                            </div>
                            <div className="hotel-room-card__content">
                              <header className="hotel-room-card__header">
                                <h3>{room.title}</h3>
                                <span className="hotel-room-card__price">{formatCurrency(room.price)}</span>
                              </header>
                              <p className="hotel-room-card__description">
                                {room.desc || "This suite will soon include a curated description."}
                              </p>
                              {Array.isArray(room?.roomNumbers) && room.roomNumbers.length > 0 ? (
                                <div className="hotel-room-card__numbers">
                                  {room.roomNumbers.slice(0, 3).map((roomNumber) => (
                                    <span className="hotel-room-card__number" key={roomNumber._id || roomNumber.number}>
                                      Suite {roomNumber.number}
                                    </span>
                                  ))}
                                  {room.roomNumbers.length > 3 ? (
                                    <span className="hotel-room-card__more">+{room.roomNumbers.length - 3} more</span>
                                  ) : null}
                                </div>
                              ) : null}
                              <button type="button" className="hotel-room-card__cta" onClick={handleClick}>
                                Reserve this suite
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </section>
            </div>
          </>
        )}
      </main>
      <Footer />
      {openModal && <Reserve setOpen={setOpenModal} hotelId={id} />}
    </div>
  );
};

export default Hotel;
