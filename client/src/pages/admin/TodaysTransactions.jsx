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

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;

    const fetchTodayTransactions = async () => {
      setLoading(true);
      setError("");

      try {
        const from = dayjs().startOf("day").toISOString();
        const to = dayjs().endOf("day").toISOString();
        const params = { from, to };
        if (!user?.superAdmin && managedHotelId) {
          params.hotelId = managedHotelId;
        }
        const data = await getTransactions(params);
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || "Failed to load today's transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTodayTransactions();
  }, [isAdmin, managedHotelId, user?.superAdmin]);

  const summary = useMemo(() => {
    return transactions.reduce(
      (acc, txn) => {
        const key = txn.status || "pending";
        acc[key] = (acc[key] || 0) + 1;
        acc.totalAmount += typeof txn.amount === "number" ? txn.amount : 0;
        return acc;
      },
      { captured: 0, pending: 0, refunded: 0, failed: 0, totalAmount: 0 }
    );
  }, [transactions]);

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
          {transactions.length === 0 && !loading ? (
            <p>No transactions captured today.</p>
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
                  {transactions.map((txn) => (
                    <tr key={txn._id}>
                      <td>{txn._id}</td>
                      <td>{txn.booking?._id || "—"}</td>
                      <td>{txn.hotel?.name || "—"}</td>
                      <td>{(txn.method || "manual").toUpperCase()}</td>
                      <td>{STATUS_LABELS[txn.status] || txn.status || "Pending"}</td>
                      <td>
                        {typeof txn.amount === "number"
                          ? txn.amount.toLocaleString("en-IN", {
                              style: "currency",
                              currency: "INR",
                              minimumFractionDigits: 0,
                            })
                          : "—"}
                      </td>
                      <td>{dayjs(txn.createdAt).format("MMM D, YYYY h:mm A")}</td>
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

export default TodaysTransactions;
