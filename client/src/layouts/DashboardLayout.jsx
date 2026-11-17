import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuPackage,
  LuClipboardCheck,
  LuLogOut,
  LuBoxes,
} from "react-icons/lu";
import { useAuth } from "../context/AuthContext";

const DashboardLayout = ({ children, title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const storeKeeperLinks = [
    { to: "/storekeeper", label: "Dashboard", icon: LuLayoutDashboard, end: true },
    { to: "/storekeeper/requests", label: "My Requests", icon: LuClipboardCheck },
    { to: "/inventory", label: "Inventory", icon: LuBoxes },
  ];

  const managerLinks = [
    { to: "/manager", label: "Dashboard", icon: LuLayoutDashboard, end: true },
    { to: "/manager/approvals", label: "Approvals", icon: LuClipboardCheck },
    { to: "/manager/stock-history", label: "Stock History", icon: LuClipboardCheck },
    { to: "/inventory", label: "Inventory", icon: LuBoxes },
  ];

  const links = user?.role === "manager" ? managerLinks : storeKeeperLinks;

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-64 bg-graphite-900 text-paper flex flex-col shrink-0">
        <div className="px-6 py-6 border-b border-white/10">
          <p className="font-display text-xl tracking-wide text-amber">NIMS</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/50 mt-1">
            NANCE Inventory
          </p>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber/15 text-amber"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">
              {user?.role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white/70 hover:bg-white/5 hover:text-rejected transition-colors"
          >
            <LuLogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="px-8 pt-8 pb-4">
          <h1 className="font-display text-2xl font-semibold text-graphite-900">{title}</h1>
          {subtitle && <p className="text-graphite-600 text-sm mt-1">{subtitle}</p>}
        </header>
        <div className="px-8 pb-12">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
