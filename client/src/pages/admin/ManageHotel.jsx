import { useContext, useEffect, useMemo, useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import { AuthContext } from "../../context/AuthContext";
import { getHotelById, updateHotel, uploadHotelImage } from "../../api/hotels";
import ImageCarousel from "../../components/carousel/ImageCarousel";
import "./admin.css";

const toArray = (value) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const ManageHotel = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = Boolean(user?.isAdmin);
  const managerHotelId = useMemo(
    () => user?.managedHotel?.toString?.() || user?.managedHotel || "",
    [user]
  );

  const [formValues, setFormValues] = useState({
    name: "",
    title: "",
    type: "",
    city: "",
    address: "",
    distance: "",
    desc: "",
    cheapestPrice: "",
    featured: false,
    photosInput: "",
  });

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [heroPreview, setHeroPreview] = useState("");
  const [heroFile, setHeroFile] = useState(null);
  const [imageFeedback, setImageFeedback] = useState("");
  const [allPhotos, setAllPhotos] = useState([]);
  const [galleryMessage, setGalleryMessage] = useState("");
  const [hotelDetails, setHotelDetails] = useState(null);

  useEffect(() => {
    const loadHotel = async () => {
      if (!isAdmin || !managerHotelId) return;

      try {
        setLoading(true);
        const hotel = await getHotelById(managerHotelId);
        setFormValues({
          name: hotel.name ?? "",
          title: hotel.title ?? "",
          type: hotel.type ?? "",
          city: hotel.city ?? "",
          address: hotel.address ?? "",
          distance: hotel.distance ?? "",
          desc: hotel.desc ?? "",
          cheapestPrice: hotel.cheapestPrice?.toString?.() ?? "",
          featured: Boolean(hotel.featured),
          photosInput: Array.isArray(hotel.photos) ? hotel.photos.join("\n") : "",
        });
        setHeroPreview(hotel.photos?.[0] ?? "");
        setHeroFile(null);
        setImageFeedback(hotel.photos?.[0] ? "Using existing hero image." : "");
        setAllPhotos(Array.isArray(hotel.photos) ? hotel.photos.filter(Boolean) : []);
        setHotelDetails(hotel ?? null);
        setError("");
      } catch (err) {
        setError(err?.data?.message || err?.message || "Unable to load hotel details");
      } finally {
        setLoading(false);
      }
    };

    loadHotel();
  }, [isAdmin, managerHotelId]);

  const propertyName = formValues.name || hotelDetails?.name || "Managed hotel";
  const propertySubtitle =
    formValues.title ||
    hotelDetails?.title ||
    "Fine-tune the story your guests read before they arrive.";
  const heroImage = heroPreview || allPhotos[0] || hotelDetails?.photos?.[0] || "";
  const heroMeta = [
    formValues.city || hotelDetails?.city || "",
    formValues.type || hotelDetails?.type || "",
    formValues.distance || hotelDetails?.distance || "",
  ].filter(Boolean);
  const insightItems = [
    { label: "Location", value: formValues.city || hotelDetails?.city || "—" },
    { label: "Property type", value: formValues.type || hotelDetails?.type || "Not specified" },
    { label: "Distance label", value: formValues.distance || hotelDetails?.distance || "—" },
    { label: "Total rooms linked", value: hotelDetails?.rooms?.length ?? 0 },
    { label: "Gallery items", value: allPhotos.length },
  ];
  const descriptionLength = formValues.desc?.length || 0;
  const showInsights = Boolean(managerHotelId);
  const showStatus = Boolean(loading || error || success);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setSuccess("");
  };

  const handleHeroChange = (event) => {
    const target = event.target;
    const file = target?.files?.[0];
    if (!file) {
      setHeroFile(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setHeroFile(file);
    setHeroPreview(previewUrl);
    setImageFeedback("New hero image selected.");
    setSuccess("");
    if (target) {
      target.value = "";
    }
  };

  const handleRemoveHero = () => {
    if (heroPreview) {
      URL.revokeObjectURL(heroPreview);
    }
    setHeroPreview("");
    setHeroFile(null);
    setImageFeedback("Hero image removed. Save to confirm.");
    setSuccess("");
  };

  const appendPhoto = (url) => {
    if (!url) return;
    setAllPhotos((prev) => {
      const exists = prev.includes(url);
      const next = exists ? prev : [url, ...prev];
      return next;
    });
    setGalleryMessage("Image uploaded. Save changes to persist.");
    setSuccess("");
    setError("");
  };

  const removePhotoByIndex = (index) => {
    setAllPhotos((prev) => {
      const removed = prev[index];
      const next = prev.filter((_, photoIndex) => photoIndex !== index);
      if (removed && removed === heroPreview) {
        setHeroPreview(next[0] ?? "");
      }
      return next;
    });
    setGalleryMessage("Image removed. Save to confirm.");
  };

  useEffect(() => {
    if (!heroPreview && allPhotos.length) {
      setHeroPreview(allPhotos[0]);
    }
  }, [allPhotos, heroPreview]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAdmin) return;
    if (!managerHotelId) {
      setError("No managed hotel assigned to your account.");
      return;
    }

    const payload = {
      name: formValues.name,
      title: formValues.title,
      type: formValues.type,
      city: formValues.city,
      address: formValues.address,
      distance: formValues.distance,
      desc: formValues.desc,
      cheapestPrice: Number(formValues.cheapestPrice) || 0,
      featured: Boolean(formValues.featured),
    };

    try {
      setIsSaving(true);
      setError("");

      let photos = allPhotos;
      if (heroFile) {
        const uploaded = await uploadHotelImage(heroFile);
        if (uploaded?.url) {
          photos = [uploaded.url, ...allPhotos.filter((photo) => photo !== uploaded.url)];
          setHeroPreview(uploaded.url);
        }
      } else if (heroPreview) {
        photos = [heroPreview, ...allPhotos.filter((photo) => photo !== heroPreview)];
      }

      const fallbackPhotos = toArray(formValues.photosInput);
      const merged = photos.length ? photos : fallbackPhotos;
      if (merged.length) {
        payload.photos = merged;
        setAllPhotos(merged);
      } else {
        delete payload.photos;
      }

      await updateHotel(managerHotelId, payload);
      setHotelDetails((prev) =>
        prev
          ? {
              ...prev,
              ...payload,
              photos: payload.photos ?? prev.photos,
            }
          : prev
      );
      setSuccess("Hotel details updated successfully.");
      setGalleryMessage("");
      setImageFeedback(payload.photos?.length ? "Hero image saved." : "");
    } catch (err) {
      setError(err?.data?.message || err?.message || "Failed to update hotel.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <Navbar />
        <main className="admin-content">
          <header className="admin-header">
            <h1>Manage your hotel</h1>
          </header>
          <div className="admin-panel">
            <p>You need administrator access to manage your hotel’s details.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Navbar />
      <main className="admin-content admin-content--manage">
        <section className="admin-hero">
          {heroImage ? <div className="admin-hero__bg" style={{ backgroundImage: `url(${heroImage})` }} /> : null}
          <div className="admin-hero__content">
            <span className="admin-hero__eyebrow">Hotel management</span>
            <h1 className="admin-hero__title">{propertyName}</h1>
            <p className="admin-hero__subtitle">{propertySubtitle}</p>
            {heroMeta.length ? (
              <div className="admin-hero__meta">
                {heroMeta.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {showInsights ? (
          <section className="admin-insights">
            {insightItems.map((item) => (
              <article className="admin-insight" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value || "—"}</strong>
              </article>
            ))}
          </section>
        ) : null}

        {showStatus ? (
          <section className="admin-status-stack" aria-live="polite">
            {loading ? <div className="admin-alert admin-alert--info">Loading hotel details…</div> : null}
            {error ? <div className="admin-alert admin-alert--error">{error}</div> : null}
            {success ? <div className="admin-alert admin-alert--success">{success}</div> : null}
          </section>
        ) : null}

        {managerHotelId ? (
          <div className="admin-manage-grid">
            <section className="admin-panel admin-panel--gallery">
              <div className="admin-section-header">
                <div>
                  <h2>Visual identity</h2>
                  <p>Refresh imagery to keep your listing looking polished and current.</p>
                </div>
                {imageFeedback ? <p className="helper-text info">{imageFeedback}</p> : null}
              </div>

              <div className="hero-media">
                <div className="hero-media__preview">
                  {heroPreview ? (
                    <img src={heroPreview} alt="Current hero preview" />
                  ) : (
                    <div className="hero-media__placeholder">No hero image selected</div>
                  )}
                </div>
                <div className="hero-media__controls">
                  <label className="hero-media__upload">
                    <span>Select hero image</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleHeroChange}
                      disabled={isSaving}
                    />
                  </label>
                  {heroPreview ? (
                    <button
                      type="button"
                      className="btn-outline hero-media__remove"
                      onClick={handleRemoveHero}
                      disabled={isSaving}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="admin-gallery">
                <header className="admin-gallery__header">
                  <h3>Gallery</h3>
                  <label className="admin-gallery__upload">
                    <span>Upload images</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      multiple
                      onChange={async (event) => {
                        const files = Array.from(event.target.files || []);
                        if (!files.length) return;
                        try {
                          setImageFeedback("Uploading images…");
                          for (const file of files) {
                            const uploaded = await uploadHotelImage(file);
                            if (uploaded?.url) {
                              appendPhoto(uploaded.url);
                            }
                          }
                          setImageFeedback("Gallery updated. Remember to save changes.");
                        } catch (uploadErr) {
                          setError(uploadErr?.message || "Failed to upload image.");
                        } finally {
                          event.target.value = "";
                        }
                      }}
                      disabled={isSaving}
                    />
                  </label>
                </header>
                {galleryMessage ? <p className="helper-text info">{galleryMessage}</p> : null}
                {allPhotos.length ? (
                  <>
                    <div className="admin-gallery__viewer">
                      <ImageCarousel
                        images={allPhotos}
                        altPrefix={formValues.name || "Hotel"}
                        aspect="16 / 9"
                        showControls
                        showIndicators
                      />
                    </div>
                    <div className="admin-gallery__grid">
                      {allPhotos.map((photo, index) => (
                        <figure className="admin-gallery__item" key={`${photo}-${index}`}>
                          <img src={photo} alt={`Hotel gallery ${index + 1}`} />
                          <button
                            type="button"
                            className="admin-gallery__remove"
                            onClick={() => removePhotoByIndex(index)}
                            disabled={isSaving}
                          >
                            Delete
                          </button>
                        </figure>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="helper-text">No gallery images uploaded yet.</p>
                )}
              </div>
            </section>

            <form className="admin-form admin-form--manage" onSubmit={handleSubmit}>
              <div className="admin-section-header">
                <div>
                  <h2>Hotel profile</h2>
                  <p>Complete details help guests choose your stay with confidence.</p>
                </div>
                <button type="submit" className="btn-primary" disabled={isSaving || loading}>
                  {isSaving ? "Saving…" : "Save changes"}
                </button>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Hotel name</label>
                  <input
                    id="name"
                    name="name"
                    value={formValues.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="title">Marketing title</label>
                  <input
                    id="title"
                    name="title"
                    value={formValues.title}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="type">Your property type</label>
                  <input
                    id="type"
                    name="type"
                    value={formValues.type}
                    onChange={handleChange}
                    placeholder="Hotel, Villa, Resort"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    name="city"
                    value={formValues.city}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    id="address"
                    name="address"
                    value={formValues.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="distance">Distance descriptor</label>
                  <input
                    id="distance"
                    name="distance"
                    value={formValues.distance}
                    onChange={handleChange}
                    placeholder="500m from centre"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="desc">Description</label>
                <textarea
                  id="desc"
                  name="desc"
                  rows="5"
                  value={formValues.desc}
                  onChange={handleChange}
                  required
                />
                <div className="form-helper-row">
                  <small>Use 2-3 sentences to highlight signature experiences.</small>
                  <span>{descriptionLength} characters</span>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="cheapestPrice">Starting price (₹)</label>
                  <input
                    id="cheapestPrice"
                    name="cheapestPrice"
                    type="number"
                    min="0"
                    value={formValues.cheapestPrice}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group form-group--checkbox">
                  <label htmlFor="featured">Featured</label>
                  <div className="form-checkbox">
                    <input
                      id="featured"
                      name="featured"
                      type="checkbox"
                      checked={formValues.featured}
                      onChange={handleChange}
                    />
                    <span>Display in featured collections</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="photosInput">Photo URLs</label>
                <textarea
                  id="photosInput"
                  name="photosInput"
                  rows="4"
                  value={formValues.photosInput}
                  onChange={handleChange}
                  placeholder="One URL per line"
                />
                <div className="form-helper-row">
                  <small>Separate entries with new lines or commas.</small>
                  <span>{(formValues.photosInput || "").split(/\r?\n|,/).filter(Boolean).length} linked</span>
                </div>
              </div>

              <div className="form-actions form-actions--right">
                <button type="submit" className="btn-primary" disabled={isSaving || loading}>
                  {isSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="admin-alert admin-alert--warning">
            We couldn’t find a hotel linked to your profile. Please contact the platform team.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ManageHotel;
