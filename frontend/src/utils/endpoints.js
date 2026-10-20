export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
  },
  DASHBOARD: {
    SUMMARY: "/dashboard",
  },
  ROOMS: {
    LIST: "/rooms",
    CREATE: "/rooms",
    UPDATE: (id) => `/rooms/${id}`,
    DELETE: (id) => `/rooms/${id}`,
  },
  INVENTORIES: {
    LIST: "/inventories",
    CREATE: "/inventories",
    UPDATE: (id) => `/inventories/${id}`,
    DELETE: (id) => `/inventories/${id}`,
  },
  INSPECTIONS: {
    LIST: "/inspections",
    CREATE: "/inspections",
    UPDATE: (id) => `/inspections/${id}`,
    DELETE: (id) => `/inspections/${id}`,
  },
  UTILITY_REPORTS: {
    LIST: "/utility-reports",
    CREATE: "/utility-reports",
    UPDATE: (id) => `/utility-reports/${id}`,
    DELETE: (id) => `/utility-reports/${id}`,
  },
  INCIDENTS: {
    LIST: "/incidents",
    CREATE: "/incidents",
    UPDATE: (id) => `/incidents/${id}`,
    DELETE: (id) => `/incidents/${id}`,
  },
  PERIODIC_REPORTS: {
    LIST: "/periodic-reports",
  },
  USERS: {
    LIST: "/users",
    CREATE: "/users",
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
  },
  SETTINGS: {
    GET: "/settings",
    UPDATE: "/settings",
  },
};

