const formatShortId = (mongoId = "") => {
  if (!mongoId) return "";
  const tail = mongoId.slice(-9);
  const numeric = parseInt(tail, 16);
  if (Number.isNaN(numeric)) {
    return mongoId.slice(-6).toUpperCase();
  }
  return numeric.toString(36).toUpperCase().padStart(6, "0").slice(-6);
};

const shortIdColumn = (width = 90) => ({
  field: "_id",
  headerName: "ID",
  width,
  sortable: false,
  renderCell: (params) => formatShortId(params.row?._id),
});

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "—";

  const numericValue = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numericValue);
};

const getTypeBadgeClasses = (type = "") => {
  const normalized = type.toLowerCase();

  const palette = {
    resort: "badge bg-sky-100/70 text-sky-700",
    apartment: "badge bg-amber-100/70 text-amber-700",
    villa: "badge bg-emerald-100/70 text-emerald-700",
    hotel: "badge bg-indigo-100/70 text-indigo-700",
    hostel: "badge bg-rose-100/70 text-rose-700",
    cabin: "badge bg-lime-100/70 text-lime-700",
  };

  return palette[normalized] || "badge bg-slate-200/70 text-slate-700";
};

const truncateText = (value, maxLength = 60, fallback = "—") => {
  if (value === null || value === undefined) return fallback;
  const stringValue = String(value).trim();
  if (!stringValue) return fallback;
  return stringValue.length > maxLength ? `${stringValue.slice(0, maxLength - 1)}…` : stringValue;
};

export const userColumns = [
  shortIdColumn(90),
  {
    field: "user",
    headerName: "User",
    width: 230,
    renderCell: (params) => (
      <div className="flex items-center gap-3">
        <img
          className="h-8 w-8 rounded-full object-cover"
          src={params.row.img || "https://i.ibb.co/MBtjqXQ/no-avatar.gif"}
          alt="avatar"
        />
        <span>{params.row.username}</span>
      </div>
    ),
  },
  {
    field: "email",
    headerName: "Email",
    width: 230,
  },
  {
    field: "country",
    headerName: "Country",
    width: 100,
  },
  {
    field: "city",
    headerName: "City",
    width: 100,
  },
  {
    field: "phone",
    headerName: "Phone",
    width: 120,
  },
];

export const hotelColumns = [
  shortIdColumn(110),
  {
    field: "name",
    headerName: "Name",
    flex: 1.1,
    minWidth: 220,
    renderCell: (params) => {
      const { name, photos } = params.row || {};
      const displayName = truncateText(name, 32, "Unnamed hotel");
      const coverPhoto = Array.isArray(photos) && photos.length > 0 ? photos[0] : null;
      const initials = displayName.charAt(0).toUpperCase();

      return (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-surface">
            {coverPhoto ? (
              <img src={coverPhoto} alt={displayName} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <span className="text-xs font-semibold text-primary">{initials}</span>
            )}
          </div>
          <span
            className="min-w-0 truncate text-sm font-semibold text-text-primary dark:text-dark-text-primary"
            title={name || "Unnamed hotel"}
          >
            {displayName}
          </span>
        </div>
      );
    },
  },
  {
    field: "type",
    headerName: "Type",
    flex: 0.6,
    minWidth: 110,
    renderCell: (params) => {
      const displayType = params.value || "—";
      return <span className={getTypeBadgeClasses(displayType)}>{truncateText(displayType, 16)}</span>;
    },
  },
  {
    field: "title",
    headerName: "Title",
    flex: 1,
    minWidth: 220,
    renderCell: (params) => {
      const text = truncateText(params.value, 68);
      return (
        <span
          className="block min-w-0 truncate text-sm text-text-muted dark:text-dark-text-muted"
          title={params.value || "—"}
        >
          {text}
        </span>
      );
    },
  },
  {
    field: "city",
    headerName: "City",
    flex: 0.6,
    minWidth: 120,
    renderCell: (params) => (
      <span
        className="block truncate text-sm font-medium text-text-primary dark:text-dark-text-primary"
        title={params.value || "—"}
      >
        {truncateText(params.value, 28)}
      </span>
    ),
  },
];

export const roomColumns = [
  shortIdColumn(90),
  {
    field: "title",
    headerName: "Title",
    flex: 1.1,
    minWidth: 220,
    renderCell: (params) => (
      <span
        className="block min-w-0 truncate text-sm font-semibold text-text-primary dark:text-dark-text-primary"
        title={params.value || "Untitled room"}
      >
        {truncateText(params.value, 42, "Untitled room")}
      </span>
    ),
  },
  {
    field: "desc",
    headerName: "Description",
    flex: 1,
    minWidth: 240,
    renderCell: (params) => (
      <span
        className="block min-w-0 truncate text-sm text-text-muted dark:text-dark-text-muted"
        title={params.value || "—"}
      >
        {truncateText(params.value, 72)}
      </span>
    ),
  },
  {
    field: "price",
    headerName: "Price",
    width: 130,
    renderCell: (params) => (
      <span className="inline-flex items-center rounded-full bg-emerald-100/80 px-3 py-0.5 text-xs font-semibold text-emerald-700">
        {formatCurrency(params.row?.price)}
      </span>
    ),
  },
  {
    field: "maxPeople",
    headerName: "Guests",
    width: 120,
    renderCell: (params) => (
      <span className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
        {params.value ? `${params.value} guests` : "—"}
      </span>
    ),
  },
];
