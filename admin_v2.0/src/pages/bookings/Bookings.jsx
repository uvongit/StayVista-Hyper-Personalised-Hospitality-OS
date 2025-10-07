import { useCallback, useEffect, useMemo, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { deleteResource, fetchBookings, updateBookingStatus } from "../../api/services.js";

dayjs.extend(relativeTime);

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"];

const extractArray = (payload, key) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const coerceDate = (value) => {
  if (!value) return null;
  const date = dayjs(value);
  return date.isValid() ? date : null;
};

const coerceNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const pickFirst = (...values) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      if (value.length) return value;
      continue;
    }
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
};

const formatBookingCode = (id) => {
  if (!id) return "—";
  const rawString = String(id).replace(/[^a-zA-Z0-9]/g, "");
  if (!rawString.length) return "—";
  const prefix = rawString.slice(0, 4).toUpperCase();
  const suffix = rawString.slice(-4).toUpperCase();
  return `BK-${prefix}-${suffix}`;
};

const normalizeBooking = (raw) => {
  if (!raw || typeof raw !== "object") return null;

  const id = pickFirst(raw._id, raw.id, raw.booking?._id);
  if (!id) return null;

  const hotelName = pickFirst(raw.hotel?.name, raw.booking?.hotel?.name, raw.hotelName) || "—";
  const hotelCity = pickFirst(raw.hotel?.city, raw.booking?.hotel?.city, raw.hotelCity) || "";

  const guestName =
    pickFirst(
      raw.user?.username,
      raw.booking?.user?.username,
      raw.user?.email,
      raw.booking?.user?.email,
      raw.guestName,
      raw.guestEmail
    ) || "—";
  const guestEmail = pickFirst(raw.user?.email, raw.booking?.user?.email, raw.guestEmail) || "";

  const checkInDate = coerceDate(pickFirst(raw.checkIn, raw.booking?.checkIn, raw.bookingDetails?.checkIn));
  const checkOutDate = coerceDate(pickFirst(raw.checkOut, raw.booking?.checkOut, raw.bookingDetails?.checkOut));
  const checkInText = checkInDate ? checkInDate.format("MMM D, YYYY") : "—";
  const checkOutText = checkOutDate ? checkOutDate.format("MMM D, YYYY") : "—";

  const nightsValue = coerceNumber(pickFirst(raw.nights, raw.booking?.nights, raw.bookingDetails?.nights));
  const amountValue = coerceNumber(
    pickFirst(raw.totalAmount, raw.booking?.totalAmount, raw.summary?.totalAmount)
  );

  const roomsSource = pickFirst(
    Array.isArray(raw.rooms) ? raw.rooms : undefined,
    Array.isArray(raw.booking?.rooms) ? raw.booking.rooms : undefined,
    Array.isArray(raw.bookingDetails?.rooms) ? raw.bookingDetails.rooms : undefined
  );
  const rooms = Array.isArray(roomsSource) ? roomsSource : [];
  const roomsText =
    rooms
      .map((room) => room?.roomNumberLabel || room?.label || room?.roomNumber || room?.name)
      .filter(Boolean)
      .join(", ") || "—";

  const createdDate = coerceDate(pickFirst(raw.createdAt, raw.booking?.createdAt, raw.meta?.createdAt));
  const createdFromNow = createdDate ? createdDate.fromNow() : "—";
  const createdLabel = createdDate ? createdDate.format("DD MMM YYYY") : null;

  const status = String(pickFirst(raw.status, raw.booking?.status) || "pending").toLowerCase();

  const bookingCode = formatBookingCode(id);

  const channel = pickFirst(raw.channel, raw.booking?.channel, raw.meta?.channel, raw.source, raw.booking?.source);
  const source = pickFirst(raw.sourceLabel, raw.source, raw.booking?.sourceLabel, raw.booking?.source);
  const travelPurpose = pickFirst(raw.segment, raw.booking?.segment, raw.travelPurpose, raw.booking?.travelPurpose);
  const arrivalWindow = pickFirst(raw.arrivalWindow, raw.booking?.arrivalWindow, raw.bookingDetails?.arrivalWindow);
  const guestPhone = pickFirst(raw.user?.phone, raw.booking?.user?.phone, raw.phone, raw.guestPhone, raw.contactNumber);

  const stayRange =
    checkInDate && checkOutDate
      ? `${checkInDate.format("DD MMM")} → ${checkOutDate.format("DD MMM YYYY")}`
      : null;
  const nightsLabel =
    typeof nightsValue === "number" && nightsValue > 0
      ? `${nightsValue} night${nightsValue === 1 ? "" : "s"}`
      : null;
  const perNightAmount =
    typeof amountValue === "number" && typeof nightsValue === "number" && nightsValue > 0
      ? amountValue / nightsValue
      : null;

  const taxesValue = coerceNumber(pickFirst(raw.taxes, raw.summary?.taxes, raw.fees?.taxes));
  const balanceDueValue = coerceNumber(pickFirst(raw.balanceDue, raw.summary?.balanceDue, raw.payment?.balanceDue));
  const notes = pickFirst(raw.notes, raw.meta?.notes, raw.booking?.notes);

  return {
    id,
    bookingCode,
    hotelName,
    hotelCity,
    guestName,
    guestEmail,
    guestPhone,
    checkInDate,
    checkInText,
    checkOutDate,
    checkOutText,
    nightsValue,
    amountValue,
    amountDisplay: amountValue !== null ? formatCurrency(amountValue) : "—",
    perNightAmount,
    taxesValue,
    balanceDueValue,
    status,
    channel,
    source,
    travelPurpose,
    arrivalWindow,
    stayRange,
    nightsLabel,
    rooms,
    roomsText,
    createdDate,
    createdFromNow,
    createdLabel,
    notes,
    raw,
  };
};

const formatCurrency = (value) =>
  typeof value === "number"
    ? value.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      })
    : "—";

const countStatus = (bookings, status) =>
  bookings.reduce((acc, booking) => (booking.status === status ? acc + 1 : acc), 0);

const STATUS_BADGE_CLASSES = {
  pending: "bg-amber-100 text-warning dark:bg-amber-500/15 dark:text-[#fbbf24]",
  confirmed: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/90",
  completed: "bg-green-100 text-success dark:bg-green-500/15 dark:text-[#4ade80]",
  cancelled: "bg-red-100 text-danger dark:bg-red-500/15 dark:text-[#fca5a5]",
};

const CHANNEL_BADGE_CLASS =
  "rounded-full border border-border/40 bg-surface/90 px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary dark:border-dark-border/50 dark:bg-dark-surface/70 dark:text-dark-text-secondary";

const SOURCE_BADGE_CLASS =
  "rounded-full bg-primary/10 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.18em] text-primary dark:bg-primary/20";

const formatStatusLabel = (status) => {
  if (!status) return "Pending";
  return status
    .toString()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/(^|\s)\w/g, (match) => match.toUpperCase());
};

const statusBadgeClass = (status) => STATUS_BADGE_CLASSES[status] || STATUS_BADGE_CLASSES.pending;

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchBookings();
      const normalized = extractArray(data, "bookings")
        .map(normalizeBooking)
        .filter(Boolean);
      setBookings(normalized);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleStatusChange = useCallback(async (bookingId, status) => {
    setUpdating(true);
    setError("");
    try {
      const updated = await updateBookingStatus(bookingId, status);
      const nextPayload = normalizeBooking(updated?.booking || updated);
      if (!nextPayload) {
        await loadBookings();
        return;
      }
      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? nextPayload : booking)));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update booking status");
    } finally {
      setUpdating(false);
    }
  }, [loadBookings]);

  const handleDelete = useCallback(
    async (bookingId) => {
      if (!bookingId) return;
      const confirmed = window.confirm("Delete this booking? This action cannot be undone.");
      if (!confirmed) return;

      setDeletingId(bookingId);
      setError("");
      try {
        await deleteResource("bookings", bookingId);
        setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to delete booking");
      } finally {
        setDeletingId("");
      }
    },
    []
  );

  const statusCards = useMemo(() => {
    if (!bookings.length) return [];
    const total = bookings.length;
    return [
      { key: "pending", label: "Pending" },
      { key: "confirmed", label: "Confirmed" },
      { key: "completed", label: "Completed" },
      { key: "cancelled", label: "Cancelled" },
    ]
      .map((card) => ({
        ...card,
        count: countStatus(bookings, card.key),
        badgeClass: statusBadgeClass(card.key),
      }))
      .filter(({ count }) => count > 0)
      .map((card) => ({
        ...card,
        percent: Math.round((card.count / total) * 100),
      }));
  }, [bookings]);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-6 rounded-3xl border border-border/60 bg-surface/80 p-8 shadow-medium backdrop-blur-xl dark:border-dark-border/70 dark:bg-dark-surface/60">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary dark:bg-primary/20">
            Operations · Reservations
          </span>
          <h1 className="text-4xl font-semibold text-text-primary dark:text-dark-text-primary">Bookings</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-text-secondary dark:text-dark-text-muted">
            Monitor reservations, adjust statuses in real time, and keep teams aligned across check-ins.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-sm sm:flex-row sm:items-center">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border/80 bg-white/70 px-5 py-2.5 font-semibold text-text-secondary shadow-soft transition hover:border-primary hover:bg-primary/10 hover:text-primary dark:border-dark-border/70 dark:bg-dark-surface/70 dark:text-dark-text-secondary"
            onClick={loadBookings}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh data"}
          </button>
          <span className="text-xs text-text-muted dark:text-dark-text-muted">
            {bookings.length ? `${bookings.length} records loaded` : "No bookings yet"}
          </span>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger shadow-soft">
          {error}
        </div>
      )}

      {statusCards.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statusCards.map(({ key, label, count, percent, badge }) => (
            <article
              key={key}
              className="rounded-3xl border border-border/60 bg-gradient-to-b from-surface/95 via-surface/80 to-surface/70 p-6 shadow-medium backdrop-blur-xl transition hover:border-primary/50 hover:shadow-medium dark:border-dark-border/60 dark:from-dark-surface/70 dark:via-dark-surface/60 dark:to-dark-surface/50"
            >
              <header className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-text-muted dark:text-dark-text-muted">
                  {label}
                </span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${badge}`}>
                  {percent}%
                </span>
              </header>
              <p className="pt-4 text-3xl font-semibold text-text-primary dark:text-dark-text-primary">
                {count.toLocaleString("en-IN")}
              </p>
            </article>
          ))}
        </section>
      )}

      <div className="rounded-3xl border border-border/60 bg-surface/80 p-4 shadow-medium backdrop-blur-xl dark:border-dark-border/70 dark:bg-dark-surface/60">
        <TableContainer
          component={Paper}
          className="relative max-w-full overflow-x-auto rounded-[24px] border border-border/40 bg-surface/95 shadow-soft dark:border-dark-border/50 dark:bg-dark-surface/80"
        >
          <Table
            aria-label="bookings table"
            sx={{
              width: "100%",
              tableLayout: "fixed",
              minWidth: 720,
              "& .MuiTableCell-root": {
                whiteSpace: "normal",
                wordBreak: "break-word",
              },
            }}
          >
              <TableHead className="bg-background/80 dark:bg-dark-background/70">
                <TableRow>
                  <TableCell className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
                    Booking
                  </TableCell>
                  <TableCell className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
                    Guest
                  </TableCell>
                  <TableCell className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted md:table-cell">
                    Stay
                  </TableCell>
                  <TableCell className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted lg:table-cell">
                    Property
                  </TableCell>
                  <TableCell className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted xl:table-cell">
                    Billing
                  </TableCell>
                  <TableCell className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
                    Status
                  </TableCell>
                  <TableCell className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-text-muted dark:text-dark-text-muted">
                      Loading bookings…
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-danger">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-text-muted dark:text-dark-text-muted">
                      No bookings recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((row) => {
                    const statusLabel = formatStatusLabel(row.status);
                    return (
                      <TableRow
                        key={row.id || row.bookingCode}
                        className="align-top transition hover:bg-primary/5 dark:hover:bg-primary/10"
                      >
                        <TableCell sx={{ width: "22%", minWidth: 160, maxWidth: 200 }}>
                          <div className="flex min-w-0 flex-col gap-2">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <span className="break-words font-mono text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                                {row.bookingCode || "—"}
                              </span>
                              {row.channel && <span className={CHANNEL_BADGE_CLASS}>{row.channel}</span>}
                              {row.source && row.source !== row.channel && (
                                <span className={SOURCE_BADGE_CLASS}>{row.source}</span>
                              )}
                            </div>
                            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-text-muted dark:text-dark-text-muted">
                              <span>{row.createdLabel || "Created —"}</span>
                              {row.createdFromNow && row.createdFromNow !== "—" && <span>• {row.createdFromNow}</span>}
                              {row.arrivalWindow && <span>• ETA {row.arrivalWindow}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-0 flex-col gap-2">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <span
                                className="truncate text-sm font-semibold text-text-primary dark:text-dark-text-primary"
                                title={row.guestName || undefined}
                              >
                                {row.guestName || "—"}
                              </span>
                              {row.raw?.vip && (
                                <span className="rounded-full bg-amber-100/80 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.2em] text-warning dark:bg-amber-500/20">
                                  VIP
                                </span>
                              )}
                              {row.raw?.nationality && (
                                <span className="rounded-full border border-border/50 px-2 py-[2px] text-[10px] uppercase tracking-[0.18em] text-text-muted dark:border-dark-border/60 dark:text-dark-text-muted">
                                  {row.raw.nationality}
                                </span>
                              )}
                            </div>
                            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-text-muted dark:text-dark-text-muted">
                              {row.guestEmail ? (
                                <span className="truncate" title={row.guestEmail}>
                                  {row.guestEmail}
                                </span>
                              ) : (
                                <span>Email —</span>
                              )}
                              {row.guestPhone && (
                                <span className="font-mono tracking-[0.12em]">{row.guestPhone}</span>
                              )}
                            </div>
                            {row.notes && (
                              <span
                                className="line-clamp-1 min-w-0 text-xs text-text-muted/80 dark:text-dark-text-muted"
                                title={row.notes}
                              >
                                {row.notes}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex min-w-0 flex-col gap-2">
                            <span className="truncate text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                              {row.stayRange || `${row.checkInText || "—"} → ${row.checkOutText || "—"}`}
                            </span>
                            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-text-muted dark:text-dark-text-muted">
                              <span>{row.nightsLabel || "Duration —"}</span>
                              {row.roomsText && row.roomsText !== "—" && <span>• {row.roomsText}</span>}
                              {row.travelPurpose && <span>• {row.travelPurpose}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex min-w-0 flex-col gap-2">
                            <span
                              className="truncate text-sm font-semibold text-text-primary dark:text-dark-text-primary"
                              title={row.hotelName || undefined}
                            >
                              {row.hotelName || "—"}
                            </span>
                            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-text-muted dark:text-dark-text-muted">
                              {row.hotelCity && <span>{row.hotelCity}</span>}
                              {row.rooms && row.rooms.length ? (
                                <span>• {row.rooms.length} room{row.rooms.length === 1 ? "" : "s"}</span>
                              ) : null}
                              {row.raw?.owner && <span>• Owner · {row.raw.owner}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <div className="flex min-w-0 flex-col gap-2">
                            <span className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                              {row.amountDisplay || "—"}
                            </span>
                            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-text-muted dark:text-dark-text-muted">
                              {row.perNightAmount !== null && (
                                <span>Per night · {formatCurrency(row.perNightAmount)}</span>
                              )}
                              {row.taxesValue !== null && <span>• Taxes {formatCurrency(row.taxesValue)}</span>}
                              {row.balanceDueValue !== null && <span>• Balance {formatCurrency(row.balanceDueValue)}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-0 flex-col gap-2">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusBadgeClass(
                                  row.status
                                )}`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-text-muted dark:text-dark-text-muted">
                              {row.createdFromNow && row.createdFromNow !== "—" && (
                                <span>Updated {row.createdFromNow}</span>
                              )}
                              {row.raw?.team && <span>• Team · {row.raw.team}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              className="rounded-lg border border-border/50 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-surface/70 dark:text-dark-text-primary"
                              value={row.status}
                              onChange={(event) => handleStatusChange(row.id, event.target.value)}
                              disabled={updating}
                              aria-label="Update booking status"
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option} className="capitalize">
                                  {option.charAt(0).toUpperCase() + option.slice(1)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleDelete(row.id)}
                              disabled={deletingId === row.id || loading}
                              className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-danger transition hover:border-danger hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-danger/30 dark:bg-danger/15 dark:text-danger"
                            >
                              {deletingId === row.id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
        </TableContainer>
      </div>
    </div>
  );
};

export default Bookings;
