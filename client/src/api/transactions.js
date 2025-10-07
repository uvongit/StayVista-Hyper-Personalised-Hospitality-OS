import apiClient from "./client";

const withData = (promise) => promise.then((response) => response.data);

export const getTransactions = (params) =>
  withData(apiClient.get("/transactions", { params }));

export const createCheckoutTransaction = (payload) =>
  withData(apiClient.post("/transactions/pay", payload));

export const getTransactionById = (id) =>
  withData(apiClient.get(`/transactions/${id}`));
