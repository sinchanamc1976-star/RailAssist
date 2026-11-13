/**
 * data.js – RailAssist Data Layer
 * Handles all LocalStorage operations and sample data initialization.
 */

(function (window) {
  'use strict';

  /* ---- Storage Keys ---- */
  const KEYS = {
    incidents: 'ra_incidents',
    nextId:    'ra_next_id',
    seeded:    'ra_seeded',
    theme:     'ra_theme',
    role:      'ra_role',
  };

  /* ---- Sample / Seed Data ---- */
  const SAMPLE_INCIDENTS = [
    {
      id: 'RA-1001',
      trainId: 'TRN-4521',
      category: 'Electrical',
      description: 'Main circuit breaker tripping intermittently during acceleration. Voltage fluctuations observed on traction inverter panel.',
      location: 'Platform 2 – Howrah Junction',
      priority: 'Critical',
      status: 'Reported',
      reportedBy: 'Loco Pilot',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      startedAt: null,
      resolvedAt: null,
      statusHistory: [
        { status: 'Reported', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'RA-1002',
      trainId: 'TRN-3301',
      category: 'Brakes',
      description: 'Brake pressure dropping below minimum threshold on coaches 4 and 5. Likely air-line leak suspected.',
      location: 'Yard – Sealdah Division',
      priority: 'High',
      status: 'In Progress',
      reportedBy: 'Loco Pilot',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      reportedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      resolvedAt: null,
      statusHistory: [
        { status: 'Reported', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
        { status: 'In Progress', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'RA-1003',
      trainId: 'TRN-7820',
      category: 'Signal',
      description: 'Cab signal display showing inconsistent aspect codes at km 234. TPWS alarm triggered twice.',
      location: 'Block Section – Mughal Sarai',
      priority: 'Critical',
      status: 'In Progress',
      reportedBy: 'Control Room',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      reportedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      startedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      resolvedAt: null,
      statusHistory: [
        { status: 'Reported', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
        { status: 'In Progress', timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'RA-1004',
      trainId: 'TRN-6102',
      category: 'HVAC',
      description: 'Air conditioning unit in coach 3 not cooling. Passengers experiencing discomfort. Refrigerant leak suspected.',
      location: 'En route – Delhi to Agra',
      priority: 'Medium',
      status: 'Reported',
      reportedBy: 'Loco Pilot',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      reportedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      startedAt: null,
      resolvedAt: null,
      statusHistory: [
        { status: 'Reported', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'RA-1005',
      trainId: 'TRN-9043',
      category: 'Pantograph',
      description: 'Pantograph carbon strip worn beyond limit. Excessive arcing observed. Replacement required at next halt.',
      location: 'Station – Vadodara',
      priority: 'High',
      status: 'Resolved',
      reportedBy: 'Maintenance Staff',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      startedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      statusHistory: [
        { status: 'Reported', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
        { status: 'In Progress', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() },
        { status: 'Resolved', timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'RA-1006',
      trainId: 'TRN-2210',
      category: 'Door System',
      description: 'Sliding door in coach 7 (vestibule) not closing fully. Door sensor fault code F-04 displayed.',
      location: 'Platform 1 – Chennai Central',
      priority: 'Medium',
      status: 'Resolved',
      reportedBy: 'Maintenance Staff',
      createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
      reportedAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
      startedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      statusHistory: [
        { status: 'Reported', timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString() },
        { status: 'In Progress', timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
        { status: 'Resolved', timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'RA-1007',
      trainId: 'TRN-5500',
      category: 'Track',
      description: 'Unusual vibration felt at km 48 on the up line. Track geometry irregularity suspected. Speed restriction advised.',
      location: 'Block Section – Pune Division',
      priority: 'High',
      status: 'Reported',
      reportedBy: 'Loco Pilot',
      createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      reportedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      startedAt: null,
      resolvedAt: null,
      statusHistory: [
        { status: 'Reported', timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'RA-1008',
      trainId: 'TRN-1188',
      category: 'Bogies',
      description: 'Excessive wheel flange wear on bogie 2 axle A. Wheel diameter below minimum limit. Quarantined for maintenance.',
      location: 'Maintenance Shed – Lucknow',
      priority: 'Low',
      status: 'In Progress',
      reportedBy: 'Maintenance Staff',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      reportedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      startedAt: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString(),
      resolvedAt: null,
      statusHistory: [
        { status: 'Reported', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
        { status: 'In Progress', timestamp: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'RA-1009',
      trainId: 'TRN-3775',
      category: 'Mechanical',
      description: 'Coupler pin loose on lead locomotive. Unusual noise during shunting. Emergency coupling inspection required.',
      location: 'Goods Yard – Raipur',
      priority: 'Critical',
      status: 'Resolved',
      reportedBy: 'Loco Pilot',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      reportedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      statusHistory: [
        { status: 'Reported', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
        { status: 'In Progress', timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
        { status: 'Resolved', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'RA-1010',
      trainId: 'TRN-8864',
      category: 'Electrical',
      description: 'Auxiliary power unit (APU) failure. Battery charging not occurring. Train lights on emergency backup.',
      location: 'Platform 5 – Mumbai CSMT',
      priority: 'Medium',
      status: 'Reported',
      reportedBy: 'Control Room',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      reportedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      startedAt: null,
      resolvedAt: null,
      statusHistory: [
        { status: 'Reported', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
      ],
    },
  ];

  /* ---- Helpers ---- */
  function load(key) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch (e) {
      console.error('RailAssist: load error', key, e);
      return null;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('RailAssist: save error', key, e);
    }
  }

  /* ---- Backward compatibility normalization ---- */
  function normalizeIncident(inc) {
    if (!inc) return inc;
    if (!inc.reportedAt) {
      inc.reportedAt = inc.createdAt || new Date().toISOString();
    }
    if (inc.startedAt === undefined) {
      inc.startedAt = inc.status === 'In Progress' ? (inc.updatedAt || inc.createdAt || null) : null;
    }
    if (inc.resolvedAt === undefined) {
      inc.resolvedAt = inc.status === 'Resolved' ? (inc.updatedAt || inc.createdAt || null) : null;
    }
    if (!Array.isArray(inc.statusHistory) || inc.statusHistory.length === 0) {
      const history = [
        { status: 'Reported', timestamp: inc.reportedAt }
      ];
      if (inc.startedAt) {
        history.push({ status: 'In Progress', timestamp: inc.startedAt });
      } else if (inc.status === 'In Progress') {
        history.push({ status: 'In Progress', timestamp: inc.updatedAt || inc.reportedAt });
      }
      if (inc.resolvedAt) {
        history.push({ status: 'Resolved', timestamp: inc.resolvedAt });
      } else if (inc.status === 'Resolved') {
        history.push({ status: 'Resolved', timestamp: inc.updatedAt || inc.reportedAt });
      }
      inc.statusHistory = history;
    }
    return inc;
  }

  /* ---- Initialize ---- */
  function init() {
    if (!load(KEYS.seeded)) {
      save(KEYS.incidents, SAMPLE_INCIDENTS.map(normalizeIncident));
      save(KEYS.nextId, 1011);
      save(KEYS.seeded, true);
    }
  }

  /* ---- Reset ---- */
  function resetDemoData() {
    save(KEYS.incidents, SAMPLE_INCIDENTS.map(normalizeIncident));
    save(KEYS.nextId, 1011);
  }

  /* ---- Incident CRUD ---- */
  function getIncidents() {
    const list = load(KEYS.incidents) || [];
    return list.map(normalizeIncident);
  }

  function saveIncidents(incidents) {
    save(KEYS.incidents, incidents);
  }

  function getNextId() {
    const next = load(KEYS.nextId) || 1011;
    save(KEYS.nextId, next + 1);
    return 'RA-' + next;
  }

  function addIncident(data) {
    const incidents = getIncidents();

    // Determine locationSource based on what data was provided
    const hasGps    = data.latitude != null && data.longitude != null;
    const hasManual = data.location && data.location.trim().length > 0;
    let locationSource = 'manual';
    if (hasGps && hasManual) locationSource = 'both';
    else if (hasGps)         locationSource = 'GPS';

    const now = new Date().toISOString();

    const incident = {
      id:          getNextId(),
      trainId:     data.trainId.trim().toUpperCase(),
      category:    data.category,
      description: data.description.trim(),
      location:    data.location ? data.location.trim() : '',
      priority:    data.priority,
      status:      'Reported',
      reportedBy:  data.reportedBy || 'Unknown',
      createdAt:   now,
      reportedAt:  now,
      startedAt:   null,
      resolvedAt:  null,
      statusHistory: [
        { status: 'Reported', timestamp: now }
      ],
      // GPS fields – only stored when captured; null means not captured
      latitude:        hasGps ? data.latitude        : null,
      longitude:       hasGps ? data.longitude       : null,
      accuracyMeters:  hasGps ? data.accuracyMeters  : null,
      locationSource:  locationSource,
      gpsCapturedAt:   hasGps ? data.gpsCapturedAt   : null,
    };
    incidents.unshift(incident);
    saveIncidents(incidents);
    return incident;
  }

  function updateIncidentStatus(id, status) {
    const incidents = getIncidents();
    const idx = incidents.findIndex(i => i.id === id);
    if (idx === -1) return false;

    const inc = incidents[idx];

    // Do not add duplicate history entries if the status has not changed
    if (inc.status === status) return false;

    const now = new Date().toISOString();

    // Preserve original reportedAt; guarantee it exists
    if (!inc.reportedAt) {
      inc.reportedAt = inc.createdAt || now;
    }

    // Status update rules:
    // Reported -> In Progress: record startedAt (first time it changes to In Progress)
    if (status === 'In Progress') {
      if (!inc.startedAt) {
        inc.startedAt = now;
      }
    } else if (status === 'Resolved') {
      // In Progress -> Resolved: record resolvedAt
      if (!inc.resolvedAt) {
        inc.resolvedAt = now;
      }
    }

    inc.status = status;
    inc.updatedAt = now;

    if (!Array.isArray(inc.statusHistory)) {
      inc.statusHistory = [
        { status: 'Reported', timestamp: inc.reportedAt }
      ];
    }

    // Append to status history
    inc.statusHistory.push({
      status: status,
      timestamp: now,
    });

    saveIncidents(incidents);
    return true;
  }

  function getIncidentById(id) {
    return getIncidents().find(i => i.id === id) || null;
  }

  /* ---- Stats ---- */
  function getStats() {
    const incidents = getIncidents();
    return {
      total:      incidents.length,
      reported:   incidents.filter(i => i.status === 'Reported').length,
      inProgress: incidents.filter(i => i.status === 'In Progress').length,
      resolved:   incidents.filter(i => i.status === 'Resolved').length,
    };
  }

  /* ---- Theme persistence ---- */
  function getTheme()       { return load(KEYS.theme) || 'light'; }
  function saveTheme(theme) { save(KEYS.theme, theme); }

  /* ---- Role persistence ---- */
  function getRole()      { return load(KEYS.role) || null; }
  function saveRole(role) { save(KEYS.role, role); }
  function clearRole()    { localStorage.removeItem(KEYS.role); }

  /* ---- Public API ---- */
  window.RailData = {
    init,
    resetDemoData,
    getIncidents,
    addIncident,
    updateIncidentStatus,
    getIncidentById,
    getStats,
    getTheme,
    saveTheme,
    getRole,
    saveRole,
    clearRole,
  };

})(window);
