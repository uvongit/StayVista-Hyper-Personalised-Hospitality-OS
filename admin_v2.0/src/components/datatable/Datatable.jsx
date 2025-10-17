import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import useWindowSize from "../../hooks/useWindowSize.js";
import { deleteResource, fetchCollection } from "../../api/services.js";
import { extractApiErrorMessage } from "../../utils/error.js";

const formatINRCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === "") {
    return "—";
  }

  const numericAmount = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return String(amount);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

const Datatable = ({ columns }) => {
  const location = useLocation();
  const path = location.pathname.split("/")[1];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const { width } = useWindowSize();

  const isMobile = (width || 0) < 640;

  const errorMessage = error || "";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCollection(path);
      setRows(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to load data"));
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const resourceCopy = useMemo(
    () => ({
      rooms: { singular: "room", definite: "this room" },
      hotels: { singular: "hotel", definite: "this hotel" },
      users: { singular: "member", definite: "this member" },
    }),
    []
  );

  const { singular: resourceSingular = "item", definite: resourceDefinite = "this item" } =
    resourceCopy[path] || {};

  const resourceLabel = useMemo(
    () => resourceSingular.charAt(0).toUpperCase() + resourceSingular.slice(1),
    [resourceSingular]
  );

  const handleDelete = useCallback(
    async (id) => {
      const confirmed = window.confirm(`Are you sure you want to remove ${resourceDefinite}?`);
      if (!confirmed) return;

      try {
        await deleteResource(path, id);
        setRows((prev) => prev.filter((item) => item._id !== id));
        setToast({ type: "success", message: `${resourceLabel} deleted successfully.` });
      } catch (err) {
        const message = extractApiErrorMessage(err, `Unable to delete ${resourceSingular}.`);
        setError(message);
        setToast({ type: "error", message });
      }
    },
    [path, resourceDefinite, resourceLabel, resourceSingular]
  );

  const metaByPath = {
    rooms: {
      eyebrow: "Inventory",
      title: "Rooms inventory",
      subtitle:
        "Review every room type, rates, and the room numbers currently assigned to each hotel.",
      actionLabel: "Add room",
    },
    hotels: {
      eyebrow: "Portfolio",
      title: "Hotels directory",
      subtitle:
        "Keep property details sharp so teams can maintain availability, pricing, and photos with confidence.",
      actionLabel: "Add hotel",
    },
    users: {
      eyebrow: "Team",
      title: "Admin members",
      subtitle: "Manage who has access, adjust permissions, and keep roles aligned with responsibilities.",
      actionLabel: "Add member",
    },
  };

  const meta = metaByPath[path] || {
    title: path.charAt(0).toUpperCase() + path.slice(1),
    actionLabel: "Add new",
  };

  const renderMobileCard = useCallback(
    (row) => {
      const rowId = row?._id || row?.id || row?.code || row?.reference;

      if (!rowId) {
        return null;
      }

      if (path === "hotels") {
        const photos = Array.isArray(row?.photos) ? row.photos : [];
        const cover = photos.length ? photos[0] : null;
        const hotelName = row?.name || "Unnamed hotel";
        const city = row?.city || row?.address?.city || "—";
        const type = row?.type || row?.category || "—";
        const title = row?.title || row?.headline || "—";

        return (
          <article
            key={rowId}
            className="rounded-3xl border border-border/60 bg-surface/95 p-5 shadow-soft backdrop-blur-xl dark:border-dark-border/60 dark:bg-dark-surface/80"
          >
            <header className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-surface dark:border-dark-border/50 dark:bg-dark-surface/70">
                {cover ? (
                  <img src={cover} alt={hotelName} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-lg font-semibold text-primary">{hotelName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-text-primary dark:text-dark-text-primary">{hotelName}</h3>
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted dark:text-dark-text-muted">{type}</p>
              </div>
            </header>
            <dl className="mt-4 grid gap-2 text-xs text-text-muted dark:text-dark-text-muted">
              <div className="flex justify-between gap-3">
                <dt className="font-semibold uppercase tracking-[0.14em]">City</dt>
                <dd className="truncate text-text-primary dark:text-dark-text-primary">{city}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold uppercase tracking-[0.14em]">Title</dt>
                <dd className="truncate text-text-primary dark:text-dark-text-primary">{title}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold uppercase tracking-[0.14em]">ID</dt>
                <dd className="font-mono tracking-[0.18em] text-text-primary dark:text-dark-text-primary">{rowId}</dd>
              </div>
            </dl>
            <footer className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                to={`/${path}/${rowId}`}
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-soft transition hover:bg-primary-dark"
              >
                View
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(rowId)}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full border border-danger/40 bg-danger/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-danger transition hover:border-danger hover:bg-danger/20 disabled:opacity-70 dark:border-danger/30 dark:bg-danger/15 dark:text-danger"
              >
                Delete
              </button>
            </footer>
          </article>
        );
      }

      if (path === "rooms") {
        const title = row?.title || "Untitled room";
        const desc = row?.desc || row?.description || "—";
        const price = row?.price;
        const guests = row?.maxPeople;

        return (
          <article
            key={rowId}
            className="rounded-3xl border border-border/60 bg-surface/90 p-5 shadow-soft backdrop-blur-xl dark:border-dark-border/60 dark:bg-dark-surface/80"
          >
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-text-primary dark:text-dark-text-primary">{title}</h3>
                <p className="mt-1 text-xs text-text-muted dark:text-dark-text-muted">{desc}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary dark:bg-primary/20">
                {guests ? `${guests} guests` : "Flex"}
              </span>
            </header>
            <dl className="mt-4 grid gap-2 text-xs text-text-muted dark:text-dark-text-muted">
              <div className="flex justify-between gap-3">
                <dt className="font-semibold uppercase tracking-[0.14em]">Price</dt>
                <dd className="text-text-primary dark:text-dark-text-primary">{price ? formatINRCurrency(price) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold uppercase tracking-[0.14em]">ID</dt>
                <dd className="font-mono tracking-[0.18em] text-text-primary dark:text-dark-text-primary">{rowId}</dd>
              </div>
            </dl>
            <footer className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                to={`/${path}/${rowId}`}
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-soft transition hover:bg-primary-dark"
              >
                View
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(rowId)}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full border border-danger/40 bg-danger/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-danger transition hover:border-danger hover:bg-danger/20 disabled:opacity-70 dark:border-danger/30 dark:bg-danger/15 dark:text-danger"
              >
                Delete
              </button>
            </footer>
          </article>
        );
      }

      if (path === "users") {
        const avatar = row?.img;
        const username = row?.username || row?.name || "Member";
        const email = row?.email || "—";
        const phone = row?.phone || "—";
        const country = row?.country || row?.location || "—";

        return (
          <article
            key={rowId}
            className="rounded-3xl border border-border/60 bg-surface/90 p-5 shadow-soft backdrop-blur-xl dark:border-dark-border/60 dark:bg-dark-surface/80"
          >
            <header className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full border border-border/50 bg-surface dark:border-dark-border/60 dark:bg-dark-surface/70">
                <img
                  src={avatar || "https://i.ibb.co/MBtjqXQ/no-avatar.gif"}
                  alt={username}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-text-primary dark:text-dark-text-primary">{username}</h3>
                <p className="text-xs text-text-muted dark:text-dark-text-muted">{email}</p>
              </div>
            </header>
            <dl className="mt-4 grid gap-2 text-xs text-text-muted dark:text-dark-text-muted">
              <div className="flex justify-between gap-3">
                <dt className="font-semibold uppercase tracking-[0.14em]">Phone</dt>
                <dd className="font-mono tracking-[0.12em] text-text-primary dark:text-dark-text-primary">{phone}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold uppercase tracking-[0.14em]">Country</dt>
                <dd className="truncate text-text-primary dark:text-dark-text-primary">{country}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold uppercase tracking-[0.14em]">ID</dt>
                <dd className="font-mono tracking-[0.18em] text-text-primary dark:text-dark-text-primary">{rowId}</dd>
              </div>
            </dl>
            <footer className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                to={`/${path}/${rowId}`}
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-soft transition hover:bg-primary-dark"
              >
                View
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(rowId)}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full border border-danger/40 bg-danger/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-danger transition hover:border-danger hover:bg-danger/20 disabled:opacity-70 dark:border-danger/30 dark:bg-danger/15 dark:text-danger"
              >
                Delete
              </button>
            </footer>
          </article>
        );
      }

      const entries = Object.entries(row || {}).slice(0, 6);

      return (
        <article
          key={rowId}
          className="rounded-3xl border border-border/60 bg-surface/90 p-5 shadow-soft backdrop-blur-xl dark:border-dark-border/60 dark:bg-dark-surface/80"
        >
          <header>
            <h3 className="truncate text-base font-semibold text-text-primary dark:text-dark-text-primary">
              {row?.title || row?.name || rowId}
            </h3>
          </header>
          <dl className="mt-4 grid gap-2 text-xs text-text-muted dark:text-dark-text-muted">
            {entries.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-3">
                <dt className="font-semibold uppercase tracking-[0.14em]">{key}</dt>
                <dd className="truncate text-text-primary dark:text-dark-text-primary">{String(value ?? "—")}</dd>
              </div>
            ))}
          </dl>
          <footer className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              to={`/${path}/${rowId}`}
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-soft transition hover:bg-primary-dark"
            >
              View
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(rowId)}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full border border-danger/40 bg-danger/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-danger transition hover:border-danger hover:bg-danger/20 disabled:opacity-70 dark:border-danger/30 dark:bg-danger/15 dark:text-danger"
            >
              Delete
            </button>
          </footer>
        </article>
      );
    },
    [handleDelete, loading, path]
  );

  const actionColumn = useMemo(
    () => ({
      field: "action",
      headerName: "Action",
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/${path}/${params.row._id}`}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20"
          >
            View
          </Link>
          <button
            type="button"
            className="rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger transition hover:bg-danger/20"
            onClick={() => handleDelete(params.row._id)}
          >
            Delete
          </button>
        </div>
      ),
    }),
    [handleDelete, path]
  );

  const resolvedColumns = useMemo(() => {
    if (!Array.isArray(columns) || !columns.length) return [actionColumn];
    if (!isMobile) return [...columns, actionColumn];

    const condensed = columns
      .filter((column) => column.field === "title" || column.field === "username" || column.field === "name")
      .map((column) => ({
        ...column,
        flex: 1,
        minWidth: 160,
      }));

    const fallback = condensed.length ? condensed : columns.slice(0, 2);
    return [...fallback, { ...actionColumn, width: 140 }];
  }, [actionColumn, columns, isMobile]);

  const columnVisibilityModel = useMemo(() => {
    if (!isMobile) return undefined;
    if (!Array.isArray(columns)) return undefined;
    const visibility = {};
    columns.forEach((column) => {
      if (column.field && column.field !== "title" && column.field !== "username" && column.field !== "name") {
        visibility[column.field] = false;
      }
    });
    return visibility;
  }, [columns, isMobile]);

  return (
    <section className="space-y-6 rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-medium backdrop-blur-xl dark:border-dark-border/70 dark:bg-dark-surface/60">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          {meta.eyebrow && (
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {meta.eyebrow}
            </span>
          )}
          <h2 className="text-2xl font-semibold text-text-primary dark:text-dark-text-primary">
            {meta.title}
          </h2>
          {meta.subtitle && (
            <p className="max-w-2xl text-sm text-text-muted dark:text-dark-text-muted">
              {meta.subtitle}
            </p>
          )}
        </div>
        <Link
          to={`/${path}/new`}
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-dark"
        >
          {meta.actionLabel || "Add new"}
        </Link>
      </header>

      {errorMessage && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <button
              type="button"
              className="rounded-full border border-danger/40 px-3 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10"
              onClick={loadData}
              disabled={loading}
            >
              {loading ? "Retrying…" : "Retry"}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold shadow-soft ${
            toast.type === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}

      {isMobile && (
        <div className="grid gap-4 sm:hidden">
          {loading && rows.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-surface/90 p-6 text-center text-sm text-text-muted dark:border-dark-border/60 dark:bg-dark-surface/80 dark:text-dark-text-muted">
              Loading data…
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-surface/90 p-6 text-center text-sm text-text-muted dark:border-dark-border/60 dark:bg-dark-surface/80 dark:text-dark-text-muted">
              No records yet.
            </div>
          ) : (
            rows.map((row) => renderMobileCard(row)).filter(Boolean)
          )}
        </div>
      )}

      <div
        className={`overflow-x-auto rounded-[24px] border border-border/50 bg-surface/95 shadow-soft dark:border-dark-border/60 dark:bg-dark-surface/80 ${
          isMobile ? "hidden sm:block" : ""
        }`}
      >
        <DataGrid
          className="min-w-full sm:min-w-[680px] !border-none !bg-transparent"
          autoHeight
          rows={rows}
          columns={resolvedColumns}
          getRowId={(row) => row._id}
          disableRowSelectionOnClick
          loading={loading}
          disableColumnMenu
          pageSizeOptions={[9, 18, 36]}
          initialState={{ pagination: { paginationModel: { pageSize: 9 } } }}
          rowHeight={64}
          columnHeaderHeight={56}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={() => {}}
          sx={{
            borderRadius: "24px",
            border: "1px solid rgba(148, 163, 184, 0.16)",
            boxShadow: "0 28px 80px -48px rgba(15, 23, 42, 0.35)",
            background: "linear-gradient(180deg, rgba(248,250,252,0.92) 0%, rgba(226,232,240,0.85) 100%)",
            fontSize: 14,
            "& .MuiDataGrid-columnHeaders": {
              position: "sticky",
              top: 0,
              zIndex: 2,
              background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(226,232,240,0.75) 100%)",
              backdropFilter: "blur(14px)",
              borderBottom: "1px solid rgba(148, 163, 184, 0.26)",
              padding: "0 16px",
            },
            "& .MuiDataGrid-columnHeader": {
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontWeight: 600,
              color: "rgba(30, 41, 59, 0.82)",
              fontFamily:
                '"General Sans", "Inter", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
              padding: "0 8px",
              lineHeight: 1.4,
            },
            "& .MuiDataGrid-columnSeparator": {
              display: "none",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid rgba(148, 163, 184, 0.16)",
              color: "rgba(15, 23, 42, 0.9)",
              fontSize: "0.9rem",
              lineHeight: 1.4,
              padding: "12px 16px",
              alignItems: "center",
              display: "flex",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
            "& .MuiDataGrid-row": {
              transition: "background-color 180ms ease, transform 180ms ease",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "rgba(59, 130, 246, 0.08)",
              transform: "translateY(-2px)",
            },
            "& .MuiDataGrid-virtualScroller": {
              background: "linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(241,245,249,0.82) 100%)",
              overflowX: "hidden",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid rgba(148, 163, 184, 0.18)",
              background: "linear-gradient(180deg, rgba(248,250,252,0.92) 0%, rgba(226,232,240,0.8) 100%)",
              minHeight: 62,
              color: "rgba(30, 41, 59, 0.78)",
              letterSpacing: "0.1em",
              fontWeight: 600,
              padding: "0 16px",
            },
            ".dark &": {
              border: "1px solid rgba(71, 85, 105, 0.32)",
              background: "linear-gradient(180deg, rgba(8,11,18,0.97) 0%, rgba(8,11,18,0.84) 100%)",
              boxShadow: "0 30px 80px -48px rgba(15, 23, 42, 0.75)",
              "& .MuiDataGrid-columnHeaders": {
                background: "linear-gradient(135deg, rgba(8,11,18,0.98) 0%, rgba(8,11,18,0.9) 100%)",
                borderBottom: "1px solid rgba(71, 85, 105, 0.74)",
                boxShadow: "inset 0 -1px 0 rgba(8, 11, 18, 0.82)",
              },
              "& .MuiDataGrid-columnHeader--filler": {
                background: "linear-gradient(135deg, rgba(8,11,18,0.98) 0%, rgba(8,11,18,0.9) 100%)",
                borderBottom: "1px solid rgba(71, 85, 105, 0.74)",
              },
              "& .MuiDataGrid-columnHeadersInner": {
                background: "linear-gradient(135deg, rgba(8,11,18,0.98) 0%, rgba(8,11,18,0.9) 100%)",
              },
              "& .MuiDataGrid-filler": {
                background: "linear-gradient(135deg, rgba(8,11,18,0.98) 0%, rgba(8,11,18,0.9) 100%)",
                borderBottom: "1px solid rgba(71, 85, 105, 0.74)",
              },
              "& .MuiDataGrid-scrollbarFiller": {
                backgroundColor: "rgba(8, 11, 18, 0.94)",
                borderBottom: "1px solid rgba(71, 85, 105, 0.74)",
              },
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: "rgba(8, 11, 18, 0.94)",
                borderColor: "rgba(71, 85, 105, 0.74)",
                color: "rgba(248, 250, 252, 0.96)",
                letterSpacing: "0.18em",
                textShadow: "0 1px 0 rgba(8, 11, 18, 0.8)",
                padding: "0 8px",
                lineHeight: 1.4,
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                color: "rgba(248, 250, 252, 0.96)",
                textShadow: "0 1px 0 rgba(8, 11, 18, 0.8)",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid rgba(51, 65, 85, 0.6)",
                color: "rgba(226, 232, 240, 0.9)",
                padding: "12px 16px",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "rgba(59, 130, 246, 0.16)",
              },
              "& .MuiDataGrid-virtualScroller": {
                background: "linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.78) 100%)",
                overflowX: "hidden",
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: "1px solid rgba(51, 65, 85, 0.65)",
                background: "linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.85) 100%)",
                color: "rgba(226, 232, 240, 0.88)",
                letterSpacing: "0.1em",
                fontWeight: 600,
                padding: "0 16px",
              },
            },
          }}
        />
      </div>
    </section>
  );
};

export default Datatable;
