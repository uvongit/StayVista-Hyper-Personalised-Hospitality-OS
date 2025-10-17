import { useContext, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import { getTransactions } from "../../api/transactions";
import { AuthContext } from "../../context/AuthContext";
import "./admin.css";

const STATUS_LABELS = {
  captured: "Captured",
  pending: "Pending",
  refunded: "Refunded",
  failed: "Failed",
};

const TodaysTransactions = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = Boolean(user?.isAdmin);
  const managedHotelId = user?.managedHotel?.toString?.() || user?.managedHotel || "";

  const [todayTransactions, setTodayTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setTodayTransactions([]);
      setAllTransactions([]);
      setShowAll(false);
      return;
    }

    const loadTransactions = async () => {
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
          getTransactions(todayParams),
          getTransactions(allParams),
        ]);

        const todayArray = Array.isArray(todayData) ? todayData : [];
        const allArray = Array.isArray(allData) ? allData : [];

        setTodayTransactions(todayArray);
        setAllTransactions(allArray);
        setShowAll(todayArray.length === 0);
      } catch (err) {
        setError(err?.message || "Failed to load transactions");
        setTodayTransactions([]);
        setAllTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [isAdmin, managedHotelId, user?.superAdmin]);

  const displayedTransactions = useMemo(() => {
    if (showAll || todayTransactions.length === 0) {
      return allTransactions;
    }
    return todayTransactions;
  }, [showAll, todayTransactions, allTransactions]);

  const summary = useMemo(() => {
    return displayedTransactions.reduce(
      (acc, txn) => {
        const key = txn.status || "pending";
        acc[key] = (acc[key] || 0) + 1;
        acc.totalAmount += typeof txn.amount === "number" ? txn.amount : 0;
        return acc;
      },
      { captured: 0, pending: 0, refunded: 0, failed: 0, totalAmount: 0 }
    );
  }, [displayedTransactions]);

  const monthlySummary = useMemo(() => {
    const currentMonthTransactions = allTransactions.filter((txn) =>
      dayjs(txn.createdAt).isSame(dayjs(), "month")
    );

    const capturedStatuses = new Set(["captured", "approved", "completed"]);
    const monthlyEarnings = currentMonthTransactions.reduce((total, txn) => {
      if (!capturedStatuses.has((txn.status || "").toLowerCase())) {
        return total;
      }
      const amount = typeof txn.amount === "number" ? txn.amount : Number(txn.amount);
      return Number.isFinite(amount) ? total + amount : total;
    }, 0);

    return {
      earnings: monthlyEarnings,
      count: currentMonthTransactions.length,
    };
  }, [allTransactions]);

  const hasPrevious = useMemo(
    () => allTransactions.some((txn) => !dayjs(txn.createdAt).isSame(dayjs(), "day")),
    [allTransactions]
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
            <h1>Today's transactions</h1>
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
            <h1>Today's transactions</h1>
            <p>Track payment flow happening now across all bookings.</p>
          </div>
          {loading && <span>Loading…</span>}
        </header>

        {error && <div className="form-error">{error}</div>}

        <section className="admin-insights" aria-label="Monthly earnings summary">
          <article className="admin-insight">
            <span>Monthly earnings</span>
            <strong>
              {monthlySummary.earnings.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 0,
              })}
            </strong>
          </article>
        </section>

        <section className="admin-stat-grid">
          <div className="admin-stat-card">
            <span>Total captured</span>
            <strong>
              {summary.totalAmount.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 0,
              })}
            </strong>
          </div>
          {Object.entries(summary)
            .filter(([key]) => key !== "totalAmount")
            .map(([status, count]) => (
              <div className="admin-stat-card" key={status}>
                <span>{STATUS_LABELS[status] || status}</span>
                <strong>{count}</strong>
              </div>
            ))}
        </section>

        <section className="admin-panel">
          <h2>Transaction details</h2>
          {displayedTransactions.length === 0 && !loading ? (
            <p>No transactions found.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Booking</th>
                    <th>Hotel</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTransactions.map((txn) => (
                    <tr key={txn._id}>
                      <td data-label="Transaction">{txn._id}</td>
                      <td data-label="Booking">{txn.booking?._id || "—"}</td>
                      <td data-label="Hotel">{txn.hotel?.name || "—"}</td>
                      <td data-label="Method">{(txn.method || "manual").toUpperCase()}</td>
                      <td data-label="Status">{STATUS_LABELS[txn.status] || txn.status || "Pending"}</td>
                      <td data-label="Amount">
                        {typeof txn.amount === "number"
                          ? txn.amount.toLocaleString("en-IN", {
                              style: "currency",
                              currency: "INR",
                              minimumFractionDigits: 0,
                            })
                          : "—"}
                      </td>
                      <td data-label="Created">{dayjs(txn.createdAt).format("MMM D, YYYY h:mm A")}</td>
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
              {showAll ? "Show today's transactions" : "Load previous transactions"}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TodaysTransactions;
