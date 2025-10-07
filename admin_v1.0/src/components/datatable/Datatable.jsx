import "./datatable.scss";
import { DataGrid } from "@mui/x-data-grid";
import { Link, useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteResource, fetchCollection } from "../../api/services";

const Datatable = ({ columns }) => {
  const location = useLocation();
  const path = location.pathname.split("/")[1];
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const errorMessage =
    error?.response?.data?.message || error?.message || (error ? "Failed to load data" : "");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCollection(path);
      setList(data);
      setError(null);
    } catch (err) {
      setError(err);
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

  const handleDelete = async (id) => {
    const confirmed = window.confirm(`Are you sure you want to remove ${resourceDefinite}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteResource(path, id);
      setList((prev) => prev.filter((item) => item._id !== id));
      setToast({
        type: "success",
        message: `${resourceLabel} deleted successfully.`,
      });
    } catch (err) {
      setError(err);
      const message =
        err?.response?.data?.message || err?.message || `Unable to delete ${resourceSingular}.`;
      setToast({ type: "error", message });
    }
  };

  const metaByPath = {
    rooms: {
      eyebrow: "Inventory",
      title: "Rooms inventory",
      subtitle: "Review every room type, rates, and the room numbers currently assigned to each hotel.",
      actionLabel: "Add room",
    },
    hotels: {
      eyebrow: "Portfolio",
      title: "Hotels directory",
      subtitle: "Keep property details sharp so teams can maintain availability, pricing, and photos with confidence.",
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

  const actionColumn = [
    {
      field: "action",
      headerName: "Action",
      width: 200,
      renderCell: (params) => (
        <div className="cellAction">
          <Link to={`/${path}/${params.row._id}`} style={{ textDecoration: "none" }}>
            <div className="viewButton">View</div>
          </Link>
          <button
            type="button"
            className="deleteButton"
            onClick={() => handleDelete(params.row._id)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];
  return (
    <div className="datatable">
      <div className="datatableTitle">
        <div className="datatableTitle__content">
          {meta.eyebrow && <span className="datatableTitle__eyebrow">{meta.eyebrow}</span>}
          <h2>{meta.title}</h2>
          {meta.subtitle && <p>{meta.subtitle}</p>}
        </div>
        <Link to={`/${path}/new`} className="link primary-button">
          {meta.actionLabel || "Add new"}
        </Link>
      </div>
      {errorMessage && <div className="datatableError">{errorMessage}</div>}
      {toast ? (
        <div className={`datatableToast datatableToast--${toast.type}`} role="status">
          {toast.message}
        </div>
      ) : null}
      <DataGrid
        className="datagrid"
        rows={list}
        columns={columns.concat(actionColumn)}
        rowsPerPageOptions={[9]}
        checkboxSelection
        getRowId={(row) => row._id}
        loading={loading}
      />
    </div>
  );
};

export default Datatable;
