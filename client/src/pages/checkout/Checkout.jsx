import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getBookingById } from "../../api/bookings";
import { createCheckoutTransaction } from "../../api/transactions";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import "./checkout.css";

dayjs.extend(duration);

const formatCurrency = (value, currency = "INR") =>
  typeof value === "number"
    ? value.toLocaleString("en-IN", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
      })
    : "—";

const detectCardBrand = (cardNumber = "") => {
  const sanitized = cardNumber.replace(/\s|-/g, "");
  if (/^4[0-9]{6,}$/.test(sanitized)) return "VISA";
  if (/^5[1-5][0-9]{5,}$/.test(sanitized)) return "MASTERCARD";
  if (/^3[47][0-9]{5,}$/.test(sanitized)) return "AMEX";
  if (/^6(?:011|5[0-9]{2})[0-9]{3,}$/.test(sanitized)) return "DISCOVER";
  return "CARD";
};

const Checkout = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({
    billingName: "",
    billingEmail: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    saveCard: true,
  });

  useEffect(() => {
    const loadBooking = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getBookingById(bookingId);
        setBooking(data);
        setForm((prev) => ({
          ...prev,
          billingName: data?.user?.username || prev.billingName,
          billingEmail: data?.user?.email || prev.billingEmail,
        }));
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const staySummary = useMemo(() => {
    if (!booking) return null;
    const checkIn = dayjs(booking.checkIn);
    const checkOut = dayjs(booking.checkOut);
    const nights = booking.nights;
    const durationLabel = `${checkIn.format("MMM D, YYYY")} → ${checkOut.format("MMM D, YYYY")}`;
    const guestAdults = booking.guests?.adults ?? 1;
    const guestChildren = booking.guests?.children ?? 0;
    const guestsLabel = `${guestAdults} adult${guestAdults === 1 ? "" : "s"}${
      guestChildren > 0 ? ` + ${guestChildren} child${guestChildren === 1 ? "" : "ren"}` : ""
    }`;
    const rooms = booking.rooms?.map((room) => room.roomNumberLabel).join(", ");

    return {
      hotelName: booking.hotel?.name,
      hotelCity: booking.hotel?.city,
      durationLabel,
      nights,
      rooms,
      guestsLabel,
    };
  }, [booking]);

  const sanitizedCardNumber = form.cardNumber.replace(/\D/g, "");
  const cardDescriptor = sanitizedCardNumber.length >= 4
    ? `${detectCardBrand(form.cardNumber)} •••• ${sanitizedCardNumber.slice(-4)}`
    : detectCardBrand(form.cardNumber);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!booking) return;

    setProcessing(true);
    setError("");

    try {
      const payload = {
        bookingId: booking._id,
        billingName: form.billingName,
        billingEmail: form.billingEmail,
        cardNumber: form.cardNumber,
        cardBrand: detectCardBrand(form.cardNumber),
        metadata: {
          channel: "web_checkout",
          saveCard: String(form.saveCard),
          cardExpiry: form.expiry,
        },
      };

      const { redirectUrl, transaction } = await createCheckoutTransaction(payload);

      if (redirectUrl) {
        navigate(redirectUrl, { replace: true, state: { transactionId: transaction?._id } });
      } else if (transaction?._id) {
        navigate(`/transactions/${transaction._id}`, { replace: true });
      } else {
        navigate("/transactions");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Payment could not be completed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="checkout-page paypal-theme">
      <header className="paypal-header">
        <div className="paypal-header__logo" role="banner">
          <span className="paypal-header__brand">StayPay</span>
          <span className="paypal-header__tagline">Secure checkout by StayVista</span>
        </div>
        <div className="paypal-header__secure" aria-label="SSL encrypted checkout">
          <span className="paypal-header__icon" aria-hidden="true">🔒</span>
          <span>SSL Encrypted</span>
        </div>
      </header>
      <main className="paypal-container">
        {loading ? (
          <div className="paypal-skeleton">
            <div className="paypal-skeleton__block" />
            <div className="paypal-skeleton__block" />
          </div>
        ) : error ? (
          <div className="paypal-card paypal-card--error">
            <h2>We couldn't prepare your checkout</h2>
            <p>{error}</p>
            <Link to="/bookings" className="paypal-ghost-button">
              Back to bookings
            </Link>
          </div>
        ) : booking ? (
          <div className="paypal-grid">
            <section className="paypal-card paypal-card--payment">
              <div className="paypal-card__header">
                <h1>Complete your payment</h1>
                <p>Review your details and pay securely with your preferred card.</p>
              </div>
              <form className="paypal-form" onSubmit={handleSubmit}>
                <div className="paypal-section">
                  <div className="paypal-section__title">Contact information</div>
                  <label className="paypal-field">
                    <span>Email address</span>
                    <input
                      type="email"
                      name="billingEmail"
                      value={form.billingEmail}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label className="paypal-field">
                    <span>Full name</span>
                    <input
                      type="text"
                      name="billingName"
                      value={form.billingName}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                </div>
                <div className="paypal-section">
                  <div className="paypal-section__header">
                    <div className="paypal-section__title">Pay with card</div>
                    <div className="paypal-card-brands" aria-hidden="true">
                      <span className="brand brand--visa">VISA</span>
                      <span className="brand brand--mastercard">MC</span>
                      <span className="brand brand--amex">AMEX</span>
                      <span className="brand brand--rupay">RUPAY</span>
                    </div>
                  </div>
                  <label className="paypal-field">
                    <span>Card number</span>
                    <input
                      type="text"
                      name="cardNumber"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      value={form.cardNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <div className="paypal-field-row">
                    <label className="paypal-field">
                      <span>Expiry date</span>
                      <input
                        type="text"
                        name="expiry"
                        placeholder="MM/YY"
                        value={form.expiry}
                        onChange={handleInputChange}
                        required
                      />
                    </label>
                    <label className="paypal-field">
                      <span>CVV</span>
                      <input
                        type="password"
                        name="cvv"
                        placeholder="123"
                        value={form.cvv}
                        onChange={handleInputChange}
                        required
                      />
                    </label>
                  </div>
                  <label className="paypal-checkbox">
                    <input
                      type="checkbox"
                      name="saveCard"
                      checked={form.saveCard}
                      onChange={handleInputChange}
                    />
                    <span>Save this card for faster checkout</span>
                  </label>
                </div>
                <div className="paypal-total">
                  <div>
                    <span>Total due today</span>
                    <strong>{formatCurrency(booking.totalAmount * 1.08)}</strong>
                  </div>
                  <span className="paypal-total__meta">{cardDescriptor}</span>
                </div>
                <button type="submit" className="paypal-button" disabled={processing}>
                  {processing ? "Processing…" : `Pay ${formatCurrency(booking.totalAmount * 1.08)}`}
                </button>
                <p className="paypal-policy">
                  By continuing, you agree to StayVista's booking terms and acknowledge our privacy policy.
                </p>
              </form>
              <div className="paypal-trust">
                <span className="paypal-trust__icon" aria-hidden="true">
                  🛡️
                </span>
                <p>Your card details are processed using PCI-DSS compliant infrastructure.</p>
              </div>
            </section>
            <aside className="paypal-card paypal-card--summary">
              <div className="summary-header">
                <span className="summary-header__label">You're paying for</span>
                <h2>{staySummary?.hotelName}</h2>
                <p>{staySummary?.hotelCity}</p>
              </div>
              <div className="summary-stay">
                <div>
                  <span>Stay</span>
                  <strong>{staySummary?.durationLabel}</strong>
                </div>
                <div>
                  <span>Guests</span>
                  <strong>{staySummary?.guestsLabel}</strong>
                </div>
                <div>
                  <span>Rooms</span>
                  <strong>{staySummary?.rooms || "—"}</strong>
                </div>
              </div>
              <hr />
              <dl className="summary-breakdown">
                <div>
                  <dt>Stay subtotal</dt>
                  <dd>{formatCurrency(booking.totalAmount)}</dd>
                </div>
                <div>
                  <dt>Taxes &amp; fees</dt>
                  <dd>{formatCurrency(booking.totalAmount * 0.08)}</dd>
                </div>
                <div className="summary-total">
                  <dt>Total today</dt>
                  <dd>{formatCurrency(booking.totalAmount * 1.08)}</dd>
                </div>
              </dl>
              <div className="summary-payment-meta">
                <span>Payment method</span>
                <strong>{cardDescriptor}</strong>
              </div>
              <div className="summary-actions">
                <Link to="/bookings" className="summary-actions__link">
                  View booking details
                </Link>
              </div>
              <div className="summary-support">
                <p>Need help? Call +1 (800) 555-0199 or email concierge@stayvista.com</p>
              </div>
            </aside>
          </div>
        ) : (
          <div className="paypal-card paypal-card--error">
            <h2>We couldn't find that booking</h2>
            <Link to="/bookings" className="paypal-ghost-button">
              Back to bookings
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default Checkout;
