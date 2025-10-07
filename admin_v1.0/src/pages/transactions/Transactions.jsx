import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import { DataGrid } from "@mui/x-data-grid";
import { fetchTransactions } from "../../api/services";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./transactions.scss";

dayjs.extend(relativeTime);

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTransactions = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTransactions({ limit: 100 });
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const columns = useMemo(
    () => [
      { field: "_id", headerName: "Transaction ID", width: 220 },
      {
        field: "booking",
        headerName: "Booking",
        width: 200,
        valueGetter: (params) => params.row.booking?._id || "—",
      },
      {
        field: "user",
        headerName: "Guest",
        width: 160,
        valueGetter: (params) => params.row.user?.username || params.row.user?.email,
      },
      {
        field: "hotel",
        headerName: "Hotel",
        width: 160,
        valueGetter: (params) => params.row.hotel?.name,
      },
      {
        field: "amount",
        headerName: "Amount",
        width: 140,
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
        field: "method",
        headerName: "Method",
        width: 120,
        valueGetter: (params) => params.row.method || "—",
        renderCell: (params) => (
          <span className={`methodChip method-${params.row.method || "manual"}`}>
            {(params.row.method || "manual").toUpperCase()}
          </span>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        renderCell: (params) => (
          <span className={`statusChip status-${params.row.status || "pending"}`}>
            {(params.row.status || "pending").toUpperCase()}
          </span>
        ),
      },
      {
        field: "createdAt",
        headerName: "Created",
        width: 160,
        valueGetter: (params) => dayjs(params.row.createdAt).format("MMM D, YYYY h:mm A"),
      },
      {
        field: "relative",
        headerName: "Age",
        width: 120,
        valueGetter: (params) => dayjs(params.row.createdAt).fromNow(),
      },
    ],
    []
  );

  return (
    <div className="transactions">
      <Sidebar />
      <div className="transactionsContainer">
        <Navbar />
        <div className="transactionsHeader">
          <div>
            <h1>Transactions</h1>
            <p>Review captured payments and track booking settlement history.</p>
          </div>
          <button className="refreshButton" onClick={loadTransactions} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        {error && <div className="transactionsError">{error}</div>}
        <DataGrid
          className="transactionsGrid"
          rows={transactions}
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

export default Transactions;
