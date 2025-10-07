import { useContext, useEffect, useState } from "react";
import Sidebar from "../sidebar/Sidebar.jsx";
import Navbar from "../navbar/Navbar.jsx";
import { DarkModeContext } from "../../context/darkModeContext.js";

const AdminLayout = ({ children }) => {
  const { darkMode } = useContext(DarkModeContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    return () => {
      root.classList.remove("dark");
    };
  }, [darkMode]);

  const handleSidebarToggle = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={`app ${darkMode ? "dark bg-dark-background text-dark-text-primary" : ""}`}>
      <div className="flex min-h-screen bg-background text-text-primary transition-colors duration-200 dark:bg-dark-background dark:text-dark-text-primary">
        <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

        <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
          <Navbar onToggleSidebar={handleSidebarToggle} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background px-4 py-6 sm:px-6 lg:px-8 dark:bg-dark-background">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
