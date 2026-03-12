import axios from 'axios'
import api from './axios'

// Public endpoint — no auth required
export const getAgents = () =>
  axios.get(`${import.meta.env.VITE_API_URL}/api/agents`)

export const getAgentById = (id) =>
  api.get(`/api/agents/${id}`)
