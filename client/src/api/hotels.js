import apiClient from "./client";

const extractData = (response) => response.data;

export const getHotelCountsByCity = (cities) => {
  const citiesParam = Array.isArray(cities) ? cities.join(",") : cities;
  return apiClient
    .get("/hotels/countByCity", { params: { cities: citiesParam } })
    .then(extractData);
};

export const getHotelCountsByType = () =>
  apiClient.get("/hotels/countByType").then(extractData);

export const getFeaturedHotels = (limit) => {
  const params = { featured: true };
  if (typeof limit === "number") {
    params.limit = limit;
  }

  return apiClient.get("/hotels", { params }).then(extractData);
};

export const getHotels = ({ city, min, max, limit, featured } = {}) => {
  const params = {};
  if (city) params.city = city;
  if (typeof min === "number") params.min = min;
  if (typeof max === "number") params.max = max;
  if (limit) params.limit = limit;
  if (typeof featured !== "undefined") params.featured = featured;

  return apiClient.get("/hotels", { params }).then(extractData);
};

export const getHotelById = (id) =>
  apiClient.get(`/hotels/find/${id}`).then(extractData);

export const getHotelRooms = (hotelId, params = {}) =>
  apiClient.get(`/hotels/room/${hotelId}`, { params }).then(extractData);

export const updateRoomAvailability = (roomId, payload) =>
  apiClient.put(`/rooms/availability/${roomId}`, payload).then(extractData);

export const updateHotel = (id, payload) =>
  apiClient.put(`/hotels/${id}`, payload).then(extractData);

export const uploadHotelImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return apiClient
    .post("/upload/hotels", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(extractData);
};
