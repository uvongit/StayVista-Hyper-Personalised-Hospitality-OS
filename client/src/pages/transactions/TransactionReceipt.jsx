import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import { getTransactionById } from "../../api/transactions";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import advancedFormat from "dayjs/plugin/advancedFormat";
import "./transactionReceipt.css";

dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);

const formatCurrency = (value) =>
  typeof value === "number"
    ? value.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      })
    : "—";

const TransactionReceipt = () => {
  const { transactionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTransaction = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getTransactionById(transactionId);
        setTransaction(data);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "We couldn't find that transaction.");
      } finally {
        setLoading(false);
      }
    };

    if (transactionId) {
      loadTransaction();
    }
  }, [transactionId]);

  const meta = useMemo(() => {
    if (!transaction) return null;
    const createdLabel = dayjs(transaction.createdAt).format("MMM D, YYYY h:mm A");
    const relative = dayjs(transaction.createdAt).fromNow();
    const bookingWindow = transaction.booking
      ? `${dayjs(transaction.booking.checkIn).format("MMM D, YYYY")} → ${dayjs(transaction.booking.checkOut).format(
          "MMM D, YYYY"
        )}`
      : null;

    return {
      createdLabel,
      relative,
      bookingWindow,
      amountFormatted: formatCurrency(transaction.amount),
      taxesFormatted: formatCurrency(transaction.amount * 0.08),
      totalFormatted: formatCurrency(transaction.amount * 1.08),
      status: transaction.status?.toUpperCase() || "CAPTURED",
    };
  }, [transaction]);

  const handleBack = () => {
    if (location.state?.from === "checkout") {
      navigate("/bookings");
    } else {
      navigate("/transactions");
    }
  };

  return (
    <div className="receipt-page">
      <Navbar />
      <main className="receipt-content">
        {loading ? (
          <div className="receipt-skeleton">
            <div className="skeleton skeleton--header" />
            <div className="skeleton skeleton--body" />
          </div>
        ) : error ? (
          <div className="receipt-error">
            <h2>Receipt unavailable</h2>
            <p>{error}</p>
            <div className="receipt-actions">
              <button type="button" className="ghost-button" onClick={handleBack}>
                Back
              </button>
            </div>
          </div>
        ) : transaction ? (
          <div className="receipt-grid">
            <section className="receipt-panel receipt-panel--primary">
              <header className="receipt-header">
                <div>
                  <span className={`status-chip status-chip--${transaction.status || "captured"}`}>
                    {meta?.status}
                  </span>
                  <h1>Payment receipt</h1>
                  <p>Thank you for choosing StayVista. Your payment has been securely processed.</p>
                </div>
                <div className="reference-block">
                  <span>Reference</span>
                  <strong>{transaction.reference || "N/A"}</strong>
                </div>
              </header>

              <div className="receipt-details">
                <div>
                  <span className="eyebrow">Charged to</span>
                  <p className="detail-primary">{transaction.billingName || transaction.user?.username}</p>
                  <p className="detail-secondary">{transaction.billingEmail || transaction.user?.email}</p>
                </div>
                <div>
                  <span className="eyebrow">Card</span>
                  <p className="detail-primary">
                    {transaction.cardBrand || transaction.method?.toUpperCase()} •••• {transaction.cardLast4 || "0000"}
                  </p>
                  <p className="detail-secondary">Processed via {transaction.paymentGateway || "StayPay"}</p>
                </div>
                <div>
                  <span className="eyebrow">Processed</span>
                  <p className="detail-primary">{meta?.createdLabel}</p>
                  <p className="detail-secondary">{meta?.relative}</p>
                </div>
              </div>

              <div className="receipt-summary">
                <div className="summary-row">
                  <span>Stay subtotal</span>
                  <span>{meta?.amountFormatted}</span>
                </div>
                <div className="summary-row">
                  <span>Taxes &amp; fees</span>
                  <span>{meta?.taxesFormatted}</span>
                </div>
                <div className="summary-row summary-row--total">
                  <span>Total charged</span>
                  <span>{meta?.totalFormatted}</span>
                </div>
              </div>

              <div className="receipt-actions">
                <button type="button" className="primary-button" onClick={handleBack}>
                  Back to transactions
                </button>
                <a className="ghost-button" href={`mailto:${transaction.billingEmail || "concierge@stayvista.com"}`}>
                  Email receipt
                </a>
              </div>
            </section>

            <aside className="receipt-panel receipt-panel--secondary">
              <div className="hotel-card">
                <span className="eyebrow">Hotel</span>
                <h2>{transaction.hotel?.name || "StayVista"}</h2>
                <p className="hotel-location">{transaction.hotel?.city}</p>
                {meta?.bookingWindow && (
                  <p className="hotel-dates">
                    <strong>Stay:</strong> {meta.bookingWindow}
                  </p>
                )}
              </div>

              {transaction.booking && (
                <div className="booking-card">
                  <span className="eyebrow">Booking</span>
                  <p>
                    <strong>ID:</strong> {transaction.booking._id}
                  </p>
                  <p>
                    <strong>Status:</strong> {transaction.booking.status?.toUpperCase()}
                  </p>
                  <p>
                    <strong>Total:</strong> {formatCurrency(transaction.booking.totalAmount)}
                  </p>
                  <Link to="/bookings" className="link-button">
                    View booking
                  </Link>
                </div>
              )}

              <div className="support-card">
                <h3>Need help?</h3>
                <p>Reach our 24×7 billing concierge for any questions about this charge.</p>
                <a href="tel:+18005550199">+1 (800) 555-0199</a>
                <a href="mailto:concierge@stayvista.com">concierge@stayvista.com</a>
              </div>
            </aside>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
};

export default TransactionReceipt;
