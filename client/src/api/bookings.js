import apiClient from "./client";

const withData = (promise) => promise.then((response) => response.data);

export const createBooking = (payload) => withData(apiClient.post("/bookings", payload));

export const getBookings = (params) => withData(apiClient.get("/bookings", { params }));

export const getBookingById = (id) => withData(apiClient.get(`/bookings/${id}`));
