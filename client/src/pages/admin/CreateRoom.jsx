import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import { useContext, useEffect, useMemo, useState } from "react";
import { createRoom } from "../../api/rooms";
import { getHotelById } from "../../api/hotels";
import { AuthContext } from "../../context/AuthContext";
import "./admin.css";

const CreateRoom = () => {
  const { user } = useContext(AuthContext);
  const managerHotelId = useMemo(() => user?.managedHotel?.toString?.() || user?.managedHotel || "", [user]);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [maxPeople, setMaxPeople] = useState("");
  const [roomNumbers, setRoomNumbers] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [hotelDetails, setHotelDetails] = useState(null);

  useEffect(() => {
    const hydrateHotelDetails = async () => {
      if (!managerHotelId) return;

      try {
        const details = await getHotelById(managerHotelId);
        setHotelDetails(details);
        setError("");
      } catch (err) {
        setError(err?.message || "We couldn’t load your hotel details.");
      }
    };

    hydrateHotelDetails();
  }, [managerHotelId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!managerHotelId) {
      setError("No hotel is linked to your account yet. Please contact the platform team.");
      return;
    }

    const roomNumbersArray = roomNumbers
      .split(",")
      .map((num) => num.trim())
      .filter(Boolean)
      .map((number) => ({ number }));

    const payload = {
      title,
      price: price ? Number(price) : undefined,
      desc,
      maxPeople: maxPeople ? Number(maxPeople) : undefined,
      roomNumbers: roomNumbersArray,
    };

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await createRoom(managerHotelId, payload);
      setSuccess("Room published for your hotel.");
      setTitle("");
      setPrice("");
      setDesc("");
      setMaxPeople("");
      setRoomNumbers("");
    } catch (err) {
      setError(err?.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = Boolean(user?.isAdmin);

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <Navbar />
        <main className="admin-content">
          <header className="admin-header">
            <h1>Create a new room</h1>
          </header>
          <div className="admin-panel">
            <p>You need administrator access to create rooms.</p>
          </div>
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
            <h1>Create a new room</h1>
            <p>Publish new inventory for the hotel you manage.</p>
          </div>
          {managerHotelId && hotelDetails && (
            <div className="admin-badge">
              <span>Your hotel:</span>
              <strong>{hotelDetails.name}</strong>
            </div>
          )}
          {!managerHotelId && (
            <div className="admin-badge warning">No hotel linked to your profile.</div>
          )}
        </header>

        <form className="admin-form" onSubmit={handleSubmit} aria-live="polite">
          <div className="form-group">
            <label htmlFor="title">Room title</label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Signature Skyline Suite"
              required
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="price">Nightly price</label>
              <input
                id="price"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="350"
              />
            </div>
            <div className="form-group">
              <label htmlFor="maxPeople">Max guests</label>
              <input
                id="maxPeople"
                type="number"
                min="1"
                value={maxPeople}
                onChange={(e) => setMaxPeople(e.target.value)}
                placeholder="4"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="desc">Description</label>
            <textarea
              id="desc"
              rows="4"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the experience, amenities, and standout features"
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="roomNumbers">Room numbers</label>
              <textarea
                id="roomNumbers"
                rows="3"
                value={roomNumbers}
                onChange={(e) => setRoomNumbers(e.target.value)}
                placeholder="101, 102, 103"
                required
              />
              <small>Separate each room number with a comma.</small>
            </div>
            <div className="form-group" aria-live="polite">
              <label>Your hotel</label>
              <div className="form-assigned-hotel">
                {managerHotelId ? (
                  <>
                    <strong>{hotelDetails?.name || managerHotelId}</strong>
                    {hotelDetails?.city && <span>{hotelDetails.city}</span>}
                  </>
                ) : (
                  <span>No hotel found for your account.</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={loading || !managerHotelId}
              className="btn-primary"
            >
              {loading ? "Creating…" : "Create room"}
            </button>
          </div>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default CreateRoom;
