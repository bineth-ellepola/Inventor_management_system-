import React from "react";

const STYLES = {
  Pending: "stamp-pending",
  Approved: "stamp-approved",
  Rejected: "stamp-rejected",
};

const StatusStamp = ({ status }) => {
  return <span className={`stamp ${STYLES[status] || "stamp-pending"}`}>{status}</span>;
};

export default StatusStamp;
