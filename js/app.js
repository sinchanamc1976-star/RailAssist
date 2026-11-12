/**
 * app.js – RailAssist Application Logic
 * Handles all UI interactions, navigation, forms, and role permissions.
 */

(function (window, document) {
  'use strict';

  /* ============================================================
     STATE
     ============================================================ */
  const State = {
    currentRole: null,
    currentView: 'dashboard',
    currentTheme: 'light',
    confirmCallback: null,
  };

  /* ============================================================
     ROLE PERMISSIONS
     ============================================================ */
  const Permissions = {
    'Loco Pilot': {
      canReport: true,
      canViewIncidents: true,
      canUpdateStatus: false,
    },
    'Control Room': {
      canReport: false,
      canViewIncidents: true,
      canUpdateStatus: true,
    },
    'Maintenance Staff': {
      canReport: false,
      canViewIncidents: true,
      canUpdateStatus: true,
    },
  };

  function can(action) {
    if (!State.currentRole) return false;
    return !!Permissions[State.currentRole][action];
  }

  /* ============================================================
     DOM HELPERS
     ============================================================ */
  function $(id)  { return document.getElementById(id); }
  function $$(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  /* ============================================================
     THEME
     ============================================================ */
  function applyTheme(theme) {
    State.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    RailData.saveTheme(theme);
    const icon = theme === 'dark' ? '☀️' : '🌙';
    $$('.theme-toggle-btn').forEach(btn => btn.textContent = icon);
  }

  function toggleTheme() {
    applyTheme(State.currentTheme === 'light' ? 'dark' : 'light');
  }

  /* ============================================================
     PAGES
     ============================================================ */
  function showPage(pageId) {
    $$('.page').forEach(p => p.classList.remove('active'));
    const page = $('page-' + pageId);
    if (page) page.classList.add('active');
  }

  /* ============================================================
     VIEWS (within app shell)
     ============================================================ */
  const VIEW_TITLES = {
    'dashboard':    'Dashboard',
    'report-fault': 'Report Fault',
    'incidents':    'Incident Management',
  };

  function showView(viewId) {
    State.currentView = viewId;
    $$('.view').forEach(v => v.classList.remove('active'));
    const view = $('view-' + viewId);
    if (view) view.classList.add('active');

    // Update nav links
    $$('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.view === viewId);
    });

    // Update topbar title
    $('topbar-title').textContent = VIEW_TITLES[viewId] || '';

    // Close sidebar on mobile
    closeSidebar();

    // Refresh view content
    if (viewId === 'dashboard')   renderDashboard();
    if (viewId === 'incidents')   renderIncidentsTable();
  }

  /* ============================================================
     SIDEBAR
     ============================================================ */
  let sidebarOverlay = null;

  function createOverlay() {
    if (!sidebarOverlay) {
      sidebarOverlay = document.createElement('div');
      sidebarOverlay.className = 'sidebar-overlay';
      sidebarOverlay.addEventListener('click', closeSidebar);
      document.body.appendChild(sidebarOverlay);
    }
  }

  function openSidebar() {
    $('sidebar').classList.add('open');
    sidebarOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    $('sidebar').classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('visible');
    document.body.style.overflow = '';
  }

  /* ============================================================
     LOGIN / LOGOUT
     ============================================================ */
  function loginAs(role) {
    State.currentRole = role;
    RailData.saveRole(role);
    applyRoleUI(role);
    showPage('app');
    showView('dashboard');
  }

  function applyRoleUI(role) {
    // Sidebar user info
    const avatars = { 'Loco Pilot': '🚂', 'Control Room': '🖥️', 'Maintenance Staff': '🔧' };
    $('sidebar-user-avatar').textContent = avatars[role] || '👤';
    $('sidebar-user-role').textContent = role;
    $('topbar-role-badge').textContent = role;

    // Report Fault nav visibility
    const reportNav = $('nav-report-fault');
    if (can('canReport')) {
      reportNav.classList.remove('disabled');
    } else {
      reportNav.classList.add('disabled');
    }
  }

  function logout() {
    State.currentRole = null;
    RailData.clearRole();
    showPage('login');
  }

  /* ============================================================
     DASHBOARD
     ============================================================ */
  function renderDashboard() {
    const stats = RailData.getStats();
    $('stat-total').textContent     = stats.total;
    $('stat-reported').textContent  = stats.reported;
    $('stat-inprogress').textContent= stats.inProgress;
    $('stat-resolved').textContent  = stats.resolved;
    renderRecentIncidents();
  }

  function renderRecentIncidents() {
    const incidents = RailData.getIncidents().slice(0, 6);
    const container = $('recent-incidents-list');

    if (incidents.length === 0) {
      container.innerHTML = '<div class="empty-state"><span>📋</span><p>No incidents reported yet.</p></div>';
      return;
    }

    container.innerHTML = incidents.map(inc => `
      <div class="recent-item">
        <span class="recent-id">${esc(inc.id)}</span>
        <div class="recent-info">
          <strong>${esc(inc.trainId)} — ${esc(inc.category)}</strong>
          <span>${esc(inc.location)}</span>
        </div>
        <div class="recent-meta">
          ${priorityBadge(inc.priority)}
          ${statusBadge(inc.status)}
        </div>
      </div>
    `).join('');
  }

  /* ============================================================
     INCIDENT TABLE
     ============================================================ */
  function renderIncidentsTable() {
    const searchVal = ($('incident-search').value || '').trim().toLowerCase();
    const statusVal = $('filter-status').value;
    let incidents   = RailData.getIncidents();

    if (searchVal) {
      incidents = incidents.filter(i => i.id.toLowerCase().includes(searchVal));
    }
    if (statusVal) {
      incidents = incidents.filter(i => i.status === statusVal);
    }

    const tbody  = $('incidents-tbody');
    const empty  = $('incidents-empty');
    const table  = $('incidents-table');

    if (incidents.length === 0) {
      tbody.innerHTML = '';
      table.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    table.style.display = '';
    empty.style.display = 'none';

    tbody.innerHTML = incidents.map(inc => `
      <tr>
        <td class="incident-id-cell">${esc(inc.id)}</td>
        <td>${esc(inc.trainId)}</td>
        <td>${esc(inc.category)}</td>
        <td>${esc(inc.location)}</td>
        <td>${priorityBadge(inc.priority)}</td>
        <td>${statusBadge(inc.status)}</td>
        <td>
          <div class="table-actions">
            <button class="btn-view" data-id="${esc(inc.id)}" title="View details">View</button>
            ${can('canUpdateStatus') ? `<button class="btn-status" data-id="${esc(inc.id)}" ${inc.status === 'Resolved' ? 'disabled' : ''} title="Update status">Update</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    // Bind row action buttons
    tbody.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => openIncidentModal(btn.dataset.id, 'view'));
    });
    tbody.querySelectorAll('.btn-status').forEach(btn => {
      btn.addEventListener('click', () => openIncidentModal(btn.dataset.id, 'update'));
    });
  }

  /* ============================================================
     INCIDENT MODAL
     ============================================================ */
  function openIncidentModal(id, mode) {
    const inc = RailData.getIncidentById(id);
    if (!inc) return;

    $('modal-title').textContent = `Incident ${esc(inc.id)}`;

    $('modal-body').innerHTML = `
      <div class="detail-grid">
        <div class="detail-row">
          <span class="detail-label">Incident ID</span>
          <span class="detail-value">${esc(inc.id)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Train ID</span>
          <span class="detail-value">${esc(inc.trainId)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Category</span>
          <span class="detail-value">${esc(inc.category)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Priority</span>
          <span class="detail-value">${priorityBadge(inc.priority)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="detail-value" id="modal-status-display">${statusBadge(inc.status)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Reported By</span>
          <span class="detail-value">${esc(inc.reportedBy || 'N/A')}</span>
        </div>
        <div class="detail-row full">
          <span class="detail-label">Location</span>
          <span class="detail-value">${esc(inc.location)}</span>
        </div>
        <div class="detail-row full">
          <span class="detail-label">Description</span>
          <span class="detail-value">${esc(inc.description)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Created</span>
          <span class="detail-value">${formatDate(inc.createdAt)}</span>
        </div>
        ${inc.updatedAt ? `<div class="detail-row">
          <span class="detail-label">Last Updated</span>
          <span class="detail-value">${formatDate(inc.updatedAt)}</span>
        </div>` : ''}
        ${(mode === 'update' && can('canUpdateStatus') && inc.status !== 'Resolved') ? `
        <div class="detail-row full status-selector">
          <label for="modal-status-select">Update Status</label>
          <select id="modal-status-select">
            <option value="" disabled selected>-- Select new status --</option>
            ${inc.status !== 'Reported'    ? '' : '<option value="Reported" disabled>Reported (current)</option>'}
            ${inc.status === 'Reported'    ? '<option value="In Progress">In Progress</option>' : ''}
            ${inc.status !== 'In Progress' ? '' : '<option value="In Progress" disabled>In Progress (current)</option>'}
            ${inc.status === 'In Progress' ? '<option value="Resolved">Resolved</option>' : ''}
            ${inc.status === 'Reported'    ? '<option value="Resolved">Resolved</option>' : ''}
          </select>
        </div>` : ''}
      </div>
    `;

    const footer = $('modal-footer');
    footer.innerHTML = '';

    if (mode === 'update' && can('canUpdateStatus') && inc.status !== 'Resolved') {
      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn btn-primary';
      saveBtn.textContent = 'Save Status';
      saveBtn.addEventListener('click', () => {
        const sel = $('modal-status-select');
        if (!sel || !sel.value) {
          showToast('Please select a new status.', 'error');
          return;
        }
        doStatusUpdate(inc.id, sel.value);
      });

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn btn-outline';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', closeModal);

      footer.appendChild(cancelBtn);
      footer.appendChild(saveBtn);
    } else {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn btn-primary';
      closeBtn.textContent = 'Close';
      closeBtn.addEventListener('click', closeModal);
      footer.appendChild(closeBtn);
    }

    $('incident-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    $('incident-modal').style.display = 'none';
    document.body.style.overflow = '';
  }

  function doStatusUpdate(id, newStatus) {
    const ok = RailData.updateIncidentStatus(id, newStatus);
    if (ok) {
      closeModal();
      renderIncidentsTable();
      showToast(`Incident ${id} updated to "${newStatus}".`, 'success');
    } else {
      showToast('Failed to update status. Please try again.', 'error');
    }
  }

  /* ============================================================
     FAULT REPORT FORM
     ============================================================ */
  function setupReportForm() {
    const form = $('fault-report-form');

    $('btn-clear-form').addEventListener('click', () => {
      form.reset();
      clearFormErrors();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!can('canReport')) {
        showToast('Your role does not have permission to submit fault reports.', 'error');
        return;
      }
      submitReport();
    });
  }

  function validateReportForm() {
    clearFormErrors();
    let valid = true;

    const trainId = $('f-train-id').value.trim();
    const category = $('f-category').value;
    const location = $('f-location').value.trim();
    const priority = $('f-priority').value;
    const description = $('f-description').value.trim();

    if (!trainId) {
      setFieldError('f-train-id', 'err-train-id', 'Train ID is required.');
      valid = false;
    } else if (!/^[A-Za-z0-9\-_]+$/.test(trainId)) {
      setFieldError('f-train-id', 'err-train-id', 'Train ID must be alphanumeric (e.g. TRN-2201).');
      valid = false;
    }

    if (!category) {
      setFieldError('f-category', 'err-category', 'Please select a fault category.');
      valid = false;
    }

    if (!location) {
      setFieldError('f-location', 'err-location', 'Location is required.');
      valid = false;
    }

    if (!priority) {
      setFieldError('f-priority', 'err-priority', 'Please select a priority level.');
      valid = false;
    }

    if (!description) {
      setFieldError('f-description', 'err-description', 'Please provide a fault description.');
      valid = false;
    } else if (description.length < 10) {
      setFieldError('f-description', 'err-description', 'Description must be at least 10 characters.');
      valid = false;
    }

    return valid;
  }

  function setFieldError(fieldId, errId, msg) {
    const field = $(fieldId);
    const err   = $(errId);
    if (field) field.classList.add('error');
    if (err)   err.textContent = msg;
  }

  function clearFormErrors() {
    ['f-train-id','f-category','f-location','f-priority','f-description'].forEach(id => {
      const el = $(id);
      if (el) el.classList.remove('error');
    });
    ['err-train-id','err-category','err-location','err-priority','err-description'].forEach(id => {
      const el = $(id);
      if (el) el.textContent = '';
    });
  }

  function submitReport() {
    if (!validateReportForm()) return;

    const incident = RailData.addIncident({
      trainId:     $('f-train-id').value,
      category:    $('f-category').value,
      description: $('f-description').value,
      location:    $('f-location').value,
      priority:    $('f-priority').value,
      reportedBy:  State.currentRole,
    });

    $('fault-report-form').reset();
    clearFormErrors();

    showToast(`Fault report submitted! Incident ID: ${incident.id}`, 'success', incident.id);
  }

  /* ============================================================
     SEARCH & FILTER
     ============================================================ */
  function setupSearchFilter() {
    const searchInput  = $('incident-search');
    const filterStatus = $('filter-status');
    const clearBtn     = $('btn-clear-search');

    searchInput.addEventListener('input', () => {
      clearBtn.classList.toggle('visible', searchInput.value.length > 0);
      renderIncidentsTable();
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.remove('visible');
      renderIncidentsTable();
    });

    filterStatus.addEventListener('change', () => {
      renderIncidentsTable();
    });
  }

  /* ============================================================
     RESET DEMO DATA
     ============================================================ */
  function resetDemo() {
    openConfirm(
      'This will restore the original sample incidents and remove any new reports you have added. Continue?',
      () => {
        RailData.resetDemoData();
        renderDashboard();
        if (State.currentView === 'incidents') renderIncidentsTable();
        showToast('Demo data has been reset to the original sample incidents.', 'info');
      }
    );
  }

  /* ============================================================
     CONFIRM MODAL
     ============================================================ */
  function openConfirm(message, onConfirm) {
    State.confirmCallback = onConfirm;
    $('confirm-message').textContent = message;
    $('confirm-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeConfirm() {
    State.confirmCallback = null;
    $('confirm-modal').style.display = 'none';
    document.body.style.overflow = '';
  }

  /* ============================================================
     TOAST NOTIFICATIONS
     ============================================================ */
  function showToast(message, type, detail) {
    const container = $('toast-container');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const titles = { success: 'Success', error: 'Error', info: 'Info' };

    const toast = document.createElement('div');
    toast.className = `toast ${type || 'info'}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <div class="toast-text">
        <span class="toast-title">${titles[type] || 'Info'}</span>
        <span class="toast-msg">${esc(message)}${detail ? ` <strong>${esc(detail)}</strong>` : ''}</span>
      </div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /* ============================================================
     UTILITY
     ============================================================ */
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function statusBadge(status) {
    const cls = {
      'Reported':    'badge-reported',
      'In Progress': 'badge-inprogress',
      'Resolved':    'badge-resolved',
    }[status] || '';
    return `<span class="badge ${cls}">${esc(status)}</span>`;
  }

  function priorityBadge(priority) {
    const cls = {
      'Low':      'badge-low',
      'Medium':   'badge-medium',
      'High':     'badge-high',
      'Critical': 'badge-critical',
    }[priority] || '';
    return `<span class="badge ${cls}">${esc(priority)}</span>`;
  }

  function formatDate(isoString) {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
    } catch (e) {
      return isoString;
    }
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    // Initialize data layer
    RailData.init();

    // Apply saved theme (light is default)
    applyTheme(RailData.getTheme());

    // Create sidebar overlay for mobile
    createOverlay();

    // Setup report form
    setupReportForm();

    // Setup search/filter
    setupSearchFilter();

    /* ----- Event Listeners ----- */

    // Landing page
    $('btn-get-started').addEventListener('click', () => showPage('login'));
    $('landing-theme-toggle').addEventListener('click', toggleTheme);

    // Login page
    $('login-theme-toggle').addEventListener('click', toggleTheme);
    $$('.role-card').forEach(card => {
      card.addEventListener('click', () => loginAs(card.dataset.role));
    });

    // App shell
    $('app-theme-toggle').addEventListener('click', toggleTheme);
    $('btn-logout').addEventListener('click', () => {
      openConfirm('Are you sure you want to log out?', logout);
    });

    // Sidebar navigation
    $$('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (link.classList.contains('disabled')) return;
        showView(link.dataset.view);
      });
    });

    // Sidebar toggle (mobile)
    $('sidebar-toggle').addEventListener('click', openSidebar);
    $('sidebar-close').addEventListener('click', closeSidebar);

    // Reset demo data
    $('btn-reset-demo').addEventListener('click', resetDemo);

    // Incident modal close
    $('modal-close').addEventListener('click', closeModal);
    $('incident-modal').addEventListener('click', (e) => {
      if (e.target === $('incident-modal')) closeModal();
    });

    // Confirm modal
    $('confirm-ok').addEventListener('click', () => {
      if (State.confirmCallback) State.confirmCallback();
      closeConfirm();
    });
    $('confirm-cancel').addEventListener('click', closeConfirm);
    $('confirm-cancel-x').addEventListener('click', closeConfirm);
    $('confirm-modal').addEventListener('click', (e) => {
      if (e.target === $('confirm-modal')) closeConfirm();
    });

    // Keyboard close modals with Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if ($('incident-modal').style.display !== 'none') closeModal();
        if ($('confirm-modal').style.display !== 'none') closeConfirm();
        closeSidebar();
      }
    });

    /* ----- Determine initial page ----- */
    const savedRole = RailData.getRole();
    if (savedRole && Permissions[savedRole]) {
      State.currentRole = savedRole;
      applyRoleUI(savedRole);
      showPage('app');
      showView('dashboard');
    } else {
      showPage('landing');
    }
  }

  /* Start when DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
