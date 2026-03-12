import api from "./api";

export const getChallenges = () => api.get("/api/challenges").then((r) => r.data);

export const getActiveChallenges = () =>
  api.get("/api/challenges/active").then((r) => r.data);

export const getStats = () => api.get("/api/challenges/stats").then((r) => r.data);

export const getSuggestion = () => api.get("/api/challenges/suggest").then((r) => r.data);

export const createChallenge = (payload) =>
  api.post("/api/challenges", payload).then((r) => r.data);

export const updateChallenge = (id, payload) =>
  api.put(`/api/challenges/${id}`, payload).then((r) => r.data);

export const deleteChallenge = (id) =>
  api.delete(`/api/challenges/${id}`).then((r) => r.data);
