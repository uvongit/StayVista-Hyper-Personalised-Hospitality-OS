import apiClient from "./client";

const withData = (promise) => promise.then((response) => response.data);

export const createRoom = (hotelId, payload) =>
  withData(apiClient.post(`/rooms/${hotelId}`, payload));

export const getRooms = (params) => withData(apiClient.get("/rooms", { params }));

export const getRoomById = (roomId) => withData(apiClient.get(`/rooms/${roomId}`));

export const updateRoom = (roomId, payload) => withData(apiClient.put(`/rooms/${roomId}`, payload));

export const deleteRoom = (roomId) => withData(apiClient.delete(`/rooms/${roomId}`));

export const uploadRoomImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);

  return apiClient
    .post("/upload/rooms", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((response) => response.data?.url || response.data?.secure_url || response.data);
};

export const updateRoomAvailability = (roomNumberId, payload) =>
  withData(apiClient.put(`/rooms/availability/${roomNumberId}`, payload));
