import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { hotelInputs } from "../../formSource.js";
import {
  createHotel,
  fetchCollection,
  fetchResourceById,
  updateHotel,
  uploadHotelImage,
} from "../../api/services.js";

const MAX_HOTEL_IMAGES = 8;
const FALLBACK_HERO_IMAGE = "https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg";

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
  const { hotelId } = useParams();
  const isEditMode = Boolean(hotelId);
  const navigate = useNavigate();

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
  const [initializing, setInitializing] = useState(isEditMode);

  const requiredFields = useMemo(() => hotelInputs.map((input) => input.id), []);

  const loadRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const data = await fetchCollection("rooms");
      setRoomOptions(Array.isArray(data) ? data : []);
      setRoomsError("");
    } catch (err) {
      setRoomsError(err?.response?.data?.message || err?.message || "Failed to load rooms");
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!files.length) {
      setPreviewUrls([]);
      return undefined;
    }

    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => urls.forEach((url) => URL.revokeObjectURL(url));
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
        setImageFeedback(
          photos.length ? `${photos.length} image${photos.length > 1 ? "s" : ""} in library.` : ""
        );
      } catch (err) {
        setSubmitError(err?.response?.data?.message || err?.message || "Failed to load hotel details.");
      } finally {
        setInitializing(false);
      }
    };

    loadHotelDetails();
  }, [hotelId, isEditMode]);

  const allImages = [...existingPhotos, ...previewUrls];
  const heroImageSrc = allImages.length ? allImages[0] : FALLBACK_HERO_IMAGE;

  const handleChange = (event) => {
    const { id, value } = event.target;
    setInfo((prev) => ({ ...prev, [id]: value }));
    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleSelect = (event) => {
    const value = Array.from(event.target.selectedOptions, (option) => option.value);
    setRooms(value);
    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleFileChange = (event) => {
    const incoming = Array.from(event.target.files || []);
    if (!incoming.length) {
      if (!files.length) {
        setImageFeedback(
          existingPhotos.length
            ? `${existingPhotos.length} image${existingPhotos.length > 1 ? "s" : ""} in library.`
            : ""
        );
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
      const nextCount = existingPhotos.length + prev.length + accepted.length;
      setImageFeedback(`${nextCount}/${MAX_HOTEL_IMAGES} images ready.`);
      return [...prev, ...accepted];
    });

    setSubmitError("");
    setSubmitSuccess("");
    if (event.target.value) event.target.value = "";
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

  const handleSubmit = async (event) => {
    event.preventDefault();
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
              throw new Error(err?.response?.data?.message || err?.message || "Image upload failed");
            }
          })
        );
        uploadedPhotos = uploads.filter(Boolean);
      }

      const payload = {
        ...info,
        featured: String(info.featured) === "true",
        cheapestPrice: info.cheapestPrice ? Number(info.cheapestPrice) : undefined,
        rooms,
        photos: [...existingPhotos, ...uploadedPhotos].slice(0, MAX_HOTEL_IMAGES),
      };

      const response = isEditMode ? await updateHotel(hotelId, payload) : await createHotel(payload);

      setSubmitSuccess(isEditMode ? "Hotel updated successfully." : "Hotel created successfully.");

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
      setSubmitError(err?.response?.data?.message || err?.message || "Failed to create hotel");
      setSubmitSuccess("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-6 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted dark:text-dark-text-muted">
            Inventory · Hotels
          </span>
          <h1 className="text-3xl font-semibold text-text-primary dark:text-dark-text-primary">
            {isEditMode ? "Update hotel" : "Create a signature stay"}
          </h1>
          <p className="max-w-3xl text-sm text-text-muted dark:text-dark-text-muted">
            Craft a compelling listing by combining premium visuals, clear positioning, and accurate availability details.
          </p>
        </div>
        <div className="grid gap-2 text-sm text-text-muted dark:text-dark-text-muted">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary dark:text-dark-text-primary">Images prepared:</span>
            <span>{[...existingPhotos, ...previewUrls].length}/{MAX_HOTEL_IMAGES}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary dark:text-dark-text-primary">Rooms linked:</span>
            <span>{selectedRoomDetails.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary dark:text-dark-text-primary">Featured:</span>
            <span>{String(info.featured) === "true" ? "Enabled" : "Off"}</span>
          </div>
        </div>
      </header>

      <form className="grid gap-8" onSubmit={handleSubmit}>
        <section className="grid gap-6 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface md:grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div className="space-y-4">
            <div className="h-64 overflow-hidden rounded-2xl border border-border/60 bg-background dark:border-dark-border dark:bg-dark-background">
              <img src={heroImageSrc} alt="Primary hotel preview" className="h-full w-full object-cover" />
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text-secondary dark:hover:border-primary dark:hover:text-primary">
              <DriveFolderUploadOutlinedIcon fontSize="small" />
              <span>Upload gallery images</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={submitting || initializing}
              />
            </label>
            <p className="text-xs text-text-muted dark:text-dark-text-muted">
              PNG, JPG, WEBP, or GIF under 5MB. Upload up to {MAX_HOTEL_IMAGES} images showcasing this property.
            </p>
            {imageFeedback && (
              <p className="text-xs font-medium text-primary dark:text-primary">{imageFeedback}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {existingPhotos.map((url, index) => (
                <div key={`existing-${url}-${index}`} className="relative h-28 overflow-hidden rounded-xl border border-border/60 dark:border-dark-border/60">
                  <img src={url} alt={`Hotel existing ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded-full bg-slate-900/80 px-2 py-0.5 text-xs text-white"
                    onClick={() => handleRemoveExistingPhoto(index)}
                    disabled={submitting || initializing}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {previewUrls.map((url, index) => (
                <div key={`preview-${url}-${index}`} className="relative h-28 overflow-hidden rounded-xl border border-border/60 dark:border-dark-border/60">
                  <img src={url} alt={`Hotel preview ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded-full bg-slate-900/80 px-2 py-0.5 text-xs text-white"
                    onClick={() => handleRemoveNewImage(index)}
                    disabled={submitting || initializing}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
          {initializing && (
            <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-text-muted dark:border-dark-border/60 dark:bg-dark-background/60 dark:text-dark-text-muted">
              Loading hotel details…
            </div>
          )}

          {HOTEL_FIELD_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
                  {section.title}
                </h2>
                <p className="text-sm text-text-muted dark:text-dark-text-muted">{section.description}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {section.fields.map((fieldId) => {
                  const field = HOTEL_INPUT_MAP[fieldId];
                  if (!field) return null;

                  if (field.id === "desc") {
                    return (
                      <label key={field.id} className="md:col-span-2 grid gap-1 text-sm">
                        <span className="font-medium text-text-secondary dark:text-dark-text-secondary">
                          {field.label}
                        </span>
                        <textarea
                          id={field.id}
                          rows={4}
                          placeholder={field.placeholder}
                          value={info[field.id] || ""}
                          onChange={handleChange}
                          required
                          disabled={submitting || initializing}
                          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                        />
                      </label>
                    );
                  }

                  return (
                    <label key={field.id} className="grid gap-1 text-sm">
                      <span className="font-medium text-text-secondary dark:text-dark-text-secondary">
                        {field.label}
                      </span>
                      <input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={info[field.id] || ""}
                        onChange={handleChange}
                        required
                        disabled={submitting || initializing}
                        className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-text-secondary dark:text-dark-text-secondary">Featured</span>
              <select
                id="featured"
                value={info.featured || "false"}
                onChange={handleChange}
                disabled={submitting || initializing}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark;border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
                Rooms & availability
              </h2>
              <p className="text-sm text-text-muted dark:text-dark-text-muted">
                Select which room types belong to this property (optional). Hold Ctrl/Cmd to select multiple.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,260px),1fr]">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-text-secondary dark:text-dark-text-secondary">Rooms</span>
                <select
                  multiple
                  value={rooms}
                  onChange={handleSelect}
                  disabled={roomsLoading || submitting || initializing}
                  className="min-h-[10rem] rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                >
                  {roomsLoading && <option disabled>Loading rooms…</option>}
                  {roomsError && !roomsLoading && <option disabled>{roomsError || "Failed to load rooms"}</option>}
                  {!roomsLoading && !roomsError &&
                    roomOptions.map((room) => (
                      <option key={room._id} value={room._id}>
                        {room.title}
                      </option>
                    ))}
                </select>
                {roomsError && !roomsLoading && (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-danger">
                    <span>{roomsError || "Failed to load rooms"}</span>
                    <button
                      type="button"
                      onClick={loadRooms}
                      className="rounded-full border border-danger/40 px-3 py-1 font-semibold text-danger transition hover:bg-danger/10"
                      disabled={roomsLoading}
                    >
                      Retry
                    </button>
                  </div>
                )}
              </label>

              {!!selectedRoomDetails.length && (
                <div className="grid gap-3 rounded-xl border border-border/60 bg-background/60 p-4 text-sm dark:border-dark-border/60 dark:bg-dark-background/60">
                  <ul className="flex flex-wrap gap-2">
                    {selectedRoomDetails.map((room) => (
                      <li key={room._id} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20">
                        {room.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting || initializing}
            >
              {submitting ? (isEditMode ? "Saving..." : "Creating...") : isEditMode ? "Save changes" : "Create hotel"}
            </button>
            {submitError && (
              <span className="text-sm font-medium text-danger">{submitError}</span>
            )}
            {submitSuccess && (
              <span className="text-sm font-medium text-success">{submitSuccess}</span>
            )}
          </div>
        </section>
      </form>
    </div>
  );
};

export default NewHotel;
