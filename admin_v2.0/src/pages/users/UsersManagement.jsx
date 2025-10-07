import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteResource, fetchCollection } from "../../api/services.js";

const ROLE_GROUPS = [
  {
    key: "superAdmin",
    label: "Super Admins",
    description: "Full control over platform access and settings.",
  },
  {
    key: "isAdmin",
    label: "Admins",
    description: "Can manage bookings, transactions, and inventory.",
  },
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
      setToast({ type: "success", message: `${username || "User"} deleted successfully.`, role: resolveRoleKey(user) });
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

      if (!matchesRole) return false;
      if (!term) return true;

      const composite = `${user.username || ""} ${user.email || ""} ${user.city || ""}`.toLowerCase();
      return composite.includes(term);
    });
  }, [users, search, roleFilter]);

  const groupedUsers = useMemo(() => {
    const base = { superAdmin: [], isAdmin: [], member: [] };
    filteredUsers.forEach((user) => {
      if (user.superAdmin) base.superAdmin.push(user);
      else if (user.isAdmin) base.isAdmin.push(user);
      else base.member.push(user);
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
    <div className="space-y-8">
      <header className="rounded-2xl border border-border bg-surface p-8 shadow-soft dark:border-dark-border dark:bg-dark-surface">
        <h1 className="text-3xl font-semibold text-text-primary dark:text-dark-text-primary">User access control</h1>
        <p className="mt-2 text-sm text-text-muted dark:text-dark-text-muted">
          Review, filter, and manage accounts by role. Open any user to adjust permissions or reset credentials.
        </p>
      </header>

      {toast?.type === "error" && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger" role="status">
          {toast.message}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map(({ key, label, value }) => (
          <article key={key} className="rounded-2xl border border-border bg-surface px-6 py-5 text-sm shadow-soft dark:border-dark-border dark:bg-dark-surface">
            <span className="block text-2xl font-semibold text-text-primary dark:text-dark-text-primary">
              {value}
            </span>
            <span className="block text-text-muted dark:text-dark-text-muted">{label}</span>
          </article>
        ))}
      </section>

      <div className="flex flex-wrap gap-4 rounded-2xl border border-border bg-surface p-6 text-sm shadow-soft dark:border-dark-border dark:bg-dark-surface">
        <label className="flex flex-1 min-w-[240px] flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
            Search
          </span>
          <input
            id="users-search"
            type="search"
            placeholder="Search by name, email, or city"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
          />
        </label>
        <label className="flex w-48 flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-dark-text-muted">
            Role
          </span>
          <select
            id="users-filter"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
          >
            <option value="all">All roles</option>
            <option value="superAdmin">Super admin</option>
            <option value="isAdmin">Admin</option>
            <option value="member">Member</option>
          </select>
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger" role="status">
          {error}
        </div>
      )}
      {loading && !users.length && (
        <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-text-muted dark:border-dark-border/60 dark:bg-dark-background/60 dark:text-dark-text-muted">
          Loading users…
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {ROLE_GROUPS.map(({ key, label, description }) => {
          const list = groupedUsers[key];
          const isEmpty = !list || list.length === 0;

          return (
            <section key={key} className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">{label}</h2>
                  <p className="text-sm text-text-muted dark:text-dark-text-muted">{description}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20">
                  {list?.length || 0}
                </span>
              </header>

              {toast?.type === "success" && toast.role === key && (
                <div className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success" role="status">
                  {toast.message}
                </div>
              )}

              {isEmpty ? (
                <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-text-muted dark:border-dark-border/60 dark:bg-dark-background/60 dark:text-dark-text-muted">
                  {hasResults ? "No users match the current filters." : "No users available in this category yet."}
                </div>
              ) : (
                <ul className="space-y-3">
                  {list.map((user) => (
                    <li
                      key={user._id}
                      className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm shadow-soft transition hover:border-primary/40 hover:shadow-medium dark:border-dark-border/60 dark:bg-dark-background/70"
                    >
                      <div className="flex w-full flex-wrap items-center gap-4">
                        <div className="flex min-w-[200px] flex-1 items-center gap-3">
                          <img
                            src={user.img || "https://i.ibb.co/MBtjqXQ/no-avatar.gif"}
                            alt={user.username || user.email || "profile"}
                            className="h-12 w-12 flex-none rounded-full border border-border/70 object-cover dark:border-dark-border/70"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                              {user.username || user.email || "Unnamed user"}
                            </p>
                            <p className="truncate text-xs text-text-muted dark:text-dark-text-muted">
                              {user.email || "No email"}
                            </p>
                          </div>
                        </div>

                        <div className="flex min-w-[200px] flex-1 flex-wrap items-center gap-2 text-xs text-text-muted dark:text-dark-text-muted">
                          {user.country && (
                            <span className="rounded-full bg-primary/5 px-3 py-1 font-medium uppercase tracking-[0.15em] text-primary dark:bg-primary/15 dark:text-primary">
                              {user.country}
                            </span>
                          )}
                          {user.city && (
                            <span className="rounded-full bg-surface px-3 py-1 font-medium text-text-secondary dark:bg-dark-surface/60 dark:text-dark-text-secondary">
                              {user.city}
                            </span>
                          )}
                          {user.phone && (
                            <span className="rounded-full bg-surface px-3 py-1 font-medium text-text-secondary dark:bg-dark-surface/60 dark:text-dark-text-secondary">
                              {user.phone}
                            </span>
                          )}
                        </div>

                        <div className="flex min-w-[180px] flex-shrink-0 items-center gap-2 sm:justify-end">
                          <Link
                            to={`/users/${user._id}`}
                            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-dark"
                          >
                            Manage
                          </Link>
                          <button
                            type="button"
                            className="rounded-lg border border-danger px-4 py-2 text-xs font-semibold text-danger transition hover:bg-danger/10"
                            onClick={() => handleDeleteUser(user)}
                          >
                            Delete
                          </button>
                        </div>
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
  );
};

export default UsersManagement;
