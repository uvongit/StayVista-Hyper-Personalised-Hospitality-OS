import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  fetchResourceById,
  updateUser,
  resetUserPassword,
  updateRoom,
  uploadRoomImage,
  fetchCollection,
} from "../../api/services.js";
import { AuthContext } from "../../context/AuthContext.js";
import LatestTransactionsTable from "../../components/table/LatestTransactionsTable.jsx";

const PLACEHOLDER_IMAGE = "https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg";
const MAX_ROOM_IMAGES = 6;

const normalizeManagedHotelValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (typeof value._id === "string") return value._id;
    if (typeof value.id === "string") return value.id;
  }
  return "";
};

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
  if (value === undefined || value === null || value === "") return "—";

  if (Array.isArray(value)) {
    if (key === "roomNumbers") {
      const numbers = value
        .map((room) => (typeof room === "object" ? room.number : room))
        .filter(Boolean);
      return numbers.length ? numbers.join(", ") : "—";
    }
    if (key === "photos") return `${value.length} photo${value.length === 1 ? "" : "s"}`;
    return value.join(", ");
  }

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (value && typeof value === "object") {
    if (key === "managedHotel") {
      const hotelName = value?.name || value?.title;
      const hotelCity = value?.city;
      if (hotelName && hotelCity) return `${hotelName} · ${hotelCity}`;
      if (hotelName) return hotelName;
      if (value?._id) return value._id;
    }

    if (value?._id && typeof value._id === "string") return value._id;

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  if (key.toLowerCase().includes("date")) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleString();
  }

  return value;
};

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === "") return "—";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return numeric.toLocaleString();
  }
};

const derivePrimaryTitle = (resource, data) => {
  if (!data) return "";
  if (resource === "users") return data.username || data.email || "User";
  if (resource === "hotels") return data.name || data.title || "Hotel";
  if (resource === "rooms") return data.title || "Room";
  return data.name || data.title || "Details";
};

const deriveSubTitle = (resource, data) => {
  if (!data) return "";
  if (resource === "users") {
    const parts = [data.email, data.phone, data.city].filter(Boolean);
    return parts.join(" · ");
  }
  if (resource === "hotels") return data.type ? `${formatLabel(data.type)} · ${data.city || ""}` : data.city;
  if (resource === "rooms") return data.desc || "";
  return "";
};

const getImageSrc = (resource, data) => {
  if (!data) return PLACEHOLDER_IMAGE;
  if (resource === "users" && data.img) return data.img;
  if (resource === "hotels" && data.photos?.length) return data.photos[0];
  if (resource === "rooms" && data.photos?.length) return data.photos[0];
  return PLACEHOLDER_IMAGE;
};

const Single = () => {
  const location = useLocation();
  const params = useParams();
  const id = useMemo(() => Object.values(params)[0], [params]);
  const resource = useMemo(() => location.pathname.split("/")[1] || "", [location.pathname]);
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [formState, setFormState] = useState(null);
  const [passwordState, setPasswordState] = useState({ newPassword: "", confirmPassword: "" });
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const { user: authUser, dispatch } = useContext(AuthContext);
  const isMounted = useRef(true);

  const [hotelOptions, setHotelOptions] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [hotelOptionsError, setHotelOptionsError] = useState("");

  const [editingRoom, setEditingRoom] = useState(false);
  const [roomForm, setRoomForm] = useState(null);
  const [roomSaving, setRoomSaving] = useState(false);
  const [roomSaveError, setRoomSaveError] = useState("");
  const [roomSaveSuccess, setRoomSaveSuccess] = useState("");
  const [roomUploading, setRoomUploading] = useState(false);
  const [roomImageFeedback, setRoomImageFeedback] = useState("");

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
        setError(err?.response?.data?.message || err?.message || "Failed to load details");
        setData(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [resource, id]);


  const configuredFields = useMemo(() => fieldConfig[resource] || [], [resource]);
  const configuredKeys = useMemo(() => new Set(configuredFields.map((field) => field.key)), [configuredFields]);

  const fallbackFields = useMemo(() => {
    if (!data) return [];
    return Object.keys(data)
      .filter((key) => !configuredKeys.has(key) && !excludedFallbackFields.includes(key))
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

    return [...configuredDetails, ...fallbackDetails].filter((detail) => detail.value !== "");
  }, [configuredFields, fallbackFields, data]);

  const pageTitle = resourceTitles[resource] || "Details";
  const primaryTitle = derivePrimaryTitle(resource, data);
  const subTitle = deriveSubTitle(resource, data);
  const imageSrc = getImageSrc(resource, data);
  const isUserResource = resource === "users";
  const isHotelResource = resource === "hotels";
  const isRoomResource = resource === "rooms";
  const canUsePortal = typeof window !== "undefined" && typeof document !== "undefined";
  const modalRoot = canUsePortal ? document.body : null;

  const resetPasswordFields = () => {
    setPasswordState({ newPassword: "", confirmPassword: "" });
  };

  const clearPasswordFeedback = () => {
    setResetError("");
    setResetSuccess("");
  };

  const resetPasswordForm = () => {
    resetPasswordFields();
    clearPasswordFeedback();
  };

  const closeUserModal = () => {
    setEditingUser(false);
    resetPasswordForm();
    setSaveSuccess("");
    setSaveError("");
  };

  const openRoomDrawer = () => {
    if (!data) return;
    const normalized = normalizeRoom(data);
    setRoomForm(normalized);
    setRoomSaveError("");
    setRoomSaveSuccess("");
    setRoomImageFeedback(
      normalized.photos.length ? `${normalized.photos.length}/${MAX_ROOM_IMAGES} images in gallery.` : ""
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
        if (uploaded) uploadedUrls.push(uploaded);
        if (roomForm.photos.length + uploadedUrls.length >= MAX_ROOM_IMAGES) break;
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
      if (event.target) event.target.value = "";
    }
  };

  const handleRemoveRoomPhoto = (index) => {
    setRoomForm((prev) => {
      if (!prev) return prev;
      const nextPhotos = prev.photos.filter((_, photoIndex) => photoIndex !== index);
      setRoomImageFeedback(nextPhotos.length ? `${nextPhotos.length}/${MAX_ROOM_IMAGES} images in gallery.` : "");
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
        roomNumbers: [...prev.roomNumbers, { _id: `temp-${Date.now()}`, number: "", unavailableDates: [] }],
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
      return { ...prev, roomNumbers: prev.roomNumbers.filter((roomNumber) => roomNumber._id !== roomNumberId) };
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
        if (Number.isNaN(parsedNumber)) return null;
        const payload = {
          number: parsedNumber,
          unavailableDates: Array.isArray(roomNumber.unavailableDates) ? roomNumber.unavailableDates : [],
        };
        if (roomNumber._id && !`${roomNumber._id}`.startsWith("temp-")) payload._id = roomNumber._id;
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
        normalized.photos.length ? `${normalized.photos.length}/${MAX_ROOM_IMAGES} images in gallery.` : ""
      );
      setRoomSaveSuccess("Room details saved.");
    } catch (err) {
      setRoomSaveError(err?.response?.data?.message || err?.message || "Failed to save room details.");
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

  useEffect(() => {
    if (!editingUser || !isUserResource || !authUser?.superAdmin) return undefined;

    let active = true;

    const loadHotels = async () => {
      setLoadingHotels(true);
      setHotelOptionsError("");
      try {
        const hotels = await fetchCollection("hotels");
        if (!active) return;
        const normalized = Array.isArray(hotels)
          ? hotels
              .map((hotel) => ({
                id: normalizeManagedHotelValue(hotel),
                name: hotel?.name || hotel?.title || "",
                city: hotel?.city || "",
              }))
              .filter((option) => option.id && option.name)
              .sort((a, b) => a.name.localeCompare(b.name))
          : [];
        setHotelOptions(normalized);
      } catch (err) {
        if (!active) return;
        setHotelOptionsError(err?.response?.data?.message || err?.message || "Failed to load hotels.");
        setHotelOptions([]);
      } finally {
        if (active) setLoadingHotels(false);
      }
    };

    loadHotels();

    return () => {
      active = false;
    };
  }, [editingUser, isUserResource, authUser?.superAdmin]);

  const selectedManagedHotelId = formState?.superAdmin
    ? ""
    : normalizeManagedHotelValue(formState?.managedHotel);
  const shouldShowManagedHotelFallbackOption = Boolean(
    selectedManagedHotelId && !hotelOptions.some((option) => option.id === selectedManagedHotelId)
  );
  const managedHotelFallbackLabel = (() => {
    if (!data?.managedHotel) return "Current selection";
    const name = data.managedHotel?.name || data.managedHotel?.title || "Current selection";
    const city = data.managedHotel?.city ? ` · ${data.managedHotel.city}` : "";
    return `${name}${city}`;
  })();

  const hotelStats = useMemo(() => {
    if (!isHotelResource || !data) return [];
    return [
      { label: "Property type", value: data.type ? formatLabel(data.type) : "" },
      {
        label: "Base rate",
        value:
          data.cheapestPrice !== undefined && data.cheapestPrice !== null
            ? formatCurrency(data.cheapestPrice)
            : "",
      },
      { label: "Distance", value: data.distance ? `${data.distance} from centre` : "" },
      { label: "Rooms linked", value: Array.isArray(data.rooms) ? `${data.rooms.length} room types` : "" },
      { label: "Featured listing", value: data.featured ? "Yes" : "No" },
      { label: "Address", value: data.address || "" },
    ].filter((item) => item.value);
  }, [data, isHotelResource]);

  const hotelGallery = useMemo(() => {
    if (!isHotelResource || !data?.photos?.length) return [];
    return data.photos.slice(0, 4);
  }, [data, isHotelResource]);

  const renderWithPortal = (element) => {
    if (!element) return null;
    return modalRoot ? createPortal(element, modalRoot) : element;
  };

  const userModal =
    editingUser && data && formState ? (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-6">
        <div className="w-full max-w-2xl space-y-6 rounded-2xl border border-border bg-surface p-8 shadow-soft dark:border-dark-border dark:bg-dark-surface">
          <header className="space-y-1">
            <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Edit user</h2>
            <p className="text-sm text-text-muted dark:text-dark-text-muted">
              Update contact information and administrative permissions for this account.
            </p>
          </header>

          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              setSaveError("");
              setSaveSuccess("");
              try {
                const payload = {
                  ...formState,
                  isAdmin: Boolean(formState.isAdmin),
                  superAdmin: Boolean(formState.superAdmin),
                };
                payload.managedHotel = payload.superAdmin
                  ? ""
                  : normalizeManagedHotelValue(formState.managedHotel);

                const updated = await updateUser(id, payload);
                if (!isMounted.current) return;
                setData(updated);
                setFormState((prev) => ({
                  ...prev,
                  username: updated?.username || "",
                  email: updated?.email || "",
                  phone: updated?.phone || "",
                  country: updated?.country || "",
                  city: updated?.city || "",
                  isAdmin: Boolean(updated?.isAdmin),
                  superAdmin: Boolean(updated?.superAdmin),
                  managedHotel: updated?.superAdmin ? "" : normalizeManagedHotelValue(updated?.managedHotel),
                }));
                if (authUser?._id === updated._id) {
                  dispatch({ type: "UPDATE_USER", payload: updated });
                }
                setSaveSuccess("Profile details saved successfully.");
              } catch (err) {
                if (!isMounted.current) return;
                setSaveError(err?.response?.data?.message || err?.message || "Failed to update user");
              } finally {
                if (isMounted.current) setSaving(false);
              }
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { id: "username", label: "Username" },
                { id: "email", label: "Email", type: "email" },
                { id: "phone", label: "Phone" },
                { id: "country", label: "Country" },
                { id: "city", label: "City" },
              ].map(({ id: fieldId, label, type = "text" }) => (
                <label key={fieldId} className="grid gap-1 text-sm">
                  <span className="font-medium text-text-secondary dark:text-dark-text-secondary">{label}</span>
                  <input
                    id={fieldId}
                    type={type}
                    value={formState[fieldId] || ""}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, [fieldId]: event.target.value }))
                    }
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                  />
                </label>
              ))}
              {authUser?.superAdmin && (
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-text-secondary dark:text-dark-text-secondary">Managed Hotel</span>
                  <select
                    value={selectedManagedHotelId}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setFormState((prev) => ({
                        ...prev,
                        managedHotel: nextValue,
                        isAdmin: nextValue ? true : prev.isAdmin,
                      }));
                    }}
                    disabled={formState.superAdmin || loadingHotels}
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface/70 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary dark:disabled:bg-dark-surface/70"
                  >
                    <option value="">No managed hotel</option>
                    {shouldShowManagedHotelFallbackOption && (
                      <option value={selectedManagedHotelId}>{managedHotelFallbackLabel}</option>
                    )}
                    {hotelOptions.map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name}
                        {hotel.city ? ` · ${hotel.city}` : ""}
                      </option>
                    ))}
                  </select>
                  {loadingHotels && (
                    <span className="text-xs text-text-muted dark:text-dark-text-muted">Loading hotel list…</span>
                  )}
                  {hotelOptionsError && (
                    <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">
                      {hotelOptionsError}
                    </div>
                  )}
                  <span className="text-xs text-text-muted dark:text-dark-text-muted">
                    Assigning a hotel automatically gives this user property manager access.
                  </span>
                </label>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3 text-sm font-medium text-text-secondary dark:border-dark-border/60 dark:text-dark-text-secondary">
                <input
                  type="checkbox"
                  checked={formState.isAdmin}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, isAdmin: event.target.checked }))
                  }
                  className="h-4 w-4"
                />
                <span>Grant admin access</span>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3 text-sm font-medium text-text-secondary dark:border-dark-border/60 dark:text-dark-text-secondary">
                <input
                  type="checkbox"
                  checked={formState.superAdmin}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setFormState((prev) => ({
                      ...prev,
                      superAdmin: checked,
                      managedHotel: checked ? "" : normalizeManagedHotelValue(prev.managedHotel),
                    }));
                  }}
                  className="h-4 w-4"
                />
                <span>Grant super-admin access</span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-text-secondary dark:text-dark-text-secondary">New password</span>
                <input
                  type="password"
                  value={passwordState.newPassword}
                  onChange={(event) =>
                    setPasswordState((prev) => ({ ...prev, newPassword: event.target.value }))
                  }
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-text-secondary dark:text-dark-text-secondary">Confirm password</span>
                <input
                  type="password"
                  value={passwordState.confirmPassword}
                  onChange={(event) =>
                    setPasswordState((prev) => ({ ...prev, confirmPassword: event.target.value }))
                  }
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                />
              </label>
            </div>

            {saveError && (
              <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                {saveSuccess}
              </div>
            )}

            {resetError && (
              <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                {resetSuccess}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/60"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text-secondary"
                onClick={closeUserModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text-secondary"
                disabled={
                  resettingPassword ||
                  !passwordState.newPassword ||
                  passwordState.newPassword !== passwordState.confirmPassword
                }
                onClick={async () => {
                  if (!passwordState.newPassword || passwordState.newPassword !== passwordState.confirmPassword) return;
                  setResettingPassword(true);
                  clearPasswordFeedback();
                  try {
                    const trimmedPassword = passwordState.newPassword.trim();
                    await resetUserPassword(id, trimmedPassword);
                    resetPasswordFields();
                    setResetSuccess("Password reset successfully.");
                  } catch (err) {
                    setResetError(
                      err?.response?.data?.message || err?.message || "Failed to reset password"
                    );
                  } finally {
                    setResettingPassword(false);
                  }
                }}
              >
                {resettingPassword ? "Resetting…" : "Reset password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
    : null;

  const roomModal =
    editingRoom && isRoomResource && roomForm ? (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-6 sm:p-8">
        <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-[0_48px_140px_-70px_rgba(15,23,42,0.75)] dark:border-dark-border/80 dark:bg-dark-surface">
          <header className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 py-5 sm:px-8 sm:py-6 dark:border-dark-border/60">
            <div className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-l from-primary/30 via-transparent to-transparent opacity-60 blur-2xl" />
            <div className="relative flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary dark:bg-primary/20">
                  Room management
                </span>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
                    Manage room
                  </h2>
                  <p className="max-w-lg text-sm text-text-muted dark:text-dark-text-muted">
                    Refresh inventory details, imagery, and suite availability without leaving this property view.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                <div className="rounded-2xl border border-border/50 bg-white/70 px-4 py-1.5 text-text-primary backdrop-blur dark:border-dark-border/50 dark:bg-dark-background/70 dark:text-dark-text-primary">
                  <span className="block text-[11px] uppercase tracking-[0.22em] text-text-muted dark:text-dark-text-muted">
                    Nightly rate
                  </span>
                  <span>{formatCurrency(roomForm.price)}</span>
                </div>
                <div className="rounded-2xl border border-border/50 bg-white/70 px-4 py-1.5 text-text-primary backdrop-blur dark:border-dark-border/50 dark:bg-dark-background/70 dark:text-dark-text-primary">
                  <span className="block text-[11px] uppercase tracking-[0.22em] text-text-muted dark:text-dark-text-muted">
                    Capacity
                  </span>
                  <span>{roomForm.maxPeople || "—"} guests</span>
                </div>
                <div className="rounded-2xl border border-border/50 bg-white/70 px-4 py-1.5 text-text-primary backdrop-blur dark:border-dark-border/50 dark:bg-dark-background/70 dark:text-dark-text-primary">
                  <span className="block text-[11px] uppercase tracking-[0.22em] text-text-muted dark:text-dark-text-muted">
                    Suites linked
                  </span>
                  <span>{roomForm.roomNumbers.length}</span>
                </div>
              </div>
              <button
                type="button"
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-base text-text-secondary transition hover:border-danger hover:text-danger dark:border-dark-border/60 dark:text-dark-text-secondary"
                onClick={closeRoomDrawer}
                aria-label="Close room drawer"
              >
                ×
              </button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto bg-background/80 dark:bg-dark-background/80">
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <div className="space-y-6">
                  <section className="rounded-2xl border border-border/60 bg-white/80 shadow-soft backdrop-blur dark:border-dark-border/60 dark:bg-dark-background/70">
                    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 px-5 py-4 dark:border-dark-border/60">
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Room profile</h3>
                        <p className="text-sm text-text-muted dark:text-dark-text-muted">
                          Essential information guests will see first.
                        </p>
                      </div>
                    </header>
                    <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                      <label className="grid gap-1 text-sm">
                        <span className="font-medium text-text-secondary dark:text-dark-text-secondary">Title</span>
                        <input
                          type="text"
                          value={roomForm.title}
                          onChange={(event) => handleRoomFieldChange("title", event.target.value)}
                          placeholder="Signature Skyline Suite"
                          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                        />
                      </label>
                      <label className="grid gap-1 text-sm">
                        <span className="font-medium text-text-secondary dark:text-dark-text-secondary">Nightly price (₹)</span>
                        <input
                          type="number"
                          min="0"
                          value={roomForm.price}
                          onChange={(event) => handleRoomFieldChange("price", event.target.value)}
                          placeholder="350"
                          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                        />
                      </label>
                      <label className="grid gap-1 text-sm">
                        <span className="font-medium text-text-secondary dark:text-dark-text-secondary">Max guests</span>
                        <input
                          type="number"
                          min="1"
                          value={roomForm.maxPeople}
                          onChange={(event) => handleRoomFieldChange("maxPeople", event.target.value)}
                          placeholder="4"
                          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                        />
                      </label>
                      <div className="grid gap-1 text-sm sm:col-span-2">
                        <span className="font-medium text-text-secondary dark:text-dark-text-secondary">Description</span>
                        <textarea
                          rows="4"
                          value={roomForm.desc}
                          onChange={(event) => handleRoomFieldChange("desc", event.target.value)}
                          placeholder="Describe standout amenities, layout, and service highlights."
                          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border/60 bg-white/80 shadow-soft backdrop-blur dark:border-dark-border/60 dark:bg-dark-background/70">
                    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-5 py-4 text-sm dark:border-dark-border/60">
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Gallery</h3>
                        <p className="text-sm text-text-muted dark:text-dark-text-muted">
                          Showcase high-impact imagery. The first image appears as the cover photo.
                        </p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20">
                        {roomForm.photos.length}/{MAX_ROOM_IMAGES} images
                      </span>
                    </header>
                    <div className="space-y-4 px-5 py-5">
                      {roomImageFeedback && (
                        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary dark:border-primary/50 dark:bg-primary/10">
                          {roomImageFeedback}
                        </div>
                      )}
                      <label
                        className={`flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-white/60 px-4 py-6 text-center text-sm text-text-muted transition hover:border-primary hover:text-primary dark:border-dark-border/60 dark:bg-dark-background/60 dark:text-dark-text-muted ${
                          roomUploading ? "pointer-events-none opacity-60" : "cursor-pointer"
                        }`}
                      >
                        <span className="font-medium">
                          {roomUploading ? "Uploading…" : "Drag & drop or click to upload"}
                        </span>
                        <span className="text-xs text-text-muted dark:text-dark-text-muted">
                          PNG, JPG, WEBP up to 4MB each
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          multiple
                          onChange={handleRoomPhotoUpload}
                          disabled={roomUploading || roomSaving}
                          className="hidden"
                        />
                      </label>
                      {roomForm.photos.length > 0 && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {roomForm.photos.map((photo, index) => (
                            <figure
                              key={`${photo}-${index}`}
                              className="group relative overflow-hidden rounded-xl border border-border/60 bg-background/80 dark:border-dark-border/60 dark:bg-dark-background/60"
                            >
                              <img
                                src={photo}
                                alt={`Room visual ${index + 1}`}
                                className="h-40 w-full object-cover transition duration-200 group-hover:scale-105"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/75 text-xs font-semibold text-white opacity-90 transition hover:bg-danger hover:text-white"
                                onClick={() => handleRemoveRoomPhoto(index)}
                                disabled={roomSaving || roomUploading}
                                aria-label={`Remove room image ${index + 1}`}
                              >
                                ✕
                              </button>
                            </figure>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border/60 bg-white/80 shadow-soft backdrop-blur dark:border-dark-border/60 dark:bg-dark-background/70">
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4 dark:border-dark-border/60">
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Suite numbers</h3>
                        <p className="text-sm text-text-muted dark:text-dark-text-muted">
                          Add every room number available for this category to track occupancy accurately.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary transition hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text-secondary"
                        onClick={handleAddRoomNumber}
                        disabled={roomSaving || roomUploading}
                      >
                        + Add suite
                      </button>
                    </header>
                    <div className="space-y-3 px-5 py-5">
                      {roomForm.roomNumbers.length === 0 && (
                        <div className="rounded-xl border border-border/50 bg-background/70 px-4 py-3 text-sm text-text-muted dark:border-dark-border/50 dark:bg-dark-background/70 dark:text-dark-text-muted">
                          No suites linked yet. Add at least one number to keep this room bookable.
                        </div>
                      )}
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {roomForm.roomNumbers.map((roomNumber) => (
                          <div
                            key={roomNumber._id}
                            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-white px-4 py-3 text-sm shadow-sm dark:border-dark-border/60 dark:bg-dark-background/80"
                          >
                            <div className="flex flex-1 flex-col gap-1">
                              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
                                Suite number
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={roomNumber.number}
                                onChange={(event) => handleRoomNumberChange(roomNumber._id, event.target.value)}
                                className="w-28 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                              />
                            </div>
                            <div className="flex flex-col items-end gap-2 text-xs text-text-muted dark:text-dark-text-muted">
                              <span className="rounded-full bg-primary/5 px-3 py-1 font-semibold text-primary dark:bg-primary/20 dark:text-primary/90">
                                {Array.isArray(roomNumber.unavailableDates)
                                  ? `${roomNumber.unavailableDates.length} dates on hold`
                                  : "0 dates on hold"}
                              </span>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 font-semibold text-text-secondary transition hover:border-danger hover:text-danger dark:border-dark-border dark:text-dark-text-secondary"
                                onClick={() => handleRemoveRoomNumber(roomNumber._id)}
                                disabled={roomSaving || roomUploading}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>

                <aside className="space-y-6">
                  <div className="rounded-2xl border border-border/60 bg-white/80 px-5 py-5 shadow-soft backdrop-blur dark:border-dark-border/60 dark:bg-dark-background/70">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted dark:text-dark-text-muted">
                      Inventory snapshot
                    </h3>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-text-muted dark:text-dark-text-muted">Status</dt>
                        <dd className="font-semibold text-text-primary dark:text-dark-text-primary">
                          {roomForm.roomNumbers.length > 0 ? "Ready to publish" : "Needs suites"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-text-muted dark:text-dark-text-muted">Lead title</dt>
                        <dd className="truncate font-semibold text-text-primary dark:text-dark-text-primary">
                          {roomForm.title || "Untitled room"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-text-muted dark:text-dark-text-muted">Gallery coverage</dt>
                        <dd className="font-semibold text-text-primary dark:text-dark-text-primary">
                          {roomForm.photos.length}/{MAX_ROOM_IMAGES}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-text-muted dark:text-dark-text-muted">Max guests</dt>
                        <dd className="font-semibold text-text-primary dark:text-dark-text-primary">
                          {roomForm.maxPeople || "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-white/80 px-5 py-5 shadow-soft backdrop-blur dark:border-dark-border/60 dark:bg-dark-background/70">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted dark:text-dark-text-muted">
                      Publishing checklist
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm">
                      <li className="flex items-start gap-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary dark:bg-primary/20">
                          ✓
                        </span>
                        <div>
                          <p className="font-semibold text-text-primary dark:text-dark-text-primary">Content completeness</p>
                          <p className="text-xs text-text-muted dark:text-dark-text-muted">
                            {roomForm.desc ? "Description included" : "Add a compelling description"}
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary dark:bg-primary/20">
                          ✓
                        </span>
                        <div>
                          <p className="font-semibold text-text-primary dark:text-dark-text-primary">Gallery quality</p>
                          <p className="text-xs text-text-muted dark:text-dark-text-muted">
                            {roomForm.photos.length > 0 ? "Images attached" : "Upload at least one image"}
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary dark:bg-primary/20">
                          ✓
                        </span>
                        <div>
                          <p className="font-semibold text-text-primary dark:text-dark-text-primary">Availability mapping</p>
                          <p className="text-xs text-text-muted dark:text-dark-text-muted">
                            {roomForm.roomNumbers.length > 0 ? "Suites mapped" : "Add suite numbers to publish"}
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-white/80 px-5 py-5 text-sm shadow-soft backdrop-blur dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-text-muted">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted dark:text-dark-text-muted">
                      Notes
                    </h3>
                    <p className="mt-3 text-text-muted dark:text-dark-text-muted">
                      Update pricing after major seasonal changes and keep suites synced with PMS to avoid overbooking.
                      Track maintenance windows by adding unavailable dates to each suite number.
                    </p>
                  </div>
                </aside>
              </div>
            </div>
          </div>
          <footer className="border-t border-border/60 bg-surface/95 px-4 py-4 sm:px-6 dark:border-dark-border/60 dark:bg-dark-surface/95">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                {roomSaveError && <span className="font-semibold text-danger">{roomSaveError}</span>}
                {roomSaveSuccess && <span className="font-semibold text-success">{roomSaveSuccess}</span>}
                {!roomSaveError && !roomSaveSuccess && (
                  <span className="text-text-muted dark:text-dark-text-muted">
                    Save changes to sync with guests and internal systems.
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text-secondary"
                  onClick={closeRoomDrawer}
                  disabled={roomSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/60"
                  onClick={handleRoomSave}
                  disabled={roomSaving || roomUploading}
                >
                  {roomSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    )
    : null;

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-8 overflow-x-hidden">
        <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted dark:text-dark-text-muted">
              Details · {pageTitle}
            </span>
            <h1 className="text-3xl font-semibold text-text-primary dark:text-dark-text-primary">
              {primaryTitle || pageTitle}
            </h1>
            <p className="max-w-2xl text-sm text-text-muted dark:text-dark-text-muted">
              Review {resource} information, inspect linked resources, and manage records directly from this overview.
            </p>
          </div>
          <span className="text-xs text-text-muted dark:text-dark-text-muted">
            {loading ? "Loading details…" : data ? "Information loaded" : "No data"}
          </span>
        </header>

        <section className="grid gap-8 overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface sm:p-8">
          <div className="flex min-w-0 flex-col gap-6 lg:flex-row">
            <div className="flex flex-col items-center gap-4 text-center lg:w-64">
              <div className="h-40 w-40 overflow-hidden rounded-2xl border border-border/60 bg-background dark:border-dark-border dark:bg-dark-background">
                <img src={imageSrc} alt={primaryTitle} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-text-primary dark:text-dark-text-primary">{primaryTitle}</h1>
                {subTitle && <p className="text-sm text-text-muted dark:text-dark-text-muted">{subTitle}</p>}
                {isUserResource && data && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-semibold">
                    {data.superAdmin && <span className="badge badge-success">Super admin</span>}
                    {!data.superAdmin && data.isAdmin && <span className="badge badge-info">Admin</span>}
                    {!data.isAdmin && !data.superAdmin && <span className="badge badge-warning">Member</span>}
                    {data.managedHotel && <span className="badge badge-primary">Manager</span>}
                  </div>
                )}
                {isHotelResource && data && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-semibold">
                    {data.type && <span className="badge badge-info">{formatLabel(data.type)}</span>}
                    {data.featured && <span className="badge badge-success">Featured</span>}
                    {data.cheapestPrice !== undefined && data.cheapestPrice !== null && (
                      <span className="badge badge-primary">{formatCurrency(data.cheapestPrice)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-text-muted dark:text-dark-text-muted">
                    Dashboard / {pageTitle}
                  </p>
                  <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">{pageTitle}</h2>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed"
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
                          managedHotel: source.superAdmin
                            ? ""
                            : normalizeManagedHotelValue(source.managedHotel),
                        };
                      });
                      resetPasswordForm();
                      setSaveError("");
                      setSaveSuccess("");
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

              <div className="min-w-0 rounded-2xl border border-border/60 bg-background/60 p-5 dark:border-dark-border/60 dark:bg-dark-background/60 sm:p-6">
                {loading && <div className="text-sm text-text-muted dark:text-dark-text-muted">Loading details…</div>}
                {error && !loading && (
                  <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                    {error}
                  </div>
                )}
                {!loading && !error && data && (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {details.length ? (
                        details.map(({ key, label, value }) => (
                          <div key={key} className="rounded-xl border border-border/50 bg-white px-4 py-3 text-sm dark:border-dark-border/50 dark:bg-dark-surface/80">
                            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
                              {label}
                            </span>
                            <span className="block pt-1 text-text-primary dark:text-dark-text-primary">{value}</span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full rounded-lg border border-border/50 bg-white px-4 py-3 text-sm text-text-muted dark:border-dark-border/50 dark:bg-dark-surface/80 dark:text-dark-text-muted">
                          No additional information available.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {isHotelResource && data && (
          <section className="space-y-6 overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface sm:p-8">
            <header className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Property highlights</h2>
              <p className="text-sm text-text-muted dark:text-dark-text-muted">
                Positioned details to help guests make quick decisions. Update these fields from the edit action if anything changes.
              </p>
            </header>

            {hotelStats.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {hotelStats.map(({ label, value }) => (
                  <article key={label} className="rounded-xl border border-border/60 bg-background/60 px-5 py-4 text-sm dark:border-dark-border/60 dark:bg-dark-background/60">
                    <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
                      {label}
                    </span>
                    <span className="block pt-2 text-text-primary dark:text-dark-text-primary">{value}</span>
                  </article>
                ))}
              </div>
            )}

            {data.desc && (
              <div className="rounded-xl border border-border/60 bg-background/60 px-5 py-4 text-sm dark:border-dark-border/60 dark:bg-dark-background/60">
                <h3 className="mb-2 text-sm font-semibold text-text-primary dark:text-dark-text-primary">About this stay</h3>
                <p className="text-text-muted dark:text-dark-text-muted">{data.desc}</p>
              </div>
            )}

            {hotelGallery.length > 1 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {hotelGallery.map((photo, index) => (
                  <figure key={photo} className="aspect-video overflow-hidden rounded-2xl border border-border/60 bg-background dark:border-dark-border">
                    <img
                      src={photo || PLACEHOLDER_IMAGE}
                      alt={`Hotel visual ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </figure>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Latest transactions</h3>
                <Link to="/transactions" className="text-sm font-medium text-primary transition hover:text-primary-dark">
                  View all
                </Link>
              </div>
              <LatestTransactionsTable />
            </div>
          </section>
        )}
      </div>
      {renderWithPortal(userModal)}
      {renderWithPortal(roomModal)}
    </>
  );
};

export default Single;
