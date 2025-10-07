import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import { fetchLogs } from "../../api/services";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./logs.scss";

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
        if (!stillExists) {
          setSelectedLogId("");
        }
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

  const groups = useMemo(() => {
    return filteredLogs.reduce((acc, logEntry) => {
      const dayLabel = dayjs(logEntry?.timestamp).format("dddd, DD MMMM YYYY");
      if (!acc[dayLabel]) {
        acc[dayLabel] = [];
      }
      acc[dayLabel].push(logEntry);
      return acc;
    }, {});
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
    if (event.key === "Enter") {
      loadLogs();
    }
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
    if (checked) {
      loadLogs();
    }
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
    } catch (err) {
      setCopyMessage("Copy failed");
    }
  };

  return (
    <div className="logs">
      <Sidebar />
      <div className="logsContainer">
        <Navbar />

        <header className="logsHeader surface-card">
          <div className="logsMeta">
            <span className="eyebrow">Diagnostics · Audit trail</span>
            <h1>System activity logs</h1>
            <p>Trace user actions, automation events, and system alerts to keep operations transparent.</p>
          </div>
          <form className="logsFilters" onSubmit={handleApplyFilters}>
            <label className="filterItem">
              <span>Level</span>
              <select name="level" value={filters.level} onChange={handleFilterChange} disabled={loading}>
                {LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="filterItem">
              <span>Search</span>
              <input
                name="search"
                type="search"
                placeholder="Actor, message, context…"
                value={filters.search}
                onChange={handleFilterChange}
                onKeyDown={handleSearchKeyDown}
                disabled={loading}
              />
            </label>
            <label className="filterItem">
              <span>Actor</span>
              <input
                name="actor"
                type="search"
                placeholder="Name, email, ID…"
                value={filters.actor}
                onChange={handleFilterChange}
                onKeyDown={handleSearchKeyDown}
                disabled={loading}
              />
            </label>
            <label className="filterItem">
              <span>Resource</span>
              <input
                name="resourceType"
                type="search"
                placeholder="Resource type or ID"
                value={filters.resourceType}
                onChange={handleFilterChange}
                onKeyDown={handleSearchKeyDown}
                disabled={loading}
              />
            </label>
            <label className="filterItem filterItem--date">
              <span>From</span>
              <input
                name="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                disabled={loading}
              />
            </label>
            <label className="filterItem filterItem--date">
              <span>To</span>
              <input
                name="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={handleFilterChange}
                disabled={loading}
              />
            </label>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Loading…" : "Apply"}
            </button>
          </form>
        </header>

        <div className="logsToolbar">
          <div className="logsToolbar__left">
            <button type="button" className="ghost-button" onClick={loadLogs} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh now"}
            </button>
            <label className="autoRefreshToggle">
              <input type="checkbox" checked={autoRefresh} onChange={handleAutoRefreshToggle} />
              <span>Auto refresh (60s)</span>
            </label>
          </div>
          <div className="logsToolbar__right">
            <span className="resultCount">
              {filteredCount} of {totalLogs} events
            </span>
            <button
              type="button"
              className="ghost-button ghost-button--muted"
              onClick={handleResetFilters}
              disabled={loading && !logs.length}
            >
              Reset filters
            </button>
          </div>
        </div>

        {error && <div className="logsError">{error}</div>}

        <section className="logsTimeline surface-card">
          {loading && <div className="logsStatus">Fetching latest activity…</div>}
          {!loading && !filteredLogs.length && (
            <div className="logsStatus logsStatus--muted">No log entries match the current filters.</div>
          )}
          {!loading &&
            Object.entries(groups).map(([day, dayLogs]) => (
              <div className="logGroup" key={day}>
                <div className="groupHeader">
                  <span>{day}</span>
                  <span>{dayjs(dayLogs[0]?.timestamp).fromNow()}</span>
                </div>
                <ul>
                  {dayLogs.map((logEntry, index) => {
                    const level = normalizeLevel(logEntry?.level);
                    const { absolute, relative } = formatTimestamp(logEntry?.timestamp);
                    const logKey = getLogKey(logEntry) || `${day}-${index}`;
                    const isActive = selectedLogId === logKey;

                    return (
                      <li className={`logEntry logEntry--${level} ${isActive ? "is-active" : ""}`} key={logKey}>
                        <div className="logMeta">
                          <span className="logLevel">{level}</span>
                          <span className="logTime" title={absolute}>
                            {relative || absolute}
                          </span>
                        </div>
                        <div className="logContent">
                          <h3>{logEntry?.message || "No message provided"}</h3>
                          {logEntry?.details && <p className="logDetails">{logEntry.details}</p>}
                          <div className="logContext">
                            {logEntry?.actor?.name && (
                              <span className="contextBadge">Actor: {logEntry.actor.name}</span>
                            )}
                            {logEntry?.actor?.email && (
                              <span className="contextBadge">Email: {logEntry.actor.email}</span>
                            )}
                            {logEntry?.context && (
                              <span className="contextBadge">Context: {logEntry.context}</span>
                            )}
                            {logEntry?.resource?.type && logEntry?.resource?.id && (
                              <span className="contextBadge">
                                Resource: {logEntry.resource.type} · {logEntry.resource.id}
                              </span>
                            )}
                            {logEntry?.sessionId && (
                              <span className="contextBadge">Session: {logEntry.sessionId}</span>
                            )}
                          </div>
                          <div className="logFooter">
                            <button type="button" className="logEntry__cta" onClick={() => handleSelectLog(logEntry)}>
                              {isActive ? "Hide details" : "Inspect details"}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
        </section>

        {selectedLog && (
          <section className="logDetail surface-card">
            <header className="logDetail__header">
              <div className="logDetail__title">
                <span className={`detailLevel detailLevel--${normalizeLevel(selectedLog.level)}`}>
                  {normalizeLevel(selectedLog.level)}
                </span>
                <h2>{selectedLog.message || "Log details"}</h2>
                <span className="detailTimestamp">{formatTimestamp(selectedLog.timestamp).absolute}</span>
              </div>
              <div className="logDetail__actions">
                <button type="button" className="ghost-button" onClick={() => handleCopyPayload(selectedLog)}>
                  Copy JSON
                </button>
                <button type="button" className="ghost-button ghost-button--muted" onClick={() => setSelectedLogId("")}>
                  Close
                </button>
              </div>
            </header>
            {copyMessage && <div className="copyMessage">{copyMessage}</div>}
            <div className="logDetail__meta">
              <div>
                <span className="label">Occurred</span>
                <span className="value">{formatTimestamp(selectedLog.timestamp).absolute}</span>
                <span className="hint">{formatTimestamp(selectedLog.timestamp).relative}</span>
              </div>
              {selectedLog.actor && (
                <div>
                  <span className="label">Actor</span>
                  <span className="value">{selectedLog.actor.name || selectedLog.actor.id || "Unknown"}</span>
                  {selectedLog.actor.email && <span className="hint">{selectedLog.actor.email}</span>}
                </div>
              )}
              {selectedLog.resource && (
                <div>
                  <span className="label">Resource</span>
                  <span className="value">{selectedLog.resource.type || "—"}</span>
                  {selectedLog.resource.id && <span className="hint">ID · {selectedLog.resource.id}</span>}
                </div>
              )}
            </div>
            <pre className="logDetail__payload">{JSON.stringify(selectedLog, null, 2)}</pre>
          </section>
        )}
      </div>
    </div>
  );
};

export default Logs;
