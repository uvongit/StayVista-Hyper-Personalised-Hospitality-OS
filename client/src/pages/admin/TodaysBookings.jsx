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

  const [todayBookings, setTodayBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setTodayBookings([]);
      setAllBookings([]);
      setShowAll(false);
      return;
    }

    const loadBookings = async () => {
      setLoading(true);
      setError("");

      try {
        const baseParams = {};
        if (!user?.superAdmin && managedHotelId) {
          baseParams.hotelId = managedHotelId;
        }

        const todayParams = {
          ...baseParams,
          from: dayjs().startOf("day").toISOString(),
          to: dayjs().endOf("day").toISOString(),
        };

        const allParams = Object.keys(baseParams).length ? { ...baseParams } : undefined;

        const [todayData, allData] = await Promise.all([
          getBookings(todayParams),
          getBookings(allParams),
        ]);

        const todayArray = Array.isArray(todayData) ? todayData : [];
        const allArray = Array.isArray(allData) ? allData : [];

        setTodayBookings(todayArray);
        setAllBookings(allArray);
        setShowAll(todayArray.length === 0);
      } catch (err) {
        setError(err?.message || "Failed to load bookings");
        setTodayBookings([]);
        setAllBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [isAdmin, managedHotelId, user?.superAdmin]);
 
  const statusSummary = useMemo(() => {
    return (showAll || todayBookings.length === 0 ? allBookings : todayBookings).reduce(
      (acc, booking) => {
        const key = booking.status || "pending";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { pending: 0, confirmed: 0, completed: 0, cancelled: 0 }
    );
  }, [showAll, todayBookings, allBookings]);

  const displayedBookings = useMemo(() => {
    if (showAll || todayBookings.length === 0) {
      return allBookings;
    }
    return todayBookings;
  }, [showAll, todayBookings, allBookings]);

  const monthlySummary = useMemo(() => {
    const currentMonthBookings = allBookings.filter((booking) =>
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
  }, [allBookings]);

  const hasPrevious = useMemo(
    () => allBookings.some((booking) => !dayjs(booking.createdAt).isSame(dayjs(), "day")),
    [allBookings]
  );

  const handleToggle = () => {
    setShowAll((prev) => !prev);
  };

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

        <section className="admin-insights" aria-label="Monthly earnings summary">
          <article className="admin-insight">
            <span>Monthly revenue</span>
            <strong>
              {monthlySummary.revenue.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 0,
              })}
            </strong>
          </article>
        </section>

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
          {displayedBookings.length === 0 && !loading ? (
            <p>No bookings found.</p>
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
                  {displayedBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td data-label="Booking">{booking._id}</td>
                      <td data-label="Guest">{booking.user?.username || "—"}</td>
                      <td data-label="Hotel">{booking.hotel?.name || "—"}</td>
                      <td data-label="Created">{dayjs(booking.createdAt).format("MMM D, YYYY h:mm A")}</td>
                      <td data-label="Status">{STATUS_LABELS[booking.status] || booking.status || "Pending"}</td>
                      <td data-label="Total">
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

        {hasPrevious && (
          <div className="admin-panel admin-panel--inline">
            <button
              type="button"
              onClick={handleToggle}
              className="btn-outline"
              disabled={loading}
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

export default TodaysBookings;
