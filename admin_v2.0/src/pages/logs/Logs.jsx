import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { fetchLogs } from "../../api/services.js";

dayjs.extend(relativeTime);

const REFRESH_INTERVAL = 60_000;

const DEFAULT_FILTERS = {
  level: "all",
  search: "",
  actor: "",
  resourceType: "",
  dateFrom: "",
  dateTo: "",
};

const LEVEL_OPTIONS = [
  { value: "all", label: "All levels" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
  { value: "critical", label: "Critical" },
];

const LEVEL_BADGE_STYLES = {
  info: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  error: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  critical: "bg-red-200 text-red-800 dark:bg-red-500/25 dark:text-red-100",
  default: "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-200",
};

const normalizeLevel = (level = "info") => level.toString().trim().toLowerCase();

const getLogKey = (logEntry = {}) => {
  if (!logEntry) return "";
  return logEntry._id || [logEntry.timestamp, logEntry.message].filter(Boolean).join("::");
};

const formatTimestamp = (value) => {
  if (!value) return { absolute: "—", relative: "" };
  const absolute = dayjs(value).format("DD MMM YYYY · HH:mm");
  const relative = dayjs(value).fromNow();
  return { absolute, relative };
};

const Logs = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const fromISO =
        filters.dateFrom && dayjs(filters.dateFrom).isValid()
          ? dayjs(filters.dateFrom).startOf("day").toISOString()
          : undefined;
      const toISO =
        filters.dateTo && dayjs(filters.dateTo).isValid()
          ? dayjs(filters.dateTo).endOf("day").toISOString()
          : undefined;
      const params = {
        level: filters.level === "all" ? undefined : filters.level,
        search: filters.search || undefined,
        actor: filters.actor || undefined,
        resourceType: filters.resourceType || undefined,
        from: fromISO,
        to: toISO,
        limit: 100,
        sort: "-timestamp",
      };
      const data = await fetchLogs(params);
      const nextLogs = Array.isArray(data?.logs) ? data.logs : Array.isArray(data) ? data : [];
      setLogs(nextLogs);
      if (selectedLogId) {
        const stillExists = nextLogs.some((entry) => getLogKey(entry) === selectedLogId);
        if (!stillExists) setSelectedLogId("");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to load logs.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedLogId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const intervalId = window.setInterval(() => {
      loadLogs();
    }, REFRESH_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoRefresh, loadLogs]);

  useEffect(() => {
    if (!copyMessage) return undefined;
    const timeoutId = window.setTimeout(() => setCopyMessage(""), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copyMessage]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const levelMatches =
        filters.level === "all" || normalizeLevel(log?.level) === normalizeLevel(filters.level);

      const searchTerm = filters.search.trim().toLowerCase();
      const searchMatches =
        !searchTerm ||
        [log?.message, log?.actor?.name, log?.context]?.some((field) =>
          field?.toString().toLowerCase().includes(searchTerm)
        );

      const actorTerm = filters.actor.trim().toLowerCase();
      const actorMatches =
        !actorTerm ||
        [log?.actor?.name, log?.actor?.email, log?.actor?.id]
          .filter(Boolean)
          .some((value) => value.toString().toLowerCase().includes(actorTerm));

      const resourceTerm = filters.resourceType.trim().toLowerCase();
      const resourceMatches =
        !resourceTerm ||
        [log?.resource?.type, log?.resource?.id]
          .filter(Boolean)
          .some((value) => value.toString().toLowerCase().includes(resourceTerm));

      const fromBoundary = filters.dateFrom && dayjs(filters.dateFrom).isValid() ? dayjs(filters.dateFrom).startOf("day") : null;
      const toBoundary = filters.dateTo && dayjs(filters.dateTo).isValid() ? dayjs(filters.dateTo).endOf("day") : null;
      const occurredAt = log?.timestamp ? dayjs(log.timestamp) : null;
      const withinRange =
        !occurredAt ||
        ((!fromBoundary || occurredAt.isSameOrAfter(fromBoundary)) &&
          (!toBoundary || occurredAt.isSameOrBefore(toBoundary)));

      return levelMatches && searchMatches && actorMatches && resourceMatches && withinRange;
    });
  }, [logs, filters]);

  const groupedLogs = useMemo(() => {
    const buckets = new Map();

    filteredLogs.forEach((logEntry) => {
      const timestamp = logEntry?.timestamp ? dayjs(logEntry.timestamp) : null;
      const dayKey = timestamp?.isValid() ? timestamp.format("YYYY-MM-DD") : "unknown";

      if (!buckets.has(dayKey)) buckets.set(dayKey, []);
      buckets.get(dayKey).push(logEntry);
    });

    return Array.from(buckets.entries())
      .sort((a, b) => {
        if (a[0] === "unknown") return 1;
        if (b[0] === "unknown") return -1;
        return dayjs(b[0]).valueOf() - dayjs(a[0]).valueOf();
      })
      .map(([dayKey, entries]) => ({
        dayKey,
        label:
          dayKey === "unknown"
            ? "Unknown date"
            : dayjs(dayKey).format("dddd, DD MMMM YYYY"),
        entries: entries.sort((left, right) => {
          const leftTime = left?.timestamp ? dayjs(left.timestamp).valueOf() : 0;
          const rightTime = right?.timestamp ? dayjs(right.timestamp).valueOf() : 0;
          return rightTime - leftTime;
        }),
      }));
  }, [filteredLogs]);

  const selectedLog = useMemo(() => {
    if (!selectedLogId) return null;
    return logs.find((entry) => getLogKey(entry) === selectedLogId) || null;
  }, [logs, selectedLogId]);

  const totalLogs = logs.length;
  const filteredCount = filteredLogs.length;

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") loadLogs();
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    loadLogs();
  };

  const handleResetFilters = () => {
    setFilters(() => ({ ...DEFAULT_FILTERS }));
    setSelectedLogId("");
  };

  const handleAutoRefreshToggle = (event) => {
    const { checked } = event.target;
    setAutoRefresh(checked);
    if (checked) loadLogs();
  };

  const handleSelectLog = (logEntry) => {
    const key = getLogKey(logEntry);
    setSelectedLogId((prev) => (prev === key ? "" : key));
  };

  const handleCopyPayload = async (logEntry) => {
    if (!logEntry) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(logEntry, null, 2));
      setCopyMessage("Copied to clipboard");
    } catch (error) {
      console.error("Failed to copy log payload", error);
      setCopyMessage("Copy failed");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-6 rounded-2xl border border-border bg-surface p-8 shadow-soft dark:border-dark-border dark:bg-dark-surface">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted dark:text-dark-text-muted">
            Diagnostics · Audit trail
          </span>
          <h1 className="text-3xl font-semibold text-text-primary dark:text-dark-text-primary">
            System activity logs
          </h1>
          <p className="max-w-2xl text-sm text-text-muted dark:text-dark-text-muted">
            Trace user actions, automation events, and system alerts to keep operations transparent.
          </p>
        </div>
        <form className="grid gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 text-sm dark:border-dark-border/60 dark:bg-dark-background/60" onSubmit={handleApplyFilters}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
                Level
              </span>
              <select
                name="level"
                value={filters.level}
                onChange={handleFilterChange}
                disabled={loading}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
              >
                {LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
                Search
              </span>
              <input
                name="search"
                type="search"
                placeholder="Actor, message, context…"
                value={filters.search}
                onChange={handleFilterChange}
                onKeyDown={handleSearchKeyDown}
                disabled={loading}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
                Actor
              </span>
              <input
                name="actor"
                type="search"
                placeholder="Name, email, ID…"
                value={filters.actor}
                onChange={handleFilterChange}
                onKeyDown={handleSearchKeyDown}
                disabled={loading}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
                Resource
              </span>
              <input
                name="resourceType"
                type="search"
                placeholder="Resource type or ID"
                value={filters.resourceType}
                onChange={handleFilterChange}
                onKeyDown={handleSearchKeyDown}
                disabled={loading}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
                From
              </span>
              <input
                name="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                disabled={loading}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
                To
              </span>
              <input
                name="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={handleFilterChange}
                disabled={loading}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
              />
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/60"
              disabled={loading}
            >
              {loading ? "Loading…" : "Apply"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text-secondary"
              onClick={handleResetFilters}
              disabled={loading && !logs.length}
            >
              Reset
            </button>
          </div>
        </form>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-text-muted dark:text-dark-text-muted">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1 text-sm font-medium text-text-secondary transition hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text-secondary"
            onClick={loadLogs}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh now"}
          </button>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={handleAutoRefreshToggle}
              className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/40 dark:border-dark-border"
            />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
              Auto refresh
            </span>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-text-secondary dark:text-dark-text-secondary">
            Showing {filteredCount} / {totalLogs}
          </span>
          {copyMessage && (
            <span className="rounded-lg border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              {copyMessage}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {loading && (
            <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-text-muted dark:border-dark-border/60 dark:bg-dark-background/60 dark:text-dark-text-muted">
              Loading logs…
            </div>
          )}

          {!loading && groupedLogs.length === 0 && (
            <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-text-muted dark:border-dark-border/60 dark:bg-dark-background/60 dark:text-dark-text-muted">
              No logs match the current filters.
            </div>
          )}

          {groupedLogs.map(({ dayKey, label, entries }) => (
            <article
              key={dayKey}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft dark:border-dark-border dark:bg-dark-surface"
            >
              <header className="flex items-center justify-between gap-4 border-b border-border/60 bg-background/40 px-5 py-3 text-sm font-semibold text-text-secondary dark:border-dark-border/60 dark:bg-dark-background/40 dark:text-dark-text-secondary">
                <span>{label}</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20">
                  {entries.length}
                </span>
              </header>
              <ul className="divide-y divide-border/60 dark:divide-dark-border/60">
                {entries.map((logEntry) => {
                  const { absolute, relative } = formatTimestamp(logEntry?.timestamp);
                  const entryKey = getLogKey(logEntry);
                  const isSelected = entryKey === selectedLogId;
                  const normalizedLevel = normalizeLevel(logEntry?.level);
                  const badgeClasses = LEVEL_BADGE_STYLES[normalizedLevel] || LEVEL_BADGE_STYLES.default;

                  return (
                    <li key={entryKey} className={isSelected ? "bg-primary/5 dark:bg-primary/10" : ""}>
                      <button
                        type="button"
                        className="flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-background/60 focus:bg-background/60 focus:outline-none dark:hover:bg-dark-background/60 dark:focus:bg-dark-background/60"
                        onClick={() => handleSelectLog(logEntry)}
                      >
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses}`}>
                          {logEntry?.level || "Info"}
                        </span>
                        <div className="flex flex-1 flex-col gap-1">
                          <div className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                            {logEntry?.message || "Untitled event"}
                          </div>
                          <div className="text-xs text-text-muted dark:text-dark-text-muted">
                            {absolute}
                            {relative ? ` · ${relative}` : ""}
                          </div>
                          {logEntry?.actor?.name && (
                            <div className="text-xs text-text-muted dark:text-dark-text-muted">
                              Actor: {logEntry.actor.name}
                            </div>
                          )}
                          {logEntry?.resource?.type && (
                            <div className="text-xs text-text-muted dark:text-dark-text-muted">
                              Resource: {logEntry.resource.type}
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>

        <aside className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Log inspector</h2>
            {selectedLog && (
              <button
                type="button"
                onClick={() => handleCopyPayload(selectedLog)}
                className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-text-secondary transition hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text-secondary"
              >
                Copy JSON
              </button>
            )}
          </header>

          {!selectedLog && (
            <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-6 text-sm text-text-muted dark:border-dark-border/60 dark:bg-dark-background/60 dark:text-dark-text-muted">
              Select a log entry to inspect full details.
            </div>
          )}

          {selectedLog && (
            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted dark:text-dark-text-muted">
                  Message
                </span>
                <p className="text-text-primary dark:text-dark-text-primary">{selectedLog.message}</p>
              </div>

              <div className="grid gap-2 text-xs text-text-muted dark:text-dark-text-muted">
                <div className="flex items-center justify-between">
                  <span>Level</span>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary dark:bg-primary/20">
                    {selectedLog.level}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Timestamp</span>
                  <span>{formatTimestamp(selectedLog.timestamp).absolute}</span>
                </div>
                {selectedLog.actor?.name && (
                  <div className="flex items-center justify-between">
                    <span>Actor</span>
                    <span>{selectedLog.actor.name}</span>
                  </div>
                )}
                {selectedLog.actor?.email && (
                  <div className="flex items-center justify-between">
                    <span>Email</span>
                    <span>{selectedLog.actor.email}</span>
                  </div>
                )}
                {selectedLog.resource?.type && (
                  <div className="flex items-center justify-between">
                    <span>Resource</span>
                    <span>{selectedLog.resource.type}</span>
                  </div>
                )}
                {selectedLog.resource?.id && (
                  <div className="flex items-center justify-between">
                    <span>Resource ID</span>
                    <span>{selectedLog.resource.id}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted dark:text-dark-text-muted">
                  Payload
                </span>
                <pre className="max-h-64 overflow-auto rounded-xl border border-border/60 bg-background/80 p-4 text-xs leading-relaxed text-text-secondary dark:border-dark-border/60 dark:bg-dark-background/80 dark:text-dark-text-secondary">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

export default Logs;
