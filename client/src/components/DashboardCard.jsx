import React from "react";

const DashboardCard = ({ label, value, icon: Icon, accent = "amber" }) => {
  const accentClasses = {
    amber: "text-amber border-amber/30",
    approved: "text-approved border-approved/30",
    rejected: "text-rejected border-rejected/30",
    slateblue: "text-slateblue border-slateblue/30",
  };

  return (
    <div className="bg-white border border-graphite-900/10 rounded-md p-5 flex items-center justify-between shadow-sm">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-graphite-600 mb-1">
          {label}
        </p>
        <p className="font-display text-3xl font-semibold text-graphite-900">{value}</p>
      </div>
      {Icon && (
        <div
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center ${accentClasses[accent]}`}
        >
          <Icon size={20} />
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
