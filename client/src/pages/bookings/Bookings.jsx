import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBookings } from "../../api/bookings";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./bookings.css";

dayjs.extend(relativeTime);

const STATUS_COLORS = {
  pending: "status status--pending",
  confirmed: "status status--confirmed",
  completed: "status status--completed",
  cancelled: "status status--cancelled",
};

const formatCurrency = (value, currency = "INR") =>
  typeof value === "number"
    ? value.toLocaleString("en-IN", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
      })
    : "—";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const todaysBookings = useMemo(
    () => bookings.filter((booking) => dayjs(booking.createdAt).isSame(dayjs(), "day")),
    [bookings]
  );

  const previousBookings = useMemo(
    () => bookings.filter((booking) => !dayjs(booking.createdAt).isSame(dayjs(), "day")),
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    const base = showAll || todaysBookings.length === 0 ? bookings : todaysBookings;
    if (filter === "all") return base;
    return base.filter((booking) => booking.status === filter);
  }, [bookings, filter, showAll, todaysBookings]);

  const monthlySummary = useMemo(() => {
    const currentMonthBookings = bookings.filter((booking) =>
      dayjs(booking.createdAt).isSame(dayjs(), "month")
    );

    const monthlyRevenue = currentMonthBookings.reduce((total, booking) => {
      const amount = typeof booking.totalAmount === "number" ? booking.totalAmount : Number(booking.totalAmount);
      return Number.isFinite(amount) ? total + amount : total;
    }, 0);

    return {
      revenue: monthlyRevenue,
      count: currentMonthBookings.length,
    };
  }, [bookings]);

  const hasPrevious = previousBookings.length > 0;

  return (
    <div className="bookings-page">
      <Navbar />
      <main className="bookings-content">
        <header className="bookings-header">
          <div>
            <h1>Your bookings</h1>
            <p>Track your upcoming stays and review past reservations.</p>
          </div>
          <div className="bookings-actions">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="filter-select"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button onClick={loadBookings} disabled={loading} className="refresh">
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        {error && <div className="bookings-error">{error}</div>}

        <section className="bookings-metrics" aria-label="Monthly expenditure summary">
          <article className="metric-card">
            <h2>Monthly expenditure</h2>
            <p className="metric-value">{formatCurrency(monthlySummary.revenue)}</p>
            <p className="metric-caption">Amount you've spent on stays this month</p>
          </article>
          <article className="metric-card">
            <h2>Bookings this month</h2>
            <p className="metric-value">{monthlySummary.count}</p>
            <p className="metric-caption">All reservations confirmed or pending</p>
          </article>
        </section>

        <section className="bookings-list">
          {loading && bookings.length === 0 && <div className="loading">Loading bookings…</div>}
          {!loading && filteredBookings.length === 0 && (
            <div className="empty-state">
              <h3>No bookings yet</h3>
              <p>When you reserve a stay, your booking timeline will appear here.</p>
            </div>
          )}
          {filteredBookings.map((booking) => (
            <article className="booking-card" key={booking._id}>
              <div className="booking-card__header">
                <div>
                  <h2>{booking.hotel?.name || "Hotel"}</h2>
                  <p className="booking-meta">
                    {dayjs(booking.checkIn).format("MMM D")} – {dayjs(booking.checkOut).format("MMM D, YYYY")}
                    <span className="divider">•</span>
                    {booking.nights} night{booking.nights > 1 ? "s" : ""}
                  </p>
                </div>
                <span className={STATUS_COLORS[booking.status] || STATUS_COLORS.pending}>
                  {booking.status}
                </span>
              </div>

              <div className="booking-card__body">
                <div className="booking-details">
                  <p>
                    <strong>Guest:</strong> {booking.user?.username || booking.user?.email || "Account"}
                  </p>
                  <p>
                    <strong>Rooms:</strong> {booking.rooms?.map((room) => room.roomNumberLabel).join(", ") || "—"}
                  </p>
                  <p>
                    <strong>Booked:</strong> {dayjs(booking.createdAt).fromNow()}
                  </p>
                </div>
                <div className="booking-total">
                  <span className="total-label">Total</span>
                  <span className="total-amount">
                    {formatCurrency(booking.totalAmount)}
                  </span>
                </div>
              </div>
              {booking.status === "pending" && (
                <div className="booking-card__footer">
                  <div className="payment-context">
                    <span className="payment-context__badge">Awaiting payment</span>
                    <p className="payment-context__copy">
                      Complete your reservation with a secure checkout powered by StayPay.
                    </p>
                  </div>
                  <Link to={`/checkout/${booking._id}`} className="payment-button">
                    Pay {formatCurrency(booking.totalAmount)}
                  </Link>
                </div>
              )}
            </article>
          ))}
        </section>

        {hasPrevious && (
          <div className="bookings-load-more">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="load-more-button"
            >
              {showAll ? "Show today's bookings" : "Load previous bookings"}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Bookings;
