import apiClient from './client'

export const authAPI = {
  login: (phone, password) =>
    apiClient.post('/auth/login/', { phone, password }),

  logout: (refreshToken) =>
    apiClient.post('/auth/logout/', { refresh: refreshToken }),

  refreshToken: (refresh) =>
    apiClient.post('/auth/refresh/', { refresh }),

  getMe: () =>
    apiClient.get('/auth/me/'),

  updateMe: (data) =>
    apiClient.patch('/auth/me/', data),

  changePassword: (data) =>
    apiClient.post('/auth/change-password/', data),
}

export const usersAPI = {
  getUsers: (params) => apiClient.get('/auth/users/', { params }),
  createUser: (data) => apiClient.post('/auth/users/', data),
  updateUser: (id, data) => apiClient.patch(`/auth/users/${id}/`, data),
  deactivateUser: (id) => apiClient.post(`/auth/users/${id}/deactivate/`),
  getUserRoles: (id) => apiClient.get(`/auth/users/${id}/roles/`),
  assignRole: (id, data) => apiClient.post(`/auth/users/${id}/roles/`, data),
  getRoles: () => apiClient.get('/auth/roles/'),
  getAuditLogs: (params) => apiClient.get('/auth/audit-logs/', { params }),
}
