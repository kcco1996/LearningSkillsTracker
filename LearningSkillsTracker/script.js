/* Learning & Skills Tracker
   - localStorage persistence
   - Skills with progress bars
   - Projects log
   - KSB library + evidence
   - Notes/certs
   - Weekly reflections
*/

const STORAGE_KEY = "lst_app_v1";

const el = (id) => document.getElementById(id);
const nowISO = () => new Date().toISOString();
const safeTrim = (s) => (s || "").toString().trim();
const splitTags = (s) =>
  safeTrim(s)
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);

function uid(prefix="id"){
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

const DEFAULT_STATE = {
  skills: [
    { id: uid("skill"), name: "Python", category: "Python", progress: 35, goal: "Comfortable writing clean scripts + notebooks", createdAt: nowISO() },
    { id: uid("skill"), name: "SQL", category: "Data Science", progress: 25, goal: "Joins, CTEs, window functions", createdAt: nowISO() },
    { id: uid("skill"), name: "Power BI", category: "Power BI", progress: 20, goal: "DAX + model design + dashboards", createdAt: nowISO() },
  ],
  projects: [
    { id: uid("proj"), name: "KSB Notebook Exercises", type: "University", skills: ["Python", "ML"], ksbs: ["B1","B5"], learned: "Built consistent workflow for practice notebooks.", status: "In progress", createdAt: nowISO() }
  ],
  ksbLibrary: [
    { id: uid("ksb"), code: "B1", text: "An inquisitive approach: curiosity, tenacity, creativity in solutions.", createdAt: nowISO() },
    { id: uid("ksb"), code: "B5", text: "Impartial, scientific, hypothesis-driven approach with integrity.", createdAt: nowISO() },
  ],
  evidence: [
    { id: uid("ev"), title: "Built ETL import with validation checks", ksbs: ["B5"], notes: "Handled missing values + unit cleanup + reporting.", createdAt: nowISO() }
  ],
  notes: [
    { id: uid("note"), title: "Random Forest", tags: ["ML","Trees"], link: "", body: "Bagging ensemble. Key knobs: n_estimators, max_depth, max_features.", createdAt: nowISO() }
  ],
  reflections: [
    { id: uid("ref"), week: "Week of 2026-01-26", learned: "Stayed consistent. Improved SQL joins. Refactored JS modules.", next: "Do 1 ML notebook + one small app feature.", createdAt: nowISO() }
  ]
};

let state = loadState();

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);

    // lightweight sanity defaults
    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      ksbLibrary: Array.isArray(parsed.ksbLibrary) ? parsed.ksbLibrary : [],
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      reflections: Array.isArray(parsed.reflections) ? parsed.reflections : [],
    };
  }catch{
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

function setPillSummary(){
  const skills = state.skills.length;
  const projects = state.projects.length;
  const done = state.projects.filter(p => p.status === "Completed").length;
  el("pillSummary").textContent = `${skills} skills • ${projects} projects • ${done} completed`;
}

/* ---------------- Views (Navigation) ---------------- */
const viewTitles = {
  dashboard: ["Dashboard", "Your real-life skill tree."],
  skills: ["Skills", "Progress bars for what you’re learning."],
  projects: ["Projects", "Your output log + learning proof."],
  ksb: ["KSB Mapping", "Evidence log aligned to KSBs."],
  notes: ["Notes & Certs", "Your searchable knowledge bank."],
  reflection: ["Weekly Reflection", "What did you learn this week?"],
};

function showView(name){
  document.querySelectorAll(".nav__item").forEach(b => b.classList.remove("is-active"));
  document.querySelector(`.nav__item[data-view="${name}"]`)?.classList.add("is-active");

  document.querySelectorAll(".view").forEach(v => v.classList.remove("is-active"));
  el(`view-${name}`)?.classList.add("is-active");

  const [t, s] = viewTitles[name] || ["", ""];
  el("viewTitle").textContent = t;
  el("viewSubtitle").textContent = s;
}

document.querySelectorAll(".nav__item").forEach(btn=>{
  btn.addEventListener("click", ()=> showView(btn.dataset.view));
});

/* ---------------- Render helpers ---------------- */
function esc(s){
  return (s ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function renderTags(tags){
  if(!tags || !tags.length) return "";
  return `<div class="tags">${tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>`;
}

function renderProgressBar(percent){
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  return `
    <div class="progress">
      <div class="progress__row">
        <span>Progress</span>
        <span>${p}%</span>
      </div>
      <div class="bar"><div style="width:${p}%"></div></div>
    </div>
  `;
}

function sortByNewest(a,b){
  return (b.createdAt || "").localeCompare(a.createdAt || "");
}

/* ---------------- Dashboard ---------------- */
function renderDashboard(){
  // Top skills: show top 5 by progress
  const top = [...state.skills].sort((a,b)=> (b.progress||0) - (a.progress||0)).slice(0,5);
  el("dashTopSkills").innerHTML = top.length ? top.map(sk => `
    <div class="item">
      <div class="item__top">
        <div>
          <p class="item__title">${esc(sk.name)}</p>
          <p class="item__meta">${esc(sk.category)} • ${esc(sk.goal || "—")}</p>
          ${renderProgressBar(sk.progress)}
        </div>
      </div>
    </div>
  `).join("") : `<div class="item"><p class="item__meta">No skills yet.</p></div>`;

  // This week stats (simple snapshot)
  const skillsAvg = state.skills.length
    ? Math.round(state.skills.reduce((sum,s)=> sum + (Number(s.progress)||0), 0) / state.skills.length)
    : 0;

  const completed = state.projects.filter(p => p.status === "Completed").length;
  const evidenceCount = state.evidence.length;

  el("dashStats").innerHTML = `
    <div class="stat">
      <div class="stat__num">${skillsAvg}%</div>
      <div class="stat__label">Avg skill progress</div>
    </div>
    <div class="stat">
      <div class="stat__num">${completed}</div>
      <div class="stat__label">Projects completed</div>
    </div>
    <div class="stat">
      <div class="stat__num">${evidenceCount}</div>
      <div class="stat__label">KSB evidence items</div>
    </div>
  `;

  // Recent projects
  const recent = [...state.projects].sort(sortByNewest).slice(0,6);
  el("dashRecentProjects").innerHTML = recent.length ? recent.map(p => `
    <div class="item">
      <div class="item__top">
        <div>
          <p class="item__title">${esc(p.name)}</p>
          <p class="item__meta">${esc(p.type)} • ${esc(p.status)} • ${new Date(p.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      ${renderTags([...(p.skills||[]), ...(p.ksbs||[])])}
    </div>
  `).join("") : `<div class="item"><p class="item__meta">No projects yet.</p></div>`;
}

/* ---------------- Skills ---------------- */
function renderSkills(){
  const q = safeTrim(el("skillSearch").value).toLowerCase();
  const filter = el("skillFilter").value;

  const rows = state.skills
    .filter(s => filter === "all" ? true : s.category === filter)
    .filter(s => !q ? true : `${s.name} ${s.goal||""} ${s.category}`.toLowerCase().includes(q))
    .sort((a,b)=> (b.progress||0) - (a.progress||0));

  el("skillsList").innerHTML = rows.length ? rows.map(s => `
    <div class="item">
      <div class="item__top">
        <div>
          <p class="item__title">${esc(s.name)}</p>
          <p class="item__meta">${esc(s.category)} • ${esc(s.goal || "—")}</p>
        </div>
        <div class="actions">
          <button class="iconbtn" title="Minus 5%" data-skill-dec="${esc(s.id)}">−5</button>
          <button class="iconbtn" title="Plus 5%" data-skill-inc="${esc(s.id)}">+5</button>
          <button class="iconbtn" title="Delete" data-skill-del="${esc(s.id)}">🗑️</button>
        </div>
      </div>

      ${renderProgressBar(s.progress)}
    </div>
  `).join("") : `<div class="item"><p class="item__meta">No skills yet. Add one on the left.</p></div>`;

  // bind actions
  document.querySelectorAll("[data-skill-inc]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-skill-inc");
      adjustSkill(id, +5);
    });
  });
  document.querySelectorAll("[data-skill-dec]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-skill-dec");
      adjustSkill(id, -5);
    });
  });
  document.querySelectorAll("[data-skill-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-skill-del");
      deleteSkill(id);
    });
  });
}

function adjustSkill(id, delta){
  const s = state.skills.find(x => x.id === id);
  if(!s) return;
  s.progress = Math.max(0, Math.min(100, (Number(s.progress)||0) + delta));
  saveState();
}

function deleteSkill(id){
  state.skills = state.skills.filter(s => s.id !== id);
  saveState();
}

el("skillForm").addEventListener("submit", (e)=>{
  e.preventDefault();
  const name = safeTrim(el("skillName").value);
  const category = el("skillCategory").value;
  const progress = Math.max(0, Math.min(100, Number(el("skillProgress").value) || 0));
  const goal = safeTrim(el("skillGoal").value);

  state.skills.unshift({ id: uid("skill"), name, category, progress, goal, createdAt: nowISO() });
  e.target.reset();
  el("skillProgress").value = 10;
  saveState();
});

el("skillSearch").addEventListener("input", renderSkills);
el("skillFilter").addEventListener("change", renderSkills);

/* ---------------- Projects ---------------- */
function renderProjects(){
  const q = safeTrim(el("projectSearch").value).toLowerCase();
  const filter = el("projectFilter").value;

  const rows = state.projects
    .filter(p => filter === "all" ? true : p.type === filter)
    .filter(p => !q ? true : `${p.name} ${p.type} ${(p.skills||[]).join(" ")} ${(p.ksbs||[]).join(" ")} ${p.learned||""}`.toLowerCase().includes(q))
    .sort(sortByNewest);

  el("projectsList").innerHTML = rows.length ? rows.map(p => `
    <div class="item">
      <div class="item__top">
        <div>
          <p class="item__title">${esc(p.name)}</p>
          <p class="item__meta">${esc(p.type)} • ${esc(p.status)} • ${new Date(p.createdAt).toLocaleDateString()}</p>
        </div>
        <div class="actions">
          <button class="iconbtn" title="Toggle status" data-proj-toggle="${esc(p.id)}">✅</button>
          <button class="iconbtn" title="Delete" data-proj-del="${esc(p.id)}">🗑️</button>
        </div>
      </div>

      ${p.learned ? `<p class="item__meta">${esc(p.learned)}</p>` : ""}

      ${renderTags([...(p.skills||[]), ...(p.ksbs||[])])}
    </div>
  `).join("") : `<div class="item"><p class="item__meta">No projects yet. Add one on the left.</p></div>`;

  document.querySelectorAll("[data-proj-toggle]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-proj-toggle");
      toggleProjectStatus(id);
    });
  });

  document.querySelectorAll("[data-proj-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-proj-del");
      state.projects = state.projects.filter(p => p.id !== id);
      saveState();
    });
  });
}

function toggleProjectStatus(id){
  const p = state.projects.find(x => x.id === id);
  if(!p) return;
  const order = ["In progress", "Completed", "Paused"];
  const idx = order.indexOf(p.status);
  p.status = order[(idx + 1 + order.length) % order.length];
  saveState();
}

el("projectForm").addEventListener("submit", (e)=>{
  e.preventDefault();
  const name = safeTrim(el("projName").value);
  const type = el("projType").value;
  const skills = splitTags(el("projSkills").value);
  const ksbs = splitTags(el("projKsbs").value).map(x => x.toUpperCase());
  const learned = safeTrim(el("projLearned").value);
  const status = el("projStatus").value;

  state.projects.unshift({ id: uid("proj"), name, type, skills, ksbs, learned, status, createdAt: nowISO() });
  e.target.reset();
  saveState();
});

el("projectSearch").addEventListener("input", renderProjects);
el("projectFilter").addEventListener("change", renderProjects);

/* ---------------- KSB ---------------- */
function renderKSB(){
  // KSB list with evidence counts
  const counts = {};
  state.evidence.forEach(ev => (ev.ksbs || []).forEach(k => counts[k] = (counts[k]||0) + 1));

  const lib = [...state.ksbLibrary].sort((a,b)=> a.code.localeCompare(b.code));
  el("ksbList").innerHTML = lib.length ? lib.map(k => `
    <div class="item">
      <div class="item__top">
        <div>
          <p class="item__title">${esc(k.code)} <span class="tag">${counts[k.code] || 0} evidence</span></p>
          <p class="item__meta">${esc(k.text)}</p>
        </div>
        <div class="actions">
          <button class="iconbtn" title="Delete" data-ksb-del="${esc(k.id)}">🗑️</button>
        </div>
      </div>
    </div>
  `).join("") : `<div class="item"><p class="item__meta">No KSBs yet. Add one on the left.</p></div>`;

  document.querySelectorAll("[data-ksb-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-ksb-del");
      state.ksbLibrary = state.ksbLibrary.filter(k => k.id !== id);
      saveState();
    });
  });

  // Evidence list
  const q = safeTrim(el("evidenceSearch").value).toLowerCase();
  const evRows = [...state.evidence]
    .filter(ev => !q ? true : `${ev.title} ${(ev.ksbs||[]).join(" ")} ${ev.notes||""}`.toLowerCase().includes(q))
    .sort(sortByNewest);

  el("evidenceList").innerHTML = evRows.length ? evRows.map(ev => `
    <div class="item">
      <div class="item__top">
        <div>
          <p class="item__title">${esc(ev.title)}</p>
          <p class="item__meta">${new Date(ev.createdAt).toLocaleDateString()}</p>
        </div>
        <div class="actions">
          <button class="iconbtn" title="Delete" data-ev-del="${esc(ev.id)}">🗑️</button>
        </div>
      </div>
      ${ev.notes ? `<p class="item__meta">${esc(ev.notes)}</p>` : ""}
      ${renderTags(ev.ksbs || [])}
    </div>
  `).join("") : `<div class="item"><p class="item__meta">No evidence logged yet.</p></div>`;

  document.querySelectorAll("[data-ev-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-ev-del");
      state.evidence = state.evidence.filter(ev => ev.id !== id);
      saveState();
    });
  });
}

el("ksbForm").addEventListener("submit", (e)=>{
  e.preventDefault();
  const code = safeTrim(el("ksbCode").value).toUpperCase();
  const text = safeTrim(el("ksbText").value);

  state.ksbLibrary.push({ id: uid("ksb"), code, text, createdAt: nowISO() });
  e.target.reset();
  saveState();
});

el("evidenceForm").addEventListener("submit", (e)=>{
  e.preventDefault();
  const title = safeTrim(el("evTitle").value);
  const ksbs = splitTags(el("evKsbs").value).map(x => x.toUpperCase());
  const notes = safeTrim(el("evNotes").value);

  state.evidence.unshift({ id: uid("ev"), title, ksbs, notes, createdAt: nowISO() });
  e.target.reset();
  saveState();
});

el("evidenceSearch").addEventListener("input", renderKSB);

/* ---------------- Notes ---------------- */
function renderNotes(){
  const q = safeTrim(el("noteSearch").value).toLowerCase();
  const rows = [...state.notes]
    .filter(n => !q ? true : `${n.title} ${(n.tags||[]).join(" ")} ${n.body||""} ${n.link||""}`.toLowerCase().includes(q))
    .sort(sortByNewest);

  el("notesList").innerHTML = rows.length ? rows.map(n => `
    <div class="item">
      <div class="item__top">
        <div>
          <p class="item__title">${esc(n.title)}</p>
          <p class="item__meta">
            ${new Date(n.createdAt).toLocaleDateString()}
            ${n.link ? ` • <a class="smalllink" href="${esc(n.link)}" target="_blank" rel="noopener">Open link</a>` : ""}
          </p>
        </div>
        <div class="actions">
          <button class="iconbtn" title="Delete" data-note-del="${esc(n.id)}">🗑️</button>
        </div>
      </div>
      ${n.body ? `<p class="item__meta">${esc(n.body)}</p>` : ""}
      ${renderTags(n.tags || [])}
    </div>
  `).join("") : `<div class="item"><p class="item__meta">No notes yet. Add one on the left.</p></div>`;

  document.querySelectorAll("[data-note-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-note-del");
      state.notes = state.notes.filter(n => n.id !== id);
      saveState();
    });
  });
}

el("noteForm").addEventListener("submit", (e)=>{
  e.preventDefault();
  const title = safeTrim(el("noteTitle").value);
  const tags = splitTags(el("noteTags").value);
  const link = safeTrim(el("noteLink").value);
  const body = safeTrim(el("noteBody").value);

  state.notes.unshift({ id: uid("note"), title, tags, link, body, createdAt: nowISO() });
  e.target.reset();
  saveState();
});

el("noteSearch").addEventListener("input", renderNotes);

/* ---------------- Reflections ---------------- */
function renderReflections(){
  const rows = [...state.reflections].sort(sortByNewest);

  el("reflectionList").innerHTML = rows.length ? rows.map(r => `
    <div class="item">
      <div class="item__top">
        <div>
          <p class="item__title">${esc(r.week || "Weekly Reflection")}</p>
          <p class="item__meta">${new Date(r.createdAt).toLocaleDateString()}</p>
        </div>
        <div class="actions">
          <button class="iconbtn" title="Delete" data-ref-del="${esc(r.id)}">🗑️</button>
        </div>
      </div>

      ${r.learned ? `<p class="item__meta"><strong>Learned:</strong> ${esc(r.learned)}</p>` : ""}
      ${r.next ? `<p class="item__meta"><strong>Next:</strong> ${esc(r.next)}</p>` : ""}
    </div>
  `).join("") : `<div class="item"><p class="item__meta">No reflections yet.</p></div>`;

  document.querySelectorAll("[data-ref-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-ref-del");
      state.reflections = state.reflections.filter(r => r.id !== id);
      saveState();
    });
  });
}

el("reflectionForm").addEventListener("submit", (e)=>{
  e.preventDefault();
  const week = safeTrim(el("refWeek").value);
  const learned = safeTrim(el("refLearned").value);
  const next = safeTrim(el("refNext").value);

  state.reflections.unshift({ id: uid("ref"), week, learned, next, createdAt: nowISO() });
  e.target.reset();
  saveState();
});

/* ---------------- Export / Import / Reset ---------------- */
el("btnExport").addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "learning-skills-tracker-export.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

el("importFile").addEventListener("change", async (e)=>{
  const file = e.target.files?.[0];
  if(!file) return;

  try{
    const text = await file.text();
    const parsed = JSON.parse(text);

    // Accept if it looks like our shape
    if(!parsed || typeof parsed !== "object") throw new Error("Invalid JSON.");
    state = {
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      ksbLibrary: Array.isArray(parsed.ksbLibrary) ? parsed.ksbLibrary : [],
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      reflections: Array.isArray(parsed.reflections) ? parsed.reflections : [],
    };

    saveState();
    e.target.value = "";
    alert("Import complete.");
  }catch(err){
    alert("Import failed. Make sure it’s a valid export JSON file.");
  }
});

el("btnReset").addEventListener("click", ()=>{
  const ok = confirm("Reset EVERYTHING? This clears all skills, projects, notes, KSBs, evidence, reflections.");
  if(!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(DEFAULT_STATE);
  saveState();
});

/* ---------------- Render all ---------------- */
function renderAll(){
  setPillSummary();
  renderDashboard();
  renderSkills();
  renderProjects();
  renderKSB();
  renderNotes();
  renderReflections();
}

renderAll();
showView("dashboard");

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}