import { useCallback, useEffect, useMemo, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import dayjs from "dayjs";
import { fetchTransactions } from "../../api/services.js";
import useWindowSize from "../../hooks/useWindowSize.js";
import { extractApiErrorMessage } from "../../utils/error.js";

const MAX_RECENT_TRANSACTIONS = 6;

const normalizeText = (value, fallback = "—") => {
  if (!value) return fallback;
  return String(value);
};

const formatAmount = (amount, currency = "INR") => {
  const numeric = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(numeric)) return "—";

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

const formatMethod = (method) => {
  if (!method) return "Manual";
  return method
    .toString()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/(^|\s)\w/g, (match) => match.toUpperCase());
};

const formatStatus = (status) => {
  if (!status) return "Pending";
  return status
    .toString()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/(^|\s)\w/g, (match) => match.toUpperCase());
};

const normalizeId = (value) => (value ? String(value) : "");

const LatestTransactionsTable = ({ hotelId = "" }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { width } = useWindowSize();
  const isMobile = (width || 0) < 768;

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { limit: MAX_RECENT_TRANSACTIONS, sort: "-createdAt" };
      if (hotelId) params.hotelId = hotelId;
      const data = await fetchTransactions(params);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to load transactions."));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const filteredTransactions = useMemo(() => {
    if (!hotelId) return transactions;
    const targetId = normalizeId(hotelId);
    if (!targetId) return transactions;

    return transactions.filter((row) => {
      const candidateIds = [
        row?.hotel?._id,
        row?.hotel?.id,
        row?.hotelId,
        typeof row?.hotel === "string" ? row.hotel : null,
        row?.booking?.hotel?._id,
        row?.booking?.hotelId,
      ];

      return candidateIds.some((candidate) => normalizeId(candidate) === targetId);
    });
  }, [hotelId, transactions]);

  const emptyState = useMemo(() => {
    if (loading) return "Loading latest transactions…";
    if (error) return error;
    if (filteredTransactions.length === 0) {
      return hotelId ? "No transactions for this hotel yet." : "No transactions captured yet.";
    }
    return "";
  }, [error, filteredTransactions.length, hotelId, loading]);

  if (isMobile) {
    return (
      <div className="space-y-4">
        {loading || error || filteredTransactions.length === 0 ? (
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
              error
                ? "border-danger/30 bg-danger/10 text-danger"
                : "border-border/60 bg-surface text-text-muted dark:border-dark-border/60 dark:bg-dark-surface/60 dark:text-dark-text-muted"
            }`}
          >
            <span>{emptyState}</span>
            {error && (
              <button
                type="button"
                onClick={loadTransactions}
                className="rounded-full border border-danger/40 px-3 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10"
                disabled={loading}
              >
                {loading ? "Retrying…" : "Retry"}
              </button>
            )}
          </div>
        ) : null}

        {filteredTransactions.map((row) => {
          const status = (row.status || "pending").toLowerCase();
          const methodValue = (row.method || "manual").toLowerCase();

          return (
            <article
              key={row._id}
              className="space-y-3 rounded-2xl border border-border/60 bg-surface p-4 shadow-soft transition hover:border-primary/40 hover:shadow-medium dark:border-dark-border/60 dark:bg-dark-surface"
            >
              <header className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-text-muted dark:text-dark-text-muted">
                  {normalizeText(row._id)}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                    status === "approved"
                      ? "bg-green-100 text-success dark:bg-green-500/15 dark:text-[#4ade80]"
                      : status === "pending"
                      ? "bg-amber-100 text-warning dark:bg-amber-500/15 dark:text-[#fbbf24]"
                      : "bg-red-100 text-danger dark:bg-red-500/15 dark:text-[#fca5a5]"
                  }`}
                >
                  {formatStatus(row.status)}
                </span>
              </header>

              <div className="grid gap-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-[0.18em] text-text-muted dark:text-dark-text-muted">
                    Guest
                  </span>
                  <span className="font-semibold text-text-primary dark:text-dark-text-primary">
                    {normalizeText(row.user?.username || row.user?.email, "Guest")}
                  </span>
                  <span className="text-xs text-text-muted dark:text-dark-text-muted">
                    {normalizeText(row.user?.email)}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-[0.18em] text-text-muted dark:text-dark-text-muted">
                    Hotel
                  </span>
                  <span className="font-semibold text-text-primary dark:text-dark-text-primary">
                    {normalizeText(row.hotel?.name, "Unassigned hotel")}
                  </span>
                  <span className="text-xs text-text-muted dark:text-dark-text-muted">
                    {normalizeText(row.booking?._id, "No booking linked")}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.18em] text-text-muted dark:text-dark-text-muted">
                    Amount
                  </span>
                  <span className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                    {formatAmount(row.amount, row.currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.18em] text-text-muted dark:text-dark-text-muted">
                    Method
                  </span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary dark:bg-primary/20 dark:text-primary/90">
                    {formatMethod(methodValue)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.18em] text-text-muted dark:text-dark-text-muted">
                    Created
                  </span>
                  <span className="font-mono text-xs text-text-muted dark:text-dark-text-muted">
                    {row.createdAt ? dayjs(row.createdAt).format("DD MMM, YYYY") : "—"}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <TableContainer
      component={Paper}
      className="relative w-full max-w-full overflow-x-auto rounded-[24px] border border-border/60 bg-surface/95 shadow-medium backdrop-blur-xl dark:border-dark-border/70 dark:bg-dark-surface/80"
    >
      <Table
        aria-label="latest transactions table"
        sx={{
          width: "100%",
          minWidth: 0,
          tableLayout: "fixed",
          borderCollapse: "separate",
          borderSpacing: 0,
          background: "linear-gradient(180deg, rgba(248,250,252,0.92) 0%, rgba(226,232,240,0.85) 100%)",
          "& thead": {
            position: "sticky",
            top: 0,
            zIndex: 1,
            background: "linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(226,232,240,0.82) 100%)",
            backdropFilter: "blur(14px)",
            borderBottom: "1px solid rgba(148, 163, 184, 0.28)",
          },
          "& th": {
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontSize: "0.68rem",
            fontWeight: 600,
            color: "rgba(30, 41, 59, 0.86)",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(148, 163, 184, 0.24)",
            textShadow: "0 1px 0 rgba(255,255,255,0.6)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
          "& td": {
            borderBottom: "1px solid rgba(148, 163, 184, 0.16)",
            fontSize: "0.85rem",
            color: "rgba(15, 23, 42, 0.92)",
            padding: "18px 20px",
            verticalAlign: "top",
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          },
          "& tbody tr": {
            transition: "background-color 180ms ease, transform 180ms ease",
          },
          "& tbody tr:hover": {
            backgroundColor: "rgba(59, 130, 246, 0.08)",
            transform: "translateY(-2px)",
          },
          ".dark &": {
            background: "linear-gradient(180deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.82) 100%)",
            "& thead": {
              background: "linear-gradient(135deg, rgba(8,11,18,0.98) 0%, rgba(8,11,18,0.92) 100%)",
              borderBottom: "1px solid rgba(71, 85, 105, 0.75)",
              boxShadow: "inset 0 -1px 0 rgba(8, 11, 18, 0.8)",
            },
            "& th": {
              backgroundColor: "rgba(8, 11, 18, 0.96)",
              color: "rgba(248, 250, 252, 0.96)",
              borderBottom: "1px solid rgba(71, 85, 105, 0.75)",
              textShadow: "0 1px 0 rgba(8, 11, 18, 0.8)",
            },
            "& td": {
              borderBottom: "1px solid rgba(51, 65, 85, 0.55)",
              color: "rgba(226, 232, 240, 0.92)",
            },
            "& tbody tr:hover": {
              backgroundColor: "rgba(59, 130, 246, 0.18)",
            },
          },
        }}
      >
        <TableHead>
          <TableRow>
              <TableCell className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary dark:text-dark-text-primary">
                Transaction
              </TableCell>
              <TableCell className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary dark:text-dark-text-primary">
                Guest
              </TableCell>
              <TableCell className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary dark:text-dark-text-primary">
                Hotel
              </TableCell>
              <TableCell className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary dark:text-dark-text-primary">
                Amount
              </TableCell>
              <TableCell className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary dark:text-dark-text-primary">
                Method
              </TableCell>
              <TableCell className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary dark:text-dark-text-primary">
                Status
              </TableCell>
              <TableCell className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary dark:text-dark-text-primary">
                Created
              </TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-text-muted dark:text-dark-text-muted">
                  Loading latest transactions…
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-danger">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={loadTransactions}
                      className="rounded-full border border-danger/40 px-3 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10"
                      disabled={loading}
                    >
                      {loading ? "Retrying…" : "Retry"}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-text-muted">
                  {hotelId ? "No transactions for this hotel yet." : "No transactions captured yet."}
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((row) => {
                const status = (row.status || "pending").toLowerCase();
                const methodValue = (row.method || "manual").toLowerCase();

                return (
                  <TableRow key={row._id} className="transition">
                    <TableCell className="font-mono text-xs text-text-muted dark:text-dark-text-muted">
                      {normalizeText(row._id)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                          {normalizeText(row.user?.username || row.user?.email, "Guest")}
                        </span>
                        <span className="text-xs text-text-muted dark:text-dark-text-muted">
                          {normalizeText(row.user?.email)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-text-primary dark:text-dark-text-primary">
                          {normalizeText(row.hotel?.name, "Unassigned hotel")}
                        </span>
                        <span className="text-xs text-text-muted dark:text-dark-text-muted">
                          {normalizeText(row.booking?._id, "No booking linked")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                      {formatAmount(row.amount)}
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary dark:bg-primary/20 dark:text-primary/90">
                        {formatMethod(methodValue)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${
                          status === "approved"
                            ? "bg-green-100 text-success dark:bg-green-500/15 dark:text-[#4ade80]"
                            : status === "pending"
                            ? "bg-amber-100 text-warning dark:bg-amber-500/15 dark:text-[#fbbf24]"
                            : "bg-red-100 text-danger dark:bg-red-500/15 dark:text-[#fca5a5]"
                        }`}
                      >
                        {formatStatus(row.status)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-text-muted dark:text-dark-text-muted">
                      {row.createdAt ? dayjs(row.createdAt).format("DD MMM, YYYY") : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default LatestTransactionsTable;
