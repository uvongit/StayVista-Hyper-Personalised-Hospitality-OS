import apiClient from "./client.js";

export const fetchCollection = async (resource, config = {}) => {
  const response = await apiClient.get(`/${resource}`, config);
  return response.data;
};

export const fetchAnalyticsSummary = async () => {
  const response = await apiClient.get("/analytics/summary");
  return response.data;
};

export const fetchBookings = async (params = {}) => {
  const response = await apiClient.get("/bookings", { params });
  return response.data;
};

export const updateBookingStatus = async (bookingId, status) => {
  const response = await apiClient.put(`/bookings/${bookingId}/status`, { status });
  return response.data;
};

export const fetchTransactions = async (params = {}) => {
  const response = await apiClient.get("/transactions", { params });
  return response.data;
};

export const fetchLogs = async (params = {}) => {
  const response = await apiClient.get("/logs", { params });
  return response.data;
};

const deletePathBuilders = {
  rooms: async (id) => `/rooms/${id}`,
  users: async (id) => `/users/${id}`,
};

export const deleteResource = async (resource, id) => {
  const builder = deletePathBuilders[resource];
  const path = builder ? await builder(id) : `/${resource}/${id}`;
  await apiClient.delete(path);
};

export const login = async (credentials) => {
  const payload = {
    ...credentials,
    scope: "admin",
  };
  const response = await apiClient.post("/auth/login", payload);
  return response.data;
};

export const registerUser = async (payload) => {
  const response = await apiClient.post("/auth/register", {
    ...payload,
    scope: "admin",
  });
  return response.data;
};

const resourcePathBuilders = {
  hotels: (id) => `/hotels/find/${id}`,
};

const buildResourcePath = (resource, id) => {
  const builder = resourcePathBuilders[resource];
  if (builder) {
    return builder(id);
  }
  return `/${resource}/${id}`;
};

export const fetchResourceById = async (resource, id, config = {}) => {
  const response = await apiClient.get(buildResourcePath(resource, id), config);
  return response.data;
};

export const createHotel = async (payload) => {
  const response = await apiClient.post("/hotels", payload);
  return response.data;
};

export const updateHotel = async (hotelId, payload) => {
  const response = await apiClient.put(`/hotels/${hotelId}`, payload);
  return response.data;
};

export const createRoom = async (hotelId, payload) => {
  const response = await apiClient.post(`/rooms/${hotelId}`, payload);
  return response.data;
};

export const updateRoom = async (roomId, payload) => {
  const response = await apiClient.put(`/rooms/${roomId}`, payload);
  return response.data;
};

export const fetchAvatarOptions = async () => {
  const response = await apiClient.get("/users/assets/avatars");
  return response.data?.avatars || [];
};

export const updateUserAvatar = async (userId, img) => {
  const response = await apiClient.put(`/users/${userId}/avatar`, { img });
  return response.data;
};

export const uploadHotelImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiClient.post("/upload/hotels", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data?.url;
};

export const uploadRoomImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiClient.post("/upload/rooms", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data?.url;
};

export const updateUser = async (userId, payload) => {
  const response = await apiClient.put(`/users/${userId}`, payload);
  return response.data;
};

export const resetUserPassword = async (userId, newPassword) => {
  const response = await apiClient.post(`/users/${userId}/reset-password`, {
    newPassword,
  });
  return response.data;
};
