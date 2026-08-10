import api from "./api";

// Inventory (approved items) — visible to both roles
export const getInventory = async (params = {}) => {
  const { data } = await api.get("/materials", { params });
  return data;
};

export const getMaterialById = async (id) => {
  const { data } = await api.get(`/materials/${id}`);
  return data;
};

// Store keeper's own requests (any status)
export const getMyRequests = async (params = {}) => {
  const { data } = await api.get("/materials/mine", { params });
  return data;
};

export const createMaterial = async (payload) => {
  const { data } = await api.post("/materials", payload);
  return data;
};

export const updateMaterial = async (id, payload) => {
  const { data } = await api.put(`/materials/${id}`, payload);
  return data;
};

export const deleteMaterial = async (id) => {
  const { data } = await api.delete(`/materials/${id}`);
  return data;
};

export const getStoreKeeperStats = async () => {
  const { data } = await api.get("/materials/stats/storekeeper");
  return data;
};

export const getManagerStats = async () => {
  const { data } = await api.get("/materials/stats/manager");
  return data;
};

// Approvals (manager only)
export const getPendingRequests = async (params = {}) => {
  const { data } = await api.get("/approvals", { params });
  return data;
};

export const getApprovalHistory = async (params = {}) => {
  const { data } = await api.get("/approvals/history", { params });
  return data;
};

export const updatePendingApprovalRequest = async (id, payload) => {
  const { data } = await api.put(`/approvals/${id}`, payload);
  return data;
};

export const approveRequest = async (id) => {
  const { data } = await api.put(`/approvals/${id}/approve`);
  return data;
};

export const rejectRequest = async (id, reason) => {
  const { data } = await api.put(`/approvals/${id}/reject`, { reason });
  return data;
};
