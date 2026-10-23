
"use strict";



const STORAGE_KEYS = {
  applications: "applywise_applications_v1",
  roadmap: "applywise_roadmap_v1"
};

const defaultRoadmap = [
  { id: "topic-1", title: "JavaScript fundamentals", done: false },
  { id: "topic-2", title: "DOM and event handling", done: false },
  { id: "topic-3", title: "Array methods and ES6+", done: false },
  { id: "topic-4", title: "Fetch API and async/await", done: false },
  { id: "topic-5", title: "Git and GitHub", done: false },
  { id: "topic-6", title: "Build and deploy a project", done: false }
];

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.error("Could not load saved data:", error);
    return fallback;
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Could not save data:", error);
    showToast("Could not save data. Check browser storage.");
    return false;
  }
}

let applications = loadData(STORAGE_KEYS.applications, []);
let roadmap = loadData(STORAGE_KEYS.roadmap, defaultRoadmap);

if (!Array.isArray(applications)) applications = [];
if (!Array.isArray(roadmap)) roadmap = defaultRoadmap;



const applicationList = document.getElementById("applicationList");
const applicationMessage = document.getElementById("applicationMessage");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

const dialog = document.getElementById("internshipDialog");
const internshipForm = document.getElementById("internshipForm");

const companyInput = document.getElementById("company");
const roleInput = document.getElementById("role");
const deadlineInput = document.getElementById("deadline");
const applicationStatus = document.getElementById("applicationStatus");
const jobLinkInput = document.getElementById("jobLink");
const editIdInput = document.getElementById("editId");
const dialogTitle = document.getElementById("dialogTitle");

const roadmapList = document.getElementById("roadmapList");
const roadmapForm = document.getElementById("roadmapForm");
const newTopicInput = document.getElementById("newTopic");

const toast = document.getElementById("toast");

let toastTimer;


function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function isValidJobUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2600);
}

function saveApplications() {
  return saveData(STORAGE_KEYS.applications, applications);
}

function saveRoadmap() {
  return saveData(STORAGE_KEYS.roadmap, roadmap);
}

function getStatusClass(status) {
  const classes = {
    Applied: "status-applied",
    Interview: "status-interview",
    Offer: "status-offer",
    Rejected: "status-rejected"
  };

  return classes[status] || "status-applied";
}


function updateStats() {
  document.getElementById("totalCount").textContent = applications.length;

  document.getElementById("interviewCount").textContent =
    applications.filter(function (application) {
      return application.status === "Interview";
    }).length;

  document.getElementById("offerCount").textContent =
    applications.filter(function (application) {
      return application.status === "Offer";
    }).length;

  const completed = roadmap.filter(function (topic) {
    return topic.done;
  }).length;

  const percent = roadmap.length
    ? Math.round((completed / roadmap.length) * 100)
    : 0;

  document.getElementById("learningPercent").textContent = percent + "%";
  document.getElementById("progressFill").style.width = percent + "%";

  document.getElementById("progressLabel").textContent =
    completed + " of " + roadmap.length + " completed";
}


function renderApplications() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  const filteredApplications = applications.filter(function (application) {
    const matchesSearch =
      String(application.company || "").toLowerCase().includes(query) ||
      String(application.role || "").toLowerCase().includes(query);

    const matchesStatus =
      selectedStatus === "All" || application.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  applicationList.innerHTML = filteredApplications.map(function (application) {
    const company = escapeHTML(application.company || "");
    const role = escapeHTML(application.role || "");
    const deadline = escapeHTML(application.deadline || "Not set");
    const status = ["Applied", "Interview", "Offer", "Rejected"].includes(
      application.status
    ) ? application.status : "Applied";

    const jobLink = isValidJobUrl(application.jobLink)
      ? application.jobLink
      : "";

    const companyDisplay = jobLink
      ? '<a href="' + escapeHTML(jobLink) +
        '" target="_blank" rel="noopener noreferrer" class="company-name">' +
        company + "</a>"
      : '<span class="company-name">' + company + "</span>";

    return `
      <tr>
        <td>
          ${companyDisplay}
          <span class="role-name">${role}</span>
        </td>
        <td>${deadline}</td>
        <td>
          <span class="status ${getStatusClass(status)}">${status}</span>
        </td>
        <td>
          <div class="action-group">
            <button class="small-btn" data-action="edit" data-id="${escapeHTML(application.id)}">Edit</button>
            <button class="small-btn delete-btn" data-action="delete" data-id="${escapeHTML(application.id)}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  applicationMessage.hidden = filteredApplications.length > 0;
  applicationMessage.textContent = applications.length === 0
    ? "No applications yet. Add your first opportunity!"
    : "No applications match your search or filter.";

  updateStats();
}


function openAddDialog() {
  internshipForm.reset();
  editIdInput.value = "";
  dialogTitle.textContent = "Add Internship";

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    showToast("Please use an up-to-date browser.");
  }
}

function openEditDialog(id) {
  const application = applications.find(function (item) {
    return item.id === id;
  });

  if (!application) return;

  editIdInput.value = application.id;
  companyInput.value = application.company;
  roleInput.value = application.role;
  deadlineInput.value = application.deadline || "";
  applicationStatus.value = application.status;
  jobLinkInput.value = application.jobLink || "";

  dialogTitle.textContent = "Edit Internship";
  dialog.showModal();
}

function closeDialog() {
  dialog.close();
}

document.getElementById("addTopBtn").addEventListener("click", openAddDialog);
document.getElementById("addSectionBtn").addEventListener("click", openAddDialog);
document.getElementById("closeDialogBtn").addEventListener("click", closeDialog);
document.getElementById("cancelBtn").addEventListener("click", closeDialog);

internshipForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const company = companyInput.value.trim();
  const role = roleInput.value.trim();
  const jobLink = jobLinkInput.value.trim();

  if (!company || !role) {
    showToast("Please enter the company and role.");
    return;
  }

  if (!isValidJobUrl(jobLink)) {
    showToast("Enter a valid HTTP or HTTPS job link.");
    return;
  }

  const existingId = editIdInput.value;

  const applicationData = {
    id: existingId || makeId(),
    company: company,
    role: role,
    deadline: deadlineInput.value,
    status: applicationStatus.value,
    jobLink: jobLink
  };

  if (existingId) {
    applications = applications.map(function (application) {
      return application.id === existingId ? applicationData : application;
    });
  } else {
    applications.unshift(applicationData);
  }

  if (!saveApplications()) return;

  closeDialog();
  renderApplications();

  showToast(existingId ? "Application updated!" : "Application added!");
});



searchInput.addEventListener("input", renderApplications);
statusFilter.addEventListener("change", renderApplications);

applicationList.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "edit") {
    openEditDialog(id);
    return;
  }

  if (action === "delete") {
    const application = applications.find(function (item) {
      return item.id === id;
    });

    if (!application) return;

    const confirmed = window.confirm(
      "Delete the application for " + application.company + "?"
    );

    if (!confirmed) return;

    const previousApplications = applications;
    applications = applications.filter(function (item) {
      return item.id !== id;
    });

    if (!saveApplications()) {
      applications = previousApplications;
      return;
    }

    renderApplications();
    showToast("Application deleted.");
  }
});



const commonSkills = [
  "html", "css", "javascript", "typescript", "react",
  "angular", "vue", "node.js", "express", "python",
  "java", "sql", "mongodb", "git", "github",
  "rest api", "api integration", "responsive design",
  "testing", "debugging", "accessibility", "figma",
  "communication", "problem solving", "data structures",
  "next.js", "tailwind css", "bootstrap"
];

function normalizeText(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function analyzeSkills() {
  const mySkills = normalizeText(
    document.getElementById("mySkills").value
  );

  const jobDescription = normalizeText(
    document.getElementById("jobDescription").value
  );

  const result = document.getElementById("analysisResult");

  if (!mySkills || !jobDescription) {
    showToast("Enter your skills and a job description first.");
    return;
  }

  const requiredSkills = commonSkills.filter(function (skill) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp("(^|[^a-z0-9+#.])" + escaped + "(?=$|[^a-z0-9+#.])", "i");
    return pattern.test(jobDescription);
  });

  if (requiredSkills.length === 0) {
    result.hidden = false;
    result.textContent =
      "No recognized skills were found. Try a job description containing specific technologies or skills.";
    return;
  }

  const matchedSkills = requiredSkills.filter(function (skill) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp("(^|[^a-z0-9+#.])" + escaped + "(?=$|[^a-z0-9+#.])", "i");
    return pattern.test(mySkills);
  });

  const missingSkills = requiredSkills.filter(function (skill) {
    return !matchedSkills.includes(skill);
  });

  const percent = Math.round(
    (matchedSkills.length / requiredSkills.length) * 100
  );

  result.innerHTML = `
    <div class="match-score">
      <div>
        <strong>${percent}%</strong>
        <p>Keyword overlap</p>
      </div>
      <span>${matchedSkills.length} of ${requiredSkills.length} skills matched</span>
    </div>
    <h3>✓ Matching skills</h3>
    <p>${matchedSkills.length ? matchedSkills.map(escapeHTML).join(", ") : "No matching skills found yet."}</p>
    <h3>↗ Skills to explore</h3>
    <p>${missingSkills.length ? missingSkills.map(escapeHTML).join(", ") : "All recognized skills in this description match your list!"}</p>
    <p><small>This is a simple keyword comparison, not an AI evaluation or a prediction of hiring success.</small></p>
  `;

  result.hidden = false;
}

document.getElementById("analyzeBtn").addEventListener("click", analyzeSkills);



function renderRoadmap() {
  roadmapList.innerHTML = roadmap.map(function (topic) {
    const id = escapeHTML(topic.id);
    const title = escapeHTML(topic.title);

    return `
      <div class="roadmap-item">
        <input
          type="checkbox"
          id="${id}"
          data-topic-id="${id}"
          ${topic.done ? "checked" : ""}
        >
        <label for="${id}">${title}</label>
        <button
          type="button"
          class="remove-topic"
          data-remove-topic="${id}"
          aria-label="Remove ${title}"
          title="Remove topic"
        >×</button>
      </div>
    `;
  }).join("");

  updateStats();
}

roadmapList.addEventListener("change", function (event) {
  const checkbox = event.target.closest("input[data-topic-id]");
  if (!checkbox) return;

  const topic = roadmap.find(function (item) {
    return item.id === checkbox.dataset.topicId;
  });

  if (!topic) return;

  const previousValue = topic.done;
  topic.done = checkbox.checked;

  if (!saveRoadmap()) {
    topic.done = previousValue;
    renderRoadmap();
    return;
  }

  renderRoadmap();
});

roadmapList.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-remove-topic]");
  if (!button) return;

  const id = button.dataset.removeTopic;
  const previousRoadmap = roadmap;

  roadmap = roadmap.filter(function (topic) {
    return topic.id !== id;
  });

  if (!saveRoadmap()) {
    roadmap = previousRoadmap;
    return;
  }

  renderRoadmap();
  showToast("Learning topic removed.");
});

roadmapForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = newTopicInput.value.trim();

  if (!title) return;

  roadmap.push({
    id: makeId(),
    title: title,
    done: false
  });

  if (!saveRoadmap()) {
    roadmap.pop();
    return;
  }

  newTopicInput.value = "";
  renderRoadmap();
  showToast("Learning topic added!");
});


document.getElementById("currentYear").textContent =
  new Date().getFullYear();

renderApplications();
renderRoadmap();
