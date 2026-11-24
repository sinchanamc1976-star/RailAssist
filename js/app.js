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
    currentStaff: null,
    currentView: 'dashboard',
    currentTheme: 'dark',
    confirmCallback: null,
    // GPS state for the active Report Fault form session
    gps: {
      capturing: false,
      latitude:      null,
      longitude:     null,
      accuracyMeters: null,
      capturedAt:    null,
    },
  };

  /* ============================================================
     ROLE PERMISSIONS
     ============================================================ */
  const Permissions = {
    'Loco Pilot': {
      canReport: true,
      canViewIncidents: true,
      canUpdateStatus: false,
      canAssignStaff: false,
    },
    'Control Room': {
      canReport: false,
      canViewIncidents: true,
      canUpdateStatus: true,
      canAssignStaff: true,
    },
    'Maintenance Staff': {
      canReport: false,
      canViewIncidents: true,
      canUpdateStatus: true,
      canAssignStaff: false,
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
  function loginAs(role, staffMember) {
    State.currentRole = role;
    RailData.saveRole(role);
    if (role === 'Maintenance Staff') {
      State.currentStaff = staffMember || RailData.getStaff() || RailData.getMaintenanceStaff()[0];
      RailData.saveStaff(State.currentStaff);
    } else {
      State.currentStaff = null;
      RailData.clearStaff();
    }
    applyRoleUI(role);
    showPage('app');
    showView('dashboard');
  }

  function applyRoleUI(role) {
    // Sidebar user info
    const avatars = { 'Loco Pilot': '🚂', 'Control Room': '🖥️', 'Maintenance Staff': '🔧' };
    $('sidebar-user-avatar').textContent = avatars[role] || '👤';

    const roleSubtitle = $('sidebar-user-subtitle');
    if (role === 'Maintenance Staff' && State.currentStaff) {
      $('sidebar-user-role').textContent = State.currentStaff.name;
      if (roleSubtitle) roleSubtitle.textContent = `Maintenance Staff (${State.currentStaff.id})`;
      $('topbar-role-badge').textContent = `🔧 ${State.currentStaff.name}`;
    } else if (role === 'Control Room') {
      $('sidebar-user-role').textContent = role;
      if (roleSubtitle) roleSubtitle.textContent = 'System Controller';
      $('topbar-role-badge').textContent = role;
    } else {
      $('sidebar-user-role').textContent = role;
      if (roleSubtitle) roleSubtitle.textContent = 'Train Operator';
      $('topbar-role-badge').textContent = role;
    }

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
    State.currentStaff = null;
    RailData.clearRole();
    RailData.clearStaff();
    hideMaintenanceSelect();
    showPage('login');
  }

  /* ---- Demo Login Maintenance Staff Selector Helpers ---- */
  function populateLoginStaffSelect() {
    const sel = $('login-staff-select');
    if (!sel) return;
    const staffList = RailData.getMaintenanceStaff();
    sel.innerHTML = staffList.map(s => `
      <option value="${s.id}">
        ${esc(s.name)} — ${esc(s.specialty)} (${esc(s.id)})
      </option>
    `).join('');
  }

  function showMaintenanceSelect() {
    const box = $('maintenance-identity-section');
    const card = $('role-card-maintenance');
    if (box) box.style.display = 'block';
    if (card) card.classList.add('selected');
    populateLoginStaffSelect();
  }

  function hideMaintenanceSelect() {
    const box = $('maintenance-identity-section');
    const card = $('role-card-maintenance');
    if (box) box.style.display = 'none';
    if (card) card.classList.remove('selected');
  }

  /* ============================================================
     DASHBOARD
     ============================================================ */
  function renderDashboard() {
    const isStaff = State.currentRole === 'Maintenance Staff' && State.currentStaff;
    const stats = isStaff ? RailData.getStats(State.currentStaff.id) : RailData.getStats();
    $('stat-total').textContent     = stats.total;
    $('stat-reported').textContent  = stats.reported;
    $('stat-inprogress').textContent= stats.inProgress;
    $('stat-resolved').textContent  = stats.resolved;
    renderCategoryDistribution();
    renderRecentIncidents();
  }

  function renderCategoryDistribution() {
    const bar = $('category-distribution-bar');
    const legend = $('category-distribution-legend');
    if (!bar || !legend) return;

    const isStaff = State.currentRole === 'Maintenance Staff' && State.currentStaff;
    let incidents = RailData.getIncidents();
    if (isStaff) {
      incidents = incidents.filter(i => i.assignedTo === State.currentStaff.id);
    }

    const total = incidents.length;
    if (total === 0) {
      bar.innerHTML = '<div class="category-segment empty" style="width:100%"></div>';
      legend.innerHTML = '<span class="text-muted">No operational incidents in active queue.</span>';
      return;
    }

    const counts = {};
    incidents.forEach(inc => {
      const cat = inc.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const colors = {
      'Electrical':   '#38bdf8',
      'Mechanical':   '#e07b2a',
      'Brakes':       '#f87171',
      'Signal':       '#a78bfa',
      'Track':        '#34d399',
      'HVAC':         '#60a5fa',
      'Pantograph':   '#fbbf24',
      'Door System':  '#f472b6',
      'Bogies':       '#94a3b8',
      'Other':        '#64748b',
    };

    const sortedCats = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

    bar.innerHTML = sortedCats.map(cat => {
      const pct = ((counts[cat] / total) * 100).toFixed(1);
      const col = colors[cat] || '#38bdf8';
      return `<div class="category-segment" style="width:${pct}%; background-color:${col};" title="${esc(cat)}: ${counts[cat]} (${pct}%)"></div>`;
    }).join('');

    legend.innerHTML = sortedCats.map(cat => {
      const count = counts[cat];
      const pct = Math.round((count / total) * 100);
      const col = colors[cat] || '#38bdf8';
      return `
        <div class="category-legend-item">
          <span class="legend-dot" style="background-color:${col};"></span>
          <span class="legend-name">${esc(cat)}</span>
          <span class="legend-val">${count} <small>(${pct}%)</small></span>
        </div>
      `;
    }).join('');
  }

  function renderRecentIncidents() {
    const isStaff = State.currentRole === 'Maintenance Staff' && State.currentStaff;
    let incidents = RailData.getIncidents();
    if (isStaff) {
      incidents = incidents.filter(i => i.assignedTo === State.currentStaff.id);
    }
    incidents = incidents.slice(0, 6);
    const container = $('recent-incidents-list');

    if (incidents.length === 0) {
      const msg = isStaff
        ? `No incidents assigned to ${esc(State.currentStaff.name)} yet.`
        : 'No incidents reported yet.';
      container.innerHTML = `<div class="empty-state"><span>📋</span><p>${msg}</p></div>`;
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

    // Maintenance Staff: display only incidents assigned to current technician
    const isStaff = State.currentRole === 'Maintenance Staff' && State.currentStaff;
    if (isStaff) {
      incidents = incidents.filter(i => i.assignedTo === State.currentStaff.id);
    }

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
      if (isStaff && !searchVal && !statusVal) {
        empty.innerHTML = `<span>🔧</span><p>No incidents assigned to ${esc(State.currentStaff.name)} at this time.</p>`;
      } else {
        empty.innerHTML = `<span>🗂️</span><p>No incidents found matching your search.</p>`;
      }
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
        <td>${assignedBadge(inc)}</td>
        <td>
          <div class="table-actions">
            <button class="btn-view" data-id="${esc(inc.id)}" title="View details">View</button>
            ${can('canAssignStaff') ? `<button class="btn-assign" data-id="${esc(inc.id)}" title="${inc.assignedTo ? 'Change staff assignment' : 'Assign maintenance staff'}">${inc.assignedTo ? 'Reassign' : 'Assign'}</button>` : ''}
            ${can('canUpdateStatus') ? `<button class="btn-status" data-id="${esc(inc.id)}" ${inc.status === 'Resolved' ? 'disabled' : ''} title="Update status">Update</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    // Bind row action buttons
    tbody.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => openIncidentModal(btn.dataset.id, 'view'));
    });
    tbody.querySelectorAll('.btn-assign').forEach(btn => {
      btn.addEventListener('click', () => openIncidentModal(btn.dataset.id, 'assign'));
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

    let assignHtml = '';
    if (can('canAssignStaff')) {
      const staffList = RailData.getMaintenanceStaff();
      let staffOpts = '';
      for (let i = 0; i < staffList.length; i++) {
        const s = staffList[i];
        const isSel = (inc.assignedTo === s.id) ? ' selected' : '';
        staffOpts += `<option value="${s.id}"${isSel}>${esc(s.name)} — ${esc(s.specialty)} (${esc(s.id)})</option>`;
      }
      const unassignLabel = inc.assignedTo ? 'Remove Assignment (Unassign)' : 'Select Maintenance Staff';
      const labelText = inc.assignedTo ? 'Change Assigned Staff' : 'Assign Maintenance Staff';
      const quickBtn = (mode === 'view') ? '<button type="button" id="btn-quick-assign" class="btn btn-sm btn-primary">Save Assignment</button>' : '';

      assignHtml = `
        <div class="detail-row full assignment-selector-row">
          <label for="modal-assign-select" class="detail-label">${labelText}</label>
          <div class="assign-control-group">
            <select id="modal-assign-select" class="form-control">
              <option value="">-- ${unassignLabel} --</option>
              ${staffOpts}
            </select>
            ${quickBtn}
          </div>
        </div>
      `;
    }

    let statusHtml = '';
    if (mode === 'update' && can('canUpdateStatus') && inc.status !== 'Resolved') {
      let opts = '<option value="" disabled selected>-- Select new status --</option>';
      if (inc.status === 'Reported') {
        opts += '<option value="Reported" disabled>Reported (current)</option>';
        opts += '<option value="In Progress">In Progress</option>';
        opts += '<option value="Resolved">Resolved</option>';
      } else if (inc.status === 'In Progress') {
        opts += '<option value="In Progress" disabled>In Progress (current)</option>';
        opts += '<option value="Resolved">Resolved</option>';
      }
      statusHtml = `
        <div class="detail-row full status-selector">
          <label for="modal-status-select">Update Status</label>
          <select id="modal-status-select">
            ${opts}
          </select>
        </div>
      `;
    }

    const historyList = (inc.statusHistory && inc.statusHistory.length > 0)
      ? inc.statusHistory
      : [{ status: 'Reported', timestamp: inc.reportedAt || inc.createdAt }];

    let historyHtml = '';
    for (let i = 0; i < historyList.length; i++) {
      const hItem = historyList[i];
      historyHtml += '<div class="history-item">';
      historyHtml += '<div class="history-bullet"></div>';
      historyHtml += '<div class="history-details">';
      historyHtml += '<span class="history-status">' + statusBadge(hItem.status) + '</span>';
      historyHtml += '<span class="history-time">' + formatDate(hItem.timestamp) + '</span>';
      historyHtml += '</div></div>';
    }

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
        <div class="detail-row">
          <span class="detail-label">Assigned Staff</span>
          <span class="detail-value" id="modal-assigned-display">
            ${inc.assignedToName ? `<strong>🔧 ${esc(inc.assignedToName)}</strong>` : '<em class="text-muted">Unassigned</em>'}
          </span>
        </div>
        ${inc.assignedAt ? `
        <div class="detail-row">
          <span class="detail-label">Assigned At</span>
          <span class="detail-value">${formatDate(inc.assignedAt)}</span>
        </div>` : ''}
        <div class="detail-row full">
          <span class="detail-label">Location</span>
          <span class="detail-value">${esc(inc.location) || '<em>Not specified</em>'}</span>
        </div>
        ${inc.latitude != null ? `
        <div class="detail-row full">
          <span class="detail-label">GPS Coordinates</span>
          <span class="detail-value gps-coords-display">
            <span class="gps-coord-pill">📍 ${inc.latitude.toFixed(6)}, ${inc.longitude.toFixed(6)}</span>
            ${inc.accuracyMeters != null ? `<span class="gps-accuracy-pill">±${inc.accuracyMeters} m accuracy</span>` : ''}
            <span class="gps-source-pill">${esc(inc.locationSource || 'GPS')}</span>
            ${inc.gpsCapturedAt ? `<br><small class="gps-captured-time">Captured: ${formatDate(inc.gpsCapturedAt)}</small>` : ''}
          </span>
        </div>` : ''}
        <div class="detail-row full">
          <span class="detail-label">Description</span>
          <span class="detail-value">${esc(inc.description)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Reported</span>
          <span class="detail-value">${formatDate(inc.reportedAt || inc.createdAt)}</span>
        </div>
        ${inc.startedAt ? `
        <div class="detail-row">
          <span class="detail-label">Work Started</span>
          <span class="detail-value">${formatDate(inc.startedAt)}</span>
        </div>` : ''}
        ${inc.resolvedAt ? `
        <div class="detail-row">
          <span class="detail-label">Resolved</span>
          <span class="detail-value">${formatDate(inc.resolvedAt)}</span>
        </div>` : ''}
        ${inc.updatedAt && !inc.startedAt && !inc.resolvedAt ? `
        <div class="detail-row">
          <span class="detail-label">Last Updated</span>
          <span class="detail-value">${formatDate(inc.updatedAt)}</span>
        </div>` : ''}

        <div class="detail-row full status-history-row">
          <span class="detail-label">Status History</span>
          <div class="status-history-container">
            ${historyHtml}
          </div>
        </div>

        ${assignHtml}
        ${statusHtml}
      </div>
    `;

    // Wire quick-assign button if present
    const quickAssignBtn = $('btn-quick-assign');
    if (quickAssignBtn) {
      quickAssignBtn.addEventListener('click', () => {
        const sel = $('modal-assign-select');
        doAssignment(inc.id, sel ? sel.value : null);
      });
    }

    const footer = $('modal-footer');
    footer.innerHTML = '';

    if (mode === 'assign' && can('canAssignStaff')) {
      const saveAssignBtn = document.createElement('button');
      saveAssignBtn.className = 'btn btn-primary';
      saveAssignBtn.textContent = 'Save Assignment';
      saveAssignBtn.addEventListener('click', () => {
        const sel = $('modal-assign-select');
        doAssignment(inc.id, sel ? sel.value : null);
      });

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn btn-outline';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', closeModal);

      footer.appendChild(cancelBtn);
      footer.appendChild(saveAssignBtn);
    } else if (mode === 'update' && can('canUpdateStatus') && inc.status !== 'Resolved') {
      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn btn-primary';
      saveBtn.textContent = 'Save Changes';
      saveBtn.addEventListener('click', () => {
        const selStatus = $('modal-status-select');
        const selAssign = $('modal-assign-select');
        let didChange = false;

        // Save assignment if changed by Control Room
        if (can('canAssignStaff') && selAssign && selAssign.value !== (inc.assignedTo || '')) {
          RailData.assignIncident(inc.id, selAssign.value || null);
          didChange = true;
        }

        // Save status if selected
        if (selStatus && selStatus.value) {
          RailData.updateIncidentStatus(inc.id, selStatus.value);
          didChange = true;
        }

        if (didChange) {
          closeModal();
          renderIncidentsTable();
          renderDashboard();
          showToast(`Incident ${inc.id} updated successfully.`, 'success');
        } else {
          showToast('Please select a new status or staff assignment.', 'error');
        }
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
      renderDashboard();
      showToast(`Incident ${id} updated to "${newStatus}".`, 'success');
    } else {
      showToast('Failed to update status. Please try again.', 'error');
    }
  }

  function doAssignment(id, staffId) {
    const ok = RailData.assignIncident(id, staffId || null);
    if (ok) {
      closeModal();
      renderIncidentsTable();
      renderDashboard();
      if (staffId) {
        const staff = RailData.getMaintenanceStaffById(staffId);
        showToast(`Incident ${id} assigned to ${staff ? staff.name : staffId}.`, 'success');
      } else {
        showToast(`Incident ${id} is now unassigned.`, 'info');
      }
    } else {
      showToast('Failed to update assignment.', 'error');
    }
  }

  /* ============================================================
     FAULT REPORT FORM
     ============================================================ */
  function setupReportForm() {
    const form = $('fault-report-form');

    // Clear button – also resets GPS state
    $('btn-clear-form').addEventListener('click', () => {
      form.reset();
      clearFormErrors();
      resetGpsState();
    });

    // GPS button – only captures on explicit click
    $('btn-use-gps').addEventListener('click', captureGPS);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!can('canReport')) {
        showToast('Your role does not have permission to submit fault reports.', 'error');
        return;
      }
      submitReport();
    });
  }

  /* ---- GPS helpers ---- */

  function resetGpsState() {
    State.gps = { capturing: false, latitude: null, longitude: null, accuracyMeters: null, capturedAt: null };
    // Clear hidden fields
    ['f-gps-lat','f-gps-lng','f-gps-accuracy','f-gps-captured-at'].forEach(id => {
      const el = $(id);
      if (el) el.value = '';
    });
    setGpsStatus('', null);
    const btn = $('btn-use-gps');
    const lbl = $('gps-btn-label');
    if (btn) btn.disabled = false;
    if (lbl) lbl.textContent = 'Use My Current Location';
    const icon = btn ? btn.querySelector('.gps-btn-icon') : null;
    if (icon) icon.textContent = '📍';
  }

  function setGpsStatus(message, type) {
    const el = $('gps-status');
    if (!el) return;
    if (!message) { el.style.display = 'none'; el.textContent = ''; return; }
    el.style.display = 'flex';
    el.className = 'gps-status gps-status-' + (type || 'info');
    el.innerHTML = message;
  }

  function captureGPS() {
    // Guard: already capturing
    if (State.gps.capturing) return;

    // Guard: browser support
    if (!navigator.geolocation) {
      setGpsStatus('⚠️ Geolocation is not supported by this browser. Enter location manually.', 'error');
      return;
    }

    State.gps.capturing = true;
    const btn = $('btn-use-gps');
    const lbl = $('gps-btn-label');
    const icon = btn ? btn.querySelector('.gps-btn-icon') : null;

    if (btn) btn.disabled = true;
    if (lbl) lbl.textContent = 'Locating…';
    if (icon) icon.textContent = '⏳';
    setGpsStatus('📡 Requesting location, please wait…', 'loading');

    const OPTIONS = {
      enableHighAccuracy: true,
      timeout:            10000,   // 10 s
      maximumAge:         0,
    };

    navigator.geolocation.getCurrentPosition(
      // ---- SUCCESS ----
      function (position) {
        State.gps.capturing     = false;
        State.gps.latitude      = position.coords.latitude;
        State.gps.longitude     = position.coords.longitude;
        State.gps.accuracyMeters = position.coords.accuracy != null
          ? Math.round(position.coords.accuracy)
          : null;
        State.gps.capturedAt    = new Date().toISOString();

        // Persist to hidden fields so submitReport can read them
        $('f-gps-lat').value          = State.gps.latitude;
        $('f-gps-lng').value          = State.gps.longitude;
        $('f-gps-accuracy').value     = State.gps.accuracyMeters ?? '';
        $('f-gps-captured-at').value  = State.gps.capturedAt;

        // Update button to show captured state
        if (btn) btn.disabled = false;
        if (lbl) lbl.textContent = 'Location Captured ✓';
        if (icon) icon.textContent = '✅';

        const accText = State.gps.accuracyMeters != null
          ? ` &nbsp;·&nbsp; Accuracy: ±${State.gps.accuracyMeters} m`
          : '';
        setGpsStatus(
          `✅ <strong>GPS captured:</strong> ${State.gps.latitude.toFixed(6)}, ${State.gps.longitude.toFixed(6)}${accText}
           <br><small>Add a station/landmark name in the Location field above for context.</small>`,
          'success'
        );
      },
      // ---- ERROR ----
      function (err) {
        State.gps.capturing = false;
        if (btn) btn.disabled = false;
        if (lbl) lbl.textContent = 'Use My Current Location';
        if (icon) icon.textContent = '📍';

        const MESSAGES = {
          1: '🚫 Location permission denied. Please allow location access in your browser settings and try again.',
          2: '📡 Location unavailable. Check your device settings or enter location manually.',
          3: '⏱️ Location request timed out. Move to an open area and try again, or enter location manually.',
        };
        setGpsStatus(MESSAGES[err.code] || `❌ Location error (code ${err.code}). Enter location manually.`, 'error');
      },
      OPTIONS
    );
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

    // Read GPS hidden fields (populated by captureGPS if used)
    const rawLat = $('f-gps-lat').value;
    const rawLng = $('f-gps-lng').value;
    const rawAcc = $('f-gps-accuracy').value;
    const rawCapturedAt = $('f-gps-captured-at').value;

    const latitude  = rawLat ? parseFloat(rawLat)   : null;
    const longitude = rawLng ? parseFloat(rawLng)   : null;
    const accuracyMeters = rawAcc ? parseInt(rawAcc, 10) : null;

    const incident = RailData.addIncident({
      trainId:      $('f-train-id').value,
      category:     $('f-category').value,
      description:  $('f-description').value,
      location:     $('f-location').value,
      priority:     $('f-priority').value,
      reportedBy:   State.currentRole,
      // GPS fields — null when not captured
      latitude,
      longitude,
      accuracyMeters,
      gpsCapturedAt: rawCapturedAt || null,
    });

    $('fault-report-form').reset();
    clearFormErrors();
    resetGpsState();   // clear GPS widget state after submit

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

  function assignedBadge(inc) {
    if (inc.assignedToName) {
      return `<span class="badge-assigned" title="Assigned to ${esc(inc.assignedToName)} (${esc(inc.assignedTo || '')})">🔧 ${esc(inc.assignedToName)}</span>`;
    }
    return `<span class="badge-unassigned">Unassigned</span>`;
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

  function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dashClock = $('dashboard-clock');
    const topClock = $('topbar-clock');
    if (dashClock) dashClock.textContent = `${timeStr} IST`;
    if (topClock) topClock.textContent = `${timeStr} IST`;
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    // Initialize data layer
    RailData.init();

    // Apply saved theme (dark is default)
    applyTheme(RailData.getTheme());

    // Live operations clock
    updateClock();
    setInterval(updateClock, 1000);

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
    const backLandingBtn = $('btn-back-to-landing');
    if (backLandingBtn) {
      backLandingBtn.addEventListener('click', () => showPage('landing'));
    }
    populateLoginStaffSelect();

    $$('.role-card').forEach(card => {
      card.addEventListener('click', () => {
        const role = card.dataset.role;
        if (role === 'Maintenance Staff') {
          showMaintenanceSelect();
        } else {
          hideMaintenanceSelect();
          loginAs(role);
        }
      });
    });

    const staffLoginConfirm = $('btn-login-staff-confirm');
    if (staffLoginConfirm) {
      staffLoginConfirm.addEventListener('click', () => {
        const sel = $('login-staff-select');
        const staffId = sel ? sel.value : null;
        const staff = RailData.getMaintenanceStaffById(staffId) || RailData.getMaintenanceStaff()[0];
        loginAs('Maintenance Staff', staff);
      });
    }

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
      if (savedRole === 'Maintenance Staff') {
        State.currentStaff = RailData.getStaff() || RailData.getMaintenanceStaff()[0];
        RailData.saveStaff(State.currentStaff);
      }
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
