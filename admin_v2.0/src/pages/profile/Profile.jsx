import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext.js";
import {
  fetchAvatarOptions,
  updateUserAvatar as updateUserAvatarApi,
} from "../../api/services.js";
import { extractApiErrorMessage } from "../../utils/error.js";

const PLACEHOLDER_IMAGE = "https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const Profile = () => {
  const { user, dispatch } = useContext(AuthContext);
  const [avatars, setAvatars] = useState([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.img || "");

  useEffect(() => {
    const loadAvatars = async () => {
      setLoadingAvatars(true);
      setAvatarError("");
      try {
        const options = await fetchAvatarOptions();
        setAvatars(options);
      } catch (err) {
        setAvatarError(extractApiErrorMessage(err, "Failed to load avatar options"));
      } finally {
        setLoadingAvatars(false);
      }
    };

    loadAvatars();
  }, []);

  useEffect(() => {
    setSelectedAvatar(user?.img || "");
  }, [user?.img]);

  const handleAvatarSelect = (img) => {
    setSelectedAvatar(img);
    setAvatarError("");
  };

  const handleAvatarSave = async () => {
    if (!user?._id || !selectedAvatar || selectedAvatar === user?.img) return;
    try {
      setSaving(true);
      const updated = await updateUserAvatarApi(user._id, selectedAvatar);
      dispatch({ type: "UPDATE_USER", payload: updated });
    } catch (err) {
      setAvatarError(extractApiErrorMessage(err, "Failed to update avatar"));
    } finally {
      setSaving(false);
    }
  };

  const details = useMemo(
    () => [
      { label: "Username", value: user?.username },
      { label: "Email", value: user?.email },
      { label: "Phone", value: user?.phone },
      { label: "Country", value: user?.country },
      { label: "City", value: user?.city },
      { label: "Role", value: user?.isAdmin ? "Administrator" : "Staff" },
      { label: "Created", value: formatDate(user?.createdAt) },
      { label: "Updated", value: formatDate(user?.updatedAt) },
    ],
    [user]
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted dark:text-dark-text-muted">
            Account · Personal hub
          </span>
          <h1 className="text-3xl font-semibold text-text-primary dark:text-dark-text-primary">
            Your profile overview
          </h1>
          <p className="max-w-2xl text-sm text-text-muted dark:text-dark-text-muted">
            Review personal information, update your avatar, and confirm contact details used across the admin console.
          </p>
        </div>
      </header>

      <section className="grid gap-6 rounded-2xl border border-border bg-surface p-8 shadow-soft dark:border-dark-border dark:bg-dark-surface lg:grid-cols-[320px,1fr]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-44 w-44 overflow-hidden rounded-2xl border border-border/60 bg-background dark:border-dark-border dark:bg-dark-background">
            <img
              src={
                selectedAvatar || user?.img || PLACEHOLDER_IMAGE
              }
              alt={user?.username || "User avatar"}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-text-primary dark:text-dark-text-primary">
              {user?.username || "User"}
            </h1>
            <p className="text-sm text-text-muted dark:text-dark-text-muted">
              {user?.email || "No email available"}
            </p>
            <span className={`badge ${user?.isAdmin ? "badge-success" : "badge-info"}`}>
              {user?.isAdmin ? "Admin" : "Team Member"}
            </span>
          </div>
        </div>

        <div className="grid gap-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
              Choose an avatar
            </h2>
            {loadingAvatars ? (
              <p className="text-sm text-text-muted dark:text-dark-text-muted">Loading avatars…</p>
            ) : avatarError ? (
              <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                {avatarError}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                {avatars.map((img) => (
                  <button
                    key={img}
                    type="button"
                    className={`overflow-hidden rounded-xl border-2 transition ${
                      selectedAvatar === img
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-border"
                    }`}
                    onClick={() => handleAvatarSelect(img)}
                  >
                    <img src={img} alt="Avatar option" className="h-16 w-16 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/60"
              onClick={handleAvatarSave}
              disabled={
                saving || !selectedAvatar || selectedAvatar === user?.img || Boolean(avatarError)
              }
            >
              {saving ? "Saving…" : "Save avatar"}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-8 shadow-soft dark:border-dark-border dark:bg-dark-surface">
        <header>
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
            Account details
          </h2>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {details.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm dark:border-dark-border/60 dark:bg-dark-background/60"
            >
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
                {item.label}
              </span>
              <span className="block pt-1 text-text-primary dark:text-dark-text-primary">
                {item.value || "—"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Profile;
