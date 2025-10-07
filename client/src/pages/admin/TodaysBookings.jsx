import { useContext, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import { getBookings } from "../../api/bookings";
import { AuthContext } from "../../context/AuthContext";
import "./admin.css";

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const TodaysBookings = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = Boolean(user?.isAdmin);
  const managedHotelId = user?.managedHotel?.toString?.() || user?.managedHotel || "";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;

    const fetchTodayBookings = async () => {
      setLoading(true);
      setError("");

      try {
        const from = dayjs().startOf("day").toISOString();
        const to = dayjs().endOf("day").toISOString();
        const params = { from, to };
        if (!user?.superAdmin && managedHotelId) {
          params.hotelId = managedHotelId;
        }
        const data = await getBookings(params);
        setBookings(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || "Failed to load today's bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchTodayBookings();
  }, [isAdmin, managedHotelId, user?.superAdmin]);

  const statusSummary = useMemo(() => {
    return bookings.reduce(
      (acc, booking) => {
        const key = booking.status || "pending";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { pending: 0, confirmed: 0, completed: 0, cancelled: 0 }
    );
  }, [bookings]);

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <Navbar />
        <main className="admin-content">
          <header className="admin-header">
            <h1>Today's bookings</h1>
          </header>
          <div className="admin-panel">
            <p>You need administrator access to view this page.</p>
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
            <h1>Today's bookings</h1>
            <p>Monitor all bookings created within the last 24 hours.</p>
          </div>
          {loading && <span>Loading…</span>}
        </header>

        {error && <div className="form-error">{error}</div>}

        <section className="admin-stat-grid">
          {Object.entries(statusSummary).map(([status, count]) => (
            <div className="admin-stat-card" key={status}>
              <span>{STATUS_LABELS[status] || status}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </section>

        <section className="admin-panel">
          <h2>Booking details</h2>
          {bookings.length === 0 && !loading ? (
            <p>No bookings recorded today.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Guest</th>
                    <th>Hotel</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>{booking._id}</td>
                      <td>{booking.user?.username || "—"}</td>
                      <td>{booking.hotel?.name || "—"}</td>
                      <td>{dayjs(booking.createdAt).format("MMM D, YYYY h:mm A")}</td>
                      <td>{STATUS_LABELS[booking.status] || booking.status || "Pending"}</td>
                      <td>
                        {typeof booking.totalAmount === "number"
                          ? booking.totalAmount.toLocaleString("en-IN", {
                              style: "currency",
                              currency: "INR",
                              minimumFractionDigits: 0,
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TodaysBookings;
