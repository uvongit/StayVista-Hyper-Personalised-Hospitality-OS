import Datatable from "../../components/datatable/Datatable.jsx";

const List = ({ columns }) => {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted dark:text-dark-text-muted">
            Data · Inventory
          </span>
          <h1 className="text-3xl font-semibold text-text-primary dark:text-dark-text-primary">Directory</h1>
          <p className="max-w-2xl text-sm text-text-muted dark:text-dark-text-muted">
            Manage records, inspect details, and keep the dataset fresh across hotels, rooms, and users.
          </p>
        </div>
      </header>

      <Datatable columns={columns} />
    </div>
  );
};

export default List;
