import { useEffect, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import dayjs from "dayjs";
import { fetchTransactions } from "../../api/services";
import "./table.scss";

const MAX_RECENT_TRANSACTIONS = 6;

const normalizeText = (value, fallback = "—") => {
  if (!value) return fallback;
  return String(value);
};

const formatAmount = (amount) => {
  if (typeof amount !== "number") return "—";
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  });
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

const LatestTransactionsTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchTransactions({ limit: MAX_RECENT_TRANSACTIONS, sort: "-createdAt" });
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to load transactions.");
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  const renderBody = () => {
    if (loading) {
      return (
        <TableRow className="tableRow--message">
          <TableCell className="tableCell" colSpan={7}>
            Loading latest transactions…
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow className="tableRow--message tableRow--error">
          <TableCell className="tableCell" colSpan={7}>
            {error}
          </TableCell>
        </TableRow>
      );
    }

    if (!transactions.length) {
      return (
        <TableRow className="tableRow--message tableRow--empty">
          <TableCell className="tableCell" colSpan={7}>
            No transactions captured yet.
          </TableCell>
        </TableRow>
      );
    }

    return transactions.map((row) => {
      const status = (row.status || "pending").toLowerCase();
      const method = (row.method || "manual").toLowerCase();

      return (
        <TableRow key={row._id}>
          <TableCell className="tableCell tableCell--mono">{normalizeText(row._id)}</TableCell>
          <TableCell className="tableCell">
            <div className="tableCellMain">
              <span className="primaryText">{normalizeText(row.user?.username || row.user?.email, "Guest")}</span>
              <span className="secondaryText">{normalizeText(row.user?.email)}</span>
            </div>
          </TableCell>
          <TableCell className="tableCell">
            <div className="tableCellMain">
              <span className="primaryText">{normalizeText(row.hotel?.name, "Unassigned hotel")}</span>
              <span className="secondaryText">{normalizeText(row.booking?._id, "No booking linked")}</span>
            </div>
          </TableCell>
          <TableCell className="tableCell">{formatAmount(row.amount)}</TableCell>
          <TableCell className="tableCell">
            <span className={`methodChip method-${method}`}>{formatMethod(row.method)}</span>
          </TableCell>
          <TableCell className="tableCell">
            <span className={`statusChip status-${status}`}>{formatStatus(row.status)}</span>
          </TableCell>
          <TableCell className="tableCell tableCell--mono">
            {row.createdAt ? dayjs(row.createdAt).format("DD MMM, YYYY") : "—"}
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <TableContainer component={Paper} className="table">
      <Table sx={{ minWidth: 650 }} aria-label="latest transactions table">
        <TableHead>
          <TableRow>
            <TableCell className="tableCell">Transaction</TableCell>
            <TableCell className="tableCell">Guest</TableCell>
            <TableCell className="tableCell">Hotel</TableCell>
            <TableCell className="tableCell">Amount</TableCell>
            <TableCell className="tableCell">Method</TableCell>
            <TableCell className="tableCell">Status</TableCell>
            <TableCell className="tableCell">Created</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{renderBody()}</TableBody>
      </Table>
    </TableContainer>
  );
};

export default LatestTransactionsTable;
