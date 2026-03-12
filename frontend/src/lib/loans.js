import api from "./api";

export const getLoans = () => api.get("/api/loans").then((r) => r.data);

export const getLoanSummary = () => api.get("/api/loans/summary").then((r) => r.data);

export const createLoan = (payload) =>
  api.post("/api/loans", payload).then((r) => r.data);

export const markLoanAsPaid = (id) =>
  api.put(`/api/loans/${id}/pay`).then((r) => r.data);

export const deleteLoan = (id) =>
  api.delete(`/api/loans/${id}`).then((r) => r.data);
