import "./newHotel.scss";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { hotelInputs } from "../../formSource";
import {
  createHotel,
  fetchCollection,
  fetchResourceById,
  updateHotel,
  uploadHotelImage,
} from "../../api/services";

const HOTEL_FIELD_SECTIONS = [
  {
    title: "Basic details",
    description: "Set the high-level information guests will see first.",
    fields: ["name", "title", "type"],
  },
  {
    title: "Location",
    description: "Help travelers understand where the property is located.",
    fields: ["city", "address", "distance"],
  },
  {
    title: "Rates & description",
    description: "Share pricing and what makes this stay special.",
    fields: ["cheapestPrice", "desc"],
  },
];

const HOTEL_INPUT_MAP = hotelInputs.reduce((acc, input) => {
  acc[input.id] = input;
  return acc;
}, {});

const MAX_HOTEL_IMAGES = 8;
const FALLBACK_HERO_IMAGE = "https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg";

const mapHotelToFormState = (hotel = {}) => ({
  name: hotel.name || "",
  title: hotel.title || "",
  type: hotel.type || "",
  city: hotel.city || "",
  address: hotel.address || "",
  distance: hotel.distance || "",
  desc: hotel.desc || "",
  cheapestPrice:
    hotel.cheapestPrice !== undefined && hotel.cheapestPrice !== null
      ? String(hotel.cheapestPrice)
      : "",
  featured: hotel.featured ? "true" : "false",
});

const mapRoomsToState = (roomIds = []) =>
  roomIds.map((roomId) => roomId?.toString()).filter(Boolean);

const NewHotel = () => {
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [info, setInfo] = useState(() => mapHotelToFormState());
  const [rooms, setRooms] = useState([]);
  const [roomOptions, setRoomOptions] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [imageFeedback, setImageFeedback] = useState("");
  const params = useParams();
  const { hotelId } = params;
  const isEditMode = Boolean(hotelId);
  const navigate = useNavigate();
  const [initializing, setInitializing] = useState(isEditMode);

  useEffect(() => {
    const loadRooms = async () => {
      setRoomsLoading(true);
      try {
        const data = await fetchCollection("rooms");
        setRoomOptions(data);
        setRoomsError("");
      } catch (err) {
        setRoomsError(
          err?.response?.data?.message || err?.message || "Failed to load rooms"
        );
      } finally {
        setRoomsLoading(false);
      }
    };

    loadRooms();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setInfo((prev) => ({ ...prev, [id]: value }));
    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleSelect = (e) => {
    const value = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setRooms(value);
    setSubmitError("");
    setSubmitSuccess("");
  };

  const requiredFields = useMemo(
    () => hotelInputs.map((input) => input.id),
    []
  );

  useEffect(() => {
    if (!files.length) {
      setPreviewUrls([]);
      return undefined;
    }

    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  useEffect(() => {
    if (!isEditMode) return;

    const loadHotelDetails = async () => {
      setInitializing(true);
      setSubmitError("");
      try {
        const hotel = await fetchResourceById("hotels", hotelId);
        setInfo(mapHotelToFormState(hotel));
        setRooms(mapRoomsToState(hotel.rooms));
        const photos = Array.isArray(hotel.photos) ? hotel.photos.slice(0, MAX_HOTEL_IMAGES) : [];
        setExistingPhotos(photos);
        setFiles([]);
        setPreviewUrls([]);
        setImageFeedback(photos.length ? `${photos.length} image${photos.length > 1 ? "s" : ""} in library.` : "");
      } catch (err) {
        setSubmitError(
          err?.response?.data?.message || err?.message || "Failed to load hotel details."
        );
      } finally {
        setInitializing(false);
      }
    };

    loadHotelDetails();
  }, [isEditMode, hotelId]);

  const handleFileChange = (e) => {
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) {
      if (!files.length) {
        setImageFeedback(existingPhotos.length ? `${existingPhotos.length} image${existingPhotos.length > 1 ? "s" : ""} in library.` : "");
      }
      return;
    }

    setFiles((prev) => {
      const remainingSlots = Math.max(0, MAX_HOTEL_IMAGES - (existingPhotos.length + prev.length));
      const accepted = incoming.slice(0, remainingSlots);
      if (!accepted.length) {
        setImageFeedback(`Image limit reached (${MAX_HOTEL_IMAGES}). Remove an image to add more.`);
        return prev;
      }

      setImageFeedback(`${existingPhotos.length + prev.length + accepted.length}/${MAX_HOTEL_IMAGES} images ready.`);
      return [...prev, ...accepted];
    });

    setSubmitError("");
    setSubmitSuccess("");
    if (e.target.value) {
      e.target.value = "";
    }
  };

  const handleRemoveNewImage = (index) => {
    setFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      const nextCount = existingPhotos.length + updated.length;
      setImageFeedback(nextCount ? `${nextCount}/${MAX_HOTEL_IMAGES} images ready.` : "");
      return updated;
    });
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingPhoto = (index) => {
    setExistingPhotos((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      const nextCount = updated.length + files.length;
      setImageFeedback(nextCount ? `${nextCount}/${MAX_HOTEL_IMAGES} images ready.` : "");
      return updated;
    });
  };

  const selectedRoomDetails = useMemo(() => {
    if (!rooms.length || !roomOptions.length) return [];
    return roomOptions.filter((room) => rooms.includes(room._id));
  }, [roomOptions, rooms]);

  const handleClick = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const missingField = requiredFields.find((field) => {
      const value = info[field];
      return value === undefined || value === null || String(value).trim() === "";
    });

    if (missingField) {
      setSubmitError("Please complete all required fields before submitting.");
      setSubmitSuccess("");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");
      setSubmitSuccess("");

      let uploadedPhotos = [];

      if (files.length) {
        const uploads = await Promise.all(
          files.map(async (file) => {
            try {
              return await uploadHotelImage(file);
            } catch (err) {
              throw new Error(
                err?.response?.data?.message || err?.message || "Image upload failed"
              );
            }
          })
        );

        uploadedPhotos = uploads.filter(Boolean);
      }

      const payload = {
        ...info,
        featured: String(info.featured) === "true",
        cheapestPrice: info.cheapestPrice
          ? Number(info.cheapestPrice)
          : undefined,
        rooms,
      };

      const mergedPhotos = [...existingPhotos];

      if (uploadedPhotos.length) {
        mergedPhotos.push(...uploadedPhotos);
      }

      payload.photos = mergedPhotos;

      const response = isEditMode
        ? await updateHotel(hotelId, payload)
        : await createHotel(payload);

      setSubmitSuccess(
        isEditMode ? "Hotel updated successfully." : "Hotel created successfully."
      );
      if (!isEditMode) {
        setInfo(mapHotelToFormState());
        setRooms([]);
        setFiles([]);
        setPreviewUrls([]);
        setExistingPhotos([]);
        setImageFeedback("");
      }

      setTimeout(() => {
        navigate(`/hotels/${response._id}`);
      }, 600);
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message || err?.message || "Failed to create hotel"
      );
      setSubmitSuccess("");
    } finally {
      setSubmitting(false);
    }
  };
  const allImages = [...existingPhotos, ...previewUrls];
  const hasHeroImage = allImages.length > 0;
  const heroImageSrc = hasHeroImage ? allImages[0] : FALLBACK_HERO_IMAGE;
  const imagesSelected = allImages.length;
  const roomsSelected = selectedRoomDetails.length;

  return (
    <div className="new">
      <Sidebar />
      <div className="newContainer">
        <Navbar />

        <header className="pageHeader surface-card">
          <div className="pageMeta">
            <span className="eyebrow">Inventory · Hotels</span>
            <h1>Create a signature stay</h1>
            <p>
              Craft a compelling listing by combining premium visuals, clear positioning, and accurate
              availability details. Guests will see this information across booking channels.
            </p>
          </div>
          <div className="headerStatus">
            <div className="statusCard">
              <span className="label">Images prepared</span>
              <span className="value">
                {imagesSelected}/{MAX_HOTEL_IMAGES}
              </span>
            </div>
            <div className="statusCard">
              <span className="label">Rooms linked</span>
              <span className="value">{roomsSelected}</span>
            </div>
            <div className="statusCard">
              <span className="label">Featured</span>
              <span className="value">
                {String(info.featured) === "true" ? "Enabled" : "Off"}
              </span>
            </div>
          </div>
        </header>

        <div className="workspace">
          <section className="panel mediaPanel surface-card">
            <div className="panelHeader">
              <div>
                <h2>Visual identity</h2>
                <p>Upload the hero image that defines this property's first impression.</p>
              </div>
              <span className="badge subtle">High impact area</span>
            </div>

            <div className="mediaHero">
              <img src={heroImageSrc} alt="Primary hotel preview" />
              {!hasHeroImage && (
                <div className="mediaPlaceholder">
                  <p className="helper-text subtle emptyPreview">
                    Drop files or click below to upload property imagery. These visuals power search and detail pages.
                  </p>
                </div>
              )}
            </div>

            <div className="mediaControls">
              <div className="formInput">
                <label htmlFor="file" className="uploadLabel">
                  Upload gallery images
                  <DriveFolderUploadOutlinedIcon className="icon" />
                </label>
                <input
                  type="file"
                  id="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleFileChange}
                  multiple
                  style={{ display: "none" }}
                  disabled={submitting || initializing}
                />
                <p className="helper-text subtle">
                  PNG, JPG, WEBP, or GIF under 5MB. Upload up to {MAX_HOTEL_IMAGES} images showcasing this property.
                </p>
                {imageFeedback && <p className="helper-text info">{imageFeedback}</p>}
              </div>
              {allImages.length > 0 && (
                <div className="thumbnailGrid">
                  {existingPhotos.map((url, index) => (
                    <div className="thumbnailCard" key={`existing-${url}-${index}`}>
                      <img src={url} alt={`Hotel existing ${index + 1}`} />
                      <div className="thumbnailMeta">
                        <span className="badge subtle">Saved</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingPhoto(index)}
                          disabled={submitting || initializing}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {previewUrls.map((url, index) => (
                    <div className="thumbnailCard" key={`new-${url}-${index}`}>
                      <img src={url} alt={`Hotel preview ${index + 1}`} />
                      <div className="thumbnailMeta">
                        <span className="badge subtle draft">New</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          disabled={submitting || initializing}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="panel formPanel surface-card">
            <div className="panelHeader">
              <div>
                <h2>Property details</h2>
                <p>Define positioning, location, and pricing so guests can make confident decisions.</p>
              </div>
            </div>

            <form>
              {initializing && <div className="loadingState">Loading hotel details…</div>}

              {HOTEL_FIELD_SECTIONS.map((section) => (
                <div className="formSection" key={section.title}>
                  <div className="sectionHeader">
                    <h3>{section.title}</h3>
                    <p className="sectionDescription">{section.description}</p>
                  </div>
                  <div className="sectionGrid">
                    {section.fields.map((fieldId) => {
                      const field = HOTEL_INPUT_MAP[fieldId];
                      if (!field) return null;

                      if (field.id === "desc") {
                        return (
                          <div className="formInput" key={field.id}>
                            <label>{field.label}</label>
                            <textarea
                              id={field.id}
                              onChange={handleChange}
                              placeholder={field.placeholder}
                              value={info[field.id] || ""}
                              rows={4}
                              required
                              disabled={submitting || initializing}
                            />
                          </div>
                        );
                      }

                      return (
                        <div className="formInput" key={field.id}>
                          <label>{field.label}</label>
                          <input
                            id={field.id}
                            onChange={handleChange}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={info[field.id] || ""}
                            required
                            disabled={submitting || initializing}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="formSection">
                <div className="sectionHeader">
                  <h3>Highlight status</h3>
                  <p className="sectionDescription">
                    Flag standout properties to appear in curated collections and email campaigns.
                  </p>
                </div>
                <div className="sectionGrid">
                  <div className="formInput">
                    <label>Featured</label>
                    <select
                      id="featured"
                      onChange={handleChange}
                      value={info.featured || "false"}
                      disabled={submitting || initializing}
                    >
                      <option value={false}>No</option>
                      <option value={true}>Yes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="formSection">
                <div className="sectionHeader">
                  <h3>Rooms & availability</h3>
                  <p className="sectionDescription">
                    Select which room types belong to this property (optional). Hold Ctrl/Cmd to select multiple.
                  </p>
                </div>
                <div className="sectionGrid roomsGrid">
                  <div className="formInput selectRooms">
                    <label htmlFor="rooms">Rooms</label>
                    <select
                      id="rooms"
                      multiple
                      onChange={handleSelect}
                      value={rooms}
                      disabled={roomsLoading || submitting || initializing}
                    >
                      {roomsLoading && <option disabled>Loading rooms…</option>}
                      {roomsError && !roomsLoading && <option disabled>{roomsError}</option>}
                      {!roomsLoading &&
                        !roomsError &&
                        roomOptions.map((room) => (
                          <option key={room._id} value={room._id}>
                            {room.title}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="roomChips">
                    {selectedRoomDetails.length ? (
                      selectedRoomDetails.map((room) => (
                        <span className="chip" key={room._id}>
                          {room.title}
                        </span>
                      ))
                    ) : (
                      <p className="placeholder">No rooms selected yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="formActions">
                <button
                  type="button"
                  onClick={handleClick}
                  className="primary-button"
                  disabled={submitting || initializing}
                >
                  {submitting
                    ? isEditMode
                      ? "Saving..."
                      : "Creating..."
                    : isEditMode
                    ? "Save changes"
                    : "Create hotel"}
                </button>
                {submitError && <div className="errorMessage">{submitError}</div>}
                {submitSuccess && <div className="successMessage">{submitSuccess}</div>}
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default NewHotel;
