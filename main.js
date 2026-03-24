const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hud = {
  time: document.getElementById("time-left"),
  score: document.getElementById("score"),
  seen: document.getElementById("patients-seen"),
  saved: document.getElementById("saved"),
  lost: document.getElementById("lost"),
  sat: document.getElementById("avg-sat"),
  supplies: document.getElementById("supplies"),
  critical: document.getElementById("critical-count"),
  combo: document.getElementById("combo")
};

const speechEl = document.getElementById("speech");
const outcomeBannerEl = document.getElementById("outcome-banner");
const menuEl = document.getElementById("menu");
const menuTitleEl = document.getElementById("menu-title");
const menuSubtitleEl = document.getElementById("menu-subtitle");
const menuOptionsEl = document.getElementById("menu-options");
const closeMenuBtn = document.getElementById("menu-close");
const logEl = document.getElementById("event-log");
const gameOverEl = document.getElementById("game-over");
const summaryEl = document.getElementById("summary");
const restartBtn = document.getElementById("restart");
const helpBtn = document.getElementById("help-btn");
const monitorListEl = document.getElementById("monitor-list");
const tutorialEl = document.getElementById("tutorial");
const tutorialCloseBtn = document.getElementById("tutorial-close");
const tutorialStartBtn = document.getElementById("tutorial-start");
const tutorialArt = document.getElementById("tutorial-art");
const tutorialCtx = tutorialArt.getContext("2d");

const TILE = 32;
const MAP_W = 20;
const MAP_H = 15;
const SHIFT_SECONDS = 720;
const SHIFT_START_MINUTES = 7 * 60;
const SHIFT_END_MINUTES = 19 * 60;
const BALANCE = {
  startVitalsMinLoss: 5,
  startVitalsMaxLoss: 10,
  spawnMin: 20,
  spawnMax: 34,
  emergencyTimerMin: 24,
  emergencyTimerMax: 36,
  neglectEmergencyThreshold: 24,
  deathPenalty: 40,
  supplyRegenSeconds: 20,
  maxSupplies: 6
};
const STATION_CAPS = {
  waiting: 6,
  triaged: 4,
  diagnosed: 4,
  stabilized: 4,
  treated: 5,
  or: 2
};

const STATIONS = [
  { id: "triage", name: "Triage Desk", x: 3, y: 3, color: "#6bb8ff" },
  { id: "exam", name: "Exam Room", x: 8, y: 3, color: "#9cf3ff" },
  { id: "treat", name: "Treatment Bay", x: 13, y: 3, color: "#8dffa4" },
  { id: "pharmacy", name: "Pharmacy", x: 3, y: 10, color: "#ffd166" },
  { id: "dispo", name: "Disposition", x: 8, y: 10, color: "#f8c1ff" },
  { id: "or", name: "OR Suite", x: 13, y: 10, color: "#ff6b81" }
];

const FIRST = ["Ava", "Noah", "Liam", "Maya", "Rina", "Owen", "Zoe", "Eli", "Nora", "Kai"];
const LAST = ["Parker", "Lane", "Brooks", "Kim", "Miller", "Lopez", "Singh", "Diaz", "Young", "Shaw"];
const DX = ["Cardiac", "Infection", "Neuro", "Resp", "Internal"];
const MED_BY_DX = {
  Cardiac: "Nitrates",
  Infection: "Antibiotics",
  Neuro: "Neuro Protocol",
  Resp: "Bronchodilator",
  Internal: "Fluids + Pain Control"
};
const PROCEDURE_OPTIONS = ["Urgent OR Control", "Laparoscopic Appendectomy", "Endovascular Thrombectomy", "No Procedure"];
const TREATMENT_PLANS = [
  { label: "Aggressive", level: 3, vitals: 24, sat: -3, pts: 28, supplyCost: 2, idealSeverity: 5 },
  { label: "Balanced", level: 2, vitals: 16, sat: 10, pts: 24, supplyCost: 1, idealSeverity: 3 },
  { label: "Observe", level: 1, vitals: 10, sat: 6, pts: 14, supplyCost: 0, idealSeverity: 1 }
];
const CONDITIONS = [
  {
    complaint: "Stroke Signs",
    dx: "Neuro",
    severityMin: 4,
    severityMax: 5,
    urgencyLabel: "Immediate",
    urgencyRank: 5,
    satPressure: 1.25,
    vitalsPressure: 1.3,
    emergencyRisk: 0.16,
    definitiveCare: "procedure",
    requiredProcedure: "Endovascular Thrombectomy",
    admissionBase: true,
    preferredPlan: "Aggressive",
    cues: ["Facial droop", "Slurred speech", "One-sided weakness"],
    bubbles: ["Face feels numb...", "Words not right..."]
  },
  {
    complaint: "Sepsis Concern",
    dx: "Infection",
    severityMin: 4,
    severityMax: 5,
    urgencyLabel: "Immediate",
    urgencyRank: 5,
    satPressure: 1.15,
    vitalsPressure: 1.28,
    emergencyRisk: 0.14,
    definitiveCare: "medication",
    admissionBase: true,
    preferredPlan: "Aggressive",
    cues: ["Altered mental status", "Cold clammy skin", "Low blood pressure signs"],
    bubbles: ["I feel confused...", "So weak..."]
  },
  {
    complaint: "Severe Trauma",
    dx: "Internal",
    severityMin: 4,
    severityMax: 5,
    urgencyLabel: "Immediate",
    urgencyRank: 5,
    satPressure: 1.2,
    vitalsPressure: 1.26,
    emergencyRisk: 0.16,
    definitiveCare: "procedure",
    requiredProcedure: "Urgent OR Control",
    admissionBase: true,
    preferredPlan: "Aggressive",
    cues: ["Visible bleeding", "Possible internal injury", "Rapid deterioration risk"],
    bubbles: ["Everything hurts!", "Please help now!"]
  },
  {
    complaint: "Chest Pain",
    dx: "Cardiac",
    severityMin: 3,
    severityMax: 5,
    urgencyLabel: "Emergent",
    urgencyRank: 4,
    satPressure: 1.12,
    vitalsPressure: 1.2,
    emergencyRisk: 0.12,
    definitiveCare: "medication",
    admissionBase: true,
    preferredPlan: "Aggressive",
    cues: ["Pressure to chest", "Pain to jaw/arm", "Shortness of breath"],
    bubbles: ["Chest pressure...", "Hard to breathe..."]
  },
  {
    complaint: "Asthma Attack",
    dx: "Resp",
    severityMin: 3,
    severityMax: 5,
    urgencyLabel: "Emergent",
    urgencyRank: 4,
    satPressure: 1.1,
    vitalsPressure: 1.18,
    emergencyRisk: 0.1,
    definitiveCare: "medication",
    admissionBase: false,
    preferredPlan: "Aggressive",
    cues: ["Severe wheeze", "Accessory muscle use", "Can only speak short phrases"],
    bubbles: ["Can't breathe...", "Wheezing..."]
  },
  {
    complaint: "Pneumonia",
    dx: "Resp",
    severityMin: 2,
    severityMax: 4,
    urgencyLabel: "Urgent",
    urgencyRank: 3,
    satPressure: 1.02,
    vitalsPressure: 1.05,
    emergencyRisk: 0.06,
    definitiveCare: "medication",
    admissionBase: true,
    preferredPlan: "Balanced",
    cues: ["Productive cough", "Fever + crackles", "Breath pain"],
    bubbles: ["Cough hurts...", "Breathing is painful..."]
  },
  {
    complaint: "Appendicitis",
    dx: "Internal",
    severityMin: 2,
    severityMax: 4,
    urgencyLabel: "Urgent",
    urgencyRank: 3,
    satPressure: 1.0,
    vitalsPressure: 1.04,
    emergencyRisk: 0.05,
    definitiveCare: "procedure",
    requiredProcedure: "Laparoscopic Appendectomy",
    admissionBase: true,
    preferredPlan: "Balanced",
    cues: ["RLQ abdominal pain", "Rebound tenderness", "Nausea/vomiting"],
    bubbles: ["Right side hurts...", "Sharp stomach pain..."]
  },
  {
    complaint: "High Fever",
    dx: "Infection",
    severityMin: 2,
    severityMax: 3,
    urgencyLabel: "Prompt",
    urgencyRank: 2,
    satPressure: 0.95,
    vitalsPressure: 0.95,
    emergencyRisk: 0.04,
    definitiveCare: "medication",
    admissionBase: false,
    preferredPlan: "Balanced",
    cues: ["Persistent high temp", "Chills", "Malaise"],
    bubbles: ["Burning up...", "Shivering..."]
  },
  {
    complaint: "Dehydration",
    dx: "Internal",
    severityMin: 1,
    severityMax: 3,
    urgencyLabel: "Standard",
    urgencyRank: 1,
    satPressure: 0.86,
    vitalsPressure: 0.85,
    emergencyRisk: 0.02,
    definitiveCare: "medication",
    admissionBase: false,
    preferredPlan: "Observe",
    cues: ["Dry mucosa", "Orthostatic dizziness", "Poor intake"],
    bubbles: ["So thirsty...", "I feel faint..."]
  },
  {
    complaint: "Migraine",
    dx: "Neuro",
    severityMin: 1,
    severityMax: 2,
    urgencyLabel: "Standard",
    urgencyRank: 1,
    satPressure: 0.84,
    vitalsPressure: 0.82,
    emergencyRisk: 0.01,
    definitiveCare: "medication",
    admissionBase: false,
    preferredPlan: "Observe",
    cues: ["Photophobia", "Throbbing unilateral pain", "Nausea"],
    bubbles: ["Head pounding...", "Too bright..."]
  }
];
const DIR_OFFSETS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const CONDITION_BY_COMPLAINT = CONDITIONS.reduce((acc, condition) => {
  acc[condition.complaint] = condition;
  return acc;
}, {});

const SPRITES = {
  doctor: [
    "........",
    "..yyy...",
    ".ysssy..",
    ".seyeys.",
    ".sswwss.",
    "..w..w..",
    ".b....b.",
    ".b....b."
  ],
  patient: [
    "........",
    "..ppp...",
    ".phhhp..",
    ".hheehh.",
    ".hhhhhh.",
    "..gbbg..",
    ".g....g.",
    ".g....g."
  ],
  bed: [
    "rrrrrrrr",
    "rwwwwwwr",
    "rwwwwwwr",
    "r......r",
    "r......r",
    "r......r",
    "rrrrrrrr",
    "........"
  ],
  medPack: [
    "........",
    "..rrrr..",
    "..rwwr..",
    ".rrwwrr.",
    ".rwwwwr.",
    "..rwwr..",
    "..rrrr..",
    "........"
  ],
  monitor: [
    "........",
    ".dddddd.",
    ".d....d.",
    ".d.g..d.",
    ".d..g.d.",
    ".d....d.",
    ".dddddd.",
    "...ss..."
  ],
  board: [
    "........",
    ".yyyyyy.",
    ".y....y.",
    ".y.tt.y.",
    ".y.tt.y.",
    ".y....y.",
    ".yyyyyy.",
    "..s..s.."
  ]
};

const ARTIFACTS = [
  { kind: "bed", x: 7, y: 3 },
  { kind: "bed", x: 8, y: 3 },
  { kind: "bed", x: 12, y: 3 },
  { kind: "bed", x: 13, y: 3 },
  { kind: "medPack", x: 3, y: 3 },
  { kind: "medPack", x: 13, y: 4 },
  { kind: "monitor", x: 9, y: 3 },
  { kind: "monitor", x: 14, y: 3 },
  { kind: "board", x: 3, y: 10 },
  { kind: "board", x: 8, y: 10 },
  { kind: "monitor", x: 12, y: 10 },
  { kind: "medPack", x: 2, y: 10 }
];

let game = null;
let lastTick = 0;
let acc = 0;
let speechTimer = null;
let outcomeBannerTimer = null;
let nextId = 1;
let tutorialOpen = true;
let menuButtons = [];
let menuIndex = -1;
let monitorMode = false;
let monitorIndex = 0;
const TUTORIAL_SEEN_KEY = "dr-robby-tutorial-seen-v2";

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[rnd(0, arr.length - 1)];
}

function timeLabel(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return m + ":" + s;
}

function shiftClockLabel() {
  const elapsed = SHIFT_SECONDS - game.left;
  const ratio = elapsed / SHIFT_SECONDS;
  const totalMinutes = Math.round(SHIFT_START_MINUTES + (SHIFT_END_MINUTES - SHIFT_START_MINUTES) * ratio);
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const m = String(totalMinutes % 60).padStart(2, "0");
  return h + ":" + m;
}

function clinicalLabel(p) {
  if (p.vitals < 28 || p.severity >= 5) return "Critical";
  if (p.vitals < 45 || p.severity >= 4) return "High Risk";
  if (p.vitals < 65 || p.severity >= 3) return "Needs Rapid Care";
  return "Stable-ish";
}

function conditionForPatient(p) {
  return CONDITION_BY_COMPLAINT[p.complaint];
}

function triageSort(list) {
  return [...list].sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity;
    if (a.vitals !== b.vitals) return a.vitals - b.vitals;
    return a.sat - b.sat;
  });
}

function urgencyIndicator(p) {
  const c = conditionForPatient(p);
  const label = c ? c.urgencyLabel : "Standard";
  const clue = c && c.cues.length ? c.cues[0] : "General symptoms";
  return label + " · " + clue;
}

function pickConditionForSpawn() {
  const queueHighRisk = game ? game.patients.filter((p) => p.severity >= 4 || p.vitals < 50).length : 0;
  const weighted = [];
  CONDITIONS.forEach((condition) => {
    let weight = condition.urgencyRank >= 5 ? 1 : condition.urgencyRank === 4 ? 2 : condition.urgencyRank === 3 ? 3 : condition.urgencyRank === 2 ? 5 : 7;
    if (queueHighRisk >= 4 && condition.urgencyRank >= 4) weight = Math.max(1, weight - 1);
    for (let i = 0; i < weight; i++) weighted.push(condition);
  });
  return pick(weighted);
}

function needsAdmission(p) {
  const condition = conditionForPatient(p);
  if (!condition) return p.severity >= 4 || p.vitals < 55;
  return Boolean(condition.admissionBase || p.severity >= 4 || p.vitals < 58);
}

function isDefinitiveCareComplete(p) {
  const condition = conditionForPatient(p);
  if (!condition) return Boolean(p.medication);
  if (condition.definitiveCare === "procedure") {
    return p.procedure === condition.requiredProcedure;
  }
  return Boolean(p.medication === MED_BY_DX[p.dxCorrect]);
}

function makePatient() {
  const condition = pickConditionForSpawn();
  const severity = rnd(condition.severityMin, condition.severityMax);
  return {
    id: nextId++,
    name: pick(FIRST) + " " + pick(LAST),
    complaint: condition.complaint,
    severity,
    vitals: 100 - severity * rnd(BALANCE.startVitalsMinLoss, BALANCE.startVitalsMaxLoss),
    sat: 100,
    state: "waiting",
    dxCorrect: condition.dx,
    dxPicked: "",
    treatment: "",
    medication: "",
    procedure: "",
    emergency: false,
    neglect: 0,
    bounceBacks: 0
  };
}

function addLog(message, type) {
  const line = document.createElement("div");
  line.className = "event-line " + (type || "");
  line.textContent = "[" + shiftClockLabel() + "] " + message;
  logEl.prepend(line);
}

function showSpeech(text, ms) {
  speechEl.textContent = text;
  speechEl.classList.remove("hidden");
  if (speechTimer) clearTimeout(speechTimer);
  speechTimer = setTimeout(() => speechEl.classList.add("hidden"), ms || 2200);
}

function showOutcomeBanner(text, kind) {
  if (!outcomeBannerEl) return;
  outcomeBannerEl.textContent = text;
  outcomeBannerEl.classList.remove("hidden", "good", "bad");
  outcomeBannerEl.classList.add(kind === "bad" ? "bad" : "good");
  if (outcomeBannerTimer) clearTimeout(outcomeBannerTimer);
  outcomeBannerTimer = setTimeout(() => {
    outcomeBannerEl.classList.add("hidden");
  }, 1000);
}

function openMenu(title, subtitle, options) {
  game.menuOpen = true;
  menuTitleEl.textContent = title;
  menuSubtitleEl.textContent = subtitle;
  menuOptionsEl.innerHTML = "";
  menuButtons = [];
  menuIndex = -1;
  options.forEach((opt) => {
    const b = document.createElement("button");
    b.textContent = opt.label;
    b.disabled = Boolean(opt.disabled);
    b.addEventListener("click", () => {
      if (b.disabled) return;
      opt.action();
    });
    menuOptionsEl.appendChild(b);
    menuButtons.push(b);
  });
  syncMenuSelection(0);
  menuEl.classList.remove("hidden");
}

function closeMenu() {
  if (!game) return;
  game.menuOpen = false;
  menuButtons = [];
  menuIndex = -1;
  menuEl.classList.add("hidden");
}

function syncMenuSelection(direction) {
  if (!menuButtons.length) return;
  if (menuIndex < 0) {
    menuIndex = menuButtons.findIndex((b) => !b.disabled);
  } else if (direction !== 0) {
    let next = menuIndex;
    const step = direction > 0 ? 1 : -1;
    for (let i = 0; i < menuButtons.length; i++) {
      next = (next + step + menuButtons.length) % menuButtons.length;
      if (!menuButtons[next].disabled) {
        menuIndex = next;
        break;
      }
    }
  }

  menuButtons.forEach((b, i) => {
    const active = i === menuIndex;
    b.classList.toggle("menu-option-active", active);
    b.setAttribute("aria-selected", active ? "true" : "false");
  });
}

function activateSelectedMenuOption() {
  if (!game.menuOpen || menuIndex < 0 || !menuButtons[menuIndex]) return;
  const selected = menuButtons[menuIndex];
  if (selected.disabled) return;
  selected.click();
}

function queue(state) {
  return game.patients.filter((p) => p.state === state);
}

function stageCount(state) {
  return queue(state).length;
}

function canMoveToState(state) {
  const cap = STATION_CAPS[state];
  if (!cap) return true;
  return stageCount(state) < cap;
}

function scoreSat(v) {
  if (v >= 80) return 120;
  if (v >= 60) return 80;
  if (v >= 40) return 45;
  return 15;
}

function breakCombo(reason) {
  if (!game) return;
  if (game.combo > 0 && reason) addLog("Combo broken: " + reason + ".", "warn");
  game.combo = 0;
}

function completePatient(p, alive) {
  game.patients = game.patients.filter((x) => x.id !== p.id);
  game.done.push(p);
  game.seen += 1;
  if (alive) {
    game.saved += 1;
    const base = scoreSat(p.sat);
    const cleanCase = isDefinitiveCareComplete(p) && p.sat >= 70 && p.vitals >= 60 && p.bounceBacks === 0;
    const comboBonus = cleanCase ? Math.min(80, game.combo * 6) : 0;
    game.score += base + comboBonus;
    if (cleanCase) {
      game.combo += 1;
      showOutcomeBanner("SAVED: " + p.name + " | CLEAN +" + comboBonus + " | COMBO x" + game.combo, "good");
    } else {
      game.combo = Math.max(0, game.combo - 1);
      showOutcomeBanner("SAVED: " + p.name + " discharged/transfer complete", "good");
    }
  } else {
    game.lost += 1;
    game.score -= BALANCE.deathPenalty;
    breakCombo(p.name + " lost");
    showOutcomeBanner("LOST: " + p.name + " has died", "bad");
  }
}

function updateHud() {
  const avg = game.patients.length
    ? Math.round(game.patients.reduce((a, p) => a + p.sat, 0) / game.patients.length)
    : 100;
  hud.time.textContent = shiftClockLabel();
  hud.score.textContent = String(game.score);
  hud.seen.textContent = String(game.seen);
  hud.saved.textContent = String(game.saved);
  hud.lost.textContent = String(game.lost);
  hud.sat.textContent = String(avg);
  hud.supplies.textContent = String(game.supplies);
  hud.critical.textContent = String(
    game.patients.filter((p) => {
      const c = conditionForPatient(p);
      return p.severity >= 4 || p.vitals < 45 || (c && c.urgencyRank >= 4);
    }).length
  );
  hud.combo.textContent = String(game.combo);
  renderPatientMonitor();
}

function stationLabelFromState(state) {
  if (state === "waiting") return "Queue";
  if (state === "triaged") return "Triage";
  if (state === "diagnosed") return "Exam";
  if (state === "stabilized") return "Treatment";
  if (state === "treated") return "Pharmacy";
  if (state === "or") return "OR";
  return state;
}

function recommendedNextStep(p) {
  if (p.emergency) return "CODE -> OR now";
  if (p.state === "waiting") return "Triage";
  if (p.state === "triaged") return "Diagnose";
  if (p.state === "diagnosed") return "Stabilize";
  if (p.state === "or") return "Continue OR care";
  if (p.state === "stabilized") {
    const c = conditionForPatient(p);
    return c && c.definitiveCare === "procedure" ? "Definitive procedure" : "Give medication";
  }
  if (p.state === "treated") return needsAdmission(p) ? "Admit to ward" : "Discharge home";
  return "Review";
}

function sortedPatientsForMonitor() {
  return [...game.patients].sort((a, b) => {
    const ac = conditionForPatient(a);
    const bc = conditionForPatient(b);
    const aCritical = a.severity >= 4 || a.vitals < 45 || (ac && ac.urgencyRank >= 4);
    const bCritical = b.severity >= 4 || b.vitals < 45 || (bc && bc.urgencyRank >= 4);
    if (aCritical !== bCritical) return aCritical ? -1 : 1;
    if ((bc?.urgencyRank || 0) !== (ac?.urgencyRank || 0)) return (bc?.urgencyRank || 0) - (ac?.urgencyRank || 0);
    return a.vitals - b.vitals;
  });
}

function moveMonitorSelection(step) {
  const list = sortedPatientsForMonitor();
  if (!list.length) return;
  monitorMode = true;
  monitorIndex = (monitorIndex + step + list.length) % list.length;
  renderPatientMonitor();
}

function activateMonitorSelection() {
  const list = sortedPatientsForMonitor();
  if (!list.length) return;
  monitorMode = true;
  const selected = list[Math.max(0, Math.min(monitorIndex, list.length - 1))];
  performMonitorAction(selected.id);
  renderPatientMonitor();
}

function expectedDxFromComplaint(complaint) {
  const c = CONDITION_BY_COMPLAINT[complaint];
  return c ? c.dx : "Internal";
}

function bestPlanForPatient(p) {
  const c = conditionForPatient(p);
  const preferred = c ? TREATMENT_PLANS.find((plan) => plan.label === c.preferredPlan) : null;
  if (preferred && game.supplies >= preferred.supplyCost) return preferred;
  const fallback = TREATMENT_PLANS.find((plan) => p.severity >= 4 && plan.label === "Aggressive" && game.supplies >= plan.supplyCost);
  if (fallback) return fallback;
  const mid = TREATMENT_PLANS.find((plan) => p.severity >= 2 && plan.label === "Balanced" && game.supplies >= plan.supplyCost);
  if (mid) return mid;
  return TREATMENT_PLANS[TREATMENT_PLANS.length - 1];
}
function monitorActionLabel(p) {
  if (p.emergency) return "Code";
  if (p.state === "waiting") return "Triage";
  if (p.state === "triaged") return "Diagnose";
  if (p.state === "diagnosed") return "Treat";
  if (p.state === "or") return "OR Care";
  if (p.state === "stabilized") {
    const c = conditionForPatient(p);
    return c && c.definitiveCare === "procedure" ? "Procedure" : "Medicate";
  }
  if (p.state === "treated") return "Dispo";
  return "";
}

function openORCareMenu(p, sourceLabel) {
  const source = sourceLabel || "OR";
  if (p.state !== "or") return;
  const condition = conditionForPatient(p);

  if (!p.dxPicked) {
    openMenu(
      source + " Diagnose " + p.name,
      "Condition: " + p.complaint + " · " + urgencyIndicator(p),
      DX.map((d) => ({
        label: d,
        action: () => {
          const ok = d === p.dxCorrect;
          p.dxPicked = d;
          p.sat += ok ? 10 : -8;
          p.vitals += ok ? 14 : -10;
          game.score += ok ? 40 : -10;
          addLog(source + " diagnosis " + (ok ? "correct" : "wrong") + " for " + p.name + ".", ok ? "good" : "warn");
          closeMenu();
        }
      }))
    );
    return;
  }

  if (!p.treatment) {
    openMenu(
      source + " Stabilize " + p.name,
      "Select protocol (supply-limited)",
      TREATMENT_PLANS.map((plan) => ({
        label: plan.label + " (cost " + plan.supplyCost + ", stock " + game.supplies + ")",
        disabled: game.supplies < plan.supplyCost,
        action: () => {
          if (game.supplies < plan.supplyCost) {
            showSpeech("Not enough supplies.", 1000);
            closeMenu();
            return;
          }
          const mismatch = Math.abs(p.severity - plan.idealSeverity);
          const conditionPlanBonus = condition && condition.preferredPlan === plan.label ? 6 : -4;
          const fitBonus = mismatch <= 1 ? 8 : mismatch === 2 ? 0 : -10;
          game.supplies = Math.max(0, game.supplies - plan.supplyCost);
          p.vitals = Math.min(100, p.vitals + plan.vitals + 8 - p.severity);
          p.sat = Math.max(0, Math.min(100, p.sat + plan.sat + fitBonus / 2 + conditionPlanBonus / 2));
          p.treatment = plan.label;
          game.score += plan.pts + fitBonus + conditionPlanBonus;
          addLog(source + " stabilization: " + p.name + " " + plan.label + ".", fitBonus + conditionPlanBonus < 0 ? "warn" : "good");
          closeMenu();
        }
      }))
    );
    return;
  }

  if (!isDefinitiveCareComplete(p)) {
    if (condition && condition.definitiveCare === "procedure") {
      openMenu(
        source + " Procedure " + p.name,
        "Choose definitive procedure",
        PROCEDURE_OPTIONS.map((proc) => ({
          label: proc,
          action: () => {
            const correct = proc === condition.requiredProcedure;
            p.procedure = proc;
            if (correct) {
              p.vitals = Math.min(100, p.vitals + 22);
              p.sat = Math.min(100, p.sat + 9);
              game.score += 44;
              addLog(source + " procedure success for " + p.name + ".", "good");
            } else {
              p.vitals -= 10;
              p.sat -= 10;
              game.score -= 18;
              addLog(source + " procedure mismatch for " + p.name + ".", "warn");
            }
            closeMenu();
          }
        }))
      );
      return;
    }

    const meds = Object.values(MED_BY_DX);
    openMenu(
      source + " Medicate " + p.name,
      "Symptoms: " + p.complaint + " · " + urgencyIndicator(p),
      meds.map((med) => ({
        label: med,
        action: () => {
          const medOK = med === MED_BY_DX[p.dxCorrect];
          const dxOK = p.dxPicked === p.dxCorrect;
          p.medication = med;
          if (medOK) {
            p.vitals = Math.min(100, p.vitals + (dxOK ? 20 : 14));
            p.sat = Math.min(100, p.sat + (dxOK ? 10 : 6));
            game.score += dxOK ? 40 : 28;
            addLog(source + " medication match for " + p.name + ".", "good");
          } else {
            p.vitals -= 7;
            p.sat -= 7;
            game.score -= 12;
            addLog(source + " medication mismatch for " + p.name + ".", "warn");
          }
          closeMenu();
        }
      }))
    );
    return;
  }

  openMenu(source + " Transfer " + p.name, "Move patient out of OR to free capacity", [
    {
      label: "Move to Disposition Queue",
      action: () => {
        if (!canMoveToState("treated")) {
          showSpeech("Disposition full. Clear treated queue first.", 1200);
          closeMenu();
          return;
        }
        p.state = "treated";
        p.emergency = false;
        p.neglect = 0;
        game.score += 18;
        addLog(p.name + " moved out of OR to Disposition queue.", "good");
        closeMenu();
      }
    }
  ]);
}

function activateEmergencyCode(patientId, sourceLabel) {
  if (!game.emergency) {
    showSpeech("No active emergency call.", 1200);
    return;
  }
  const source = sourceLabel || "Code";
  const targetId = patientId || game.emergency.patientId;
  const p = game.patients.find((x) => x.id === targetId) || game.patients.find((x) => x.id === game.emergency.patientId);
  if (!p) {
    game.emergency = null;
    return;
  }
  if (!canMoveToState("or")) {
    addLog(source + " failed: OR full, " + p.name + " could not be boarded in time.", "bad");
    p.vitals = 0;
    p.emergency = false;
    game.emergency = null;
    breakCombo("OR unavailable for code");
    completePatient(p, false);
    return;
  }

  p.state = "or";
  p.emergency = false;
  p.neglect = 0;
  game.emergency = null;
  game.score += 24;
  addLog(source + ": " + p.name + " moved to OR immediately.", "good");
  refreshEmergencyVisuals();
  openORCareMenu(p, "OR");
}

function performMonitorAction(patientId) {
  const p = game.patients.find((x) => String(x.id) === String(patientId));
  if (!p || game.over) return;

  if (p.emergency) {
    activateEmergencyCode(p.id, "Monitor code");
    return;
  }

  if (p.state === "or") {
    openORCareMenu(p, "OR");
    return;
  }

  if (p.state === "waiting") {
    if (!canMoveToState("triaged")) return showSpeech("Triage full.", 1000);
    p.state = "triaged";
    p.sat = Math.min(100, p.sat + 10);
    game.score += 18;
    addLog("Triaged " + p.name + " via monitor.", "good");
    return;
  }

  if (p.state === "triaged") {
    if (!canMoveToState("diagnosed")) return showSpeech("Exam full.", 1000);
    openMenu(
      "Monitor Diagnose " + p.name,
      "Condition: " + p.complaint + " · " + urgencyIndicator(p),
      DX.map((d) => ({
        label: d,
        action: () => {
          const ok = d === p.dxCorrect;
          p.dxPicked = d;
          p.state = "diagnosed";
          p.sat += ok ? 14 : -8;
          p.vitals += ok ? 12 : -8;
          game.score += ok ? 45 : -8;
          addLog(p.name + " diagnosis " + (ok ? "correct" : "wrong") + " (" + d + ") via monitor.", ok ? "good" : "warn");
          closeMenu();
        }
      }))
    );
    return;
  }

  if (p.state === "diagnosed") {
    if (!canMoveToState("stabilized")) return showSpeech("Treatment full.", 1000);
    const plans = TREATMENT_PLANS;
    openMenu(
      "Monitor Treat " + p.name,
      "Select protocol",
      plans.map((plan) => ({
        label: plan.label + " (cost " + plan.supplyCost + ", stock " + game.supplies + ")",
        disabled: game.supplies < plan.supplyCost,
        action: () => {
          if (game.supplies < plan.supplyCost) {
            showSpeech("Not enough supplies.", 1000);
            closeMenu();
            return;
          }
          const condition = conditionForPatient(p);
          const mismatch = Math.abs(p.severity - plan.idealSeverity);
          const conditionPlanBonus = condition && condition.preferredPlan === plan.label ? 5 : -3;
          const fitBonus = mismatch <= 1 ? 6 : mismatch === 2 ? 0 : -8;
          game.supplies = Math.max(0, game.supplies - plan.supplyCost);
          p.vitals = Math.min(100, p.vitals + plan.vitals - p.severity * 2);
          p.sat = Math.max(0, Math.min(100, p.sat + plan.sat + fitBonus / 2 + conditionPlanBonus / 2));
          p.treatment = plan.label;
          p.state = "stabilized";
          game.score += plan.pts + fitBonus + conditionPlanBonus;
          addLog("Monitor treatment: " + p.name + " " + plan.label + ".", fitBonus + conditionPlanBonus < 0 ? "warn" : "good");
          closeMenu();
        }
      }))
    );
    return;
  }

  if (p.state === "stabilized") {
    if (!canMoveToState("treated")) return showSpeech("Disposition full.", 1000);
    const condition = conditionForPatient(p);
    if (condition && condition.definitiveCare === "procedure") {
      openMenu(
        "Monitor Procedure " + p.name,
        "Choose definitive procedure",
        PROCEDURE_OPTIONS.map((proc) => ({
          label: proc,
          action: () => {
            const correct = proc === condition.requiredProcedure;
            p.procedure = proc;
            if (correct) {
              p.state = "treated";
              p.vitals = Math.min(100, p.vitals + 20);
              p.sat = Math.min(100, p.sat + 8);
              game.score += 40;
              addLog("Monitor procedure success for " + p.name + ".", "good");
            } else {
              p.vitals -= 7;
              p.sat -= 8;
              game.score -= 14;
              addLog("Monitor procedure mismatch for " + p.name + ".", "warn");
            }
            closeMenu();
          }
        }))
      );
      return;
    }
    const meds = Object.values(MED_BY_DX);
    openMenu(
      "Monitor Medicate " + p.name,
      "Symptoms: " + p.complaint + " · " + urgencyIndicator(p),
      meds.map((med) => ({
        label: med,
        action: () => {
          const medOK = med === MED_BY_DX[p.dxCorrect];
          const dxOK = p.dxPicked === p.dxCorrect;
          p.medication = med;
          if (medOK) {
            p.state = "treated";
            p.vitals = Math.min(100, p.vitals + (dxOK ? 18 : 12));
            p.sat = Math.min(100, p.sat + (dxOK ? 12 : 7));
            game.score += dxOK ? 44 : 30;
            addLog("Monitor med match for " + p.name + ".", "good");
          } else {
            p.vitals -= 4;
            p.sat -= 4;
            game.score -= 8;
            breakCombo("wrong medication");
            addLog("Monitor med mismatch for " + p.name + ".", "warn");
          }
          closeMenu();
        }
      }))
    );
    return;
  }

  if (p.state === "treated") {
    const requiresAdmission = needsAdmission(p);
    const completeCare = isDefinitiveCareComplete(p);
    openMenu(
      "Monitor Disposition " + p.name,
      "Choose destination",
      [
        {
          label: "Discharge Home",
          action: () => {
            const unsafeHome = p.vitals < 45 || p.severity >= 4 || !completeCare || requiresAdmission;
            if (unsafeHome) {
              p.sat -= 12;
              p.vitals -= 8;
              game.score -= 18;
              p.bounceBacks += 1;
              breakCombo("unsafe discharge");
              addLog("Unsafe discharge sent " + p.name + " back to queue via monitor.", "bad");
              if (p.vitals <= 0) {
                completePatient(p, false);
              } else {
                p.sat = Math.max(0, p.sat - 12);
                p.state = "triaged";
              }
            } else {
              game.score += 36;
              addLog(p.name + " discharged via monitor.", "good");
              completePatient(p, true);
            }
            closeMenu();
          }
        },
        {
          label: "Admit to Ward",
          action: () => {
            if (!requiresAdmission) {
              p.sat = Math.max(0, p.sat - 14);
              game.score -= 12;
              breakCombo("unnecessary admission attempt");
              addLog("Admission rejected for " + p.name + " via monitor (no bed indication).", "warn");
            } else {
              game.score += 30;
              addLog(p.name + " admitted to ward via monitor.", "good");
              completePatient(p, true);
            }
            closeMenu();
          }
        }
      ]
    );
  }
}

function renderPatientMonitor() {
  if (!monitorListEl) return;
  if (!game || !game.patients.length) {
    monitorListEl.innerHTML = '<div class="monitor-empty">No active patients.</div>';
    return;
  }

  const sorted = sortedPatientsForMonitor();
  if (monitorIndex >= sorted.length) monitorIndex = sorted.length - 1;
  if (monitorIndex < 0) monitorIndex = 0;

  monitorListEl.innerHTML = sorted
    .map((p, idx) => {
      const vitals = Math.max(0, Math.min(100, p.vitals));
      const sat = Math.max(0, Math.min(100, p.sat));
      const c = conditionForPatient(p);
      const critical = p.severity >= 4 || vitals < 45 || (c && c.urgencyRank >= 4) ? " critical" : "";
      const emergency = p.emergency ? " emergency" : "";
      const active = monitorMode && idx === monitorIndex ? " active" : "";
      const conditionHint = c && c.cues.length ? c.cues[0] : "General symptoms";
      const urgency = c ? c.urgencyLabel : "Standard";
      const next = recommendedNextStep(p);
      return (
        '<div class="monitor-card' + critical + emergency + active + '" data-monitor-index="' + idx + '">' +
        '<div class="monitor-head">' +
        '<div class="monitor-name">' + p.name + "</div>" +
        '<div class="monitor-station">' + stationLabelFromState(p.state) + "</div>" +
        '<div class="monitor-sev">S' + p.severity + "</div>" +
        "</div>" +
        '<div class="monitor-meta">' +
        '<div>' + p.complaint + "</div>" +
        '<div>V ' + Math.round(vitals) + "</div>" +
        '<div>S ' + Math.round(sat) + "</div>" +
        "</div>" +
        '<div class="monitor-meta">' +
        "<div>" + urgency + "</div>" +
        "<div>" + conditionHint + "</div>" +
        "<div>" + clinicalLabel(p) + "</div>" +
        "</div>" +
        '<div class="monitor-meta">' +
        '<div><strong>Next:</strong> ' + next + "</div>" +
        '<div>N' + Math.round(p.neglect || 0) + "</div>" +
        '<div>' + (p.emergency ? "ALERT" : "") + "</div>" +
        "</div>" +
        '<div class="monitor-mini-bars">' +
        '<div class="monitor-bar"><span style="width:' + vitals + '%;background:' + (vitals < 45 ? "#ff748a" : "#7be495") + ';"></span></div>' +
        '<div class="monitor-bar"><span style="width:' + sat + '%;background:#8fd3ff;"></span></div>' +
        "</div>" +
        '<button class="monitor-action-btn" data-monitor-action="1" data-patient-id="' + p.id + '">' + monitorActionLabel(p) + "</button>" +
        "</div>"
      );
    })
    .join("");
}

function spawnPatient() {
  const p = makePatient();
  const condition = conditionForPatient(p);
  const cue = condition && condition.cues.length ? condition.cues[0] : "General symptoms";
  const urgency = condition ? condition.urgencyLabel : "Standard";
  game.patients.push(p);
  addLog(p.name + " arrived with " + p.complaint + " [" + urgency + "] - " + cue + " (sev " + p.severity + ").");
}

function nearestStation() {
  return STATIONS.find((s) => Math.abs(s.x - game.player.x) + Math.abs(s.y - game.player.y) <= 1);
}

function triageFlow() {
  const list = triageSort(queue("waiting"));
  openMenu(
    "Triage Desk",
    !canMoveToState("triaged") ? "Triage is full. Move patients to Exam." : list.length ? "Pick next patient" : "No one waiting",
    list.length
      ? list.map((p) => ({
          label: p.name + " sev " + p.severity + " · " + urgencyIndicator(p),
          disabled: !canMoveToState("triaged"),
          action: () => {
            p.state = "triaged";
            p.sat = Math.min(100, p.sat + 10);
            game.score += 18;
            addLog("Triaged " + p.name + " priority " + p.severity + ".", "good");
            showSpeech(p.name + ": Thank you.");
            closeMenu();
          }
        }))
      : [{ label: "No action", disabled: true, action: () => {} }]
  );
}

function examFlow() {
  const list = triageSort(queue("triaged"));
  openMenu(
    "Exam Room",
    !canMoveToState("diagnosed") ? "Exam is full. Move diagnosed patients to Treatment." : list.length ? "Choose patient to diagnose" : "No triaged patients",
    list.length
      ? list.map((p) => ({
          label: p.name + " " + p.complaint + " · " + urgencyIndicator(p),
          disabled: !canMoveToState("diagnosed"),
          action: () => {
            openMenu(
              "Diagnose " + p.name,
              "Condition: " + p.complaint + " · " + urgencyIndicator(p),
              DX.map((d) => ({
                label: d,
                action: () => {
                  if (!canMoveToState("diagnosed")) {
                    showSpeech("Exam queue full. Clear space first.", 1400);
                    closeMenu();
                    return;
                  }
                  p.dxPicked = d;
                  p.state = "diagnosed";
                  const ok = d === p.dxCorrect;
                  p.sat += ok ? 14 : -8;
                  p.vitals += ok ? 12 : -8;
                  game.score += ok ? 45 : -8;
                  addLog(p.name + " diagnosis " + (ok ? "correct" : "wrong") + " (" + d + ").", ok ? "good" : "warn");
                  closeMenu();
                }
              }))
            );
          }
        }))
      : [{ label: "No action", disabled: true, action: () => {} }]
  );
}

function treatmentFlow() {
  const list = triageSort(queue("diagnosed"));
  const plans = TREATMENT_PLANS;
  openMenu(
    "Treatment Bay",
    !canMoveToState("stabilized") ? "Treatment bays full. Move stabilized patients to Pharmacy." : list.length ? "Treat diagnosed patient" : "No diagnosed patients",
    list.length
      ? list.map((p) => ({
          label: p.name + " dx " + p.dxPicked + " · " + urgencyIndicator(p),
          disabled: !canMoveToState("stabilized"),
          action: () => {
            openMenu(
              "Treat " + p.name,
              "Select protocol (supply-limited)",
              plans.map((plan) => ({
                label: plan.label + " (cost " + plan.supplyCost + ", stock " + game.supplies + ")",
                disabled: game.supplies < plan.supplyCost || !canMoveToState("stabilized"),
                action: () => {
                  if (!canMoveToState("stabilized")) {
                    showSpeech("No treatment bay capacity.", 1200);
                    closeMenu();
                    return;
                  }
                  const condition = conditionForPatient(p);
                  const mismatch = Math.abs(p.severity - plan.idealSeverity);
                  const conditionPlanBonus = condition && condition.preferredPlan === plan.label ? 5 : -3;
                  const fitBonus = mismatch <= 1 ? 6 : mismatch === 2 ? 0 : -8;
                  game.supplies = Math.max(0, game.supplies - plan.supplyCost);
                  p.vitals = Math.min(100, p.vitals + plan.vitals - p.severity * 2);
                  p.sat = Math.max(0, Math.min(100, p.sat + plan.sat + fitBonus / 2 + conditionPlanBonus / 2));
                  p.treatment = plan.label;
                  p.state = "stabilized";
                  game.score += plan.pts + fitBonus + conditionPlanBonus;
                  addLog(
                    "Stabilized " +
                      p.name +
                      " with " +
                      plan.label +
                      (fitBonus + conditionPlanBonus < 0 ? " (undertreated)." : fitBonus + conditionPlanBonus > 0 ? " (good match)." : "."),
                    fitBonus + conditionPlanBonus < 0 ? "warn" : "good"
                  );
                  closeMenu();
                }
              }))
            );
          }
        }))
      : [{ label: "No action", disabled: true, action: () => {} }]
  );
}

function pharmacyFlow() {
  const list = triageSort(queue("stabilized"));
  const meds = Object.values(MED_BY_DX);
  openMenu(
    "Pharmacy",
    !canMoveToState("treated") ? "Disposition full. Clear treated patients first." : list.length ? "Medication or procedure based on condition" : "No stabilized cases waiting",
    list.length
      ? list.map((p) => ({
          label: p.name + " dx " + p.dxPicked + " · " + urgencyIndicator(p),
          disabled: !canMoveToState("treated"),
          action: () => {
            const condition = conditionForPatient(p);
            if (condition && condition.definitiveCare === "procedure") {
              openMenu(
                "Procedure " + p.name,
                "Select definitive procedure",
                PROCEDURE_OPTIONS.map((proc) => ({
                  label: proc,
                  action: () => {
                    const correct = proc === condition.requiredProcedure;
                    p.procedure = proc;
                    if (correct) {
                      if (!canMoveToState("treated")) {
                        showSpeech("No treated capacity right now.", 1200);
                        closeMenu();
                        return;
                      }
                      p.state = "treated";
                      p.vitals = Math.min(100, p.vitals + 20);
                      p.sat = Math.min(100, p.sat + 8);
                      game.score += 40;
                      addLog("Procedure success for " + p.name + ": " + proc + ".", "good");
                    } else {
                      p.state = "stabilized";
                      p.vitals -= 7;
                      p.sat -= 8;
                      game.score -= 14;
                      addLog("Procedure mismatch for " + p.name + " (" + proc + "). Try again.", "warn");
                    }
                    closeMenu();
                  }
                }))
              );
              return;
            }
            openMenu(
              "Medicate " + p.name,
              "Symptoms: " + p.complaint + " · " + urgencyIndicator(p),
              meds.map((med) => ({
                label: med,
                action: () => {
                  const correctMed = MED_BY_DX[p.dxCorrect];
                  const medOK = med === correctMed;
                  const dxOK = p.dxPicked === p.dxCorrect;
                  p.medication = med;

                  if (medOK) {
                    if (!canMoveToState("treated")) {
                      showSpeech("No treated capacity right now.", 1200);
                      closeMenu();
                      return;
                    }
                    p.state = "treated";
                    p.vitals = Math.min(100, p.vitals + (dxOK ? 18 : 12));
                    p.sat = Math.min(100, p.sat + (dxOK ? 12 : 7));
                    game.score += dxOK ? 44 : 30;
                    addLog("Medication match for " + p.name + ": " + med + ".", "good");
                  } else {
                    p.state = "stabilized";
                    p.vitals -= 4;
                    p.sat -= 4;
                    game.score -= 8;
                    breakCombo("wrong medication");
                    addLog("Medication mismatch for " + p.name + " (" + med + "). Try pharmacy again.", "warn");
                  }
                  closeMenu();
                }
              }))
            );
          }
        }))
      : [{ label: "No action", disabled: true, action: () => {} }]
  );
}

function dispoFlow() {
  const list = queue("treated");
  openMenu(
    "Disposition",
    list.length ? "Discharge home or admit to ward" : "No ready patients",
    list.length
      ? list.map((p) => ({
          label: p.name + " vitals " + Math.round(p.vitals) + " sev " + p.severity,
          action: () => {
            const requiresAdmission = needsAdmission(p);
            const completeCare = isDefinitiveCareComplete(p);
            openMenu("Disposition " + p.name, "Choose destination", [
              {
                label: "Discharge Home",
                action: () => {
                  const unsafeHome = p.vitals < 45 || p.severity >= 4 || !completeCare || requiresAdmission;
                  if (unsafeHome) {
                    p.sat -= 12;
                    p.vitals -= 8;
                    game.score -= 18;
                    p.bounceBacks += 1;
                    breakCombo("unsafe discharge");
                    addLog("Unsafe discharge sent " + p.name + " back to queue.", "bad");
                    if (p.vitals <= 0) {
                      completePatient(p, false);
                    } else {
                      p.sat = Math.max(0, p.sat - 12);
                      p.state = "triaged";
                    }
                  } else {
                    game.score += 36;
                    addLog(p.name + " discharged stable.", "good");
                    completePatient(p, true);
                  }
                  closeMenu();
                }
              },
              {
                label: "Admit to Ward",
                action: () => {
                  if (!requiresAdmission) {
                    p.sat = Math.max(0, p.sat - 14);
                    game.score -= 12;
                    breakCombo("unnecessary admission attempt");
                    addLog("Admission rejected for " + p.name + " (no bed indication).", "warn");
                  } else {
                    game.score += 30;
                    addLog(p.name + " admitted for further care.", "good");
                    completePatient(p, true);
                  }
                  closeMenu();
                }
              }
            ]);
          }
        }))
      : [{ label: "No action", disabled: true, action: () => {} }]
  );
}

function codeFlow() {
  if (game.emergency) {
    activateEmergencyCode(null, "Code station");
    return;
  }
  const inOR = triageSort(queue("or"));
  if (!inOR.length) {
    showSpeech("No active code and OR is empty.", 1200);
    return;
  }
  openMenu(
    "OR Suite",
    "Continue care and clear OR capacity",
    inOR.map((p) => ({
      label: p.name + " " + p.complaint + " V" + Math.round(p.vitals),
      action: () => openORCareMenu(p, "OR")
    }))
  );
}

function resolveEmergency(success) {
  if (!game.emergency) return;
  const p = game.patients.find((x) => x.id === game.emergency.patientId);
  if (success) {
    game.score += 35;
    addLog("Emergency resolved.", "good");
    if (p) {
      p.vitals = Math.min(100, p.vitals + 20);
      p.sat = Math.min(100, p.sat + 8);
      p.emergency = false;
    }
    showSpeech("Code resolved. Back to flow.");
  } else {
    game.score -= 25;
    addLog("Emergency missed. Critical delay caused severe collapse.", "bad");
    breakCombo("missed emergency");
    if (p) {
      p.emergency = false;
      p.vitals -= 35;
      p.sat -= 22;
      if (p.vitals <= 0) completePatient(p, false);
    }
  }
  game.emergency = null;
  refreshEmergencyVisuals();
}

function interactStation() {
  if (game.over || game.menuOpen) return;
  const s = nearestStation();
  if (!s) {
    showSpeech("Move next to a station and press Space.", 1200);
    return;
  }
  if (s.id === "triage") triageFlow();
  else if (s.id === "exam") examFlow();
  else if (s.id === "treat") treatmentFlow();
  else if (s.id === "pharmacy") pharmacyFlow();
  else if (s.id === "dispo") dispoFlow();
  else if (s.id === "or") codeFlow();
}

function maybeEmergency() {
  if (game.emergency) return;
  const candidates = game.patients.filter((p) => {
    const condition = conditionForPatient(p);
    const highRisk = p.severity >= 5 || p.vitals < 30 || (p.severity >= 4 && condition && condition.urgencyRank >= 4);
    const neglected = p.neglect >= BALANCE.neglectEmergencyThreshold;
    return !p.emergency && p.state !== "treated" && highRisk && neglected;
  });
  if (!candidates.length) return;
  const p = triageSort(candidates)[0];
  const triggerChance = p.neglect >= BALANCE.neglectEmergencyThreshold + 8 ? 0.7 : 0.35;
  if (Math.random() > triggerChance) return;
  p.emergency = true;
  p.neglect = 0;
  game.emergency = { patientId: p.id, left: rnd(BALANCE.emergencyTimerMin, BALANCE.emergencyTimerMax) };
  addLog("CODE BLUE: " + p.name + " deteriorated from delayed care (" + p.complaint + ").", "bad");
  showOutcomeBanner("CODE BLUE: " + p.name + " -> OR NOW", "bad");
  showSpeech("Emergency from delayed care. Respond now.");
}

function refreshEmergencyVisuals() {
  if (!game || !game.patients) return;
  game.patients.forEach((p) => {
    p.emergency = game.emergency ? p.id === game.emergency.patientId : false;
  });
}

function stepSim() {
  if (game.over || tutorialOpen) return;
  game.left = Math.max(0, game.left - 1);
  const elapsed = SHIFT_SECONDS - game.left;
  const openingRamp = Math.min(1, elapsed / 120);
  const openingPressure = 0.62 + 0.38 * openingRamp;
  game.spawnCd -= 1;
  game.supplyCd -= 1;

  if (game.supplyCd <= 0) {
    game.supplies = Math.min(BALANCE.maxSupplies, game.supplies + 1);
    game.supplyCd = BALANCE.supplyRegenSeconds;
  }

  if (game.spawnCd <= 0) {
    if (canMoveToState("waiting")) {
      spawnPatient();
    } else {
      addLog("Ambulance hold: waiting area at capacity.", "warn");
    }
    const spawnMinNow = Math.round(BALANCE.spawnMin + (1 - openingRamp) * 12);
    const spawnMaxNow = Math.round(BALANCE.spawnMax + (1 - openingRamp) * 16);
    game.spawnCd = rnd(spawnMinNow, spawnMaxNow);
  }

  if (elapsed >= 90) maybeEmergency();
  refreshEmergencyVisuals();
  if (game.emergency) {
    game.emergency.left -= 1;
    if (game.emergency.left <= 0) resolveEmergency(false);
  }

  game.patients.forEach((p) => {
    const condition = conditionForPatient(p);
    const satMult = condition ? condition.satPressure : 1;
    const vitalsMult = condition ? condition.vitalsPressure : 1;
    const satDecay =
      (p.state === "waiting" ? 0.28 : p.state === "triaged" ? 0.19 : p.state === "diagnosed" ? 0.14 : p.state === "stabilized" ? 0.11 : p.state === "or" ? 0.08 : p.state === "treated" ? 0.09 : 0.05) +
      p.severity * 0.045;
    p.sat = Math.max(0, p.sat - satDecay * satMult * openingPressure);

    const drain =
      p.state === "waiting" ? p.severity * 0.09 : p.state === "triaged" ? p.severity * 0.06 : p.state === "diagnosed" ? p.severity * 0.045 : p.state === "stabilized" ? p.severity * 0.03 : p.state === "or" ? p.severity * 0.01 : 0.02;
    p.vitals -= (drain + (p.emergency ? 0.8 : 0)) * vitalsMult * openingPressure;

    const highRisk = p.severity >= 4 || p.vitals < 50;
    const neglectedState = p.state === "waiting" || p.state === "triaged" || p.state === "diagnosed";
    if (highRisk && neglectedState) {
      p.neglect += 1 + (p.state === "waiting" ? 1 : 0);
    } else {
      p.neglect = Math.max(0, p.neglect - 2);
    }
  });

  game.patients
    .filter((p) => p.vitals <= 0)
    .forEach((p) => {
      addLog(p.name + " coded and could not be revived.", "bad");
      completePatient(p, false);
    });

  if (game.left === 0) finishShift();
  updateHud();
}

function finishShift() {
  game.over = true;
  closeMenu();
  const avg = game.done.length ? Math.round(game.done.reduce((a, p) => a + p.sat, 0) / game.done.length) : 0;
  game.score += Math.max(0, avg - 45) + game.saved * 10 - game.lost * 2;
  updateHud();
  summaryEl.textContent = "Score " + game.score + " | Saved " + game.saved + " | Lost " + game.lost + " | Avg satisfaction " + avg + "% | Throughput " + game.seen;
  gameOverEl.classList.remove("hidden");
  addLog("Shift complete. Optimize your next run.", "warn");
}

function move(dx, dy, facing) {
  if (game.menuOpen || game.over) return;
  game.player.facing = facing;
  const nx = game.player.x + dx;
  const ny = game.player.y + dy;
  if (nx < 1 || ny < 1 || nx > MAP_W - 2 || ny > MAP_H - 2) return;
  game.player.x = nx;
  game.player.y = ny;
}

function drawSprite(sprite, colors, px, py, scale) {
  for (let y = 0; y < sprite.length; y++) {
    const row = sprite[y];
    for (let x = 0; x < row.length; x++) {
      const key = row[x];
      if (key === ".") continue;
      ctx.fillStyle = colors[key] || "#ffffff";
      ctx.fillRect(px + x * scale, py + y * scale, scale, scale);
    }
  }
}

function drawMiniSprite(sprite, colors, px, py, scale) {
  for (let y = 0; y < sprite.length; y++) {
    const row = sprite[y];
    for (let x = 0; x < row.length; x++) {
      const key = row[x];
      if (key === ".") continue;
      tutorialCtx.fillStyle = colors[key] || "#ffffff";
      tutorialCtx.fillRect(px + x * scale, py + y * scale, scale, scale);
    }
  }
}

function drawTutorialArt() {
  tutorialCtx.clearRect(0, 0, tutorialArt.width, tutorialArt.height);
  tutorialCtx.fillStyle = "#1a2748";
  tutorialCtx.fillRect(0, 0, tutorialArt.width, tutorialArt.height);
  tutorialCtx.fillStyle = "#29416d";
  tutorialCtx.fillRect(0, 34, tutorialArt.width, 18);
  tutorialCtx.fillStyle = "rgba(180,200,240,0.08)";
  for (let x = 0; x < tutorialArt.width; x += 18) {
    tutorialCtx.fillRect(x, 0, 2, tutorialArt.height);
  }

  drawMiniSprite(SPRITES.doctor, { y: "#f3d17a", s: "#f4d6be", e: "#1d2740", w: "#f7fbff", b: "#355ba8" }, 22, 20, 3);
  drawMiniSprite(SPRITES.patient, { p: "#a8b7d4", h: "#cfb49d", e: "#1c2438", g: "#5d7db8" }, 72, 20, 3);
  drawMiniSprite(SPRITES.monitor, { d: "#34415f", g: "#52f0a8", s: "#7f95b8" }, 130, 22, 3);
  drawMiniSprite(SPRITES.bed, { r: "#7f95b8", w: "#e9f0ff" }, 188, 18, 3);
  drawMiniSprite(SPRITES.medPack, { r: "#b63d52", w: "#f7f7ff" }, 262, 22, 3);

  tutorialCtx.fillStyle = "#d9ecff";
  tutorialCtx.font = "bold 12px Courier New";
  tutorialCtx.fillText("TRIAGE", 14, 84);
  tutorialCtx.fillText("DIAGNOSE", 88, 84);
  tutorialCtx.fillText("TREAT", 182, 84);
  tutorialCtx.fillText("DISPO", 248, 84);
}

function setTutorial(open) {
  tutorialOpen = open;
  tutorialEl.classList.toggle("hidden", !open);
}

function drawArtifact(kind, tx, ty) {
  const x = tx * TILE + 4;
  const y = ty * TILE + 4;
  if (kind === "bed") {
    drawSprite(SPRITES.bed, { r: "#7f95b8", w: "#e9f0ff" }, x, y, 3);
    return;
  }
  if (kind === "medPack") {
    drawSprite(SPRITES.medPack, { r: "#b63d52", w: "#f7f7ff" }, x, y, 3);
    return;
  }
  if (kind === "monitor") {
    drawSprite(SPRITES.monitor, { d: "#34415f", g: "#52f0a8", s: "#7f95b8" }, x, y, 3);
    return;
  }
  if (kind === "board") {
    drawSprite(SPRITES.board, { y: "#d7c98d", t: "#2d4063", s: "#7f95b8" }, x, y, 3);
  }
}

function drawPatient(tx, ty, p) {
  const x = tx * TILE + 4;
  const y = ty * TILE + 4;
  const hue = 120 - Math.max(0, Math.min(100, p.vitals)) * 1.2;
  const skin = "hsl(" + hue + ",55%,75%)";
  drawSprite(
    SPRITES.patient,
    { p: "#a8b7d4", h: skin, e: "#1c2438", g: "#5d7db8" },
    x,
    y,
    3
  );
  if (p.emergency) {
    ctx.fillStyle = "#ff5d73";
    ctx.fillRect(tx * TILE + 4, ty * TILE + 2, 24, 4);
    drawComplaintBubble(tx * TILE + 1, ty * TILE - 12, "Code!", true);
    return;
  }

  const bubble = getPatientBubbleText(p);
  if (bubble) {
    drawComplaintBubble(tx * TILE + 1, ty * TILE - 12, bubble, p.severity >= 4 || p.sat < 55);
  }

  drawPatientBars(tx * TILE + 5, ty * TILE + 25, p);
}

function drawPatientBars(x, y, p) {
  const w = 22;
  const vitals = Math.max(0, Math.min(100, p.vitals));
  const sat = Math.max(0, Math.min(100, p.sat));
  const severityHue = p.severity >= 4 ? "#ff7b8e" : p.severity >= 3 ? "#ffd166" : "#7be495";

  ctx.fillStyle = "#0f1730";
  ctx.fillRect(x, y, w, 3);
  ctx.fillStyle = severityHue;
  ctx.fillRect(x, y, Math.round((w * vitals) / 100), 3);

  ctx.fillStyle = "#0f1730";
  ctx.fillRect(x, y + 4, w, 3);
  ctx.fillStyle = "#8fd3ff";
  ctx.fillRect(x, y + 4, Math.round((w * sat) / 100), 3);
}

function getPatientBubbleText(p) {
  if (p.state !== "waiting" && p.state !== "triaged") return "";
  const blink = (Math.floor(game.left / 3) + p.id) % 3 === 0;
  if (!blink) return "";

  if (p.sat < 45) return "Please hurry...";
  if (p.severity >= 4) return "Need help now!";
  const options = (conditionForPatient(p) && conditionForPatient(p).bubbles) || ["It hurts..."];
  return options[p.id % options.length];
}

function drawComplaintBubble(x, y, text, urgent) {
  const width = Math.max(46, text.length * 6 + 8);
  const height = 14;
  ctx.fillStyle = urgent ? "#ffe7ea" : "#f5f8ff";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = urgent ? "#c9536a" : "#9eb8de";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  ctx.fillStyle = urgent ? "#7f1f31" : "#1d2740";
  ctx.font = "10px Courier New";
  ctx.fillText(text, x + 4, y + 10);
}

function drawPlayer() {
  const x = game.player.x * TILE + 4;
  const y = game.player.y * TILE + 4;
  drawSprite(
    SPRITES.doctor,
    { y: "#f3d17a", s: "#f4d6be", e: "#1d2740", w: "#f7fbff", b: "#355ba8" },
    x,
    y,
    3
  );
  const dir = DIR_OFFSETS[game.player.facing] || [0, 1];
  ctx.fillStyle = "#8fd3ff";
  ctx.fillRect(game.player.x * TILE + 14 + dir[0] * 8, game.player.y * TILE + 14 + dir[1] * 8, 4, 4);
}

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const border = x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1;
      const hallBand = y === 6 || y === 7 || y === 8;
      if (border) {
        ctx.fillStyle = "#223058";
      } else if (hallBand) {
        ctx.fillStyle = (x + y) % 2 ? "#23375d" : "#29416d";
      } else {
        ctx.fillStyle = (x + y) % 2 ? "#1a2748" : "#1d2a4f";
      }
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      if (!border && !hallBand && x % 2 === 0 && y % 2 === 0) {
        ctx.fillStyle = "rgba(180,200,240,0.06)";
        ctx.fillRect(x * TILE + 6, y * TILE + 6, 4, 4);
      }
    }
  }

  STATIONS.forEach((s) => {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(s.x * TILE + 1, s.y * TILE + 1, TILE - 2, TILE - 2);
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x * TILE + 4, s.y * TILE + 4, TILE - 8, TILE - 8);
    ctx.fillStyle = "#091223";
    ctx.font = "10px Courier New";
    ctx.fillText(s.name.split(" ")[0], s.x * TILE + 2, s.y * TILE - 2);
  });

  ARTIFACTS.forEach((a) => drawArtifact(a.kind, a.x, a.y));

  queue("waiting").forEach((p, i) => drawPatient(1 + (i % 2), 2 + Math.floor(i / 2), p));
  queue("triaged").forEach((p, i) => drawPatient(7, 2 + i, p));
  queue("diagnosed").forEach((p, i) => drawPatient(12, 2 + i, p));
  queue("stabilized").forEach((p, i) => drawPatient(2, 9 + i, p));
  queue("treated").forEach((p, i) => drawPatient(7, 9 + i, p));
  queue("or").forEach((p, i) => drawPatient(12 + (i % 2), 9 + Math.floor(i / 2), p));

  drawPlayer();

  const s = nearestStation();
  if (s && !game.menuOpen && !game.over) {
    ctx.fillStyle = "#fff";
    ctx.font = "12px Courier New";
    ctx.fillText("SPACE: " + s.name, 8, canvas.height - 10);
  }

  if (game.emergency) {
    ctx.fillStyle = "#ff5d73";
    ctx.font = "bold 14px Courier New";
    ctx.fillText("EMERGENCY " + game.emergency.left + "s", canvas.width - 220, 18);
  }

  ctx.fillStyle = "#d9ecff";
  ctx.font = "bold 12px Courier New";
  ctx.fillText("ART PASS v2", 8, 16);
}

function tick(ts) {
  if (!lastTick) lastTick = ts;
  const dt = (ts - lastTick) / 1000;
  lastTick = ts;
  acc += dt;
  while (acc >= 1) {
    stepSim();
    acc -= 1;
  }
  drawMap();
  requestAnimationFrame(tick);
}

function initGame() {
  game = {
    player: { x: 2, y: 7, facing: "down" },
    left: SHIFT_SECONDS,
    score: 0,
    seen: 0,
    saved: 0,
    lost: 0,
    patients: [],
    done: [],
    combo: 0,
    spawnCd: 2,
    supplies: BALANCE.maxSupplies,
    supplyCd: BALANCE.supplyRegenSeconds,
    emergency: null,
    menuOpen: false,
    over: false
  };
  logEl.innerHTML = "";
  closeMenu();
  speechEl.classList.add("hidden");
  if (outcomeBannerEl) {
    outcomeBannerEl.classList.add("hidden");
    outcomeBannerEl.classList.remove("good", "bad");
  }
  gameOverEl.classList.add("hidden");
  for (let i = 0; i < 3; i++) spawnPatient();
  game.left = SHIFT_SECONDS;
  addLog("Shift begins. Keep the ER flowing.", "warn");
  updateHud();
  drawTutorialArt();
  if (!localStorage.getItem(TUTORIAL_SEEN_KEY)) {
    setTutorial(true);
    localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
  } else {
    setTutorial(false);
  }
}

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Enter", "Escape", "w", "a", "s", "d", "W", "A", "S", "D", "m", "M"].includes(e.key)) e.preventDefault();
  if (tutorialOpen && e.key !== "Escape") return;
  if (tutorialOpen && e.key === "Escape") return setTutorial(false);
  if (e.key === "m" || e.key === "M") {
    monitorMode = !monitorMode;
    showSpeech(monitorMode ? "Monitor mode: Arrow Up/Down + Enter/Space" : "Monitor mode off", 1200);
    renderPatientMonitor();
    return;
  }
  if (e.key === "Escape") {
    if (game.menuOpen) return closeMenu();
    if (monitorMode) {
      monitorMode = false;
      renderPatientMonitor();
      showSpeech("Monitor mode off", 900);
    }
    return;
  }
  if (game.menuOpen) {
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") return syncMenuSelection(-1);
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") return syncMenuSelection(1);
    if (e.key === "Enter" || e.key === " ") return activateSelectedMenuOption();
    return;
  }
  if (monitorMode) {
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") return moveMonitorSelection(-1);
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") return moveMonitorSelection(1);
    if (e.key === "Enter" || e.key === " ") return activateMonitorSelection();
    if (e.key === "Escape") {
      monitorMode = false;
      renderPatientMonitor();
      return;
    }
    return;
  }
  if (e.key === " " || e.key === "Enter") return interactStation();
  if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") move(0, -1, "up");
  if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") move(0, 1, "down");
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") move(-1, 0, "left");
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") move(1, 0, "right");
});

closeMenuBtn.addEventListener("click", closeMenu);
restartBtn.addEventListener("click", initGame);
helpBtn.addEventListener("click", () => {
  drawTutorialArt();
  setTutorial(true);
});
tutorialCloseBtn.addEventListener("click", () => setTutorial(false));
tutorialStartBtn.addEventListener("click", () => setTutorial(false));
if (monitorListEl) {
  monitorListEl.addEventListener("click", (e) => {
    const card = e.target.closest("[data-monitor-index]");
    if (card) {
      monitorIndex = Number(card.getAttribute("data-monitor-index")) || 0;
      renderPatientMonitor();
    }
    const target = e.target.closest("[data-monitor-action]");
    if (!target) return;
    performMonitorAction(target.getAttribute("data-patient-id"));
    updateHud();
  });
}

initGame();
requestAnimationFrame(tick);
