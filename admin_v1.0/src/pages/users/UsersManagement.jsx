import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import { deleteResource, fetchCollection } from "../../api/services";
import { Link } from "react-router-dom";
import "./usersManagement.scss";

const ROLE_GROUPS = [
  { key: "superAdmin", label: "Super Admins", description: "Full control over platform access and settings." },
  { key: "isAdmin", label: "Admins", description: "Can manage bookings, transactions, and inventory." },
  { key: "member", label: "Members", description: "Standard users booking their stays." },
];

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetchCollection("users");
        setUsers(Array.isArray(response) ? response : []);
        setToast(null);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const resolveRoleKey = (user) => {
    if (user?.superAdmin) return "superAdmin";
    if (user?.isAdmin) return "isAdmin";
    return "member";
  };

  const handleDeleteUser = async (user) => {
    const username = user?.username;
    const confirmed = window.confirm(`Delete ${username || "this user"}?`);
    if (!confirmed) return;

    try {
      await deleteResource("users", user._id);
      setUsers((prev) => prev.filter((item) => item._id !== user._id));
      setToast({
        type: "success",
        message: `${username || "User"} deleted successfully.`,
        role: resolveRoleKey(user),
      });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to delete user.";
      setToast({ type: "error", message });
    }
  };

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "superAdmin" && user.superAdmin) ||
        (roleFilter === "isAdmin" && user.isAdmin && !user.superAdmin) ||
        (roleFilter === "member" && !user.isAdmin && !user.superAdmin);

      if (!matchesRole) {
        return false;
      }

      if (!term) {
        return true;
      }

      const composite = `${user.username || ""} ${user.email || ""} ${user.city || ""}`.toLowerCase();
      return composite.includes(term);
    });
  }, [users, search, roleFilter]);

  const groupedUsers = useMemo(() => {
    const base = {
      superAdmin: [],
      isAdmin: [],
      member: [],
    };

    filteredUsers.forEach((user) => {
      if (user.superAdmin) {
        base.superAdmin.push(user);
      } else if (user.isAdmin) {
        base.isAdmin.push(user);
      } else {
        base.member.push(user);
      }
    });

    return base;
  }, [filteredUsers]);

  const summaryStats = useMemo(() => {
    const total = users.length;
    const superAdmins = users.filter((user) => user.superAdmin).length;
    const admins = users.filter((user) => user.isAdmin && !user.superAdmin).length;
    const members = total - superAdmins - admins;

    return [
      { key: "total", label: "Total users", value: total },
      { key: "superAdmin", label: "Super admins", value: superAdmins },
      { key: "admin", label: "Admins", value: admins },
      { key: "member", label: "Members", value: members },
    ];
  }, [users]);

  const hasResults = filteredUsers.length > 0;

  return (
    <div className="usersManagement">
      <Sidebar />
      <div className="usersManagement__container">
        <Navbar />
        <header className="usersManagement__header">
          <div>
            <h1>User access control</h1>
            <p>Review, filter, and manage accounts by role. Open any user to adjust permissions or reset credentials.</p>
          </div>
        </header>

        {toast?.type === "error" ? (
          <div className={`usersManagement__toast usersManagement__toast--error`} role="status">
            {toast.message}
          </div>
        ) : null}

        <section className="usersManagement__summary">
          {summaryStats.map(({ key, label, value }) => (
            <article key={key} className="usersManagement__summaryCard">
              <span className="usersManagement__summaryValue">{value}</span>
              <span className="usersManagement__summaryLabel">{label}</span>
            </article>
          ))}
        </section>

        <div className="usersManagement__toolbar">
          <div className="usersManagement__search">
            <label htmlFor="users-search">Search</label>
            <input
              id="users-search"
              type="search"
              placeholder="Search by name, email, or city"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="usersManagement__filter">
            <label htmlFor="users-filter">Role</label>
            <select
              id="users-filter"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="all">All roles</option>
              <option value="superAdmin">Super admin</option>
              <option value="isAdmin">Admin</option>
              <option value="member">Member</option>
            </select>
          </div>
        </div>

        {error && <div className="usersManagement__error">{error}</div>}
        {loading && !users.length && <div className="usersManagement__loading">Loading users…</div>}

        <div className="usersManagement__grid">
          {ROLE_GROUPS.map(({ key, label, description }) => {
            const list = groupedUsers[key];
            const isFilteredEmpty = !list || list.length === 0;

            return (
              <section className="usersManagement__section" key={key}>
                <header className="usersManagement__sectionHeader">
                  <div>
                    <h2>{label}</h2>
                    <p>{description}</p>
                  </div>
                  <span className="usersManagement__badge">{list?.length || 0}</span>
                </header>

                {toast?.type === "success" && toast.role === key ? (
                  <div className="usersManagement__toast usersManagement__toast--success" role="status">
                    {toast.message}
                  </div>
                ) : null}

                {isFilteredEmpty ? (
                  <div className="usersManagement__empty">
                    {hasResults
                      ? "No users match the current filters."
                      : "No users available in this category yet."}
                  </div>
                ) : (
                  <ul className="usersManagement__list">
                    {list.map((user) => (
                      <li key={user._id} className="usersManagement__item">
                        <div className="usersManagement__identity">
                          <img
                            src={user.img || "https://i.ibb.co/MBtjqXQ/no-avatar.gif"}
                            alt={user.username}
                            className="usersManagement__avatar"
                          />
                          <div>
                            <div className="usersManagement__name">{user.username}</div>
                            <div className="usersManagement__email">{user.email}</div>
                          </div>
                        </div>
                        <div className="usersManagement__meta">
                          <span>{user.country}</span>
                          <span>{user.city}</span>
                          <span>{user.phone}</span>
                        </div>
                        <div className="usersManagement__actions">
                          <Link to={`/users/${user._id}`} className="usersManagement__link">
                            Manage
                          </Link>
                          <button
                            type="button"
                            className="usersManagement__delete"
                            onClick={() => handleDeleteUser(user)}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;
