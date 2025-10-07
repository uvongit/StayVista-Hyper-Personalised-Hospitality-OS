import "./single.scss";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import List from "../../components/table/Table";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  fetchCollection,
  fetchResourceById,
  updateUser,
  resetUserPassword,
  updateRoom,
  uploadRoomImage,
} from "../../api/services";
import { AuthContext } from "../../context/AuthContext";

const PLACEHOLDER_IMAGE =
  "https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg";
const MAX_ROOM_IMAGES = 6;

const normalizeRoom = (room = {}) => {
  const photos = Array.isArray(room.photos) ? room.photos.filter(Boolean) : [];
  const roomNumbers = Array.isArray(room.roomNumbers)
    ? room.roomNumbers.map((entry, index) => ({
        _id: entry?._id || `temp-${index}-${entry?.number || ""}`,
        number: entry?.number ?? "",
        unavailableDates: Array.isArray(entry?.unavailableDates) ? entry.unavailableDates : [],
      }))
    : [];

  return {
    _id: room?._id || "",
    title: room?.title || "",
    desc: room?.desc || "",
    price: room?.price ?? "",
    maxPeople: room?.maxPeople ?? "",
    photos: photos.slice(0, MAX_ROOM_IMAGES),
    roomNumbers,
  };
};

const fieldConfig = {
  users: [
    { key: "username", label: "Username" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "country", label: "Country" },
    { key: "city", label: "City" },
  ],
  hotels: [
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    { key: "city", label: "City" },
    { key: "address", label: "Address" },
    { key: "distance", label: "Distance" },
    { key: "cheapestPrice", label: "Cheapest Price" },
    { key: "featured", label: "Featured" },
  ],
  rooms: [
    { key: "title", label: "Title" },
    { key: "desc", label: "Description" },
    { key: "price", label: "Price" },
    { key: "maxPeople", label: "Max People" },
    { key: "roomNumbers", label: "Room Numbers" },
  ],
};

const resourceTitles = {
  users: "User Details",
  hotels: "Hotel Details",
  rooms: "Room Details",
};

const excludedFallbackFields = [
  "_id",
  "__v",
  "password",
  "isAdmin",
  "createdAt",
  "updatedAt",
  "roomNumbers",
  "rooms",
  "photos",
];

const formatLabel = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (str) => str.toUpperCase());

const formatValue = (key, value) => {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  if (Array.isArray(value)) {
    if (key === "roomNumbers") {
      const numbers = value
        .map((room) => (typeof room === "object" ? room.number : room))
        .filter(Boolean);
      return numbers.length ? numbers.join(", ") : "—";
    }
    if (key === "photos") {
      return `${value.length} photo${value.length === 1 ? "" : "s"}`;
    }
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value && typeof value === "object") {
    if (key === "managedHotel") {
      const hotelName = value?.name || value?.title;
      const hotelCity = value?.city;
      if (hotelName && hotelCity) {
        return `${hotelName} · ${hotelCity}`;
      }
      if (hotelName) {
        return hotelName;
      }
      if (value?._id) {
        return value._id;
      }
    }

    if (value?._id && typeof value._id === "string") {
      return value._id;
    }

    try {
      return JSON.stringify(value);
    } catch (err) {
      return String(value);
    }
  }

  if (key.toLowerCase().includes("date")) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  }

  return value;
};

const derivePrimaryTitle = (resource, data) => {
  if (!data) return "";
  if (resource === "users") {
    return data.username || data.email || "User";
  }
  if (resource === "hotels") {
    return data.name || data.title || "Hotel";
  }
  if (resource === "rooms") {
    return data.title || "Room";
  }
  return data.name || data.title || "Details";
};

const deriveSubTitle = (resource, data) => {
  if (!data) return "";
  if (resource === "users") {
    const parts = [data.email, data.phone, data.city].filter(Boolean);
    return parts.join(" · ");
  }
  if (resource === "hotels") {
    return data.type ? `${formatLabel(data.type)} · ${data.city || ""}` : data.city;
  }
  if (resource === "rooms") {
    return data.desc || "";
  }
  return "";
};

const getImageSrc = (resource, data) => {
  if (!data) return PLACEHOLDER_IMAGE;
  if (resource === "users" && data.img) return data.img;
  if (resource === "hotels" && data.photos?.length) return data.photos[0];
  if (resource === "rooms" && data.photos?.length) return data.photos[0];
  return PLACEHOLDER_IMAGE;
};

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === "") return "—";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value;
  }
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch (error) {
    return numeric.toLocaleString();
  }
};

const Single = () => {
  const location = useLocation();
  const params = useParams();
  const id = useMemo(() => Object.values(params)[0], [params]);
  const resource = useMemo(() => location.pathname.split("/")[1] || "", [
    location.pathname,
  ]);
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [formState, setFormState] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [passwordState, setPasswordState] = useState({ newPassword: "", confirmPassword: "" });
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const { user: authUser, dispatch } = useContext(AuthContext);
  const isMounted = useRef(true);
  const [editingRoom, setEditingRoom] = useState(false);
  const [roomForm, setRoomForm] = useState(null);
  const [roomSaving, setRoomSaving] = useState(false);
  const [roomSaveError, setRoomSaveError] = useState("");
  const [roomSaveSuccess, setRoomSaveSuccess] = useState("");
  const [roomUploading, setRoomUploading] = useState(false);
  const [roomImageFeedback, setRoomImageFeedback] = useState("");

  const resetPasswordForm = () => {
    setPasswordState({ newPassword: "", confirmPassword: "" });
    setResetError("");
    setResetSuccess("");
  };

  const closeUserModal = () => {
    setEditingUser(false);
    resetPasswordForm();
    setSaveError("");
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      if (!resource || !id) return;
      setLoading(true);
      setError("");
      try {
        const result = await fetchResourceById(resource, id);
        if (!active) return;
        setData(result);
      } catch (err) {
        if (!active) return;
        setError(
          err?.response?.data?.message || err?.message || "Failed to load details"
        );
        setData(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [resource, id]);

  useEffect(() => {
    let active = true;
    const loadHotels = async () => {
      if (resource !== "users") return;
      try {
        const response = await fetchCollection("hotels");
        if (!active) return;
        setHotels(Array.isArray(response) ? response : []);
      } catch (err) {
        if (active) {
          console.error("Failed to load hotels", err);
        }
      }
    };

    loadHotels();

    return () => {
      active = false;
    };
  }, [resource]);

  const configuredFields = useMemo(() => fieldConfig[resource] || [], [resource]);
  const configuredKeys = useMemo(
    () => new Set(configuredFields.map((field) => field.key)),
    [configuredFields]
  );

  const fallbackFields = useMemo(() => {
    if (!data) return [];
    return Object.keys(data)
      .filter(
        (key) =>
          !configuredKeys.has(key) && !excludedFallbackFields.includes(key)
      )
      .map((key) => ({ key, label: formatLabel(key) }));
  }, [data, configuredKeys]);

  const details = useMemo(() => {
    const configuredDetails = configuredFields.map(({ key, label }) => ({
      key,
      label,
      value: data ? formatValue(key, data[key]) : "",
    }));

    const fallbackDetails = fallbackFields.map(({ key, label }) => ({
      key,
      label,
      value: data ? formatValue(key, data[key]) : "",
    }));

    return [...configuredDetails, ...fallbackDetails].filter(
      (detail) => detail.value !== ""
    );
  }, [configuredFields, fallbackFields, data]);

  const pageTitle = resourceTitles[resource] || "Details";
  const primaryTitle = derivePrimaryTitle(resource, data);
  const subTitle = deriveSubTitle(resource, data);
  const imageSrc = getImageSrc(resource, data);
  const isUserResource = resource === "users";
  const isHotelResource = resource === "hotels";
  const isRoomResource = resource === "rooms";

  const openRoomDrawer = () => {
    if (!data) return;
    const normalized = normalizeRoom(data);
    setRoomForm(normalized);
    setRoomSaveError("");
    setRoomSaveSuccess("");
    setRoomImageFeedback(
      normalized.photos.length
        ? `${normalized.photos.length}/${MAX_ROOM_IMAGES} images in gallery.`
        : ""
    );
    setEditingRoom(true);
  };

  const closeRoomDrawer = () => {
    setEditingRoom(false);
    setRoomForm(null);
    setRoomSaveError("");
    setRoomSaveSuccess("");
    setRoomImageFeedback("");
  };

  const handleRoomFieldChange = (field, value) => {
    setRoomForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    setRoomSaveError("");
    setRoomSaveSuccess("");
  };

  const handleRoomPhotoUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !roomForm) return;
    if (roomForm.photos.length >= MAX_ROOM_IMAGES) {
      setRoomSaveError(`You can upload up to ${MAX_ROOM_IMAGES} images.`);
      if (event.target) event.target.value = "";
      return;
    }

    setRoomSaveError("");
    setRoomSaveSuccess("");
    setRoomUploading(true);
    const uploadedUrls = [];

    try {
      for (const file of files) {
        const uploaded = await uploadRoomImage(file);
        if (uploaded) {
          uploadedUrls.push(uploaded);
        }
        if (roomForm.photos.length + uploadedUrls.length >= MAX_ROOM_IMAGES) {
          break;
        }
      }

      if (uploadedUrls.length) {
        let nextCount = 0;
        setRoomForm((prev) => {
          if (!prev) return prev;
          const merged = [...prev.photos, ...uploadedUrls].slice(0, MAX_ROOM_IMAGES);
          nextCount = merged.length;
          return { ...prev, photos: merged };
        });
        setRoomImageFeedback(`${nextCount}/${MAX_ROOM_IMAGES} images in gallery.`);
      }
    } catch (err) {
      setRoomSaveError(err?.response?.data?.message || err?.message || "Failed to upload image.");
    } finally {
      setRoomUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleRemoveRoomPhoto = (index) => {
    setRoomForm((prev) => {
      if (!prev) return prev;
      const nextPhotos = prev.photos.filter((_, photoIndex) => photoIndex !== index);
      setRoomImageFeedback(
        nextPhotos.length ? `${nextPhotos.length}/${MAX_ROOM_IMAGES} images in gallery.` : ""
      );
      return { ...prev, photos: nextPhotos };
    });
    setRoomSaveError("");
    setRoomSaveSuccess("");
  };

  const handleAddRoomNumber = () => {
    setRoomForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        roomNumbers: [
          ...prev.roomNumbers,
          { _id: `temp-${Date.now()}`, number: "", unavailableDates: [] },
        ],
      };
    });
    setRoomSaveError("");
    setRoomSaveSuccess("");
  };

  const handleRoomNumberChange = (roomNumberId, value) => {
    setRoomForm((prev) => {
      if (!prev) return prev;
      const nextRoomNumbers = prev.roomNumbers.map((roomNumber) =>
        roomNumber._id === roomNumberId ? { ...roomNumber, number: value } : roomNumber
      );
      return { ...prev, roomNumbers: nextRoomNumbers };
    });
    setRoomSaveError("");
    setRoomSaveSuccess("");
  };

  const handleRemoveRoomNumber = (roomNumberId) => {
    setRoomForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        roomNumbers: prev.roomNumbers.filter((roomNumber) => roomNumber._id !== roomNumberId),
      };
    });
    setRoomSaveError("");
    setRoomSaveSuccess("");
  };

  const handleRoomSave = async () => {
    if (!roomForm?._id) return;

    const trimmedTitle = roomForm.title.trim();
    if (!trimmedTitle) {
      setRoomSaveError("Room title is required.");
      return;
    }

    const parsedRoomNumbers = roomForm.roomNumbers
      .map((roomNumber) => {
        const parsedNumber = Number(roomNumber.number);
        if (Number.isNaN(parsedNumber)) {
          return null;
        }
        const payload = {
          number: parsedNumber,
          unavailableDates: Array.isArray(roomNumber.unavailableDates)
            ? roomNumber.unavailableDates
            : [],
        };
        if (roomNumber._id && !`${roomNumber._id}`.startsWith("temp-")) {
          payload._id = roomNumber._id;
        }
        return payload;
      })
      .filter(Boolean);

    if (!parsedRoomNumbers.length) {
      setRoomSaveError("Please add at least one valid room number.");
      return;
    }

    const sanitizedPhotos = roomForm.photos.filter(Boolean).slice(0, MAX_ROOM_IMAGES);
    const payload = {
      title: trimmedTitle,
      desc: roomForm.desc || "",
      price: Number(roomForm.price) || 0,
      maxPeople: Number(roomForm.maxPeople) || 0,
      photos: sanitizedPhotos,
      roomNumbers: parsedRoomNumbers,
    };

    setRoomSaving(true);
    setRoomSaveError("");
    setRoomSaveSuccess("");
    try {
      const updated = await updateRoom(roomForm._id, payload);
      setData(updated);
      const normalized = normalizeRoom(updated);
      setRoomForm(normalized);
      setRoomImageFeedback(
        normalized.photos.length
          ? `${normalized.photos.length}/${MAX_ROOM_IMAGES} images in gallery.`
          : ""
      );
      setRoomSaveSuccess("Room details saved.");
    } catch (err) {
      setRoomSaveError(
        err?.response?.data?.message || err?.message || "Failed to save room details."
      );
    } finally {
      setRoomSaving(false);
    }
  };

  useEffect(() => {
    if (!isRoomResource) {
      setEditingRoom(false);
      setRoomForm(null);
    }
  }, [isRoomResource]);

  const hotelStats = useMemo(() => {
    if (!isHotelResource || !data) return [];
    const stats = [
      {
        label: "Property type",
        value: data.type ? formatLabel(data.type) : "",
      },
      {
        label: "Base rate",
        value:
          data.cheapestPrice !== undefined && data.cheapestPrice !== null
            ? formatCurrency(data.cheapestPrice)
            : "",
      },
      {
        label: "Distance",
        value: data.distance ? `${data.distance} from centre` : "",
      },
      {
        label: "Rooms linked",
        value: Array.isArray(data.rooms) ? `${data.rooms.length} room types` : "",
      },
      {
        label: "Featured listing",
        value: data.featured ? "Yes" : "No",
      },
      {
        label: "Address",
        value: data.address || "",
      },
    ];

    return stats.filter((item) => item.value);
  }, [data, isHotelResource]);

  const hotelGallery = useMemo(() => {
    if (!isHotelResource || !data?.photos?.length) return [];
    return data.photos.slice(0, 4);
  }, [data, isHotelResource]);

  return (
    <div className="single">
      <Sidebar />
      <div className="singleContainer">
        <Navbar />
        <div className={`top ${isHotelResource ? "top--hotel" : ""}`}>
          <section className={`profilePanel ${isUserResource ? "profilePanel--user" : ""}`}>
            <div className="titleRow">
              <div>
                <p className="breadcrumb">Dashboard / {pageTitle}</p>
                <h1 className="title">{pageTitle}</h1>
              </div>
              <button
                className="editButton"
                type="button"
                disabled={!id}
                onClick={() => {
                  if (isUserResource) {
                    setFormState((prev) => {
                      const source = prev || data || {};
                      return {
                        username: source.username || "",
                        email: source.email || "",
                        phone: source.phone || "",
                        country: source.country || "",
                        city: source.city || "",
                        isAdmin: Boolean(source.isAdmin),
                        superAdmin: Boolean(source.superAdmin),
                        managedHotel: source.managedHotel?._id || source.managedHotel || "",
                      };
                    });
                    resetPasswordForm();
                    setEditingUser(true);
                    return;
                  }

                  if (isRoomResource && id) {
                    openRoomDrawer();
                    return;
                  }

                  if (resource === "hotels" && id) {
                    navigate(`/hotels/${id}/edit`, { replace: false });
                  }
                }}
              >
                {isHotelResource ? "Edit hotel" : resource === "rooms" ? "Manage room" : "Manage"}
              </button>
            </div>

            <div className={`profilePanel__body ${isHotelResource ? "profilePanel__body--hotel" : ""}`}>
              <div className="profilePanel__media">
                <img src={imageSrc} alt={primaryTitle} className="itemImg" />
              </div>
              <div className="profilePanel__details">
                {loading && <div className="stateMessage loading">Loading details…</div>}
                {error && !loading && <div className="stateMessage error">{error}</div>}
                {!loading && !error && data && (
                  <>
                    <div className="itemHead">
                      <h1 className="itemTitle">{primaryTitle}</h1>
                      {isUserResource && (
                        <div className="tagRow">
                          {data.superAdmin && <span className="tag tag--super">Super admin</span>}
                          {!data.superAdmin && data.isAdmin && <span className="tag tag--admin">Admin</span>}
                          {!data.isAdmin && !data.superAdmin && <span className="tag tag--member">Member</span>}
                          {data.managedHotel && (
                            <span className="tag tag--hotel">Manager</span>
                          )}
                        </div>
                      )}
                      {isHotelResource && (
                        <div className="tagRow">
                          {data.type && <span className="tag tag--type">{formatLabel(data.type)}</span>}
                          {data.featured && <span className="tag tag--featured">Featured</span>}
                          {data.cheapestPrice !== undefined && data.cheapestPrice !== null && (
                            <span className="tag tag--price">{formatCurrency(data.cheapestPrice)}</span>
                          )}
                        </div>
                      )}
                    </div>
                    {subTitle && <p className="itemSubtitle">{subTitle}</p>}
                    {details.length ? (
                      <div className="detailGrid">
                        {details.map(({ key, label, value }) => (
                          <div className="detailCard" key={key}>
                            <span className="detailLabel">{label}</span>
                            <span className="detailValue">{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="stateMessage muted">No additional information available.</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
        {isHotelResource && data && (
          <section className="hotelOverview">
            <header className="hotelOverview__header">
              <div>
                <h2>Property highlights</h2>
                <p>
                  Positioned details to help guests make quick decisions. Update these fields from the edit
                  action if anything changes.
                </p>
              </div>
            </header>
            {hotelStats.length > 0 && (
              <div className="hotelOverview__grid">
                {hotelStats.map(({ label, value }) => (
                  <article key={label} className="hotelOverview__card">
                    <span className="hotelOverview__label">{label}</span>
                    <span className="hotelOverview__value">{value}</span>
                  </article>
                ))}
              </div>
            )}
            {data.desc && (
              <div className="hotelOverview__description">
                <h3>About this stay</h3>
                <p>{data.desc}</p>
              </div>
            )}
            {hotelGallery.length > 1 && (
              <div className="hotelOverview__gallery">
                {hotelGallery.map((photo, index) => (
                  <figure className="hotelOverview__photo" key={photo}>
                    <img src={photo || PLACEHOLDER_IMAGE} alt={`Hotel visual ${index + 1}`} />
                  </figure>
                ))}
              </div>
            )}
          </section>
        )}
        {resource === "hotels" && (
          <div className="bottom">
            <h1 className="title">Last Transactions</h1>
            <List />
          </div>
        )}
      </div>
      {editingRoom && isRoomResource && roomForm && (
        <div className="roomDrawerOverlay">
          <div className="roomDrawer" role="dialog" aria-modal="true">
            <header className="roomDrawer__header">
              <div>
                <h2>Manage room</h2>
                <p>Refine this suite’s details, gallery, and suite numbers without leaving the panel.</p>
              </div>
              <button
                type="button"
                className="roomDrawer__close"
                onClick={closeRoomDrawer}
                aria-label="Close room drawer"
              >
                ×
              </button>
            </header>

            <div className="roomDrawer__body">
              <section className="roomDrawer__section">
                <h3>Room details</h3>
                <div className="roomDrawer__grid">
                  <label className="roomDrawer__field">
                    <span>Title</span>
                    <input
                      type="text"
                      value={roomForm.title}
                      onChange={(event) => handleRoomFieldChange("title", event.target.value)}
                      placeholder="Signature Skyline Suite"
                    />
                  </label>
                  <label className="roomDrawer__field">
                    <span>Nightly price (₹)</span>
                    <input
                      type="number"
                      min="0"
                      value={roomForm.price}
                      onChange={(event) => handleRoomFieldChange("price", event.target.value)}
                      placeholder="350"
                    />
                  </label>
                  <label className="roomDrawer__field">
                    <span>Max guests</span>
                    <input
                      type="number"
                      min="1"
                      value={roomForm.maxPeople}
                      onChange={(event) => handleRoomFieldChange("maxPeople", event.target.value)}
                      placeholder="4"
                    />
                  </label>
                </div>
                <label className="roomDrawer__field roomDrawer__field--full">
                  <span>Description</span>
                  <textarea
                    rows="3"
                    value={roomForm.desc}
                    onChange={(event) => handleRoomFieldChange("desc", event.target.value)}
                    placeholder="Describe standout amenities, layout, and service highlights"
                  />
                </label>
              </section>

              <section className="roomDrawer__section">
                <header className="roomDrawer__sectionHeader">
                  <h3>Gallery</h3>
                  <span className="roomDrawer__hint">Upload up to {MAX_ROOM_IMAGES} images.</span>
                </header>
                {roomImageFeedback && <p className="roomDrawer__info">{roomImageFeedback}</p>}
                <div className="roomDrawer__gallery">
                  {roomForm.photos.map((photo, index) => (
                    <figure className="roomDrawer__thumbnail" key={`${photo}-${index}`}>
                      <img src={photo} alt={`Room visual ${index + 1}`} />
                      <button
                        type="button"
                        className="roomDrawer__thumbnailRemove"
                        onClick={() => handleRemoveRoomPhoto(index)}
                        disabled={roomSaving || roomUploading}
                      >
                        Remove
                      </button>
                    </figure>
                  ))}
                  {roomForm.photos.length < MAX_ROOM_IMAGES && (
                    <label className={`roomDrawer__upload ${roomUploading ? "roomDrawer__upload--loading" : ""}`}>
                      <span>{roomUploading ? "Uploading…" : "Add image"}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        multiple
                        onChange={handleRoomPhotoUpload}
                        disabled={roomUploading || roomSaving}
                      />
                    </label>
                  )}
                </div>
              </section>

              <section className="roomDrawer__section">
                <header className="roomDrawer__sectionHeader">
                  <h3>Suite numbers</h3>
                  <button
                    type="button"
                    className="roomDrawer__addSuite"
                    onClick={handleAddRoomNumber}
                    disabled={roomSaving || roomUploading}
                  >
                    Add suite
                  </button>
                </header>
                <div className="roomDrawer__numbers">
                  {roomForm.roomNumbers.length === 0 && (
                    <p className="roomDrawer__hint">No suites linked yet. Add at least one number.</p>
                  )}
                  {roomForm.roomNumbers.map((roomNumber) => (
                    <div className="roomDrawer__numberCard" key={roomNumber._id}>
                      <label>
                        <span>Suite number</span>
                        <input
                          type="number"
                          min="0"
                          value={roomNumber.number}
                          onChange={(event) => handleRoomNumberChange(roomNumber._id, event.target.value)}
                        />
                      </label>
                      <div className="roomDrawer__numberMeta">
                        <span>
                          {Array.isArray(roomNumber.unavailableDates)
                            ? `${roomNumber.unavailableDates.length} dates on hold`
                            : "0 dates on hold"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRoomNumber(roomNumber._id)}
                          className="roomDrawer__numberRemove"
                          disabled={roomSaving || roomUploading}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {(roomSaveError || roomSaveSuccess) && (
                <div
                  className={`roomDrawer__message ${roomSaveError ? "roomDrawer__message--error" : "roomDrawer__message--success"}`}
                  role="status"
                >
                  {roomSaveError || roomSaveSuccess}
                </div>
              )}
            </div>

            <footer className="roomDrawer__footer">
              <button
                type="button"
                className="roomDrawer__action roomDrawer__action--muted"
                onClick={closeRoomDrawer}
                disabled={roomSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="roomDrawer__action roomDrawer__action--primary"
                onClick={handleRoomSave}
                disabled={roomSaving || roomUploading}
              >
                {roomSaving ? "Saving…" : "Save changes"}
              </button>
            </footer>
          </div>
        </div>
      )}
      {editingUser && data && formState && (
        <div className="modalOverlay">
          <div className="modal">
            <h2>Edit user</h2>
            <p className="modalSubtitle">
              Update contact information and administrative permissions for this account.
            </p>
            <form
              className="userForm"
              onSubmit={async (event) => {
                event.preventDefault();
                setSaving(true);
                setSaveError("");
                try {
                  const payload = {
                    ...formState,
                    isAdmin: formState.isAdmin,
                    superAdmin: formState.superAdmin,
                  };

                  const updated = await updateUser(id, payload);
                  if (!isMounted.current) return;
                  setData(updated);
                  if (authUser?._id === updated._id) {
                    dispatch({ type: "UPDATE_USER", payload: updated });
                  }
                  closeUserModal();
                } catch (err) {
                  if (!isMounted.current) return;
                  setSaveError(err?.response?.data?.message || err?.message || "Failed to update user.");
                } finally {
                  if (isMounted.current) {
                    setSaving(false);
                  }
                }
              }}
            >
              <div className="formGrid">
                <label className="formControl">
                  <span>Username</span>
                  <input
                    type="text"
                    value={formState.username}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, username: event.target.value }))
                    }
                    required
                    disabled={saving}
                  />
                </label>
                <label className="formControl">
                  <span>Email</span>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                    disabled={saving}
                  />
                </label>
                <label className="formControl">
                  <span>Phone</span>
                  <input
                    type="tel"
                    value={formState.phone}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    required
                    disabled={saving}
                  />
                </label>
                <label className="formControl">
                  <span>Country</span>
                  <input
                    type="text"
                    value={formState.country}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, country: event.target.value }))
                    }
                    required
                    disabled={saving}
                  />
                </label>
                <label className="formControl">
                  <span>City</span>
                  <input
                    type="text"
                    value={formState.city}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, city: event.target.value }))
                    }
                    required
                    disabled={saving}
                  />
                </label>
                <label className="formControl">
                  <span>Managed hotel</span>
                  <select
                    value={formState.managedHotel || ""}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, managedHotel: event.target.value || null }))
                    }
                    disabled={saving}
                  >
                    <option value="">Unassigned</option>
                    {hotels.map((hotel) => (
                      <option key={hotel._id} value={hotel._id}>
                        {hotel.name} · {hotel.city}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="roleToggles">
                <label className="switchLabel">
                  <input
                    type="checkbox"
                    checked={Boolean(formState?.isAdmin)}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, isAdmin: event.target.checked }))
                    }
                    disabled={saving}
                  />
                  <span>{formState?.isAdmin ? "Administrator" : "Member"}</span>
                </label>
                <label className="switchLabel">
                  <input
                    type="checkbox"
                    checked={Boolean(formState?.superAdmin)}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, superAdmin: event.target.checked }))
                    }
                    disabled={saving}
                  />
                  <span>{formState?.superAdmin ? "Super admin" : "Standard admin"}</span>
                </label>
              </div>
              {authUser?.superAdmin && (
                <div className="passwordSection">
                  <h3>Reset password</h3>
                  <p>Set a new password for this user. Minimum 6 characters.</p>
                  <div className="passwordGrid">
                    <label className="formControl">
                      <span>New password</span>
                      <input
                        type="password"
                        value={passwordState.newPassword}
                        onChange={(event) =>
                          setPasswordState((prev) => ({
                            ...prev,
                            newPassword: event.target.value,
                          }))
                        }
                        minLength={6}
                        disabled={saving || resettingPassword}
                      />
                    </label>
                    <label className="formControl">
                      <span>Confirm password</span>
                      <input
                        type="password"
                        value={passwordState.confirmPassword}
                        onChange={(event) =>
                          setPasswordState((prev) => ({
                            ...prev,
                            confirmPassword: event.target.value,
                          }))
                        }
                        minLength={6}
                        disabled={saving || resettingPassword}
                      />
                    </label>
                  </div>
                  {resetError && <div className="modalError">{resetError}</div>}
                  {resetSuccess && <div className="modalSuccess">{resetSuccess}</div>}
                  <div className="passwordActions">
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={
                        saving ||
                        resettingPassword ||
                        !passwordState.newPassword ||
                        !passwordState.confirmPassword
                      }
                      onClick={async () => {
                        if (!authUser?.superAdmin || resource !== "users" || !id) {
                          return;
                        }
                        setResettingPassword(true);
                        setResetError("");
                        setResetSuccess("");
                        const trimmed = passwordState.newPassword.trim();
                        if (trimmed.length < 6) {
                          setResetError("Password must be at least 6 characters long.");
                          setResettingPassword(false);
                          return;
                        }
                        if (trimmed !== passwordState.confirmPassword.trim()) {
                          setResetError("Passwords do not match.");
                          setResettingPassword(false);
                          return;
                        }
                        try {
                          await resetUserPassword(id, trimmed);
                          if (!isMounted.current) return;
                          setResetSuccess("Password reset successfully.");
                          setPasswordState({ newPassword: "", confirmPassword: "" });
                        } catch (err) {
                          if (!isMounted.current) return;
                          setResetError(
                            err?.response?.data?.message || err?.message || "Failed to reset password."
                          );
                        } finally {
                          if (isMounted.current) {
                            setResettingPassword(false);
                          }
                        }
                      }}
                    >
                      {resettingPassword ? "Resetting…" : "Reset password"}
                    </button>
                  </div>
                </div>
              )}

              {saveError && <div className="modalError">{saveError}</div>}
              <div className="modalActions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeUserModal}
                  disabled={saving || resettingPassword}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Single;
