/**
 * AENIGMA Contest Tracker
 * =======================
 * 1. Create a free Firebase project at https://console.firebase.google.com
 * 2. Enable "Realtime Database" (Start in test mode)
 * 3. Copy the database URL (looks like https://your-project-default-rtdb.firebaseio.com)
 * 4. Paste it below replacing YOUR-PROJECT-URL
 */
const FIREBASE_DB_URL = 'https://aenigma-33755-default-rtdb.firebaseio.com';

// ── Stage name & progress score for each page ─────────────────────────────────
const PAGE_INFO = {
  'index.html':      { label: 'Start Screen',  score: 0  },
  'q1l1.html':       { label: 'Stage 1',        score: 1  },
  'q2l1.html':       { label: 'Stage 2',        score: 2  },
  'q1l2.html':       { label: 'Stage 3',        score: 3  },
  'q2l2.html':       { label: 'Stage 4',        score: 4  },
  'q21l3.html':      { label: 'Stage 5a',       score: 5  },
  'q22l3.html':      { label: 'Stage 5b',       score: 6  },
  'q3l2.html':       { label: 'Stage 6',        score: 7  },
  'q3l3.html':       { label: 'Stage 7',        score: 8  },
  'q1l3.html':       { label: 'Stage 8',        score: 9  },
  'q3l4.html':       { label: 'Stage 9',        score: 10 },
  'q1l4.html':       { label: 'Stage 10',       score: 11 },
  'q2l4.html':       { label: 'Stage 11',       score: 12 },
  'q1l5.html':       { label: 'Stage 12',       score: 13 },
  'codeqwerty.html': { label: 'Final Stage',    score: 14 },
  'thanks.html':     { label: '✓ Completed',    score: 15 },
};
const TOTAL_STAGES = 15;

(function () {
  // Not configured yet — skip silently
  if (FIREBASE_DB_URL.includes('YOUR-PROJECT-URL')) return;

  const studentId = localStorage.getItem('contestStudentId');
  if (!studentId) return; // not logged in

  const startTime = parseInt(localStorage.getItem('contestStartTime') || '0', 10) || Date.now();
  const pageName  = (location.pathname.split('/').pop() || 'index.html').split('?')[0];
  const info      = PAGE_INFO[pageName] || { label: pageName, score: 0 };
  // Sanitise ID for Firebase key (no . # $ [ ])
  const safeId    = studentId.replace(/[.#$[\]]/g, '_');

  function getElapsed() {
    return Math.floor((Date.now() - startTime) / 1000);
  }

  function patch(data, keepalive) {
    return fetch(`${FIREBASE_DB_URL}/participants/${safeId}.json`, {
      method:    'PATCH',
      headers:   { 'Content-Type': 'application/json' },
      body:      JSON.stringify(data),
      keepalive: !!keepalive,
    }).catch(function () {});
  }

  const isCompleted = pageName === 'thanks.html';

  // ── On page load: record current stage ──────────────────────
  patch({
    studentId:      studentId,
    currentPage:    pageName,
    currentLevel:   info.label,
    progress:       info.score,
    totalStages:    TOTAL_STAGES,
    startTime:      startTime,
    lastSeen:       Date.now(),
    status:         isCompleted ? 'completed' : 'active',
    elapsedSeconds: getElapsed(),
  });

  // ── Heartbeat every 30 s ─────────────────────────────────────
  var heartbeat = setInterval(function () {
    patch({
      lastSeen:       Date.now(),
      elapsedSeconds: getElapsed(),
      status:         isCompleted ? 'completed' : 'active',
    });
  }, 30000);

  // ── On exit: submit final snapshot ──────────────────────────
  window.addEventListener('beforeunload', function () {
    clearInterval(heartbeat);
    patch({
      status:         isCompleted ? 'completed' : 'exited',
      exitTime:       Date.now(),
      elapsedSeconds: getElapsed(),
      lastPage:       pageName,
      lastLevel:      info.label,
    }, true /* keepalive */);
  });
})();
