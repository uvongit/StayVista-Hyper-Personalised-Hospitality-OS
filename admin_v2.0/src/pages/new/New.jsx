import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser, fetchAvatarOptions, fetchCollection } from "../../api/services.js";
import { AuthContext } from "../../context/AuthContext.js";
import { extractApiErrorMessage } from "../../utils/error.js";

const DEFAULT_FORM_VALUES = (inputs = []) =>
  inputs.reduce((acc, field) => {
    acc[field.id] = "";
    return acc;
  }, {});

const ROLE_HINT =
  "Admins can manage hotels, rooms, bookings, and transactions. Super admins inherit admin access and can manage other admins.";

const New = ({ inputs = [], title = "Invite new user" }) => {
  const navigate = useNavigate();
  const { user: authUser } = useContext(AuthContext);

  const [formValues, setFormValues] = useState(() => DEFAULT_FORM_VALUES(inputs));
  const [isAdmin, setIsAdmin] = useState(true);
  const [superAdmin, setSuperAdmin] = useState(false);
  const [managedHotel, setManagedHotel] = useState("");
  const [isHotelMenuOpen, setIsHotelMenuOpen] = useState(false);
  const [hotelOptions, setHotelOptions] = useState([]);
  const [avatars, setAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [fetchingHotels, setFetchingHotels] = useState(false);
  const [fetchingAvatars, setFetchingAvatars] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadHotels = async () => {
      setFetchingHotels(true);
      try {
        const data = await fetchCollection("hotels");
        setHotelOptions(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(extractApiErrorMessage(err, "Failed to load hotels for assignment."));
      } finally {
        setFetchingHotels(false);
      }
    };

    loadHotels();
  }, []);

  useEffect(() => {
    const loadAvatars = async () => {
      setFetchingAvatars(true);
      try {
        const data = await fetchAvatarOptions();
        setAvatars(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Unable to load avatar catalog", extractApiErrorMessage(err, err?.message));
      } finally {
        setFetchingAvatars(false);
      }
    };

    loadAvatars();
  }, []);

  const handleFieldChange = (event) => {
    const { id, value } = event.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
    setError("");
    setSuccess("");
  };

  const handleRoleToggle = (key, nextValue) => {
    if (key === "superAdmin") {
      setSuperAdmin(nextValue);
      if (nextValue) {
        setIsAdmin(true);
      }
    } else if (key === "isAdmin") {
      if (!superAdmin) {
        setIsAdmin(nextValue);
      }
    }
  };

  const trimmedValues = useMemo(() => {
    return Object.entries(formValues).reduce((acc, [key, value]) => {
      acc[key] = typeof value === "string" ? value.trim() : value;
      return acc;
    }, {});
  }, [formValues]);

  const canSubmit = useMemo(() => {
    const requiredFields = ["username", "email", "password", "phone", "country", "city"];
    return requiredFields.every((field) => Boolean(trimmedValues[field]));
  }, [trimmedValues]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...trimmedValues,
        isAdmin,
        superAdmin,
        ...(managedHotel ? { managedHotel } : {}),
        ...(selectedAvatar ? { img: selectedAvatar } : {}),
      };

      const created = await createUser(payload);
      setSuccess("User invited successfully.");
      setFormValues(() => DEFAULT_FORM_VALUES(inputs));
      setManagedHotel("");
      setSelectedAvatar("");
      if (!superAdmin) {
        setIsAdmin(true);
      }
      setSuperAdmin(false);

      if (created?._id) {
        setTimeout(() => {
          navigate(`/users/${created._id}`);
        }, 600);
      }
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to create user."));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedHotel = useMemo(() => {
    if (!managedHotel) return null;
    return hotelOptions.find((hotel) => hotel._id === managedHotel) || null;
  }, [hotelOptions, managedHotel]);

  const hotelMenuLabel = useMemo(() => {
    if (fetchingHotels) return "Loading hotels…";
    if (selectedHotel) return selectedHotel.name || selectedHotel.title || selectedHotel._id;
    return "No property assigned";
  }, [fetchingHotels, selectedHotel]);

  const resolvedHotelMessage = useMemo(() => {
    if (fetchingHotels) return "Loading available hotels…";
    if (selectedHotel) return "Selected hotel will scope dashboards and notifications.";
    return "Leaving this blank grants full portfolio visibility.";
  }, [fetchingHotels, selectedHotel]);

  const hotelMenuItems = useMemo(() => {
    return hotelOptions.map((hotel) => ({
      id: hotel._id,
      label: hotel.name || hotel.title || hotel._id,
    }));
  }, [hotelOptions]);

  const toggleHotelMenu = () => {
    if (fetchingHotels) return;
    setIsHotelMenuOpen((prev) => !prev);
  };

  const handleSelectHotel = (hotelId) => {
    setManagedHotel((prev) => (prev === hotelId ? "" : hotelId));
    setIsHotelMenuOpen(false);
  };

  useEffect(() => {
    if (!isHotelMenuOpen) return undefined;
    const handleOutsideClick = (event) => {
      if (!(event.target.closest && event.target.closest("[data-hotels-dropdown]"))) {
        setIsHotelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isHotelMenuOpen]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-6 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted dark:text-dark-text-muted">
            Directory · Invite user
          </span>
          <h1 className="text-3xl font-semibold text-text-primary dark:text-dark-text-primary">
            {title}
          </h1>
          <p className="max-w-2xl text-sm text-text-muted dark:text-dark-text-muted">
            Set credentials, assign roles, and optionally connect a managed hotel. Only superadmins can invite new users.
          </p>
        </div>
        <span className="text-xs text-text-muted dark:text-dark-text-muted">
          {submitting ? "Creating user…" : success ? "User created" : "Awaiting submission"}
        </span>
      </header>

      {!authUser?.superAdmin && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          You do not have permission to invite users. Please ask a superadmin to perform this action.
        </div>
      )}

      <section className="grid gap-8 rounded-2xl border border-border bg-surface p-8 shadow-soft dark:border-dark-border dark:bg-dark-surface lg:grid-cols-[minmax(0,360px),1fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Role & permissions</h2>
            <p className="text-sm text-text-muted dark:text-dark-text-muted">{ROLE_HINT}</p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm leading-6 text-text-secondary transition hover:border-primary/40 dark:border-dark-border/60 dark:bg-dark-background/60 dark:text-dark-text-secondary">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(event) => handleRoleToggle("isAdmin", event.target.checked)}
                  disabled={superAdmin}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <strong className="block font-semibold text-text-primary dark:text-dark-text-primary">Admin access</strong>
                  <span className="text-xs text-text-muted dark:text-dark-text-muted">
                    Manage hotels, rooms, bookings, transactions, and user passwords.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-warning/50 bg-warning/5 px-4 py-3 text-sm leading-6 text-text-secondary transition hover:border-warning/60">
                <input
                  type="checkbox"
                  checked={superAdmin}
                  onChange={(event) => handleRoleToggle("superAdmin", event.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <strong className="block font-semibold text-warning">Super admin</strong>
                  <span className="text-xs text-text-muted dark:text-dark-text-muted">
                    Full platform control, including inviting users and promoting/demoting admins.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-3" data-hotels-dropdown>
            <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Assign managed hotel</h2>
            <p className="text-sm text-text-muted dark:text-dark-text-muted">
              Optional. Assign a property to limit this admin&apos;s context.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={toggleHotelMenu}
                disabled={fetchingHotels}
                className={`relative flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-3 focus:ring-primary/20 dark:border-dark-border ${
                  isHotelMenuOpen
                    ? "border-primary/60 bg-primary/5"
                    : "border-border bg-white hover:border-primary/50 dark:bg-dark-background"
                }`}
              >
                <span className="truncate text-left text-text-secondary dark:text-dark-text-primary">
                  {hotelMenuLabel}
                </span>
                <span className="ml-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary dark:bg-primary/20 dark:text-primary">
                  {fetchingHotels ? "…" : isHotelMenuOpen ? "▲" : "▼"}
                </span>
              </button>
              {isHotelMenuOpen && (
                <div className="z-20 grid max-h-64 gap-1 overflow-y-auto rounded-xl border border-border bg-white p-2 shadow-lg ring-1 ring-black/5 dark:border-dark-border dark:bg-dark-surface">
                  <button
                    type="button"
                    onClick={() => handleSelectHotel("")}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 ${
                      !managedHotel ? "bg-primary/10 text-primary dark:bg-primary/20" : "text-text-secondary dark:text-dark-text-secondary"
                    }`}
                  >
                    <span className="flex-1 truncate">No property assigned</span>
                    {!managedHotel && <span className="ml-2 text-xs">Selected</span>}
                  </button>
                  {hotelMenuItems.length === 0 && !fetchingHotels && (
                    <span className="rounded-lg px-3 py-2 text-sm text-text-muted dark:text-dark-text-muted">
                      No hotels available.
                    </span>
                  )}
                  {hotelMenuItems.map((option) => {
                    const isSelected = managedHotel === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelectHotel(option.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 ${
                          isSelected ? "bg-primary/10 text-primary dark:bg-primary/20" : "text-text-secondary dark:text-dark-text-secondary"
                        }`}
                      >
                        <span className="flex-1 truncate">{option.label}</span>
                        {isSelected && <span className="text-xs">Selected</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-text-muted dark:text-dark-text-muted">{resolvedHotelMessage}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Avatar</h2>
            <p className="text-sm text-text-muted dark:text-dark-text-muted">
              Pick a profile avatar or leave blank to assign later.
            </p>
            <div className="grid grid-cols-4 gap-3 md:grid-cols-5">
              {fetchingAvatars && <span className="col-span-full text-xs text-text-muted">Loading avatars…</span>}
              {!fetchingAvatars && avatars.length === 0 && (
                <span className="col-span-full text-xs text-text-muted">No avatars available.</span>
              )}
              {avatars.map((avatar) => {
                const isSelected = selectedAvatar === avatar;
                return (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(isSelected ? "" : avatar)}
                    className={`relative overflow-hidden rounded-xl border p-1 transition ${
                      isSelected ? "border-primary shadow-[0_0_0_2px_rgba(59,130,246,0.35)]" : "border-border/60"
                    }`}
                  >
                    <img src={avatar} alt="Avatar option" className="h-16 w-full rounded-lg object-cover" />
                    {isSelected && (
                      <span className="absolute inset-1 rounded-lg border-2 border-primary/80 ring-2 ring-primary/20" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          {inputs.map((input) => (
            <label key={input.id} className="grid gap-1 text-sm">
              <span className="font-medium text-text-secondary dark:text-dark-text-secondary">{input.label}</span>
              <input
                id={input.id}
                type={input.type}
                placeholder={input.placeholder}
                value={formValues[input.id] || ""}
                onChange={handleFieldChange}
                required={input.required ?? true}
                className="rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
              />
            </label>
          ))}

          {success && (
            <div className="rounded-lg border border-success/20 bg-success/10 px-4 py-2 text-sm text-success" role="status">
              {success}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-2 text-sm text-danger" role="alert">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/60"
              disabled={!canSubmit || submitting || !authUser?.superAdmin}
            >
              {submitting ? "Creating…" : "Invite user"}
            </button>
            <span className="text-xs text-text-muted dark:text-dark-text-muted">
              All base fields are required.
            </span>
          </div>
        </form>
      </section>
    </div>
  );
};

export default New;
