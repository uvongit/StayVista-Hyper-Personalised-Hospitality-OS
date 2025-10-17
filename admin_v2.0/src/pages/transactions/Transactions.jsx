import { useCallback, useEffect, useMemo, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { deleteResource, fetchTransactions } from "../../api/services.js";
import { extractApiErrorMessage } from "../../utils/error.js";
import useWindowSize from "../../hooks/useWindowSize.js";

dayjs.extend(relativeTime);

const formatCurrency = (amount, currency = "INR") => {
  const numeric = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(numeric)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `${currency.toUpperCase()} ${numeric.toLocaleString("en-IN")}`;
  }
};

const ensureDayjs = (value) => {
  if (!value) return null;
  const instance = dayjs(value);
  return instance.isValid() ? instance : null;
};

const generateFallbackId = () => {
  const generator = globalThis.crypto?.randomUUID;
  if (typeof generator === "function") {
    return generator.call(globalThis.crypto);
  }
  return `txn-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeTransaction = (transaction = {}) => {
  const transactionId = transaction.id || transaction._id || transaction.reference || generateFallbackId();
  const booking = transaction.booking || {};
  const hotel = transaction.hotel || booking.hotel || {};
  const user = transaction.user || booking.user || {};
  const metadata = transaction.metadata || {};

  const createdAt = ensureDayjs(transaction.createdAt);
  const updatedAt = ensureDayjs(transaction.updatedAt);

  return {
    id: transactionId,
    raw: transaction,
    amount: transaction.amount ?? booking.totalAmount ?? null,
    currency: (transaction.currency || booking.currency || "INR").toUpperCase(),
    reference: transaction.reference || booking.reference || booking.code || transactionId,
    notes: transaction.notes || metadata.note || metadata.comment || "",
    bookingId: booking._id || booking.id || transaction.bookingId || transaction.booking?._id || "",
    bookingCode: booking.code || booking.reference || booking.bookingCode || booking._id || "",
    hotelName: hotel.name || hotel.title || "",
    hotelCity: hotel.city || hotel.location || "",
    guestName: transaction.billingName || user.username || `${user.firstName || ""} ${user.lastName || ""}`.trim() || booking.guestName || "",
    guestEmail: transaction.billingEmail || user.email || booking.guestEmail || "",
    method: transaction.method || transaction.paymentMethod || metadata.method || "manual",
    paymentGateway: transaction.paymentGateway || metadata.gateway || "StayPay",
    cardBrand: transaction.cardBrand || metadata.cardBrand || "",
    cardLast4: transaction.cardLast4 || metadata.cardLast4 || "",
    status: transaction.status || booking.status || metadata.status || "pending",
    createdAt,
    updatedAt,
  };
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");

  const { width } = useWindowSize();
  const viewportWidth = width || 0;
  const isCompact = viewportWidth < 1024;
  const isMobileView = viewportWidth < 768;

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchTransactions({ limit: 200 });
      const list = Array.isArray(response) ? response : response?.transactions;
      if (!Array.isArray(list)) {
        throw new Error("Transactions response malformed");
      }
      setTransactions(list.map((item) => normalizeTransaction(item)));
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to load transactions"));
    } finally {
      setLoading(false);
    }
  }, [setTransactions, setLoading, setError]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const { todayTransactions, previousTransactions } = useMemo(() => {
    const todayStart = dayjs().startOf("day");
    const todayList = [];
    const previousList = [];

    transactions.forEach((transaction) => {
      const createdAt = transaction?.createdAt;
      if (createdAt && createdAt.isSame(todayStart, "day")) {
        todayList.push(transaction);
      } else {
        previousList.push(transaction);
      }
    });

    return { todayTransactions: todayList, previousTransactions: previousList };
  }, [transactions]);

  const displayedTransactions = useMemo(() => {
    if (timeFilter === "today") return todayTransactions;
    if (timeFilter === "previous") return previousTransactions;
    return transactions;
  }, [timeFilter, todayTransactions, previousTransactions, transactions]);

  const transactionCounts = {
    today: todayTransactions.length,
    previous: previousTransactions.length,
    all: transactions.length,
  };

  const transactionFilterOptions = [
    { key: "today", label: "Today", count: transactionCounts.today },
    { key: "previous", label: "Earlier", count: transactionCounts.previous },
    { key: "all", label: "All", count: transactionCounts.all },
  ];

  const handleDelete = useCallback(async (transactionId) => {
    if (!transactionId) return;

    const confirmed = window.confirm("Delete this transaction? This action cannot be undone.");
    if (!confirmed) return;

    setDeletingId(transactionId);
    setError("");
    try {
      await deleteResource("transactions", transactionId);
      setTransactions((prev) => prev.filter((txn) => txn.id !== transactionId));
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to delete transaction"));
    } finally {
      setDeletingId("");
    }
  }, []);

  const columns = useMemo(() => {
    const paymentColumn = {
      field: "payment",
      headerName: "Payment",
      flex: 0.9,
      minWidth: 200,
      valueGetter: (params) => params?.row?.amount ?? null,
      renderCell: ({ row }) => (
        <div className="flex w-full flex-col gap-2 leading-tight">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
              {formatCurrency(row.amount, row.currency)}
            </span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-[3px] text-[11px] font-semibold uppercase tracking-[0.18em] text-primary dark:border-primary/40 dark:bg-primary/15">
              {(row.currency || "INR").toUpperCase()}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-text-muted dark:text-dark-text-muted">
            <span className="min-w-0 truncate rounded-md border border-border/50 bg-surface/70 px-2 py-[2px] font-mono text-[9px] tracking-[0.18em] text-text-muted/90 dark:border-dark-border/50 dark:bg-dark-surface/60 dark:text-dark-text-muted/80">
              REF · {row.reference || row.id || "—"}
            </span>
            {row.notes && (
              <span className="min-w-0 truncate text-xs font-medium normal-case text-text-muted dark:text-dark-text-muted" title={row.notes}>
                {row.notes}
              </span>
            )}
          </div>
        </div>
      ),
    };

    const bookingColumn = {
      field: "booking",
      headerName: "Booking",
      flex: 0.85,
      minWidth: 190,
      valueGetter: (params) => {
        if (!params || !params.row) return null;
        const { bookingCode, bookingId } = params.row;
        return bookingCode && bookingCode !== "—" ? bookingCode : bookingId || null;
      },
      renderCell: ({ row }) => (
        <div className="flex w-full flex-col gap-2 leading-tight">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[15px] font-semibold text-text-primary dark:text-dark-text-primary" title={row.bookingCode || undefined}>
              {row.bookingCode || "—"}
            </span>
            {row.hotelName && (
              <span className="rounded-full border border-border/50 bg-surface/90 px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary dark:border-dark-border/60 dark:bg-dark-surface/60 dark:text-dark-text-secondary">
                {row.hotelName}
              </span>
            )}
            {row.hotelCity && (
              <span className="rounded-full bg-primary/10 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.2em] text-primary dark:bg-primary/20">
                {row.hotelCity}
              </span>
            )}
          </div>
          {row.notes && (
            <span className="line-clamp-1 text-xs text-text-muted dark:text-dark-text-muted" title={row.notes}>
              {row.notes}
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-text-muted dark:text-dark-text-muted">
            <span className="rounded-md border border-border/50 bg-surface/70 px-1.5 py-[1px] font-mono text-[8.5px] tracking-[0.14em] text-text-muted/80 dark:border-dark-border/50 dark:bg-dark-surface/50 dark:text-dark-text-muted/80">
              #{row.bookingId || "—"}
            </span>
            {row.raw?.channel && <span>Channel · {row.raw.channel}</span>}
          </div>
        </div>
      ),
    };

    const customerColumn = {
      field: "customer",
      headerName: "Customer",
      flex: 0.78,
      minWidth: 180,
      sortable: false,
      renderCell: ({ row }) => (
        <div className="flex w-full flex-col gap-2 leading-tight">
          <span className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">{row?.guestName || "—"}</span>
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted dark:text-dark-text-muted">
            {row?.guestEmail ? (
              <span className="truncate" title={row.guestEmail}>{row.guestEmail}</span>
            ) : (
              <span>Email —</span>
            )}
            {row?.billingName && <span className="rounded-full bg-emerald-100/60 px-2 py-[1px] text-[10px] font-semibold uppercase tracking-[0.18em] text-success dark:bg-emerald-500/20">Billing</span>}
          </div>
        </div>
      ),
    };

    const methodColumn = {
      field: "method",
      headerName: "Method",
      flex: 0.75,
      minWidth: 190,
      sortable: false,
      renderCell: ({ row }) => (
        <div className="flex w-full flex-col gap-2 leading-tight">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary dark:bg-primary/20">
              {(row.method || "manual").toUpperCase()}
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted dark:text-dark-text-muted">
              {row.paymentGateway || "StayPay"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted dark:text-dark-text-muted">
            {row.cardBrand && (
              <span className="font-mono text-[11px] uppercase tracking-[0.16em]">
                {row.cardBrand.toUpperCase()}{row.cardLast4 ? ` •••• ${row.cardLast4}` : ""}
              </span>
            )}
            {!isCompact && row.billingEmail && <span className="truncate" title={row.billingEmail}>• {row.billingEmail}</span>}
          </div>
        </div>
      ),
    };

    const statusColumn = {
      field: "status",
      headerName: "Status",
      flex: 0.58,
      minWidth: 150,
      renderCell: (params) => {
        const statusValue = (params?.row?.status || "pending").toLowerCase();
        const statusClass =
          statusValue === "approved" || statusValue === "captured"
            ? "bg-success/10 text-success"
            : statusValue === "pending"
            ? "bg-warning/10 text-warning"
            : "bg-danger/10 text-danger";
        return (
          <div className="flex w-full flex-col gap-2">
            <span className={`inline-flex w-fit items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${statusClass}`}>
              {statusValue.toUpperCase()}
            </span>
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-text-muted dark:text-dark-text-muted">
              <span>{(params?.row?.currency || "INR").toUpperCase()}</span>
              {params?.row?.amount && params?.row?.createdAt && <span>• {formatCurrency(params.row.amount, params.row.currency)}</span>}
            </div>
          </div>
        );
      },
    };

    const timelineColumn = {
      field: "timeline",
      headerName: "Timeline",
      flex: 0.68,
      minWidth: 180,
      valueGetter: (params) => params?.row?.createdAt ? params.row.createdAt.valueOf() : null,
      renderCell: ({ row }) => (
        <div className="flex w-full flex-col gap-3 leading-tight">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
              {row.createdAt ? row.createdAt.format("MMM D, YYYY • h:mm A") : "—"}
            </span>
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-text-muted dark:text-dark-text-muted">
              {row.createdAt ? <span>{row.createdAt.fromNow()}</span> : <span>Awaiting capture</span>}
              {row.raw?.settlementId && <span>• Settl #{row.raw.settlementId}</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(row.id)}
            disabled={deletingId === row.id || loading}
            className="inline-flex w-fit items-center justify-center rounded-lg border border-danger/40 bg-danger/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-danger transition hover:border-danger hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-danger/30 dark:bg-danger/15 dark:text-danger"
          >
            {deletingId === row.id ? "Deleting…" : "Delete"}
          </button>
        </div>
      ),
      sortComparator: (a, b) => (a ?? 0) - (b ?? 0),
    };

    if (!isCompact) {
      return [paymentColumn, bookingColumn, customerColumn, methodColumn, statusColumn, timelineColumn];
    }

    return [paymentColumn, bookingColumn, statusColumn, customerColumn, timelineColumn];
  }, [isCompact, deletingId, handleDelete, loading]);

  const stats = useMemo(() => {
    if (!displayedTransactions.length) {
      return null;
    }

    const totals = displayedTransactions.reduce(
      (acc, tx) => {
        const amount = typeof tx.amount === "number" ? tx.amount : 0;
        const status = (tx.status || "").toLowerCase();
        const currency = (tx.currency || "INR").toUpperCase();

        acc.volume += amount;
        acc.count += 1;
        acc.currencies.add(currency);

        if (status === "pending") acc.pending += 1;
        if (status === "captured" || status === "approved") acc.approved += 1;
        if (["failed", "declined", "rejected", "refunded"].includes(status)) acc.failed += 1;

        if (tx.guestEmail) {
          acc.guests.add(tx.guestEmail.toLowerCase());
        } else if (tx.guestName) {
          acc.guests.add(tx.guestName.toLowerCase());
        }

        return acc;
      },
      { volume: 0, count: 0, pending: 0, approved: 0, failed: 0, guests: new Set(), currencies: new Set() }
    );

    const currencyList = Array.from(totals.currencies);

    return {
      totalVolume: totals.volume,
      averageTicket: totals.count ? totals.volume / totals.count : 0,
      pending: totals.pending,
      approved: totals.approved,
      failed: totals.failed,
      uniqueGuests: totals.guests.size,
      currency: currencyList[0] || "INR",
      extraCurrencies: currencyList.slice(1),
    };
  }, [displayedTransactions]);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-6 rounded-3xl border border-border/60 bg-surface/80 p-8 shadow-medium backdrop-blur-xl dark:border-dark-border/70 dark:bg-dark-surface/60">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary dark:bg-primary/20">
            Finance · Settlement
          </span>
          <h1 className="text-4xl font-semibold text-text-primary dark:text-dark-text-primary">Transactions</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-text-secondary dark:text-dark-text-muted">
            Review captured payments, check booking settlement history, and monitor the latest processing status.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-4 text-sm sm:items-end">
          <div className="inline-flex items-center gap-1 overflow-hidden rounded-full border border-border/80 bg-white/60 p-1 font-semibold text-text-secondary shadow-soft dark:border-dark-border/70 dark:bg-dark-surface/60 dark:text-dark-text-secondary">
            {transactionFilterOptions.map(({ key, label, count }) => {
              const isActive = timeFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTimeFilter(key)}
                  className={`rounded-full px-3 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    isActive
                      ? "bg-primary text-white shadow-soft dark:bg-primary/90"
                      : "text-text-secondary hover:bg-primary/10 hover:text-primary dark:text-dark-text-secondary dark:hover:bg-primary/15 dark:hover:text-primary"
                  }`}
                  aria-pressed={isActive}
                >
                  <span>{label}</span>
                  <span className="ml-1 text-[10px] font-semibold opacity-80">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border/80 bg-white/70 px-5 py-2.5 font-semibold text-text-secondary shadow-soft transition hover:border-primary hover:bg-primary/10 hover:text-primary dark:border-dark-border/70 dark:bg-dark-surface/70 dark:text-dark-text-secondary"
              onClick={loadTransactions}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh data"}
            </button>
            <span className="text-xs text-text-muted dark:text-dark-text-muted">
              {displayedTransactions.length
                ? `${displayedTransactions.length} record${displayedTransactions.length === 1 ? "" : "s"} in view • ${transactionCounts.all} total`
                : transactionCounts.all
                ? "No transactions in this view"
                : "No transactions yet"}
            </span>
          </div>
        </div>
      </header>

      {stats && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Volume",
              value: formatCurrency(stats.totalVolume, stats.currency),
              helper: `${displayedTransactions.length} settlements${stats.extraCurrencies.length ? ` • ${stats.extraCurrencies.join(", ")}` : ""}`,
              gradient: "from-primary/10 via-primary/5 to-transparent text-primary",
            },
            {
              label: "Average Ticket",
              value: formatCurrency(stats.averageTicket, stats.currency),
              helper: `Per transaction • ${stats.currency}`,
              gradient: "from-emerald-100/40 via-emerald-50/30 to-transparent text-success dark:from-emerald-400/20 dark:text-success",
            },
            {
              label: "Pending vs Approved",
              value: `${stats.pending} / ${stats.approved}`,
              helper: "Pending · Approved",
              gradient: "from-amber-100/50 via-amber-50/30 to-transparent text-warning dark:from-amber-500/20 dark:text-warning",
            },
            {
              label: "Unique Guests",
              value: stats.uniqueGuests.toLocaleString("en-IN"),
              helper: stats.failed ? `${stats.failed} failed payments` : "No failed payments",
              gradient: "from-slate-200/50 via-slate-100/40 to-transparent text-text-secondary dark:from-slate-500/20 dark:text-dark-text-muted",
            },
          ].map(({ label, value, helper, gradient }) => (
            <article
              key={label}
              className={`rounded-3xl border border-border/60 bg-gradient-to-br ${gradient} p-6 shadow-soft backdrop-blur-xl dark:border-dark-border/60 dark:bg-dark-surface/40`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted dark:text-dark-text-muted">
                {label}
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-text-primary dark:text-dark-text-primary">
                {value}
              </p>
              <p className="mt-2 text-xs text-text-muted dark:text-dark-text-muted">{helper}</p>
            </article>
          ))}
        </section>
      )}

      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger shadow-soft">
          {error}
        </div>
      )}

      {isMobileView ? (
        <div className="grid gap-4 md:hidden">
          {displayedTransactions.length === 0 && !loading ? (
            <div className="rounded-2xl border border-border/50 bg-surface/80 p-6 text-center text-sm text-text-muted dark:border-dark-border/60 dark:bg-[#0b1220]/80 dark:text-dark-text-muted">
              No transactions in this view.
            </div>
          ) : (
            displayedTransactions.map((transaction) => {
              const transactionId = transaction.id || transaction.raw?._id;
              const createdLabel = transaction.createdAt ? transaction.createdAt.format("MMM D, YYYY • h:mm A") : "—";
              const relativeLabel = transaction.createdAt ? transaction.createdAt.fromNow() : "Awaiting capture";
              return (
                <article
                  key={transactionId}
                  className="rounded-3xl border border-border/60 bg-surface/90 p-5 shadow-soft backdrop-blur-xl dark:border-dark-border/60 dark:bg-[#0c1324]/90"
                >
                  <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted dark:text-dark-text-muted">
                        {(transaction.currency || "INR").toUpperCase()} · {transaction.method?.toUpperCase() || "MANUAL"}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                        (transaction.status || "pending").toLowerCase() === "approved" ||
                        (transaction.status || "pending").toLowerCase() === "captured"
                          ? "bg-success/10 text-success"
                          : (transaction.status || "pending").toLowerCase() === "pending"
                          ? "bg-warning/10 text-warning"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {(transaction.status || "pending").toUpperCase()}
                    </span>
                  </header>
                  <dl className="mt-4 grid gap-3 text-xs text-text-muted dark:text-dark-text-muted">
                    <div className="flex justify-between gap-3">
                      <dt className="font-semibold uppercase tracking-[0.16em]">Reference</dt>
                      <dd className="truncate text-text-primary dark:text-dark-text-primary">
                        {transaction.reference || transactionId || "—"}
                      </dd>
                    </div>
                    {(transaction.bookingCode || transaction.bookingId) && (
                      <div className="flex justify-between gap-3">
                        <dt className="font-semibold uppercase tracking-[0.16em]">Booking</dt>
                        <dd className="truncate text-text-primary dark:text-dark-text-primary">
                          {transaction.bookingCode || transaction.bookingId}
                        </dd>
                      </div>
                    )}
                    {transaction.guestName && (
                      <div className="flex justify-between gap-3">
                        <dt className="font-semibold uppercase tracking-[0.16em]">Guest</dt>
                        <dd className="truncate text-text-primary dark:text-dark-text-primary">{transaction.guestName}</dd>
                      </div>
                    )}
                    {transaction.hotelName && (
                      <div className="flex justify-between gap-3">
                        <dt className="font-semibold uppercase tracking-[0.16em]">Property</dt>
                        <dd className="truncate text-text-primary dark:text-dark-text-primary">{transaction.hotelName}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-3">
                      <dt className="font-semibold uppercase tracking-[0.16em]">Timeline</dt>
                      <dd className="text-right">
                        <div className="text-text-primary dark:text-dark-text-primary">{createdLabel}</div>
                        <div>{relativeLabel}</div>
                      </dd>
                    </div>
                    {transaction.notes && (
                      <div className="flex justify-between gap-3">
                        <dt className="font-semibold uppercase tracking-[0.16em]">Notes</dt>
                        <dd className="truncate text-text-primary dark:text-dark-text-primary">{transaction.notes}</dd>
                      </div>
                    )}
                  </dl>
                  <footer className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary dark:border-primary/40 dark:bg-primary/15">
                        {transaction.paymentGateway || "StayPay"}
                      </span>
                      {transaction.raw?.channel && (
                        <span className="rounded-full border border-border/50 bg-surface/90 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary dark:border-dark-border/50 dark:bg-dark-surface/70 dark:text-dark-text-secondary">
                          {transaction.raw.channel}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(transactionId)}
                      disabled={deletingId === transactionId || loading}
                      className="inline-flex items-center justify-center rounded-full border border-danger/40 bg-danger/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-danger transition hover:border-danger hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-danger/30 dark:bg-danger/15 dark:text-danger"
                    >
                      {deletingId === transactionId ? "Deleting…" : "Delete"}
                    </button>
                  </footer>
                </article>
              );
            })
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-border/60 bg-surface/80 p-5 shadow-medium backdrop-blur-xl dark:border-dark-border/70 dark:bg-[#0b1220]/90">
          <div className="rounded-[26px] border border-border/40 dark:border-dark-border/50">
            <div className="h-[720px] w-full overflow-auto">
              <DataGrid
                className="!border-none !bg-transparent"
                rows={displayedTransactions}
                columns={columns}
                getRowId={(row) => row?.id || row?.raw?._id}
                loading={loading}
                disableColumnMenu
                disableRowSelectionOnClick
                checkboxSelection={false}
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                autoHeight={false}
                getRowHeight={() => "auto"}
                sx={{
                  width: "100%",
                  fontSize: 13,
                  headerHeight: 56,
                  rowHeight: "auto",
                  borderRadius: "26px",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  boxShadow: "0 32px 88px -48px rgba(15, 23, 42, 0.45)",
                  background: "linear-gradient(180deg, rgba(248,250,252,0.94) 0%, rgba(226,232,240,0.82) 100%)",
                  "& .MuiDataGrid-columnHeaders": {
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(241,245,249,0.85) 100%)",
                    backdropFilter: "blur(16px)",
                    borderTopLeftRadius: "26px",
                    borderTopRightRadius: "26px",
                    borderBottom: "1px solid rgba(148, 163, 184, 0.26)",
                    fontFamily:
                      '"General Sans", "Inter", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontWeight: 600,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    fontSize: "0.7rem",
                    whiteSpace: "nowrap",
                    color: "rgba(15, 23, 42, 0.92)",
                    textShadow: "0 1px 0 rgba(255,255,255,0.6)",
                    paddingY: "14px",
                  },
                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontWeight: 600,
                    letterSpacing: "0.16em",
                    color: "rgba(15, 23, 42, 0.9)",
                  },
                  "& .MuiDataGrid-columnSeparator": {
                    display: "none",
                  },
                  "& .MuiDataGrid-main": {
                    background: "linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(241,245,249,0.85) 100%)",
                  },
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid rgba(148, 163, 184, 0.16)",
                    color: "rgba(15, 23, 42, 0.92)",
                    fontFamily:
                      '"General Sans", "Inter", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontSize: "0.84rem",
                    lineHeight: 1.55,
                    paddingTop: 12,
                    paddingBottom: 12,
                    minWidth: 0,
                    alignItems: "flex-start",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  },
                  "& .MuiDataGrid-cellContent": {
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  },
                  "& .MuiDataGrid-row": {
                    transition: "background-color 180ms ease, transform 180ms ease",
                  },
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    transform: "translateY(-2px)",
                  },
                  "& .MuiDataGrid-virtualScroller": {
                    background: "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(241,245,249,0.88) 100%)",
                  },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: "1px solid rgba(148, 163, 184, 0.18)",
                    background: "linear-gradient(180deg, rgba(248,250,252,0.9) 0%, rgba(226,232,240,0.78) 100%)",
                    color: "rgba(71, 85, 105, 0.95)",
                    minHeight: 60,
                    letterSpacing: "0.08em",
                  },
                  "& .MuiCheckbox-root svg": {
                    width: 18,
                    height: 18,
                  },
                  "& .MuiDataGrid-selectedRowCount": {
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                  },
                  ".dark &": {
                    border: "1px solid rgba(71, 85, 105, 0.38)",
                    boxShadow: "0 36px 88px -44px rgba(15, 23, 42, 0.75)",
                    background: "linear-gradient(180deg, rgba(8,11,18,0.97) 0%, rgba(8,11,18,0.84) 100%)",
                    "& .MuiDataGrid-columnHeaders": {
                      background: "linear-gradient(135deg, rgba(8,11,18,0.98) 0%, rgba(8,11,18,0.9) 100%)",
                      borderBottom: "1px solid rgba(71, 85, 105, 0.72)",
                      boxShadow: "inset 0 -1px 0 rgba(8, 11, 18, 0.85)",
                      color: "rgba(248, 250, 252, 0.96)",
                      textShadow: "0 1px 0 rgba(8, 11, 18, 0.8)",
                    },
                    "& .MuiDataGrid-columnHeadersInner": {
                      background: "linear-gradient(135deg, rgba(8,11,18,0.98) 0%, rgba(8,11,18,0.9) 100%)",
                    },
                    "& .MuiDataGrid-columnHeader--filler": {
                      background: "linear-gradient(135deg, rgba(8,11,18,0.98) 0%, rgba(8,11,18,0.9) 100%)",
                      borderBottom: "1px solid rgba(71, 85, 105, 0.72)",
                    },
                    "& .MuiDataGrid-filler": {
                      background: "linear-gradient(135deg, rgba(8,11,18,0.98) 0%, rgba(8,11,18,0.9) 100%)",
                      borderBottom: "1px solid rgba(71, 85, 105, 0.72)",
                    },
                    "& .MuiDataGrid-scrollbarFiller": {
                      backgroundColor: "rgba(8, 11, 18, 0.96)",
                      borderBottom: "1px solid rgba(71, 85, 105, 0.72)",
                    },
                    "& .MuiDataGrid-columnHeader": {
                      backgroundColor: "rgba(8, 11, 18, 0.96)",
                      borderColor: "rgba(71, 85, 105, 0.72)",
                    },
                    "& .MuiDataGrid-columnHeaderTitle": {
                      color: "rgba(248, 250, 252, 0.96)",
                      textShadow: "0 1px 0 rgba(8, 11, 18, 0.8)",
                    },
                    "& .MuiDataGrid-main": {
                      background: "linear-gradient(180deg, rgba(8,15,30,0.96) 0%, rgba(8,15,30,0.82) 100%)",
                    },
                    "& .MuiDataGrid-cell": {
                      borderBottom: "1px solid rgba(51, 65, 85, 0.6)",
                      color: "rgba(226, 232, 240, 0.92)",
                    },
                    "& .MuiDataGrid-row:hover": {
                      backgroundColor: "rgba(59, 130, 246, 0.18)",
                    },
                    "& .MuiDataGrid-virtualScroller": {
                      background: "linear-gradient(180deg, rgba(8,15,30,0.95) 0%, rgba(8,15,30,0.78) 100%)",
                    },
                    "& .MuiDataGrid-footerContainer": {
                      borderTop: "1px solid rgba(51, 65, 85, 0.65)",
                      background: "linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.85) 100%)",
                      color: "rgba(203, 213, 225, 0.9)",
                    },
                    "& .MuiCheckbox-root svg": {
                      color: "rgba(148, 163, 184, 0.85)",
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
