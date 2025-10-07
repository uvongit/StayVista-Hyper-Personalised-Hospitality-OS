import "./newRoom.scss";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { useEffect, useMemo, useState } from "react";
import { roomInputs } from "../../formSource";
import { createRoom, fetchCollection, uploadRoomImage } from "../../api/services";

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
  const [hotelId, setHotelId] = useState(undefined);
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
        setHotelOptions(data);
        setHotelsError("");
      } catch (err) {
        setHotelsError(
          err?.response?.data?.message || err?.message || "Failed to load hotels"
        );
      } finally {
        setHotelsLoading(false);
      }
    };

    loadHotels();
  }, []);

  const handleChange = (e) => {
    setInfo((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    setSubmitError("");
    setSubmitSuccess("");
  };

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

  const handleFileChange = (event) => {
    const incoming = Array.from(event.target.files || []);
    if (!incoming.length) {
      if (!files.length) {
        setImageFeedback("");
      }
      return;
    }

    setFiles((prev) => {
      const remaining = Math.max(0, MAX_ROOM_IMAGES - prev.length);
      const accepted = incoming.slice(0, remaining);
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

    if (event.target.value) {
      event.target.value = "";
    }
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

  const roomNumberCount = useMemo(() => parseRoomNumbers(rooms).length, [rooms]);

  const selectedHotel = useMemo(
    () => hotelOptions.find((hotel) => hotel._id === hotelId),
    [hotelOptions, hotelId]
  );

  const heroImageSrc = previewUrls.length ? previewUrls[0] : FALLBACK_ROOM_IMAGE;
  const imagesSelected = previewUrls.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
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

    if (roomNumbers.length === 0) {
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
        try {
          const uploads = await Promise.all(files.map((file) => uploadRoomImage(file)));
          uploadedPhotos = uploads.filter(Boolean);
        } catch (err) {
          throw new Error(err?.response?.data?.message || err?.message || "Failed to upload room images");
        }
      }

      const payload = {
        ...info,
        roomNumbers,
      };

      if (uploadedPhotos.length) {
        payload.photos = uploadedPhotos.slice(0, MAX_ROOM_IMAGES);
      }

      await createRoom(hotelId, payload);
      setSubmitSuccess("Room created successfully");
      setInfo({});
      setRooms("");
      setHotelId(undefined);
      setFiles([]);
      setPreviewUrls([]);
      setImageFeedback("");
    } catch (err) {
      console.error(err);
      setSubmitError(
        err?.response?.data?.message || err?.message || "Failed to create room"
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="new roomCreator">
      <Sidebar />
      <div className="newContainer">
        <Navbar />

        <header className="pageHeader surface-card">
          <div className="pageMeta">
            <span className="eyebrow">Inventory · Rooms</span>
            <h1>Launch a new room type</h1>
            <p>
              Capture the essentials, tie the room to a property, and showcase visuals so sales and guest teams stay in sync.
            </p>
          </div>
          <div className="headerStatus">
            <div className="statusCard">
              <span className="label">Images prepared</span>
              <span className="value">
                {imagesSelected}/{MAX_ROOM_IMAGES}
              </span>
            </div>
            <div className="statusCard">
              <span className="label">Room numbers</span>
              <span className="value">{roomNumberCount}</span>
            </div>
            <div className="statusCard">
              <span className="label">Hotel assigned</span>
              <span className="value">{selectedHotel?.name || "Not set"}</span>
            </div>
          </div>
        </header>

        <div className="workspace">
          <section className="panel mediaPanel surface-card">
            <div className="panelHeader">
              <div>
                <h2>Room gallery</h2>
                <p>Upload the hero image and supporting shots that define this stay experience.</p>
              </div>
              <span className="badge subtle">High impact area</span>
            </div>

            <div className="mediaHero">
              <img src={heroImageSrc} alt="Primary room preview" />
              {!previewUrls.length && (
                <div className="mediaPlaceholder">
                  <p className="helper-text subtle emptyPreview">
                    Drop files or use the button below to add imagery. Strong visuals boost conversion and internal alignment.
                  </p>
                </div>
              )}
            </div>

            <div className="mediaControls">
              <div className="formInput">
                <label htmlFor="room-images" className="uploadLabel">
                  Upload room imagery
                  <DriveFolderUploadOutlinedIcon className="icon" />
                </label>
                <input
                  id="room-images"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  onChange={handleFileChange}
                  disabled={submitting}
                  style={{ display: "none" }}
                />
                <p className="helper-text subtle">
                  PNG, JPG, WEBP, or GIF under 5MB. Upload up to {MAX_ROOM_IMAGES} images showcasing layout and amenities.
                </p>
                {imageFeedback && <p className="helper-text info">{imageFeedback}</p>}
              </div>

              {previewUrls.length > 0 && (
                <div className="thumbnailGrid">
                  {previewUrls.map((url, index) => (
                    <div className="thumbnailCard" key={`${url}-${index}`}>
                      <img src={url} alt={`Room preview ${index + 1}`} />
                      <div className="thumbnailMeta">
                        <span className="badge subtle draft">New</span>
                        <button type="button" onClick={() => handleRemoveImage(index)} disabled={submitting}>
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
                <h2>Room configuration</h2>
                <p>Detail the experience, pricing, and linkages so operations can activate this room instantly.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {ROOM_FIELD_SECTIONS.map((section) => (
                <div className="formSection" key={section.title}>
                  <div className="sectionHeader">
                    <h3>{section.title}</h3>
                    <p className="sectionDescription">{section.description}</p>
                  </div>
                  <div className="sectionGrid">
                    {section.fields.map((fieldId) => {
                      const field = ROOM_INPUT_MAP[fieldId];
                      if (!field) return null;

                      if (field.id === "desc") {
                        return (
                          <div className="formInput" key={field.id}>
                            <label htmlFor={field.id}>{field.label}</label>
                            <textarea
                              id={field.id}
                              onChange={handleChange}
                              placeholder={field.placeholder}
                              value={info[field.id] || ""}
                              rows={4}
                              disabled={submitting}
                            />
                          </div>
                        );
                      }

                      return (
                        <div className="formInput" key={field.id}>
                          <label htmlFor={field.id}>{field.label}</label>
                          <input
                            id={field.id}
                            type={field.type}
                            placeholder={field.placeholder}
                            onChange={handleChange}
                            value={info[field.id] || ""}
                            disabled={submitting}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="formSection">
                <div className="sectionHeader">
                  <h3>Inventory & assignment</h3>
                  <p className="sectionDescription">
                    Add the room numbers to generate and link the room type to its hotel home base.
                  </p>
                </div>
                <div className="sectionGrid roomsGrid">
                  <div className="formInput">
                    <label htmlFor="roomNumbers">Room numbers</label>
                    <textarea
                      id="roomNumbers"
                      value={rooms}
                      onChange={(e) => {
                        setRooms(e.target.value);
                        setSubmitError("");
                        setSubmitSuccess("");
                      }}
                      placeholder="e.g., 204, 206, 208"
                      disabled={submitting}
                    />
                    <span className="formInputHint">
                      Separate each room number with a comma. Numbers sync instantly after creation.
                    </span>
                  </div>
                  <div className="formInput">
                    <label htmlFor="hotelId">Choose a hotel</label>
                    <select
                      id="hotelId"
                      value={hotelId || ""}
                      onChange={(e) => {
                        setHotelId(e.target.value);
                        setSubmitError("");
                        setSubmitSuccess("");
                      }}
                      disabled={hotelsLoading || submitting}
                    >
                      <option value="" disabled>
                        Select a hotel
                      </option>
                      {hotelsLoading && <option value="" disabled>Loading hotels…</option>}
                      {hotelsError && !hotelsLoading ? (
                        <option value="" disabled>
                          {hotelsError}
                        </option>
                      ) : (
                        hotelOptions.map((hotel) => (
                          <option key={hotel._id} value={hotel._id}>
                            {hotel.name}
                          </option>
                        ))
                      )}
                    </select>
                    <span className="formInputHint">
                      Only published hotels appear here. Refresh the list in Hotels if you can’t find yours.
                    </span>
                  </div>
                </div>
              </div>

              <div className="formActions">
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Saving room…" : "Save room"}
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

export default NewRoom;
