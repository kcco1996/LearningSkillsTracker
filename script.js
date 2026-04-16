(() => {
  "use strict";

  const STORAGE_KEY = "learning_skills_tracker_v1";

  const $ = (id) => document.getElementById(id);
  const nowISO = () => new Date().toISOString();

  function uid(prefix = "id") {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }

  function safeTrim(value) {
    return (value || "").toString().trim();
  }

  function splitTags(value) {
    return safeTrim(value)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  function escapeHtml(value) {
    return (value ?? "")
      .toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString();
  }

  const DEFAULT_STATE = {
    skills: [],
    projects: [],
    ksbLibrary: [],
    evidence: [],
    notes: [],
    reflections: []
  };

  let state = loadState();

  const viewMeta = {
    dashboard: {
      title: "Dashboard",
      subtitle: "Your real-life skill tree."
    },
    skills: {
      title: "Skills",
      subtitle: "Track the things you are learning and how far you have come."
    },
    projects: {
      title: "Projects",
      subtitle: "Log your output, practice, and completed work."
    },
    ksb: {
      title: "KSB Mapping",
      subtitle: "Map your work and study evidence to KSBs."
    },
    notes: {
      title: "Notes & Certs",
      subtitle: "Keep useful notes, concepts, and certificate links in one place."
    },
    reflection: {
      title: "Weekly Reflection",
      subtitle: "Capture what you learned this week and what comes next."
    }
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);

      const parsed = JSON.parse(raw);

      return {
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        ksbLibrary: Array.isArray(parsed.ksbLibrary) ? parsed.ksbLibrary : [],
        evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        reflections: Array.isArray(parsed.reflections) ? parsed.reflections : []
      };
    } catch (error) {
      console.error("Could not load saved data:", error);
      return structuredClone(DEFAULT_STATE);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderAll();
  }

  function renderSummary() {
    const text = `${state.skills.length} skills • ${state.projects.length} projects • ${state.notes.length} notes`;
    $("pillSummary").textContent = text;
  }

  function showView(viewName) {
    document.querySelectorAll(".nav__item").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.view === viewName);
    });

    document.querySelectorAll(".view").forEach((view) => {
      view.classList.toggle("is-active", view.id === `view-${viewName}`);
    });

    const meta = viewMeta[viewName];
    if (meta) {
      $("viewTitle").textContent = meta.title;
      $("viewSubtitle").textContent = meta.subtitle;
    }
  }

  function renderTags(tags) {
    if (!tags || !tags.length) return "";
    return `
      <div class="tags">
        ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
    `;
  }

  function renderProgressBar(percent) {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    return `
      <div class="progress">
        <div class="progress__row">
          <span>Progress</span>
          <span>${p}%</span>
        </div>
        <div class="bar">
          <div style="width:${p}%"></div>
        </div>
      </div>
    `;
  }

  function newestFirst(a, b) {
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  }

function renderDashboard() {
  const topSkillsEl = $("dashTopSkills");
  const dashStatsEl = $("dashStats");
  const recentProjectsEl = $("dashRecentProjects");
  const weakKsbsEl = $("dashWeakKsbs");
  const nextStepEl = $("dashNextStep");

  const topSkills = [...state.skills]
    .sort((a, b) => (Number(b.progress) || 0) - (Number(a.progress) || 0))
    .slice(0, 5);

  if (topSkills.length) {
    topSkillsEl.innerHTML = topSkills.map((skill) => `
      <div class="item">
        <div class="item__top">
          <div>
            <p class="item__title">${escapeHtml(skill.name)}</p>
            <p class="item__meta">${escapeHtml(skill.category)} • ${escapeHtml(skill.goal || "No goal set")}</p>
          </div>
        </div>
        ${renderProgressBar(skill.progress)}
      </div>
    `).join("");
  } else {
    topSkillsEl.innerHTML = `<div class="empty-state">No skills added yet.</div>`;
  }

  const avgProgress = state.skills.length
    ? Math.round(
        state.skills.reduce((sum, skill) => sum + (Number(skill.progress) || 0), 0) / state.skills.length
      )
    : 0;

  const completedProjects = state.projects.filter((p) => p.status === "Completed").length;
  const evidenceCount = state.evidence.length;

  dashStatsEl.innerHTML = `
    <div class="stat">
      <div class="stat__num">${avgProgress}%</div>
      <div class="stat__label">Avg skill progress</div>
    </div>
    <div class="stat">
      <div class="stat__num">${completedProjects}</div>
      <div class="stat__label">Projects completed</div>
    </div>
    <div class="stat">
      <div class="stat__num">${evidenceCount}</div>
      <div class="stat__label">KSB evidence items</div>
    </div>
  `;

  const recentProjects = [...state.projects].sort(newestFirst).slice(0, 6);

  if (recentProjects.length) {
    recentProjectsEl.innerHTML = recentProjects.map((project) => `
      <div class="item">
        <div class="item__top">
          <div>
            <p class="item__title">${escapeHtml(project.name)}</p>
            <p class="item__meta">${escapeHtml(project.type)} • ${escapeHtml(project.status)} • ${formatDate(project.createdAt)}</p>
          </div>
        </div>
        ${renderTags([...(project.skills || []), ...(project.ksbs || [])])}
      </div>
    `).join("");
  } else {
    recentProjectsEl.innerHTML = `<div class="empty-state">No projects logged yet.</div>`;
  }

  // Lowest KSB Coverage
  const ksbCounts = {};
  state.ksbLibrary.forEach((ksb) => {
    ksbCounts[ksb.code] = 0;
  });

  state.evidence.forEach((ev) => {
    (ev.ksbs || []).forEach((code) => {
      if (ksbCounts[code] === undefined) {
        ksbCounts[code] = 0;
      }
      ksbCounts[code] += 1;
    });
  });

  const weakestKsbs = Object.entries(ksbCounts)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);

  if (weakestKsbs.length) {
    weakKsbsEl.innerHTML = weakestKsbs.map(([code, count]) => {
      const ksb = state.ksbLibrary.find((x) => x.code === code);
      return `
        <div class="item">
          <div class="item__top">
            <div>
              <p class="item__title">${escapeHtml(code)}</p>
              <p class="item__meta">${escapeHtml(ksb?.text || "No description available")}</p>
            </div>
            <div class="tag">${count} evidence</div>
          </div>
        </div>
      `;
    }).join("");
  } else {
    weakKsbsEl.innerHTML = `<div class="empty-state">Add KSBs and evidence to see coverage gaps.</div>`;
  }

  // Suggested Next Step
  let suggestionTitle = "Start building momentum";
  let suggestionText = "Add your first skill, project, KSB, or note so the tracker can start guiding you.";

  if (state.skills.length && state.skills.some((s) => (Number(s.progress) || 0) < 40)) {
    const lowestSkill = [...state.skills].sort((a, b) => (Number(a.progress) || 0) - (Number(b.progress) || 0))[0];
    suggestionTitle = `Boost ${lowestSkill.name}`;
    suggestionText = `${lowestSkill.name} is currently at ${lowestSkill.progress}%. A good next move would be one focused study session or a small project using this skill.`;
  } else if (state.ksbLibrary.length && weakestKsbs.length && weakestKsbs[0][1] === 0) {
    suggestionTitle = `Add evidence for ${weakestKsbs[0][0]}`;
    suggestionText = `${weakestKsbs[0][0]} has no evidence yet. Log one task, uni activity, or project outcome against it next.`;
  } else if (state.projects.length && state.projects.some((p) => p.status === "In progress")) {
    const inProgress = state.projects.find((p) => p.status === "In progress");
    suggestionTitle = `Move ${inProgress.name} forward`;
    suggestionText = `You already have work in motion. A useful next step would be finishing or updating ${inProgress.name}.`;
  } else if (state.reflections.length === 0) {
    suggestionTitle = "Write your first reflection";
    suggestionText = "Add a weekly reflection so the app starts capturing what you are actually learning over time.";
  }

  nextStepEl.innerHTML = `
    <div class="item">
      <p class="item__title">${escapeHtml(suggestionTitle)}</p>
      <p class="item__meta">${escapeHtml(suggestionText)}</p>
    </div>
  `;
}

  function renderSkills() {
    const q = safeTrim($("skillSearch").value).toLowerCase();
    const filter = $("skillFilter").value;

    const rows = [...state.skills]
      .filter((skill) => filter === "all" ? true : skill.category === filter)
      .filter((skill) => {
        const haystack = `${skill.name} ${skill.category} ${skill.goal || ""}`.toLowerCase();
        return !q || haystack.includes(q);
      })
      .sort((a, b) => (Number(b.progress) || 0) - (Number(a.progress) || 0));

    const listEl = $("skillsList");

    if (!rows.length) {
      listEl.innerHTML = `<div class="empty-state">No matching skills yet.</div>`;
      return;
    }

    listEl.innerHTML = rows.map((skill) => `
      <div class="item">
        <div class="item__top">
          <div>
            <p class="item__title">${escapeHtml(skill.name)}</p>
            <p class="item__meta">${escapeHtml(skill.category)} • ${escapeHtml(skill.goal || "No goal set")}</p>
          </div>
          <div class="actions">
            <button class="iconbtn" data-skill-dec="${skill.id}" title="Decrease progress">−5</button>
            <button class="iconbtn" data-skill-inc="${skill.id}" title="Increase progress">+5</button>
            <button class="iconbtn" data-skill-del="${skill.id}" title="Delete skill">🗑️</button>
          </div>
        </div>
        ${renderProgressBar(skill.progress)}
      </div>
    `).join("");

    document.querySelectorAll("[data-skill-inc]").forEach((btn) => {
      btn.addEventListener("click", () => adjustSkill(btn.dataset.skillInc, 5));
    });

    document.querySelectorAll("[data-skill-dec]").forEach((btn) => {
      btn.addEventListener("click", () => adjustSkill(btn.dataset.skillDec, -5));
    });

    document.querySelectorAll("[data-skill-del]").forEach((btn) => {
      btn.addEventListener("click", () => deleteSkill(btn.dataset.skillDel));
    });
  }

  function adjustSkill(id, delta) {
    const skill = state.skills.find((s) => s.id === id);
    if (!skill) return;
    skill.progress = Math.max(0, Math.min(100, (Number(skill.progress) || 0) + delta));
    saveState();
  }

  function deleteSkill(id) {
    state.skills = state.skills.filter((s) => s.id !== id);
    saveState();
  }

  function renderProjects() {
    const q = safeTrim($("projectSearch").value).toLowerCase();
    const filter = $("projectFilter").value;

    const rows = [...state.projects]
      .filter((project) => filter === "all" ? true : project.type === filter)
      .filter((project) => {
        const haystack = `
          ${project.name}
          ${project.type}
          ${(project.skills || []).join(" ")}
          ${(project.ksbs || []).join(" ")}
          ${project.learned || ""}
          ${project.status || ""}
        `.toLowerCase();

        return !q || haystack.includes(q);
      })
      .sort(newestFirst);

    const listEl = $("projectsList");

    if (!rows.length) {
      listEl.innerHTML = `<div class="empty-state">No matching projects yet.</div>`;
      return;
    }

    listEl.innerHTML = rows.map((project) => `
      <div class="item">
        <div class="item__top">
          <div>
            <p class="item__title">${escapeHtml(project.name)}</p>
            <p class="item__meta">${escapeHtml(project.type)} • ${escapeHtml(project.status)} • ${formatDate(project.createdAt)}</p>
          </div>
          <div class="actions">
            <button class="iconbtn" data-project-toggle="${project.id}" title="Toggle status">✅</button>
            <button class="iconbtn" data-project-del="${project.id}" title="Delete project">🗑️</button>
          </div>
        </div>
        ${project.learned ? `<p class="item__meta">${escapeHtml(project.learned)}</p>` : ""}
        ${renderTags([...(project.skills || []), ...(project.ksbs || [])])}
      </div>
    `).join("");

    document.querySelectorAll("[data-project-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => toggleProjectStatus(btn.dataset.projectToggle));
    });

    document.querySelectorAll("[data-project-del]").forEach((btn) => {
      btn.addEventListener("click", () => deleteProject(btn.dataset.projectDel));
    });
  }

  function toggleProjectStatus(id) {
    const project = state.projects.find((p) => p.id === id);
    if (!project) return;

    const order = ["In progress", "Completed", "Paused"];
    const current = order.indexOf(project.status);
    project.status = order[(current + 1 + order.length) % order.length];

    saveState();
  }

  function deleteProject(id) {
    state.projects = state.projects.filter((p) => p.id !== id);
    saveState();
  }

  function renderKSB() {
    const counts = {};
    state.evidence.forEach((ev) => {
      (ev.ksbs || []).forEach((k) => {
        counts[k] = (counts[k] || 0) + 1;
      });
    });

    const ksbRows = [...state.ksbLibrary].sort((a, b) => a.code.localeCompare(b.code));
    const ksbListEl = $("ksbList");

    if (!ksbRows.length) {
      ksbListEl.innerHTML = `<div class="empty-state">No KSBs added yet.</div>`;
    } else {
      ksbListEl.innerHTML = ksbRows.map((ksb) => `
        <div class="item">
          <div class="item__top">
            <div>
              <p class="item__title">${escapeHtml(ksb.code)}</p>
              <p class="item__meta">${escapeHtml(ksb.text)}</p>
              <p class="item__meta">${counts[ksb.code] || 0} evidence item(s)</p>
            </div>
            <div class="actions">
              <button class="iconbtn" data-ksb-del="${ksb.id}" title="Delete KSB">🗑️</button>
            </div>
          </div>
        </div>
      `).join("");

      document.querySelectorAll("[data-ksb-del]").forEach((btn) => {
        btn.addEventListener("click", () => deleteKSB(btn.dataset.ksbDel));
      });
    }

    const q = safeTrim($("evidenceSearch").value).toLowerCase();
    const evidenceRows = [...state.evidence]
      .filter((ev) => {
        const haystack = `${ev.title} ${(ev.ksbs || []).join(" ")} ${ev.notes || ""}`.toLowerCase();
        return !q || haystack.includes(q);
      })
      .sort(newestFirst);

    const evidenceListEl = $("evidenceList");

    if (!evidenceRows.length) {
      evidenceListEl.innerHTML = `<div class="empty-state">No matching evidence yet.</div>`;
    } else {
      evidenceListEl.innerHTML = evidenceRows.map((ev) => `
        <div class="item">
          <div class="item__top">
            <div>
              <p class="item__title">${escapeHtml(ev.title)}</p>
              <p class="item__meta">${formatDate(ev.createdAt)}</p>
            </div>
            <div class="actions">
              <button class="iconbtn" data-evidence-del="${ev.id}" title="Delete evidence">🗑️</button>
            </div>
          </div>
          ${ev.notes ? `<p class="item__meta">${escapeHtml(ev.notes)}</p>` : ""}
          ${renderTags(ev.ksbs || [])}
        </div>
      `).join("");

      document.querySelectorAll("[data-evidence-del]").forEach((btn) => {
        btn.addEventListener("click", () => deleteEvidence(btn.dataset.evidenceDel));
      });
    }
  }

  function deleteKSB(id) {
    state.ksbLibrary = state.ksbLibrary.filter((k) => k.id !== id);
    saveState();
  }

  function deleteEvidence(id) {
    state.evidence = state.evidence.filter((ev) => ev.id !== id);
    saveState();
  }

  function renderNotes() {
    const q = safeTrim($("noteSearch").value).toLowerCase();

    const rows = [...state.notes]
      .filter((note) => {
        const haystack = `${note.title} ${(note.tags || []).join(" ")} ${note.body || ""} ${note.link || ""}`.toLowerCase();
        return !q || haystack.includes(q);
      })
      .sort(newestFirst);

    const listEl = $("notesList");

    if (!rows.length) {
      listEl.innerHTML = `<div class="empty-state">No matching notes yet.</div>`;
      return;
    }

    listEl.innerHTML = rows.map((note) => `
      <div class="item">
        <div class="item__top">
          <div>
            <p class="item__title">${escapeHtml(note.title)}</p>
            <p class="item__meta">
              ${formatDate(note.createdAt)}
              ${note.link ? ` • <a class="smalllink" href="${escapeHtml(note.link)}" target="_blank" rel="noopener">Open link</a>` : ""}
            </p>
          </div>
          <div class="actions">
            <button class="iconbtn" data-note-del="${note.id}" title="Delete note">🗑️</button>
          </div>
        </div>
        ${note.body ? `<p class="item__meta">${escapeHtml(note.body)}</p>` : ""}
        ${renderTags(note.tags || [])}
      </div>
    `).join("");

    document.querySelectorAll("[data-note-del]").forEach((btn) => {
      btn.addEventListener("click", () => deleteNote(btn.dataset.noteDel));
    });
  }

  function deleteNote(id) {
    state.notes = state.notes.filter((n) => n.id !== id);
    saveState();
  }

  function renderReflections() {
    const rows = [...state.reflections].sort(newestFirst);
    const listEl = $("reflectionList");

    if (!rows.length) {
      listEl.innerHTML = `<div class="empty-state">No reflections yet.</div>`;
      return;
    }

    listEl.innerHTML = rows.map((ref) => `
      <div class="item">
        <div class="item__top">
          <div>
            <p class="item__title">${escapeHtml(ref.week || "Weekly Reflection")}</p>
            <p class="item__meta">${formatDate(ref.createdAt)}</p>
          </div>
          <div class="actions">
            <button class="iconbtn" data-reflection-del="${ref.id}" title="Delete reflection">🗑️</button>
          </div>
        </div>
        ${ref.learned ? `<p class="item__meta"><strong>Learned:</strong> ${escapeHtml(ref.learned)}</p>` : ""}
        ${ref.next ? `<p class="item__meta"><strong>Next:</strong> ${escapeHtml(ref.next)}</p>` : ""}
      </div>
    `).join("");

    document.querySelectorAll("[data-reflection-del]").forEach((btn) => {
      btn.addEventListener("click", () => deleteReflection(btn.dataset.reflectionDel));
    });
  }

  function deleteReflection(id) {
    state.reflections = state.reflections.filter((r) => r.id !== id);
    saveState();
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "learning-skills-tracker-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);

        state = {
          skills: Array.isArray(parsed.skills) ? parsed.skills : [],
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          ksbLibrary: Array.isArray(parsed.ksbLibrary) ? parsed.ksbLibrary : [],
          evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
          notes: Array.isArray(parsed.notes) ? parsed.notes : [],
          reflections: Array.isArray(parsed.reflections) ? parsed.reflections : []
        };

        saveState();
        alert("Import complete.");
      } catch (error) {
        alert("That file could not be imported. Please use a valid JSON export.");
      }
    };

    reader.readAsText(file);
  }

  function resetEverything() {
    const confirmed = confirm(
      "Reset everything? This will permanently clear all app data saved in this browser."
    );

    if (!confirmed) return;

    state = structuredClone(DEFAULT_STATE);
    localStorage.removeItem(STORAGE_KEY);
    saveState();
    alert("All data has been reset.");
  }

  function bindForms() {
    $("skillForm").addEventListener("submit", (event) => {
      event.preventDefault();

      const name = safeTrim($("skillName").value);
      const category = $("skillCategory").value;
      const progress = Math.max(0, Math.min(100, Number($("skillProgress").value) || 0));
      const goal = safeTrim($("skillGoal").value);

      state.skills.unshift({
        id: uid("skill"),
        name,
        category,
        progress,
        goal,
        createdAt: nowISO()
      });

      event.target.reset();
      $("skillProgress").value = 10;
      saveState();
    });

    $("projectForm").addEventListener("submit", (event) => {
      event.preventDefault();

      const name = safeTrim($("projName").value);
      const type = $("projType").value;
      const skills = splitTags($("projSkills").value);
      const ksbs = splitTags($("projKsbs").value).map((x) => x.toUpperCase());
      const learned = safeTrim($("projLearned").value);
      const status = $("projStatus").value;

      state.projects.unshift({
        id: uid("project"),
        name,
        type,
        skills,
        ksbs,
        learned,
        status,
        createdAt: nowISO()
      });

      event.target.reset();
      saveState();
    });

    $("ksbForm").addEventListener("submit", (event) => {
      event.preventDefault();

      const code = safeTrim($("ksbCode").value).toUpperCase();
      const text = safeTrim($("ksbText").value);

      state.ksbLibrary.push({
        id: uid("ksb"),
        code,
        text,
        createdAt: nowISO()
      });

      event.target.reset();
      saveState();
    });

    $("evidenceForm").addEventListener("submit", (event) => {
      event.preventDefault();

      const title = safeTrim($("evTitle").value);
      const ksbs = splitTags($("evKsbs").value).map((x) => x.toUpperCase());
      const notes = safeTrim($("evNotes").value);

      state.evidence.unshift({
        id: uid("evidence"),
        title,
        ksbs,
        notes,
        createdAt: nowISO()
      });

      event.target.reset();
      saveState();
    });

    $("noteForm").addEventListener("submit", (event) => {
      event.preventDefault();

      const title = safeTrim($("noteTitle").value);
      const tags = splitTags($("noteTags").value);
      const link = safeTrim($("noteLink").value);
      const body = safeTrim($("noteBody").value);

      state.notes.unshift({
        id: uid("note"),
        title,
        tags,
        link,
        body,
        createdAt: nowISO()
      });

      event.target.reset();
      saveState();
    });

    $("reflectionForm").addEventListener("submit", (event) => {
      event.preventDefault();

      const week = safeTrim($("refWeek").value);
      const learned = safeTrim($("refLearned").value);
      const next = safeTrim($("refNext").value);

      state.reflections.unshift({
        id: uid("reflection"),
        week,
        learned,
        next,
        createdAt: nowISO()
      });

      event.target.reset();
      saveState();
    });
  }

  function bindFilters() {
    $("skillSearch").addEventListener("input", renderSkills);
    $("skillFilter").addEventListener("change", renderSkills);

    $("projectSearch").addEventListener("input", renderProjects);
    $("projectFilter").addEventListener("change", renderProjects);

    $("evidenceSearch").addEventListener("input", renderKSB);
    $("noteSearch").addEventListener("input", renderNotes);
  }

  function bindNavigation() {
    document.querySelectorAll(".nav__item").forEach((btn) => {
      btn.addEventListener("click", () => showView(btn.dataset.view));
    });
  }

  function bindDataButtons() {
    $("btnExport").addEventListener("click", exportData);

    $("importFile").addEventListener("change", (event) => {
      const file = event.target.files[0];
      importData(file);
      event.target.value = "";
    });

    $("btnReset").addEventListener("click", resetEverything);
  }

  function renderAll() {
    renderSummary();
    renderDashboard();
    renderSkills();
    renderProjects();
    renderKSB();
    renderNotes();
    renderReflections();
  }

  function init() {
    bindNavigation();
    bindForms();
    bindFilters();
    bindDataButtons();
    renderAll();
    showView("dashboard");
  }

  init();
})();