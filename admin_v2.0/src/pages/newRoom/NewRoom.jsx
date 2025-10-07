import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { useEffect, useMemo, useState } from "react";
import { roomInputs } from "../../formSource.js";
import { createRoom, fetchCollection, uploadRoomImage } from "../../api/services.js";

const MAX_ROOM_IMAGES = 6;
const FALLBACK_ROOM_IMAGE = "https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg";

const ROOM_FIELD_SECTIONS = [
  {
    title: "Room identity",
    description: "Set the tone with a compelling name and description guests will resonate with.",
    fields: ["title", "desc"],
  },
  {
    title: "Capacity & pricing",
    description: "Clarify rates and occupancy so the inventory team can sync availability.",
    fields: ["price", "maxPeople"],
  },
];

const ROOM_INPUT_MAP = roomInputs.reduce((acc, input) => {
  acc[input.id] = input;
  return acc;
}, {});

const parseRoomNumbers = (value = "") =>
  value
    .split(",")
    .map((room) => room.trim())
    .filter(Boolean);

const NewRoom = () => {
  const [info, setInfo] = useState({});
  const [hotelId, setHotelId] = useState("");
  const [rooms, setRooms] = useState("");
  const [hotelOptions, setHotelOptions] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [hotelsError, setHotelsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [imageFeedback, setImageFeedback] = useState("");

  useEffect(() => {
    const loadHotels = async () => {
      setHotelsLoading(true);
      try {
        const data = await fetchCollection("hotels");
        setHotelOptions(Array.isArray(data) ? data : []);
        setHotelsError("");
      } catch (err) {
        setHotelsError(err?.response?.data?.message || err?.message || "Failed to load hotels");
        setHotelOptions([]);
      } finally {
        setHotelsLoading(false);
      }
    };

    loadHotels();
  }, []);

  useEffect(() => {
    if (!files.length) {
      setPreviewUrls([]);
      setImageFeedback("");
      return undefined;
    }

    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    setImageFeedback(`${urls.length}/${MAX_ROOM_IMAGES} images ready.`);

    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const roomNumberCount = useMemo(() => parseRoomNumbers(rooms).length, [rooms]);
  const selectedHotel = useMemo(
    () => hotelOptions.find((hotel) => hotel._id === hotelId),
    [hotelOptions, hotelId]
  );
  const heroImageSrc = previewUrls.length ? previewUrls[0] : FALLBACK_ROOM_IMAGE;

  const handleChange = (event) => {
    const { id, value } = event.target;
    setInfo((prev) => ({ ...prev, [id]: value }));
    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleFileChange = (event) => {
    const incoming = Array.from(event.target.files || []);
    if (!incoming.length) {
      if (!files.length) setImageFeedback("");
      return;
    }

    setFiles((prev) => {
      const remainingSlots = Math.max(0, MAX_ROOM_IMAGES - prev.length);
      const accepted = incoming.slice(0, remainingSlots);
      if (!accepted.length) {
        setImageFeedback(`Image limit reached (${MAX_ROOM_IMAGES}). Remove an image to add more.`);
        return prev;
      }
      const next = [...prev, ...accepted];
      setImageFeedback(`${next.length}/${MAX_ROOM_IMAGES} images ready.`);
      return next;
    });

    setSubmitError("");
    setSubmitSuccess("");
    if (event.target.value) event.target.value = "";
  };

  const handleRemoveImage = (index) => {
    setFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      setImageFeedback(updated.length ? `${updated.length}/${MAX_ROOM_IMAGES} images ready.` : "");
      return updated;
    });
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!hotelId) {
      setSubmitError("Please select a hotel");
      setSubmitSuccess("");
      return;
    }

    if (!rooms.trim()) {
      setSubmitError("Please provide room numbers");
      setSubmitSuccess("");
      return;
    }

    const roomNumbers = parseRoomNumbers(rooms).map((room) => ({ number: room }));
    if (!roomNumbers.length) {
      setSubmitError("Please provide valid room numbers");
      setSubmitSuccess("");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");
      setSubmitSuccess("");

      let uploadedPhotos = [];
      if (files.length) {
        const uploads = await Promise.all(files.map((file) => uploadRoomImage(file)));
        uploadedPhotos = uploads.filter(Boolean).slice(0, MAX_ROOM_IMAGES);
      }

      const payload = {
        ...info,
        roomNumbers,
      };

      if (uploadedPhotos.length) {
        payload.photos = uploadedPhotos;
      }

      await createRoom(hotelId, payload);
      setSubmitSuccess("Room created successfully");
      setInfo({});
      setRooms("");
      setHotelId("");
      setFiles([]);
      setPreviewUrls([]);
      setImageFeedback("");
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err?.message || "Failed to create room");
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
            Inventory · Rooms
          </span>
          <h1 className="text-3xl font-semibold text-text-primary dark:text-dark-text-primary">
            Launch a new room type
          </h1>
          <p className="max-w-3xl text-sm text-text-muted dark:text-dark-text-muted">
            Capture the essentials, tie the room to a property, and showcase visuals so sales and guest teams stay in sync.
          </p>
        </div>
        <div className="grid gap-2 text-sm text-text-muted dark:text-dark-text-muted">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary dark:text-dark-text-primary">Images prepared:</span>
            <span>{previewUrls.length}/{MAX_ROOM_IMAGES}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary dark:text-dark-text-primary">Room numbers:</span>
            <span>{roomNumberCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary dark:text-dark-text-primary">Hotel assigned:</span>
            <span>{selectedHotel?.name || "Not set"}</span>
          </div>
        </div>
      </header>

      <section className="grid gap-6 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface lg:grid-cols-[320px,1fr]">
        <div className="space-y-4">
          <div className="h-64 overflow-hidden rounded-2xl border border-border/60 bg-background dark:border-dark-border dark:bg-dark-background">
            <img src={heroImageSrc} alt="Primary room preview" className="h-full w-full object-cover" />
          </div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text-secondary dark:hover:border-primary dark:hover:text-primary">
            <DriveFolderUploadOutlinedIcon fontSize="small" />
            <span>Upload room imagery</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={submitting}
            />
          </label>
          <p className="text-xs text-text-muted dark:text-dark-text-muted">
            PNG, JPG, WEBP, or GIF under 5MB. Upload up to {MAX_ROOM_IMAGES} images showcasing layout and amenities.
          </p>
          {imageFeedback && <p className="text-xs font-medium text-primary dark:text-primary">{imageFeedback}</p>}
        </div>

        <div className="space-y-4">
          {previewUrls.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previewUrls.map((url, index) => (
                <div key={`${url}-${index}`} className="relative h-28 w-28 overflow-hidden rounded-xl border border-border/60 dark:border-dark-border/60">
                  <img src={url} alt={`Room preview ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded-full bg-slate-900/80 px-2 py-0.5 text-xs text-white"
                    onClick={() => handleRemoveImage(index)}
                    disabled={submitting}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
          {ROOM_FIELD_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
                  {section.title}
                </h2>
                <p className="text-sm text-text-muted dark:text-dark-text-muted">{section.description}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {section.fields.map((fieldId) => {
                  const field = ROOM_INPUT_MAP[fieldId];
                  if (!field) return null;

                  if (field.id === "desc") {
                    return (
                      <label key={field.id} className="grid gap-1 text-sm md:col-span-2">
                        <span className="font-medium text-text-secondary dark:text-dark-text-secondary">
                          {field.label}
                        </span>
                        <textarea
                          id={field.id}
                          rows={4}
                          placeholder={field.placeholder}
                          value={info[field.id] || ""}
                          onChange={handleChange}
                          disabled={submitting}
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
                        onChange={handleChange}
                        value={info[field.id] || ""}
                        disabled={submitting}
                        className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Availability</h2>
              <label className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                <input
                  type="checkbox"
                  checked={info.available ?? true}
                  onChange={(event) =>
                    setInfo((prev) => ({ ...prev, available: event.target.checked }))
                  }
                  disabled={submitting}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/40 dark:border-dark-border"
                />
                <span>Room is active</span>
              </label>
            </div>

            <div className="grid gap-1 text-sm">
              <span className="font-medium text-text-secondary dark:text-dark-text-secondary">
                Assign to hotel
              </span>
              <select
                value={hotelId}
                onChange={(event) => {
                  setHotelId(event.target.value);
                  setSubmitError("");
                  setSubmitSuccess("");
                }}
                disabled={submitting || hotelsLoading}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
              >
                <option value="">Select a hotel</option>
                {hotelOptions.map((hotel) => (
                  <option key={hotel._id} value={hotel._id}>
                    {hotel.name}
                  </option>
                ))}
              </select>
              {hotelsLoading && (
                <span className="text-xs text-text-muted dark:text-dark-text-muted">Loading hotels…</span>
              )}
              {hotelsError && (
                <span className="text-xs text-danger">{hotelsError}</span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                    Room numbers
                  </h3>
                  <p className="text-xs text-text-muted dark:text-dark-text-muted">
                    Add comma-separated unit numbers or ranges (e.g. 101-105)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const generated = parseRoomNumbers(rooms);
                    if (!generated.length) {
                      setSubmitError("Please provide valid room numbers");
                      setSubmitSuccess("");
                      return;
                    }
                    setRooms(generated.join(", "));
                    setSubmitError("");
                    setSubmitSuccess("");
                  }}
                  className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-text-secondary transition hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text-secondary"
                  disabled={submitting}
                >
                  Generate rooms
                </button>
              </div>

              <textarea
                rows={3}
                placeholder="101, 102, 103-105"
                value={rooms}
                onChange={(event) => {
                  setRooms(event.target.value);
                  setSubmitError("");
                  setSubmitSuccess("");
                }}
                disabled={submitting}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
              />

              {roomNumberCount > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
                    Generated rooms
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parseRoomNumbers(rooms).map((number) => (
                      <span
                        key={number}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-text-secondary dark:border-dark-border dark:text-dark-text-secondary"
                      >
                        {number}
                        <button
                          type="button"
                          className="text-danger"
                          onClick={() => {
                            const filtered = parseRoomNumbers(rooms).filter((value) => value !== number);
                            setRooms(filtered.join(", "));
                          }}
                          disabled={submitting}
                          aria-label={`Remove room ${number}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        {submitError && (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-2 text-danger">
            {submitError}
          </div>
        )}
        {submitSuccess && (
          <div className="rounded-lg border border-success/20 bg-success/10 px-4 py-2 text-success">
            {submitSuccess}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/60 sm:w-auto"
            disabled={submitting || hotelsLoading}
          >
            {submitting ? "Saving room…" : "Save room"}
          </button>
          <span className="text-xs text-text-muted dark:text-dark-text-muted">
            Fields marked with * are required. You can edit this room type later.
          </span>
        </div>
      </section>
    </form>
  </div>
);
};

export default NewRoom;
