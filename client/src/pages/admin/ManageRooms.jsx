import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import "./admin.css";
import { AuthContext } from "../../context/AuthContext";
import { getHotelById, getHotelRooms } from "../../api/hotels";
import {
  deleteRoom,
  getRoomById,
  updateRoom,
  uploadRoomImage,
  updateRoomAvailability,
} from "../../api/rooms";

const MAX_PHOTOS = 6;

const normalizeRoom = (room) => ({
  _id: room?._id || "",
  title: room?.title || "",
  desc: room?.desc || "",
  price: room?.price ?? "",
  maxPeople: room?.maxPeople ?? "",
  photos: Array.isArray(room?.photos) ? room.photos.slice(0, MAX_PHOTOS) : [],
  roomNumbers: Array.isArray(room?.roomNumbers)
    ? room.roomNumbers.map((roomNumber) => ({
        _id: roomNumber?._id || `${room._id || "new"}-${roomNumber.number}`,
        number: roomNumber?.number || "",
        unavailableDates: Array.isArray(roomNumber?.unavailableDates)
          ? roomNumber.unavailableDates
          : [],
      }))
    : [],
});

const formatCurrency = (value) =>
  typeof value === "number"
    ? value.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      })
    : "—";

const formatDateString = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const parseDateTokens = (input = "") =>
  input
    .split(/\n|,|;|\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

const ManageRooms = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = Boolean(user?.isAdmin);
  const navigate = useNavigate();
  const managerHotelId = useMemo(
    () => user?.managedHotel?.toString?.() || user?.managedHotel || "",
    [user]
  );

  const [hotelDetails, setHotelDetails] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [roomForm, setRoomForm] = useState(null);
  const [availabilityInput, setAvailabilityInput] = useState("");
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [activeRoomNumberId, setActiveRoomNumberId] = useState("");

  const loadHotelRooms = useCallback(async () => {
    if (!managerHotelId) return;
    setRoomsLoading(true);
    setRoomsError("");
    try {
      const [hotel, response] = await Promise.all([
        getHotelById(managerHotelId).catch(() => null),
        getHotelRooms(managerHotelId).catch((error) => {
          throw error;
        }),
      ]);

      if (hotel) {
        setHotelDetails(hotel);
      }

      const roomList = Array.isArray(response?.rooms) ? response.rooms : [];
      setRooms(roomList);
    } catch (err) {
      setRoomsError(err?.message || "Failed to load rooms for your hotel.");
    } finally {
      setRoomsLoading(false);
    }
  }, [managerHotelId]);

  useEffect(() => {
    if (!isAdmin || !managerHotelId) return;
    loadHotelRooms();
  }, [isAdmin, managerHotelId, loadHotelRooms]);

  const handleOpenDrawer = async (roomId) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerError("");
    setRoomForm(null);
    setAvailabilityInput("");
    setAvailabilityMessage("");
    setActiveRoomNumberId("");

    try {
      const roomDetails = await getRoomById(roomId);
      const normalized = normalizeRoom(roomDetails);
      setRoomForm(normalized);
      setActiveRoomNumberId(normalized.roomNumbers?.[0]?._id || "");
    } catch (err) {
      setDrawerError(err?.message || "Unable to load room details.");
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerError("");
    setRoomForm(null);
    setAvailabilityInput("");
    setAvailabilityMessage("");
    setActiveRoomNumberId("");
  };

  const handleFormChange = (field, value) => {
    setRoomForm((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
        : prev
    );
  };

  const handleRoomNumberChange = (id, nextValue) => {
    setRoomForm((prev) => {
      if (!prev) return prev;
      const nextRoomNumbers = prev.roomNumbers.map((roomNumber) =>
        roomNumber._id === id
          ? {
              ...roomNumber,
              number: nextValue,
            }
          : roomNumber
      );
      return { ...prev, roomNumbers: nextRoomNumbers };
    });
  };

  const handleAddRoomNumber = () => {
    setRoomForm((prev) => {
      if (!prev) return prev;
      const tempId = `temp-${Date.now()}`;
      const nextRoomNumbers = [
        ...prev.roomNumbers,
        {
          _id: tempId,
          number: "",
          unavailableDates: [],
        },
      ];
      return { ...prev, roomNumbers: nextRoomNumbers };
    });
  };

  const handleRemoveRoomNumber = (id) => {
    setRoomForm((prev) => {
      if (!prev) return prev;
      const nextRoomNumbers = prev.roomNumbers.filter((roomNumber) => roomNumber._id !== id);
      const nextActiveId =
        activeRoomNumberId === id ? nextRoomNumbers?.[0]?._id || "" : activeRoomNumberId;
      setActiveRoomNumberId(nextActiveId);
      return { ...prev, roomNumbers: nextRoomNumbers };
    });
  };

  const handleRemovePhoto = (index) => {
    setRoomForm((prev) => {
      if (!prev) return prev;
      const photos = prev.photos.filter((_, photoIndex) => photoIndex !== index);
      return { ...prev, photos };
    });
  };

  const handleUploadPhoto = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setSaving(true);
    try {
      for (const file of files) {
        const uploadedUrl = await uploadRoomImage(file);
        if (!uploadedUrl) continue;
        setRoomForm((prev) => {
          if (!prev) return prev;
          const uniquePhotos = prev.photos.filter(Boolean);
          if (uniquePhotos.length >= MAX_PHOTOS) {
            return prev;
          }
          return {
            ...prev,
            photos: [...uniquePhotos, uploadedUrl].slice(0, MAX_PHOTOS),
          };
        });
      }
    } catch (err) {
      setDrawerError(err?.message || "Image upload failed. Please try again.");
    } finally {
      setSaving(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const buildUpdatePayload = () => {
    if (!roomForm) return null;
    const sanitizedPhotos = roomForm.photos.filter(Boolean).slice(0, MAX_PHOTOS);
    const sanitizedRoomNumbers = roomForm.roomNumbers
      .map((roomNumber) => {
        const parsedNumber = Number(roomNumber.number);
        if (Number.isNaN(parsedNumber)) return null;
        return {
          ...(roomNumber._id && !`${roomNumber._id}`.startsWith("temp-") ? { _id: roomNumber._id } : {}),
          number: parsedNumber,
          unavailableDates: Array.isArray(roomNumber.unavailableDates)
            ? roomNumber.unavailableDates
            : [],
        };
      })
      .filter(Boolean);

    return {
      title: roomForm.title,
      price: Number(roomForm.price) || 0,
      desc: roomForm.desc,
      maxPeople: Number(roomForm.maxPeople) || 0,
      photos: sanitizedPhotos,
      roomNumbers: sanitizedRoomNumbers,
    };
  };

  const handleSave = async () => {
    if (!roomForm?._id) return;
    const payload = buildUpdatePayload();
    if (!payload) return;
    setSaving(true);
    setDrawerError("");
    try {
      await updateRoom(roomForm._id, payload);
      setAvailabilityMessage("Room details saved.");
      await loadHotelRooms();
      setDrawerError("");
    } catch (err) {
      setDrawerError(err?.message || "Failed to save room.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomForm?._id) return;
    const confirmed = window.confirm("Are you sure you want to delete this room?");
    if (!confirmed) return;

    setDeleteLoading(true);
    setDrawerError("");
    try {
      await deleteRoom(roomForm._id);
      await loadHotelRooms();
      closeDrawer();
    } catch (err) {
      setDrawerError(err?.message || "Failed to delete room.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const activeRoomNumber = useMemo(() => {
    if (!roomForm) return null;
    return roomForm.roomNumbers.find((roomNumber) => roomNumber._id === activeRoomNumberId) || null;
  }, [roomForm, activeRoomNumberId]);

  const applyAvailabilityChange = async (operation) => {
    if (!activeRoomNumber?._id) {
      setAvailabilityMessage("Select a suite number to manage availability.");
      return;
    }

    if (operation !== "clear" && !availabilityInput.trim()) {
      setAvailabilityMessage("Add at least one date to continue.");
      return;
    }

    const parsedTokens = parseDateTokens(availabilityInput).map((token) => token.trim());
    const dedupedTokens = [...new Set(parsedTokens)];
    const payload = {
      operation,
      dates: dedupedTokens,
    };

    if (operation === "clear") {
      delete payload.dates;
    }

    setAvailabilityMessage("Updating availability…");
    try {
      await updateRoomAvailability(activeRoomNumber._id, payload);

      setRoomForm((prev) => {
        if (!prev) return prev;
        const nextRoomNumbers = prev.roomNumbers.map((roomNumber) => {
          if (roomNumber._id !== activeRoomNumber._id) return roomNumber;
          if (operation === "clear") {
            return { ...roomNumber, unavailableDates: [] };
          }

          if (operation === "remove") {
            const toRemove = new Set(
              dedupedTokens
                .map((token) => {
                  const date = new Date(token);
                  if (Number.isNaN(date.getTime())) return null;
                  date.setHours(0, 0, 0, 0);
                  return date.toISOString();
                })
                .filter(Boolean)
            );
            const filteredDates = roomNumber.unavailableDates.filter((date) => {
              const normalized = new Date(date);
              if (Number.isNaN(normalized.getTime())) return true;
              normalized.setHours(0, 0, 0, 0);
              return !toRemove.has(normalized.toISOString());
            });
            return { ...roomNumber, unavailableDates: filteredDates };
          }

          // add operation
          const merged = new Set(
            roomNumber.unavailableDates.map((value) => {
              const date = new Date(value);
              if (Number.isNaN(date.getTime())) return value;
              date.setHours(0, 0, 0, 0);
              return date.toISOString();
            })
          );

          dedupedTokens.forEach((token) => {
            const date = new Date(token);
            if (Number.isNaN(date.getTime())) return;
            date.setHours(0, 0, 0, 0);
            merged.add(date.toISOString());
          });

          return { ...roomNumber, unavailableDates: Array.from(merged) };
        });
        return { ...prev, roomNumbers: nextRoomNumbers };
      });

      setAvailabilityMessage(
        operation === "clear"
          ? "All holds cleared for this suite."
          : operation === "remove"
          ? "Dates restored for booking."
          : "Dates blocked successfully."
      );
      setAvailabilityInput("");
    } catch (err) {
      setAvailabilityMessage(err?.message || "Failed to update availability.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <Navbar />
        <main className="admin-content">
          <header className="admin-header">
            <h1>Manage rooms</h1>
          </header>
          <section className="admin-panel">
            <p>You need administrator access to manage rooms.</p>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (!managerHotelId) {
    return (
      <div className="admin-page">
        <Navbar />
        <main className="admin-content">
          <header className="admin-header">
            <h1>Manage rooms</h1>
          </header>
          <section className="admin-panel">
            <p>No hotel is linked to your account yet. Please contact the platform team.</p>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Navbar />
      <main className="admin-content">
        <header className="admin-header">
          <div>
            <h1>Manage your rooms</h1>
            <p>Review every suite, update photos, and control availability without leaving the client site.</p>
          </div>
          <div className="admin-header__actions">
            <button
              type="button"
              className="room-action room-action--primary"
              onClick={() => navigate("/admin/new-room")}
            >
              Create room
            </button>
            {hotelDetails ? (
              <div className="admin-badge">
                <span>Your hotel:</span>
                <strong>{hotelDetails?.name || managerHotelId}</strong>
              </div>
            ) : null}
          </div>
        </header>

        <section className="admin-panel" aria-live="polite">
          {roomsLoading ? <p>Loading rooms…</p> : null}
          {roomsError ? <div className="form-error">{roomsError}</div> : null}
          {!roomsLoading && !roomsError && rooms.length === 0 ? (
            <p>
              No rooms created yet. Use the <strong>Create a new room</strong> option to publish your first suite.
            </p>
          ) : null}

          <div className="admin-room-grid">
            {rooms.map((room) => {
              const description = room?.desc?.trim()
                ? room.desc
                : "This suite is awaiting its curated description. Update the details to showcase its highlights.";

              return (
                <article className="admin-room-card" key={room._id}>
                  <header className="admin-room-card__header">
                    <div className="admin-room-card__title">
                      <h3>{room.title}</h3>
                    </div>
                    <div className="admin-room-card__meta">
                      <span>{formatCurrency(room.price)}</span>
                      <span>• Sleeps {room.maxPeople}</span>
                    </div>
                  </header>
                  <div className="admin-room-card__description">
                    <p>{description}</p>
                  </div>
                  <footer className="admin-room-card__actions">
                    <button
                      type="button"
                      className="room-action room-action--outline"
                      onClick={() => handleOpenDrawer(room._id)}
                    >
                      Manage
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />

      {drawerOpen ? (
        <div className="room-drawer" role="dialog" aria-modal="true">
          <div className="room-drawer__backdrop" onClick={closeDrawer} />
          <aside className="room-drawer__panel">
            <header className="room-drawer__header">
              <div>
                <h2>{roomForm?.title || "Manage room"}</h2>
                <p>Update details, photos, and availability for this suite.</p>
              </div>
              <button type="button" className="room-drawer__close" onClick={closeDrawer} aria-label="Close drawer">
                ×
              </button>
            </header>

            {drawerLoading ? <p>Loading room details…</p> : null}
            {drawerError ? <div className="form-error">{drawerError}</div> : null}

            {!drawerLoading && roomForm ? (
              <div className="room-drawer__body">
                <section className="room-drawer__section">
                  <h3>Room details</h3>
                  <div className="form-group">
                    <label htmlFor="room-title">Title</label>
                    <input
                      id="room-title"
                      value={roomForm.title}
                      onChange={(event) => handleFormChange("title", event.target.value)}
                    />
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="room-price">Price per night (₹)</label>
                      <input
                        id="room-price"
                        type="number"
                        min="0"
                        value={roomForm.price}
                        onChange={(event) => handleFormChange("price", event.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="room-max">Max guests</label>
                      <input
                        id="room-max"
                        type="number"
                        min="1"
                        value={roomForm.maxPeople}
                        onChange={(event) => handleFormChange("maxPeople", event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="room-desc">Description</label>
                    <textarea
                      id="room-desc"
                      rows="4"
                      value={roomForm.desc}
                      onChange={(event) => handleFormChange("desc", event.target.value)}
                    />
                  </div>
                </section>

                <section className="room-drawer__section">
                  <h3>Gallery ({roomForm.photos.length}/{MAX_PHOTOS})</h3>
                  <div className="room-gallery">
                    {roomForm.photos.map((photo, index) => (
                      <figure className="room-gallery__item" key={`${photo}-${index}`}>
                        <img src={photo} alt={`Room visual ${index + 1}`} />
                        <button
                          type="button"
                          className="room-gallery__remove"
                          onClick={() => handleRemovePhoto(index)}
                          disabled={saving}
                        >
                          Remove
                        </button>
                      </figure>
                    ))}
                    {roomForm.photos.length < MAX_PHOTOS ? (
                      <label className="room-gallery__upload">
                        <span>Add image</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          multiple
                          onChange={handleUploadPhoto}
                          disabled={saving}
                        />
                      </label>
                    ) : null}
                  </div>
                </section>

                <section className="room-drawer__section">
                  <header className="room-drawer__section-header">
                    <h3>Room numbers</h3>
                    <button
                      type="button"
                      onClick={handleAddRoomNumber}
                      className="room-action room-action--accent"
                      disabled={saving}
                    >
                      Add suite
                    </button>
                  </header>

                  <div className="room-number-list">
                    {roomForm.roomNumbers.map((roomNumber) => (
                      <div
                        key={roomNumber._id}
                        className={`room-number-item ${
                          activeRoomNumberId === roomNumber._id ? "room-number-item--active" : ""
                        }`}
                      >
                        <label htmlFor={`suite-${roomNumber._id}`}>
                          <span>Suite number</span>
                          <input
                            id={`suite-${roomNumber._id}`}
                            type="number"
                            min="0"
                            value={roomNumber.number}
                            onChange={(event) => handleRoomNumberChange(roomNumber._id, event.target.value)}
                          />
                        </label>
                        <div className="room-number-item__meta">
                          <span>{roomNumber.unavailableDates.length} dates on hold</span>
                          <div className="room-number-item__actions">
                            <button
                              type="button"
                              className={`room-number-item__select ${
                                activeRoomNumberId === roomNumber._id ? "is-active" : ""
                              }`}
                              onClick={() => setActiveRoomNumberId(roomNumber._id)}
                            >
                              {activeRoomNumberId === roomNumber._id ? "Selected" : "Manage availability"}
                            </button>
                            <button
                              type="button"
                              className="room-number-item__remove"
                              onClick={() => handleRemoveRoomNumber(roomNumber._id)}
                              disabled={saving}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {activeRoomNumber ? (
                    <div className="room-availability">
                      <h4>Update availability</h4>
                      <p className="helper-text">
                        Add dates separated by comma, space, or new lines. Example: 2025-10-12
                      </p>
                      <textarea
                        rows="3"
                        value={availabilityInput}
                        onChange={(event) => setAvailabilityInput(event.target.value)}
                        placeholder="2025-10-12, 2025-10-18"
                      />
                      <div className="room-action-group">
                        <button
                          type="button"
                          className="room-action room-action--danger"
                          onClick={() => applyAvailabilityChange("remove")}
                          disabled={saving}
                        >
                          Restore listed dates
                        </button>
                        <button
                          type="button"
                          className="room-action room-action--accent"
                          onClick={() => applyAvailabilityChange("add")}
                          disabled={saving}
                        >
                          Block listed dates
                        </button>
                        <button
                          type="button"
                          className="room-action room-action--muted"
                          onClick={() => applyAvailabilityChange("clear")}
                          disabled={saving}
                        >
                          Clear all holds
                        </button>
                      </div>
                      {availabilityMessage && (
                        <p className="helper-text info" role="status">
                          {availabilityMessage}
                        </p>
                      )}
                    </div>
                  ) : null}
                </section>

                <section className="room-drawer__section room-drawer__section--availability">
                  <h3>Current holds</h3>
                  {activeRoomNumber ? (
                    <div className="room-availability-list">
                      {activeRoomNumber.unavailableDates.length ? (
                        <ul>
                          {activeRoomNumber.unavailableDates.map((date) => (
                            <li key={date}>{formatDateString(date)}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="helper-text">This suite has no blocked dates.</p>
                      )}
                    </div>
                  ) : (
                    <p className="helper-text">Select a suite above to see its blocked dates.</p>
                  )}
                </section>
              </div>
            ) : null}

            <footer className="room-drawer__footer">
              <div className="room-drawer__footer-actions">
                <button
                  type="button"
                  className="room-action room-action--danger"
                  onClick={handleDeleteRoom}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting…" : "Delete room"}
                </button>
                <div className="room-drawer__footer-spacer" />
                <button
                  type="button"
                  className="room-action room-action--muted"
                  onClick={closeDrawer}
                  disabled={saving || deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="room-action room-action--primary"
                  onClick={handleSave}
                  disabled={saving || deleteLoading}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}
    </div>
  );
};

export default ManageRooms;

