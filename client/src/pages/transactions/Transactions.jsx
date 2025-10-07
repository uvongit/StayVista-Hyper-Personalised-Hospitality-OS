import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import { getTransactions } from "../../api/transactions";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./transactions.css";

dayjs.extend(relativeTime);

const STATUS_COLORS = {
  captured: "status status--captured",
  pending: "status status--pending",
  refunded: "status status--refunded",
  failed: "status status--failed",
};

const formatCurrency = (value) =>
  typeof value === "number"
    ? value.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      })
    : "—";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTransactions = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <div className="transactions-page">
      <Navbar />
      <main className="transactions-content">
        <header className="transactions-header">
          <div>
            <h1>Your transactions</h1>
            <p>Keep track of booking payments and refunds.</p>
          </div>
          <button onClick={loadTransactions} disabled={loading} className="refresh">
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {error && <div className="transactions-error">{error}</div>}

        <section className="transactions-list">
          {loading && transactions.length === 0 && <div className="loading">Loading transactions…</div>}
          {!loading && transactions.length === 0 && (
            <div className="empty-state">
              <h3>No transactions yet</h3>
              <p>Your future booking payments will appear here.</p>
            </div>
          )}
          {transactions.map((txn) => (
            <article className="transaction-card" key={txn._id}>
              <div className="transaction-card__header">
                <div>
                  <h2>{txn.hotel?.name || "Hotel"}</h2>
                  <p className="transaction-meta">
                    {dayjs(txn.createdAt).format("MMM D, YYYY h:mm A")}
                    <span className="divider">•</span>
                    {dayjs(txn.createdAt).fromNow()}
                  </p>
                </div>
                <span className={STATUS_COLORS[txn.status] || STATUS_COLORS.pending}>
                  {txn.status?.toUpperCase() || "PENDING"}
                </span>
              </div>
              <div className="transaction-card__body">
                <div className="transaction-details">
                  <p>
                    <strong>Booking:</strong> {txn.booking?._id || "—"}
                  </p>
                  <p>
                    <strong>Method:</strong> {(txn.method || "manual").toUpperCase()}
                  </p>
                  {txn.reference && (
                    <p>
                      <strong>Reference:</strong> {txn.reference}
                    </p>
                  )}
                </div>
                <div className="transaction-total">
                  <span className="total-label">Amount</span>
                  <span className="total-amount">{formatCurrency(txn.amount)}</span>
                </div>
              </div>
              <div className="transaction-actions">
                <Link to={`/transactions/${txn._id}`} className="receipt-button">
                  View receipt
                </Link>
                {txn.status === "pending" && txn.booking?._id && (
                  <Link to={`/checkout/${txn.booking._id}`} className="pay-outline">
                    Complete payment
                  </Link>
                )}
              </div>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Transactions;
