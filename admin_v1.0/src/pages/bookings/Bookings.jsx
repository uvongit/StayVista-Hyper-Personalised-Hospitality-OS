import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import { DataGrid } from "@mui/x-data-grid";
import { fetchBookings, updateBookingStatus } from "../../api/services";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./bookings.scss";

dayjs.extend(relativeTime);

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleStatusChange = async (bookingId, status) => {
    setUpdating(true);
    setError("");
    try {
      const updated = await updateBookingStatus(bookingId, status);
      setBookings((prev) =>
        prev.map((booking) => (booking._id === bookingId ? { ...booking, ...updated } : booking))
      );
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update booking status");
    } finally {
      setUpdating(false);
    }
  };

  const columns = useMemo(
    () => [
      { field: "_id", headerName: "Booking ID", width: 220 },
      {
        field: "hotel",
        headerName: "Hotel",
        width: 180,
        valueGetter: (params) => params.row.hotel?.name,
      },
      {
        field: "user",
        headerName: "Guest",
        width: 180,
        valueGetter: (params) => params.row.user?.username,
      },
      {
        field: "checkIn",
        headerName: "Check-in",
        width: 120,
        valueGetter: (params) => dayjs(params.row.checkIn).format("MMM D, YYYY"),
      },
      {
        field: "checkOut",
        headerName: "Check-out",
        width: 120,
        valueGetter: (params) => dayjs(params.row.checkOut).format("MMM D, YYYY"),
      },
      {
        field: "nights",
        headerName: "Nights",
        width: 90,
      },
      {
        field: "totalAmount",
        headerName: "Amount",
        width: 120,
        valueFormatter: ({ value }) =>
          typeof value === "number"
            ? value.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 0,
              })
            : value,
      },
      {
        field: "status",
        headerName: "Status",
        width: 150,
        renderCell: (params) => (
          <select
            className="statusSelect"
            value={params.row.status}
            onChange={(event) => handleStatusChange(params.row._id, event.target.value)}
            disabled={updating}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        ),
      },
      {
        field: "rooms",
        headerName: "Rooms",
        width: 220,
        valueGetter: (params) =>
          params.row.rooms
            ?.map((room) => room.roomNumberLabel)
            .filter(Boolean)
            .join(", ") || "—",
      },
      {
        field: "createdAt",
        headerName: "Created",
        width: 150,
        valueGetter: (params) => dayjs(params.row.createdAt).fromNow(),
      },
    ],
    [updating]
  );

  return (
    <div className="bookings">
      <Sidebar />
      <div className="bookingsContainer">
        <Navbar />
        <div className="bookingsHeader">
          <div>
            <h1>Bookings</h1>
            <p>Monitor reservations and update statuses as guests check in or out.</p>
          </div>
          <button className="refreshButton" onClick={loadBookings} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        {error && <div className="bookingsError">{error}</div>}
        <DataGrid
          className="bookingsGrid"
          rows={bookings}
          columns={columns}
          getRowId={(row) => row._id}
          loading={loading}
          autoHeight
          disableSelectionOnClick
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </div>
    </div>
  );
};

export default Bookings;
