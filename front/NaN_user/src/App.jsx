import { useState, useEffect } from "react";
import { 
  LogOut, Plus, Trash2, Edit2, Copy, Check, X, 
  Users, Calendar, Search, Menu, Clock, User
} from "lucide-react";

const API_BASE = "http://localhost:3000";

// API Service simplifié et sécurisé
const api = {
  register: async (data) => {
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      throw new Error("Erreur de connexion au serveur");
    }
  },

  login: async (data) => {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      throw new Error("Erreur de connexion au serveur");
    }
  },

  logout: async (token) => {
    try {
      const response = await fetch(`${API_BASE}/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      return await response.json();
    } catch (error) {
      console.error("Erreur logout:", error);
    }
  },

  createGroup: async (data, token) => {
    try {
      const response = await fetch(`${API_BASE}/group`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      throw new Error("Erreur de création de groupe");
    }
  },

  getGroups: async (token) => {
    try {
      const response = await fetch(`${API_BASE}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await response.json();
    } catch (error) {
      throw new Error("Erreur de chargement des groupes");
    }
  },

  joinGroup: async (code, token) => {
    try {
      const response = await fetch(`${API_BASE}/group/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ invitationCode: code }),
      });
      return await response.json();
    } catch (error) {
      throw new Error("Erreur de jointure au groupe");
    }
  },

  createTask: async (data, token) => {
    try {
      const response = await fetch(`${API_BASE}/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      throw new Error("Erreur de création de tâche");
    }
  },

  getGroupTasks: async (groupId, token) => {
    try {
      const response = await fetch(`${API_BASE}/group/${groupId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await response.json();
    } catch (error) {
      throw new Error("Erreur de chargement des tâches");
    }
  },

  updateTask: async (taskId, data, token) => {
    try {
      const response = await fetch(`${API_BASE}/task/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      throw new Error("Erreur de mise à jour de tâche");
    }
  },

  deleteTask: async (taskId, token) => {
    try {
      const response = await fetch(`${API_BASE}/task/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return await response.json();
    } catch (error) {
      throw new Error("Erreur de suppression de tâche");
    }
  },
};

// Styles CSS responsive améliorés
const styles = `
/* Reset et Base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #1a202c;
  background: #f5f7fa;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
}

/* Application Principale */
.task-manager-app {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* Header */
.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 0;
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.logo-icon {
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-icon svg {
  color: white;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-info {
  font-size: 0.875rem;
  color: #4a5568;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #4a5568;
  flex-shrink: 0;
}

.mobile-menu-btn:hover {
  background: #f7fafc;
}

.logout-btn {
  background: linear-gradient(135deg, #e53e3e 0%, #d53f8c 100%);
  color: white;
  border: none;
  padding: 0.625rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
}

/* Layout Principal */
.main-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
}

/* Sidebar */
.sidebar {
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(226, 232, 240, 0.8);
  height: fit-content;
  position: sticky;
  top: 100px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.sidebar.hidden {
  display: none;
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sidebar-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.btn {
  border: none;
  padding: 0.75rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  flex: 1;
  transition: all 0.2s ease;
  min-width: 0;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-success {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.btn-success:hover {
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.btn-secondary {
  background: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
}

/* Group List */
.group-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.group-item {
  background: white;
  padding: 1.25rem;
  border-radius: 0.75rem;
  border: 2px solid #f7fafc;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 0;
}

.group-item:hover {
  border-color: #90cdf4;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.group-item.active {
  background: linear-gradient(135deg, #ebf8ff 0%, #e6fffa 100%);
  border-color: #90cdf4;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
  min-width: 0;
}

.group-name {
  font-weight: 600;
  color: #1a202c;
  margin: 0;
  font-size: 1rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-count {
  font-size: 0.75rem;
  background: #f7fafc;
  color: #4a5568;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-weight: 600;
  flex-shrink: 0;
}

.group-description {
  font-size: 0.875rem;
  color: #4a5568;
  margin-bottom: 0.75rem;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.group-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 0;
}

.invitation-code {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  background: #edf2f7;
  color: #2d3748;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-btn {
  color: #4299e1;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.copy-btn:hover {
  background: #ebf8ff;
  color: #3182ce;
}

/* Main Content */
.main-content {
  flex: 1;
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.group-header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
  min-width: 0;
}

.group-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-subtitle {
  color: #4a5568;
  margin-top: 0.25rem;
  font-size: clamp(0.875rem, 2vw, 1.125rem);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Search and Filter */
.search-filter-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(226, 232, 240, 0.8);
  margin-bottom: 1.5rem;
  width: 100%;
  min-width: 0;
}

.search-filter-content {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
  min-width: 0;
}

.search-input-container {
  flex: 1;
  position: relative;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: white;
  min-width: 0;
}

.search-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.filter-select {
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  min-width: 150px;
  transition: all 0.2s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

/* Task Grid */
.task-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  width: 100%;
  min-width: 0;
}

/* Task Item */
.task-item {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  width: 100%;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  min-width: 0;
}

.task-item:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e0;
  transform: translateY(-2px);
}

.task-content {
  padding: 1.5rem;
  min-width: 0;
}

.task-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 0.75rem;
  min-width: 0;
}

.task-title {
  font-weight: 600;
  color: #1a202c;
  font-size: 1.125rem;
  margin: 0;
  line-height: 1.3;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  white-space: nowrap;
}

.status-pending {
  background: #fefcbf;
  color: #744210;
  border-color: #faf089;
}

.status-in-progress {
  background: #bee3f8;
  color: #1a365d;
  border-color: #90cdf4;
}

.status-completed {
  background: #c6f6d5;
  color: #22543d;
  border-color: #9ae6b4;
}

.task-description {
  color: #4a5568;
  font-size: 0.875rem;
  background: #f7fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  line-height: 1.5;
  border-left: 3px solid #4299e1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #718096;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  min-width: 0;
}

.task-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  min-width: 0;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-width: 0;
}

.status-btn {
  padding: 0.625rem 1.25rem;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.status-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 1;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.icon-btn {
  padding: 0.625rem;
  background: none;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-btn.edit {
  color: #4299e1;
  background: #ebf8ff;
}

.icon-btn.edit:hover {
  background: #bee3f8;
  color: #3182ce;
}

.icon-btn.delete {
  color: #e53e3e;
  background: #fed7d7;
}

.icon-btn.delete:hover {
  background: #feb2b2;
  color: #c53030;
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1rem;
  border: 2px dashed #cbd5e0;
  margin: 2rem 0;
  width: 100%;
  min-width: 0;
}

.empty-icon {
  color: #a0aec0;
  margin: 0 auto 1.5rem;
  width: 4rem;
  height: 4rem;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.75rem;
}

.empty-description {
  color: #718096;
  margin-bottom: 2rem;
  font-size: 1rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.5;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Loading */
.loading-container {
  text-align: center;
  padding: 3rem 1rem;
  width: 100%;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #4299e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #718096;
  font-size: 0.875rem;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  width: 100%;
  max-width: 28rem;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.2s ease;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
  min-width: 0;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.close-btn {
  padding: 0.5rem;
  background: #f7fafc;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #718096;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #edf2f7;
  color: #4a5568;
}

/* Form Styles */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: white;
  min-width: 0;
}

.form-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.input-with-icon {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.input-with-icon .form-input {
  padding-left: 3rem;
}

/* Style spécifique pour les inputs date désactivés */
.form-input:disabled {
  background-color: #f7fafc;
  color: #a0aec0;
  cursor: not-allowed;
  border-color: #e2e8f0;
}

.date-info {
  font-size: 0.75rem;
  color: #718096;
  margin-top: 0.25rem;
  font-style: italic;
}

.form-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  flex-wrap: wrap;
}

/* Notifications */
.notification {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  color: white;
  font-weight: 600;
  z-index: 1001;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 400px;
  animation: slideInRight 0.2s ease;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  min-width: 0;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.notification.success {
  background: #48bb78;
}

.notification.error {
  background: #e53e3e;
}

.notification.info {
  background: #4299e1;
}

.notification-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.notification-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Login Styles */
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  width: 100vw;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2.5rem;
  width: 100%;
  max-width: 28rem;
  margin: 0 auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-icon {
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.login-icon svg {
  color: white;
  width: 2rem;
  height: 2rem;
}

.login-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
}

.login-subtitle {
  color: #718096;
  margin: 0;
  font-size: 0.875rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.login-input-group {
  position: relative;
}

.login-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  color: #1a202c;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: white;
}

.login-input::placeholder {
  color: #a0aec0;
}

.login-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.login-input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
}

.login-error {
  background: #fed7d7;
  border: 1px solid #feb2b2;
  color: #c53030;
  padding: 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
}

.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.login-footer {
  text-align: center;
  margin-top: 2rem;
  color: #718096;
}

.login-switch {
  background: none;
  border: none;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  margin-left: 0.25rem;
  transition: color 0.2s ease;
}

.login-switch:hover {
  color: #5a67d8;
}

/* Media Queries Responsive */
@media (max-width: 1024px) {
  .main-container {
    gap: 1rem;
    padding: 0.75rem;
  }
  
  .sidebar {
    width: 280px;
  }
  
  .task-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: block;
  }
  
  .main-container {
    flex-direction: column;
    gap: 1rem;
    padding: 0.75rem;
  }
  
  .sidebar {
    width: 100%;
    position: static;
    margin-bottom: 0;
  }
  
  .sidebar.hidden {
    display: none;
  }
  
  .header-content {
    padding: 0 0.75rem;
  }
  
  .app-title {
    font-size: 1.25rem;
  }
  
  .logout-btn span {
    display: none;
  }
  
  .group-header-section {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .search-filter-content {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .search-input-container {
    min-width: auto;
  }
  
  .filter-select {
    min-width: auto;
    width: 100%;
  }
  
  .task-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .btn {
    width: 100%;
  }
  
  .notification {
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
  
  .task-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .edit-actions {
    justify-content: center;
  }
  
  .modal-content {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .login-card {
    padding: 2rem;
    margin: 1rem;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0 0.5rem;
  }
  
  .app-title {
    font-size: 1.125rem;
  }
  
  .logo-icon {
    width: 2rem;
    height: 2rem;
  }
  
  .logout-btn {
    padding: 0.5rem;
  }
  
  .main-container {
    padding: 0.5rem;
  }
  
  .sidebar-actions {
    flex-direction: column;
  }
  
  .group-item {
    padding: 1rem;
  }
  
  .task-content {
    padding: 1rem;
  }
  
  .empty-state {
    padding: 2rem 1rem;
  }
  
  .empty-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .empty-actions .btn {
    width: 100%;
  }
  
  .search-filter-container {
    padding: 1rem;
  }
  
  .modal-content {
    padding: 1.25rem;
    margin: 0.5rem;
  }
  
  .login-card {
    padding: 1.5rem;
  }
}

@media (max-width: 360px) {
  .header-content {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .logo-section {
    flex: 1 1 100%;
    justify-content: center;
    margin-bottom: 0.5rem;
  }
  
  .user-info {
    font-size: 0.75rem;
  }
  
  .group-title {
    font-size: 1.25rem;
  }
  
  .status-badge {
    font-size: 0.625rem;
    padding: 0.375rem 0.75rem;
  }
  
  .btn {
    font-size: 0.75rem;
    padding: 0.625rem;
  }
}
`;

// Composant de chargement
function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">Chargement...</p>
    </div>
  );
}

// Composant de notification
function Notification({ message, type = "info", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification ${type}`}>
      <Check size={20} />
      <span>{message}</span>
      <button className="notification-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}

// Composant Login
function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = isSignUp
        ? await api.register(form)
        : await api.login({ email: form.email, password: form.password });

      if (res.tokens) {
        onLogin(res.tokens, res.data);
      } else {
        setError(res.message || "Erreur lors de l'authentification");
      }
    } catch (err) {
      setError(err.message || "Erreur de connexion");
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <style>{styles}</style>
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <Users />
          </div>
          <h1 className="login-title">Gestion </h1>
          <p className="login-subtitle">
            {isSignUp ? "Créez votre compte" : "Connectez-vous à votre compte"}
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="login-input-group">
              <User className="login-input-icon" size={20} />
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="login-input"
                required
              />
            </div>
          )}
          
          <div className="login-input-group">
            <User className="login-input-icon" size={20} />
            <input
              type="email"
              placeholder="Adresse email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="login-input"
              required
            />
          </div>
          
          <div className="login-input-group">
            <User className="login-input-icon" size={20} />
            <input
              type="password"
              placeholder="Mot de passe"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="login-input"
              required
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login-btn"
          >
            {loading ? (
              "Chargement..."
            ) : isSignUp ? (
              "S'inscrire"
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isSignUp ? "Déjà un compte?" : "Pas de compte?"}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="login-switch"
            >
              {isSignUp ? "Se connecter" : "S'inscrire"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// Composants simplifiés pour éviter les erreurs
function GroupModal({ onClose, onCreate, token }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    setLoading(true);
    try {
      const res = await api.createGroup(form, token);
      if (res.data) {
        onCreate(res.data);
        onClose();
      }
    } catch (error) {
      console.error("Erreur création groupe:", error);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Créer un groupe</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nom du groupe</label>
            <input
              type="text"
              placeholder="Ex: Projet Marketing"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              placeholder="Décrivez l'objectif de ce groupe..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="form-input form-textarea"
              rows="3"
            />
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskModal({ group, onClose, onCreate, token }) {
  const [form, setForm] = useState({ title: "", description: "", deadline: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fonction pour obtenir la date du jour au format YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Le titre est requis");
      return;
    }

    // Validation de la date
    if (form.deadline) {
      const selectedDate = new Date(form.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer seulement les dates

      if (selectedDate < today) {
        setError("La date d'échéance ne peut pas être dans le passé");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const taskData = {
        title: form.title.trim(),
        description: form.description.trim(),
        groupId: group._id,
        deadline: form.deadline || null,
      };

      const res = await api.createTask(taskData, token);
      if (res.data) {
        onCreate(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Erreur lors de la création");
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Nouvelle tâche</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Titre</label>
            <input
              type="text"
              placeholder="Que faut-il faire ?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              placeholder="Détails de la tâche..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="form-input form-textarea"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date d'échéance</label>
            <div className="input-with-icon">
              <Calendar className="input-icon" size={20} />
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="form-input"
                min={getTodayDate()} // Empêche la sélection de dates passées
              />
            </div>
            <p className="date-info">
              La date d'échéance ne peut pas être antérieure à aujourd'hui
            </p>
          </div>

          {error && (
            <div style={{ 
              color: '#e53e3e', 
              marginBottom: '1rem', 
              fontSize: '0.875rem',
              padding: '0.75rem',
              backgroundColor: '#fed7d7',
              border: '1px solid #feb2b2',
              borderRadius: '0.5rem'
            }}>
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskItem({ task, onUpdate, onDelete, token }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description,
    status: task.status,
    deadline: task.deadline || ""
  });
  const [editError, setEditError] = useState("");

  // Fonction pour obtenir la date du jour au format YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStatusChange = async (status) => {
    try {
      const res = await api.updateTask(task._id, { status }, token);
      if (res.data) onUpdate(res.data);
    } catch (err) {
      console.error("Erreur mise à jour statut:", err);
    }
  };

  const handleSave = async () => {
    // Validation de la date
    if (editForm.deadline) {
      const selectedDate = new Date(editForm.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer seulement les dates

      if (selectedDate < today) {
        setEditError("La date d'échéance ne peut pas être dans le passé");
        return;
      }
    }

    setEditError("");
    
    try {
      const res = await api.updateTask(task._id, editForm, token);
      if (res.data) {
        onUpdate(res.data);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
    }
  };

  const statusLabels = {
    pending: "En attente",
    in_progress: "En cours",
    completed: "Terminé"
  };

  return (
    <div className="task-item">
      <div className="task-content">
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="form-input"
              placeholder="Titre"
              required
            />
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="form-input form-textarea"
              rows="2"
              placeholder="Description"
            />
            
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', display: 'block' }}>
                Date d'échéance
              </label>
              <div className="input-with-icon">
                <Calendar className="input-icon" size={20} />
                <input
                  type="date"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                  className="form-input"
                  min={getTodayDate()}
                />
              </div>
              <p className="date-info">
                La date d'échéance ne peut pas être antérieure à aujourd'hui
              </p>
            </div>

            {editError && (
              <div style={{ 
                color: '#e53e3e', 
                fontSize: '0.875rem',
                padding: '0.5rem',
                backgroundColor: '#fed7d7',
                border: '1px solid #feb2b2',
                borderRadius: '0.375rem'
              }}>
                {editError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1rem', flex: '1' }}
              >
                Enregistrer
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditError("");
                }}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', flex: '1' }}
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="task-header">
              <h3 className="task-title">{task.title}</h3>
              <div className={`status-badge status-${task.status}`}>
                {statusLabels[task.status]}
              </div>
            </div>
            
            {task.description && (
              <p className="task-description">{task.description}</p>
            )}
            
            {task.deadline && (
              <div className="task-meta">
                <Calendar size={14} />
                <span>Échéance: {new Date(task.deadline).toLocaleDateString()}</span>
              </div>
            )}

            <div className="task-actions">
              <div className="action-buttons">
                {task.status !== "completed" && (
                  <button
                    onClick={() => handleStatusChange(task.status === "pending" ? "in_progress" : "completed")}
                    className="status-btn"
                  >
                    {task.status === "pending" ? "Commencer" : "Terminer"}
                  </button>
                )}
              </div>
              
              <div className="edit-actions">
                <button
                  onClick={() => setIsEditing(true)}
                  className="icon-btn edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(task._id)}
                  className="icon-btn delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function JoinGroupModal({ onClose, onJoin, token }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.joinGroup(code, token);
      if (res.data) {
        onJoin();
        onClose();
      } else {
        setError(res.message || "Erreur");
      }
    } catch (err) {
      setError(err.message || "Erreur lors de la jointure");
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Rejoindre un groupe</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Code d'invitation</label>
            <input
              type="text"
              placeholder="Entrez le code d'invitation"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="form-input"
              required
            />
          </div>

          {error && (
            <div style={{ 
              color: '#e53e3e', 
              marginBottom: '1rem', 
              fontSize: '0.875rem',
              padding: '0.75rem',
              backgroundColor: '#fed7d7',
              border: '1px solid #feb2b2',
              borderRadius: '0.5rem'
            }}>
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Rejoindre..." : "Rejoindre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Composant Principal avec gestion d'erreurs
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
  };

  const handleLogin = async (tokens, userData) => {
    setToken(tokens.accessToken);
    setUser(userData);
    localStorage.setItem('token', tokens.accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    await loadGroups(tokens.accessToken);
    showNotification("Connexion réussie !", "success");
  };

  const loadGroups = async (tk) => {
    try {
      const res = await api.getGroups(tk);
      if (res.data) setGroups(res.data);
    } catch (err) {
      console.error("Erreur chargement groupes:", err);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setGroups([]);
    setTasks([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showNotification("Déconnexion réussie", "info");
  };

  const handleSelectGroup = async (group) => {
    setSelectedGroup(group);
    setLoading(true);
    try {
      const res = await api.getGroupTasks(group._id, token);
      if (res.data) {
        setTasks(Array.isArray(res.data) ? res.data : []);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Erreur chargement tâches:", err);
      setTasks([]);
    }
    setLoading(false);
    
    if (window.innerWidth <= 768) {
      setSidebarVisible(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    showNotification("Code copié !", "success");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreateGroup = async (group) => {
    setGroups([...groups, group]);
    showNotification("Groupe créé !", "success");
  };

  const handleJoinGroup = async () => {
    await loadGroups(token);
    showNotification("Groupe rejoint !", "success");
  };

  const handleCreateTask = async (task) => {
    setTasks([...tasks, task]);
    showNotification("Tâche créée !", "success");
  };

  const handleUpdateTask = (updated) => {
    setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.deleteTask(taskId, token);
      setTasks(tasks.filter((t) => t._id !== taskId));
      showNotification("Tâche supprimée !", "success");
    } catch (err) {
      console.error("Erreur suppression tâche:", err);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Récupération de la session au chargement
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      loadGroups(savedToken);
    }
  }, []);

  // Gestion responsive
  useEffect(() => {
    const handleResize = () => {
      setSidebarVisible(window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="task-manager-app">
      <style>{styles}</style>
      
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarVisible(!sidebarVisible)}
            >
              <Menu size={20} />
            </button>
            <div className="logo-icon">
              <Users size={24} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 className="app-title"> tache & groupe</h1>
              <p className="user-info">
                <User size={14} />
                {user?.username || user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            <LogOut size={20} /> <span>Déconnexion</span>
          </button>
        </div>
      </header>

      <div className="main-container">
        <aside className={`sidebar ${sidebarVisible ? '' : 'hidden'}`}>
          <h2 className="sidebar-title">
            <Users size={20} />
            Mes Groupes
          </h2>
          <div className="sidebar-actions">
            <button
              onClick={() => setShowGroupModal(true)}
              className="btn btn-primary"
            >
              <Plus size={18} /> Créer
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="btn btn-success"
            >
              Rejoindre
            </button>
          </div>

          <div className="group-list">
            {groups.map((group) => (
              <div
                key={group._id}
                onClick={() => handleSelectGroup(group)}
                className={`group-item ${selectedGroup?._id === group._id ? 'active' : ''}`}
              >
                <div className="group-header">
                  <h3 className="group-name">{group.name}</h3>
                  <span className="member-count">
                    {group.members?.length || 1} membre(s)
                  </span>
                </div>
                <p className="group-description">
                  {group.description}
                </p>
                <div className="group-footer">
                  <span className="invitation-code">
                    {group.invitationCode}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCode(group.invitationCode);
                    }}
                    className="copy-btn"
                  >
                    {copied === group.invitationCode ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="main-content">
          {selectedGroup ? (
            <div>
              <div className="group-header-section">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h2 className="group-title">{selectedGroup.name}</h2>
                  <p className="group-subtitle">{selectedGroup.description}</p>
                </div>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="btn btn-primary"
                >
                  <Plus size={20} /> Nouvelle tâche
                </button>
              </div>

              <div className="search-filter-container">
                <div className="search-filter-content">
                  <div className="search-input-container">
                    <Search className="search-icon" size={20} />
                    <input
                      type="text"
                      placeholder="Rechercher une tâche..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminé</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <LoadingSpinner />
              ) : filteredTasks.length === 0 ? (
                <div className="empty-state">
                  <Users className="empty-icon" size={48} />
                  <h3 className="empty-title">
                    {searchTerm || statusFilter !== "all" 
                      ? "Aucune tâche trouvée" 
                      : "Aucune tâche"}
                  </h3>
                  <p className="empty-description">
                    {searchTerm || statusFilter !== "all" 
                      ? "Modifiez vos critères de recherche" 
                      : "Créez votre première tâche"}
                  </p>
                  <div className="empty-actions">
                    <button
                      onClick={() => setShowTaskModal(true)}
                      className="btn btn-primary"
                    >
                      Créer une tâche
                    </button>
                  </div>
                </div>
              ) : (
                <div className="task-grid">
                  {filteredTasks.map((task) => (
                    <TaskItem
                      key={task._id}
                      task={task}
                      onUpdate={handleUpdateTask}
                      onDelete={handleDeleteTask}
                      token={token}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <Users className="empty-icon" size={48} />
              <h3 className="empty-title">Bienvenue sur la gestion des taches </h3>
              <p className="empty-description">
                Sélectionnez ou créez un groupe pour commencer
              </p>
              <div className="empty-actions">
                <button
                  onClick={() => setShowGroupModal(true)}
                  className="btn btn-primary"
                >
                  Créer un groupe
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="btn btn-success"
                >
                  Rejoindre un groupe
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {showGroupModal && (
        <GroupModal
          onClose={() => setShowGroupModal(false)}
          onCreate={handleCreateGroup}
          token={token}
        />
      )}
      {showJoinModal && (
        <JoinGroupModal
          onClose={() => setShowJoinModal(false)}
          onJoin={handleJoinGroup}
          token={token}
        />
      )}
      {selectedGroup && showTaskModal && (
        <TaskModal
          group={selectedGroup}
          onClose={() => setShowTaskModal(false)}
          onCreate={handleCreateTask}
          token={token}
        />
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

