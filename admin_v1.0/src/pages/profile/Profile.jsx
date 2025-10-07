import "./profile.scss";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  fetchAvatarOptions,
  updateUserAvatar as updateUserAvatarApi,
} from "../../api/services";

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
        setAvatarError(
          err?.response?.data?.message || "Failed to load avatar options"
        );
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
      setAvatarError(
        err?.response?.data?.message || err?.message || "Failed to update avatar"
      );
    } finally {
      setSaving(false);
    }
  };

  const details = [
    { label: "Username", value: user?.username },
    { label: "Email", value: user?.email },
    { label: "Phone", value: user?.phone },
    { label: "Country", value: user?.country },
    { label: "City", value: user?.city },
    { label: "Role", value: user?.isAdmin ? "Administrator" : "Staff" },
    { label: "Created", value: formatDate(user?.createdAt) },
    { label: "Updated", value: formatDate(user?.updatedAt) },
  ];

  return (
    <div className="profilePage">
      <Sidebar />
      <div className="profileContainer">
        <Navbar />
        <div className="profileContent">
          <div className="summaryCard surface-card">
            <div className="avatar">
              <img
                src={
                  selectedAvatar ||
                  user?.img ||
                  "https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg"
                }
                alt={user?.username || "User"}
              />
            </div>
            <div className="summaryInfo">
              <h1>{user?.username || "User"}</h1>
              <p>{user?.email || "No email available"}</p>
              <span className="badge primary">
                {user?.isAdmin ? "Admin" : "Team Member"}
              </span>
            </div>
            <div className="avatarActions">
              <h3>Choose an avatar</h3>
              {loadingAvatars ? (
                <p className="helper-text">Loading avatars…</p>
              ) : avatarError ? (
                <div className="errorMessage inline">{avatarError}</div>
              ) : (
                <div className="avatarGrid">
                  {avatars.map((img) => (
                    <button
                      key={img}
                      type="button"
                      className={`avatarOption${
                        selectedAvatar === img ? " selected" : ""
                      }`}
                      onClick={() => handleAvatarSelect(img)}
                    >
                      <img src={img} alt="Avatar option" />
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="primary-button saveAvatar"
                onClick={handleAvatarSave}
                disabled={
                  saving ||
                  !selectedAvatar ||
                  selectedAvatar === user?.img ||
                  !!avatarError
                }
              >
                {saving ? "Saving…" : "Save avatar"}
              </button>
            </div>
          </div>

          <div className="detailsCard surface-card">
            <div className="cardHeader">
              <h2>Account Details</h2>
            </div>
            <div className="detailsGrid">
              {details.map((item) => (
                <div className="detail" key={item.label}>
                  <span className="label">{item.label}</span>
                  <span className="value">{item.value || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
