// API Service Layer for Hostello HMS Frontend
// This file contains all API calls to the backend

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper function to get auth headers
const sanitizeToken = (token) => {
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  return token;
};

const getAuthHeaders = () => {
  const token = sanitizeToken(localStorage.getItem('accessToken'));
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Axios instance
const axiosClient = axios.create({ baseURL: API_BASE_URL });

// Attach Authorization header automatically
axiosClient.interceptors.request.use((config) => {
  const token = sanitizeToken(localStorage.getItem('accessToken'));
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Default JSON if not sending FormData
  if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

const handleAxios = async (promise) => {
  try {
    const res = await promise;
    return res?.data ?? null;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const message = (data && (data.message || data.error)) || err.message || 'Request failed';
    const error = new Error(message);
    error.status = status;
    error.body = data;
    throw error;
  }
};

// ==================== AUTHENTICATION APIs ====================

export const authAPI = {
  // Login user
  login: async (credentials) => {
    // Backend expects userId (not username) based on UserLoginDTO
    const loginData = {
      userId: credentials.username || credentials.userId,
      password: credentials.password
    };
    
    return handleAxios(axiosClient.post('/auth/login', loginData));
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    return handleAxios(axiosClient.post('/auth/refreshToken', { refreshToken }));
  },

  // Get user profile
  // Get user profile
  getProfile: async () => {
    return handleAxios(axiosClient.get('/auth/login/profile'));
  },


  // Logout
  logout: async (role) => {
    const endpoint = role === 'ADMIN' ? '/auth/login/admin/logout' : 
                     role === 'RECTOR' ? '/auth/login/rector/logout' : 
                     '/auth/login/student/logout';
    return handleAxios(axiosClient.post(endpoint));
  },

  // Request OTP for password reset
  requestOTP: async (role) => {
    const endpoint = role === 'ADMIN' ? '/auth/login/admin/requestotp' : '/auth/login/rector/request-otp';
    return handleAxios(axiosClient.post(endpoint));
  },

  // Reset password with OTP
  resetPassword: async (otpData, role) => {
    const endpoint = role === 'ADMIN' ? '/auth/login/admin/resetpassword' : '/auth/login/rector/reset-password';
    return handleAxios(axiosClient.post(endpoint, otpData));
  }
};

// ==================== ROOT ADMIN APIs ====================

export const rootAdminAPI = {
  // Check if root admin exists
  checkExists: async () => {
    return handleAxios(axiosClient.get('/admin/exists'));
  },

  // Register root admin
  register: async (adminData) => {
    return handleAxios(axiosClient.post('/admin/register-root', adminData));
  }
};

// ==================== ADMIN APIs ====================

export const adminAPI = {
  // Add user
  addUser: async (userData) => {
    return handleAxios(axiosClient.post('/auth/login/admin/adduser', userData));
  },

  // Search user by ID
  searchUser: async (userId) => {
    return handleAxios(axiosClient.post('/auth/login/admin/searchUsers', { userId }));
  },

  // List all users
  listUsers: async () => {
    return handleAxios(axiosClient.get('/auth/login/admin/listUsers'));
  },

  // Send notification
  sendNotification: async (notificationData) => {
    return handleAxios(axiosClient.post('/auth/login/admin/notifications/send', notificationData));
  },

  // Filter notifications
  filterNotifications: async (filterData) => {
    return handleAxios(axiosClient.post('/auth/login/admin/notifications/filter', filterData));
  }
};

// Admin - Student Login Management
export const adminLoginAPI = {
  createStudentLogin: async (payload) => {
    return handleAxios(axiosClient.post('/auth/login/admin/createStudentLogin', payload));
  },
  deleteUserByPrn: async (prn) => {
    return handleAxios(axiosClient.delete('/auth/login/admin/deleteUserByPrn', { params: { prn } }));
  },
  deleteUser: async (userId) => {
    return handleAxios(
      axiosClient.delete('/auth/login/admin/deleteUser', { params: { userId } })
    );
  },
};

// ==================== STUDENT APIs ====================

export const studentAPI = {
  // Register student
  register: async (studentData) => {
    return handleAxios(axiosClient.post('/auth/login/admin/students/register', studentData));
  },

  // Get student profile (for student users)
  // inside studentAPI
  getProfile: async () => {
    return handleAxios(axiosClient.get(`/auth/login/student/profile`));
  },

  // Search student by PRN
  searchByPRN: async (prn) => {
    return handleAxios(axiosClient.post('/auth/login/admin/students/search', { prn }));
  },

  // List all students
  listAll: async () => {
    return handleAxios(axiosClient.get('/auth/login/admin/students/list'));
  },

  // Update student
  update: async (studentData) => {
    return handleAxios(axiosClient.put('/auth/login/admin/students/update', studentData));
  },

  // Delete student
  delete: async (prn) => {
    return handleAxios(axiosClient.post('/auth/login/admin/students/delete', { prn }));
  },

  // Generate student report
  generateReport: async (prn) => {
    return handleAxios(axiosClient.post('/auth/login/admin/students/generateReport', { prn }));
  },

  // Search student by name
  searchByName: async (firstName) => {
    return handleAxios(axiosClient.post('/auth/login/admin/students/searchByName', { firstName }));
  },

  // Filter students
  filter: async (filterData) => {
    return handleAxios(axiosClient.post('/auth/login/admin/students/filter', filterData));
  },

  // Upload documents
  uploadDocuments: async (prn, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('student', JSON.stringify({ prn }));
    return handleAxios(axiosClient.post('/auth/login/admin/students/uploadDocuments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }));
  },

  // Download document
  downloadDocument: async (docId) => {
    const res = await axiosClient.post('/auth/login/admin/students/downloadDocument', { docId }, { responseType: 'blob' });
    return res.data;
  },

  // View documents
  viewDocuments: async (prn) => {
    return handleAxios(axiosClient.post('/auth/login/admin/students/documents', { prn }));
  },

  // View notifications
  viewNotifications: async (prn) => {
    return handleAxios(axiosClient.post('/auth/login/admin/students/notifications', { prn }));
  }
};

// ==================== RECTOR APIs ====================

export const rectorAPI = {
  // Exit student
  exitStudent: async (prn) => {
    return handleAxios(axiosClient.post('/auth/login/rector/exit-student', { prn }));
  },

  // Emergency exit student
  emergencyExitStudent: async (prn) => {
    return handleAxios(axiosClient.post('/auth/login/rector/emergency-exit-student', { prn }));
  },

  // Get daily report
  getDailyReport: async (date) => {
    return handleAxios(axiosClient.post('/auth/login/rector/daily-report', { date }));
  },

  // Send notification
  sendNotification: async (notificationData) => {
    return handleAxios(axiosClient.post('/auth/login/rector/send-notification', notificationData));
  },

  // View notifications
  viewNotifications: async (filterData = {}) => {
    return handleAxios(axiosClient.post('/auth/login/rector/view-notifications', filterData));
  }
};

// ==================== ROOM APIs ====================

export const roomAPI = {
  // Register room
  register: async (roomData) => {
    return handleAxios(axiosClient.post('/auth/login/rector/roomRegistration', roomData));
  },

  // Get all rooms
  getAll: async () => {
    return handleAxios(axiosClient.get('/auth/login/rector/roomList'));
  },

  // Allot room
  allotRoom: async (allotmentData) => {
    return handleAxios(axiosClient.post('/auth/login/rector/allotRoom', allotmentData));
  },

  // Deallocate room
  deallocateRoom: async (prn, roomId) => {
    return handleAxios(axiosClient.delete('/auth/login/rector/deallocateRoom', { params: { prn, roomId } }));
  },

  // View all allotments
  viewAllotments: async () => {
    return handleAxios(axiosClient.get('/auth/login/rector/viewAllotments'));
  },

  // Get room history
  getRoomHistory: async (prn) => {
    return handleAxios(axiosClient.get('/auth/login/rector/roomHistory', { params: { prn } }));
  },

  // Update room
  update: async (roomData) => {
    return handleAxios(axiosClient.put('/auth/login/rector/updateRoom', roomData));
  },

  // Get room occupancy
  getOccupancy: async () => {
    return handleAxios(axiosClient.get('/auth/login/rector/roomOccupancy'));
  },

  // Get available rooms
  getAvailable: async () => {
    return handleAxios(axiosClient.get('/auth/login/rector/viewRoomAvailability'));
  },

  // Get unallocated students
  getUnallocatedStudents: async () => {
    return handleAxios(axiosClient.post('/auth/login/rector/unallocatedStudents'));
  }
};

// ==================== ALLOTMENT APIs ====================

export const allotmentAPI = {
  // Process allotment registration
  register: async (allotmentData) => {
    return handleAxios(axiosClient.post('/auth/login/rector/allotmentRegistration', allotmentData));
  }
};

// ==================== ATTENDANCE APIs ====================

export const attendanceAPI = {
  // Mark attendance
  mark: async (attendanceData) => {
    return handleAxios(axiosClient.post('/auth/login/rector/attendance/mark', attendanceData));
  },

  // Get all attendance logs
  getAllLogs: async () => {
    return handleAxios(axiosClient.get('/auth/login/rector/attendanceLog'));
  },

  // Get attendance by student
  getByStudent: async (prn) => {
    return handleAxios(axiosClient.get('/auth/login/rector/attendanceLog/student', { params: { prn } }));
  },

  // Get daily summary
  getDailySummary: async (date) => {
    return handleAxios(axiosClient.get('/auth/login/rector/attendance/dailySummary', { params: { date } }));
  },

  // Get monthly summary
  getMonthlySummary: async (month, year) => {
    return handleAxios(axiosClient.get('/auth/login/rector/attendance/monthlySummary', { params: { month, year } }));
  },

  // Trigger scheduled notification
  triggerScheduledNotification: async () => {
    return handleAxios(axiosClient.post('/auth/login/rector/attendance/scheduledNotification'));
  }
};

// ==================== COMPLAINT APIs ====================

export const complaintAPI = {
  // Register complaint (for both Rector and Student)
  register: async (complaintData) => {
    // Determine endpoint based on user role
    const userRole = localStorage.getItem('userRole');
    const endpoint = userRole === 'STUDENT' 
      ? `${API_BASE_URL}/auth/login/student/complaintRegistration`
      : `${API_BASE_URL}/auth/login/rector/complaintRegistration`;
    return handleAxios(axiosClient.post(endpoint.replace(API_BASE_URL, ''), complaintData));
  },

  // Get all complaints
  getAll: async (userRole = 'RECTOR') => {
    // Use appropriate endpoint based on role
    const endpoint = userRole === 'STUDENT' 
      ? `${API_BASE_URL}/auth/login/student/complaints`
      : `${API_BASE_URL}/auth/login/rector/complaints`;
    return handleAxios(axiosClient.get(endpoint.replace(API_BASE_URL, '')));
  },

  // Update complaint status
  updateStatus: async (complaintId, status) => {
    return handleAxios(axiosClient.post('/auth/login/rector/complaints/updateStatus', null, { params: { complaintId, status } }));
  },

  // Delete complaint (rector only)
  delete: async (complaintId) => {
    return handleAxios(axiosClient.delete('/auth/login/rector/complaints/delete', { params: { complaintId } }));
  },

  // Attach files to complaint
  attachFiles: async (complaintId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return handleAxios(axiosClient.post('/auth/login/rector/complaints/attachFiles', formData, {
      params: { complaintId },
      headers: { 'Content-Type': 'multipart/form-data' }
    }));
  },

  // Get complaint summary
  getSummary: async (fromDate, toDate) => {
    return handleAxios(axiosClient.get('/auth/login/rector/complaints/summary', { params: { fromDate, toDate } }));
  }
};

// ==================== NOTIFICATION APIs ====================

export const notificationAPI = {
  // Send notification
  send: async (notificationData) => {
    return handleAxios(axiosClient.post('/login/notifications/send', notificationData));
  },

  // Send bulk notification
  sendBulk: async (bulkData) => {
    return handleAxios(axiosClient.post('/login/notifications/sendBulk', bulkData));
  },

  // View notifications by role
  viewByRole: async (role) => {
    return handleAxios(axiosClient.get('/login/notifications/view', { params: { role } }));
  },

  // Mark notification as read
  markRead: async (notificationId) => {
    return handleAxios(axiosClient.put('/login/notifications/readStatus', null, { params: { notificationId } }));
  },

  // Schedule notification
  schedule: async (scheduledData) => {
    return handleAxios(axiosClient.post('/login/notifications/scheduled', scheduledData));
  },
  
  // Delete notification
  delete: async (notificationId) => {
    return handleAxios(axiosClient.delete('/login/notifications/delete', { params: { notificationId } }));
  },
  
  // Delete multiple notifications
  deleteMultiple: async (notificationIds) => {
    return handleAxios(axiosClient.post('/login/notifications/deleteMultiple', notificationIds));
  }
};

// ==================== EMERGENCY APIs ====================

export const emergencyAPI = {
  // Notify rector
  notifyRector: async (emergencyData) => {
    return handleAxios(axiosClient.post('/login/emergency/notifyRector', emergencyData));
  },

  // Evacuate student
  evacuateStudent: async (prn) => {
    return handleAxios(axiosClient.post('/login/emergency/evacuateStudent', null, { params: { prn } }));
  },

  // View emergency logs
  viewLogs: async (fromDate, toDate) => {
    return handleAxios(axiosClient.get('/login/emergency/viewLogs', { params: { fromDate, toDate } }));
  }
};

// ==================== AUDIT APIs ====================

export const auditAPI = {
  // Get action logs
  getActionLogs: async (role, fromDate, toDate) => {
    return handleAxios(axiosClient.get('/login/audit/actionLogs', { params: { role, fromDate, toDate } }));
  },

  // Get login history
  getLoginHistory: async (username, fromDate, toDate) => {
    return handleAxios(axiosClient.get('/login/audit/loginHistory', { params: { username, fromDate, toDate } }));
  }
};

// Export all APIs as a single object for easier imports
export default {
  auth: authAPI,
  rootAdmin: rootAdminAPI,
  admin: adminAPI,
  adminLogin: adminLoginAPI,
  student: studentAPI,
  rector: rectorAPI,
  room: roomAPI,
  allotment: allotmentAPI,
  attendance: attendanceAPI,
  complaint: complaintAPI,
  notification: notificationAPI,
  emergency: emergencyAPI,
  audit: auditAPI
};



