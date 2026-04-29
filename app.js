const STORAGE_KEY = "control-gastos:v1";
const supabaseConfig = window.CONTROL_GASTOS_SUPABASE || {};
const supabaseClient = createSupabaseClient();

const categoryLabels = {
  fixed: "Fijo",
  additional: "Adicional",
  casual: "Casual",
  card: "Tarjeta",
  credit: "Credito",
  future: "Futuro",
  income: "Ingreso",
};

const frequencyLabels = {
  monthly: "Mensual",
  once: "Unica vez",
  weekly: "Semanal",
  annual: "Anual",
};

const state = {
  entries: loadLocalEntries(),
  month: currentMonth(),
  view: "dashboard",
  filter: "all",
  search: "",
};

const els = {
  monthInput: document.querySelector("#monthInput"),
  monthTitle: document.querySelector("#monthTitle"),
  navTabs: document.querySelectorAll(".nav-tab"),
  views: {
    dashboard: document.querySelector("#dashboardView"),
    items: document.querySelector("#itemsView"),
    cards: document.querySelector("#cardsView"),
    forecast: document.querySelector("#forecastView"),
  },
  form: document.querySelector("#entryForm"),
  editingId: document.querySelector("#editingId"),
  formMode: document.querySelector("#formMode"),
  nameInput: document.querySelector("#nameInput"),
  kindInput: document.querySelector("#kindInput"),
  categoryInput: document.querySelector("#categoryInput"),
  amountInput: document.querySelector("#amountInput"),
  startInput: document.querySelector("#startInput"),
  frequencyInput: document.querySelector("#frequencyInput"),
  durationInput: document.querySelector("#durationInput"),
  paymentInput: document.querySelector("#paymentInput"),
  installmentsInput: document.querySelector("#installmentsInput"),
  notesInput: document.querySelector("#notesInput"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  incomeTotal: document.querySelector("#incomeTotal"),
  expenseTotal: document.querySelector("#expenseTotal"),
  balanceTotal: document.querySelector("#balanceTotal"),
  committedTotal: document.querySelector("#committedTotal"),
  itemCount: document.querySelector("#itemCount"),
  categoryBars: document.querySelector("#categoryBars"),
  entriesTable: document.querySelector("#entriesTable"),
  filterCategory: document.querySelector("#filterCategory"),
  searchInput: document.querySelector("#searchInput"),
  cardList: document.querySelector("#cardList"),
  creditList: document.querySelector("#creditList"),
  cardTotal: document.querySelector("#cardTotal"),
  creditTotal: document.querySelector("#creditTotal"),
  forecastGrid: document.querySelector("#forecastGrid"),
  seedBtn: document.querySelector("#seedBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  emptyTemplate: document.querySelector("#emptyStateTemplate"),
};

init();

async function init() {
  els.monthInput.value = state.month;
  els.startInput.value = state.month;
  bindEvents();
  render();
  await syncFromSupabase();
}

function bindEvents() {
  els.monthInput.addEventListener("change", (event) => {
    state.month = event.target.value || currentMonth();
    els.startInput.value ||= state.month;
    render();
  });

  els.navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.view = tab.dataset.view;
      render();
    });
  });

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveEntry(readForm());
  });

  els.cancelEditBtn.addEventListener("click", resetForm);

  els.filterCategory.addEventListener("change", (event) => {
    state.filter = event.target.value;
    renderEntriesTable();
  });

  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderEntriesTable();
  });

  els.seedBtn.addEventListener("click", seedDemo);
  els.exportBtn.addEventListener("click", exportJson);
  els.clearBtn.addEventListener("click", clearAll);
}

function readForm() {
  const category = els.categoryInput.value;
  return {
    id: els.editingId.value || newId(),
    name: els.nameInput.value.trim(),
    kind: els.kindInput.value,
    category,
    amount: Number(els.amountInput.value || 0),
    start: els.startInput.value,
    frequency: els.frequencyInput.value,
    duration: Number(els.durationInput.value || 0),
    payment: els.paymentInput.value,
    installments: Number(els.installmentsInput.value || 1),
    notes: els.notesInput.value.trim(),
    createdAt: new Date().toISOString(),
  };
}

async function saveEntry(entry) {
  if (!entry.name || !entry.start || entry.amount <= 0) return;
  const existingIndex = state.entries.findIndex((item) => item.id === entry.id);

  if (existingIndex >= 0) {
    state.entries[existingIndex] = { ...state.entries[existingIndex], ...entry };
  } else {
    state.entries.push(entry);
  }

  await persist(entry);
  resetForm();
  render();
}

function resetForm() {
  els.form.reset();
  els.editingId.value = "";
  els.formMode.textContent = "Nuevo";
  els.kindInput.value = "expense";
  els.categoryInput.value = "fixed";
  els.frequencyInput.value = "monthly";
  els.paymentInput.value = "cash";
  els.startInput.value = state.month;
}

function editEntry(id) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;

  els.editingId.value = entry.id;
  els.formMode.textContent = "Editando";
  els.nameInput.value = entry.name;
  els.kindInput.value = entry.kind;
  els.categoryInput.value = entry.category;
  els.amountInput.value = entry.amount;
  els.startInput.value = entry.start;
  els.frequencyInput.value = entry.frequency;
  els.durationInput.value = entry.duration || "";
  els.paymentInput.value = entry.payment;
  els.installmentsInput.value = entry.installments || 1;
  els.notesInput.value = entry.notes || "";
  state.view = "dashboard";
  render();
  els.nameInput.focus();
}

async function deleteEntry(id) {
  state.entries = state.entries.filter((item) => item.id !== id);
  await deleteRemote(id);
  persistLocal();
  render();
}

function render() {
  renderShell();
  renderDashboard();
  renderEntriesTable();
  renderCards();
  renderForecast();
}

function renderShell() {
  els.monthTitle.textContent = formatMonth(state.month);
  els.navTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === state.view));
  Object.entries(els.views).forEach(([view, element]) => {
    element.classList.toggle("active", view === state.view);
  });
}

function renderDashboard() {
  const active = entriesForMonth(state.month);
  const income = sum(active.filter((item) => item.kind === "income"));
  const expenses = sum(active.filter((item) => item.kind === "expense"));
  const committed = sum(active.filter((item) => item.kind === "expense" && item.frequency !== "once"));

  els.incomeTotal.textContent = money(income);
  els.expenseTotal.textContent = money(expenses);
  els.balanceTotal.textContent = money(income - expenses);
  els.committedTotal.textContent = money(committed);
  els.itemCount.textContent = `${active.length} items`;

  const byCategory = active
    .filter((item) => item.kind === "expense")
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + monthlyAmount(item, state.month);
      return acc;
    }, {});

  const max = Math.max(...Object.values(byCategory), 1);
  const rows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  els.categoryBars.innerHTML = "";
  if (!rows.length) {
    els.categoryBars.append(emptyState());
    return;
  }

  rows.forEach(([category, total]) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-meta">
        <strong>${categoryLabels[category]}</strong>
        <span>${money(total)}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${Math.round((total / max) * 100)}%"></div>
      </div>
    `;
    els.categoryBars.append(row);
  });
}

function renderEntriesTable() {
  const rows = state.entries
    .filter((item) => state.filter === "all" || item.category === state.filter)
    .filter((item) => !state.search || item.name.toLowerCase().includes(state.search))
    .sort((a, b) => a.start.localeCompare(b.start) || a.name.localeCompare(b.name));

  els.entriesTable.innerHTML = "";
  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="7">${emptyState().outerHTML}</td>`;
    els.entriesTable.append(tr);
    return;
  }

  rows.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <strong>${escapeHtml(item.name)}</strong>
        <div class="muted">${escapeHtml(item.notes || "")}</div>
      </td>
      <td><span class="pill">${categoryLabels[item.category]}</span></td>
      <td>${frequencyLabels[item.frequency]}</td>
      <td>${periodLabel(item)}</td>
      <td>${paymentLabel(item)}</td>
      <td>${money(monthlyAmount(item, state.month))}</td>
      <td>
        <div class="row-actions">
          <button type="button" data-edit="${item.id}" title="Editar" aria-label="Editar">E</button>
          <button class="delete" type="button" data-delete="${item.id}" title="Borrar" aria-label="Borrar">X</button>
        </div>
      </td>
    `;
    els.entriesTable.append(tr);
  });

  els.entriesTable.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => editEntry(button.dataset.edit));
  });
  els.entriesTable.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteEntry(button.dataset.delete));
  });
}

function renderCards() {
  renderList(els.cardList, "card");
  renderList(els.creditList, "credit");
  els.cardTotal.textContent = money(sum(entriesForMonth(state.month).filter((item) => item.category === "card")));
  els.creditTotal.textContent = money(sum(entriesForMonth(state.month).filter((item) => item.category === "credit")));
}

function renderList(target, category) {
  const rows = entriesForMonth(state.month).filter((item) => item.category === category);
  target.innerHTML = "";
  if (!rows.length) {
    target.append(emptyState());
    return;
  }

  rows.forEach((item) => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      <strong><span>${escapeHtml(item.name)}</span><span>${money(monthlyAmount(item, state.month))}</span></strong>
      <div class="muted">${periodLabel(item)} - ${paymentLabel(item)}</div>
      <div class="muted">${escapeHtml(item.notes || "")}</div>
    `;
    target.append(div);
  });
}

function renderForecast() {
  els.forecastGrid.innerHTML = "";
  nextMonths(state.month, 12).forEach((month) => {
    const rows = entriesForMonth(month);
    const income = sum(rows.filter((item) => item.kind === "income"), month);
    const expenses = sum(rows.filter((item) => item.kind === "expense"), month);
    const balance = income - expenses;
    const div = document.createElement("div");
    div.className = `forecast-item ${balance < 0 ? "negative" : ""}`;
    div.innerHTML = `
      <strong><span>${formatMonth(month)}</span><span>${money(balance)}</span></strong>
      <div class="muted">Ingresos ${money(income)}</div>
      <div class="muted">Gastos ${money(expenses)}</div>
    `;
    els.forecastGrid.append(div);
  });
}

function entriesForMonth(month) {
  return state.entries.filter((item) => isActiveInMonth(item, month));
}

function isActiveInMonth(entry, month) {
  const offset = monthDiff(entry.start, month);
  if (offset < 0) return false;
  if (entry.frequency === "once") return offset === 0;
  if (entry.frequency === "annual") return offset % 12 === 0;
  if (entry.duration > 0 && offset >= entry.duration) return false;
  return true;
}

function monthlyAmount(entry, month = state.month) {
  if (!isActiveInMonth(entry, month)) return 0;
  if (entry.frequency === "weekly") return entry.amount * 4.33;
  return entry.amount;
}

function sum(entries, month = state.month) {
  return entries.reduce((total, item) => total + monthlyAmount(item, month), 0);
}

function monthDiff(start, end) {
  const [startYear, startMonth] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);
  return (endYear - startYear) * 12 + (endMonth - startMonth);
}

function nextMonths(start, count) {
  const [year, month] = start.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, month - 1 + index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

function periodLabel(entry) {
  if (entry.frequency === "once") return entry.start;
  if (!entry.duration) return `${entry.start} -> sin fin`;
  const end = nextMonths(entry.start, entry.duration).at(-1);
  return `${entry.start} -> ${end}`;
}

function paymentLabel(entry) {
  const labels = {
    cash: "Efectivo/debito",
    transfer: "Transferencia",
    card: "Tarjeta",
    credit: "Credito",
  };
  const base = labels[entry.payment] || entry.payment;
  return entry.installments > 1 ? `${base} - ${entry.installments} cuotas` : base;
}

function money(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatMonth(value) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function emptyState() {
  return els.emptyTemplate.content.firstElementChild.cloneNode(true);
}

function persistLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function loadLocalEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

async function seedDemo() {
  if (state.entries.length && !confirm("Agregar datos ejemplo sobre datos actuales?")) return;
  const month = state.month;
  const demoEntries = [
    makeEntry("Sueldo", "income", "income", 1250000, month, "monthly", 0, "transfer"),
    makeEntry("Alquiler", "expense", "fixed", 360000, month, "monthly", 0, "transfer"),
    makeEntry("Supermercado", "expense", "additional", 220000, month, "monthly", 0, "card"),
    makeEntry("Salida", "expense", "casual", 45000, month, "once", 0, "card"),
    makeEntry("Visa", "expense", "card", 180000, month, "monthly", 6, "card", 6),
    makeEntry("Prestamo banco", "expense", "credit", 145000, month, "monthly", 18, "credit", 18),
    makeEntry("Seguro auto", "expense", "future", 98000, nextMonths(month, 2)[1], "monthly", 12, "transfer"),
  ];
  state.entries.push(...demoEntries);
  await persistMany(demoEntries);
  render();
}

function makeEntry(name, kind, category, amount, start, frequency, duration, payment, installments = 1) {
  return {
    id: newId(),
    name,
    kind,
    category,
    amount,
    start,
    frequency,
    duration,
    payment,
    installments,
    notes: "",
    createdAt: new Date().toISOString(),
  };
}

function exportJson() {
  const data = JSON.stringify({ exportedAt: new Date().toISOString(), entries: state.entries }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `control-gastos-${state.month}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function clearAll() {
  if (!state.entries.length) return;
  if (!confirm("Borrar todos los datos locales?")) return;
  state.entries = [];
  await clearRemote();
  persistLocal();
  resetForm();
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function newId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSupabaseClient() {
  if (!supabaseConfig.url || !supabaseConfig.anonKey || !window.supabase?.createClient) return null;
  return window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
}

async function syncFromSupabase() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient
    .from(tableName())
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Supabase sync failed:", error.message);
    return;
  }

  state.entries = data.map(fromDbEntry);
  persistLocal();
  render();
}

async function persist(entry) {
  persistLocal();
  if (!supabaseClient) return;

  const { error } = await supabaseClient
    .from(tableName())
    .upsert(toDbEntry(entry), { onConflict: "id" });

  if (error) console.error("Supabase save failed:", error.message);
}

async function persistMany(entries) {
  persistLocal();
  if (!supabaseClient) return;

  const { error } = await supabaseClient
    .from(tableName())
    .upsert(entries.map(toDbEntry), { onConflict: "id" });

  if (error) console.error("Supabase bulk save failed:", error.message);
}

async function deleteRemote(id) {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.from(tableName()).delete().eq("id", id);
  if (error) console.error("Supabase delete failed:", error.message);
}

async function clearRemote() {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.from(tableName()).delete().not("id", "is", null);
  if (error) console.error("Supabase clear failed:", error.message);
}

function tableName() {
  return supabaseConfig.table || "entries";
}

function toDbEntry(entry) {
  return {
    id: entry.id,
    name: entry.name,
    kind: entry.kind,
    category: entry.category,
    amount: entry.amount,
    start: entry.start,
    frequency: entry.frequency,
    duration: entry.duration || 0,
    payment: entry.payment,
    installments: entry.installments || 1,
    notes: entry.notes || "",
    created_at: entry.createdAt || new Date().toISOString(),
  };
}

function fromDbEntry(row) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    category: row.category,
    amount: Number(row.amount),
    start: row.start,
    frequency: row.frequency,
    duration: Number(row.duration || 0),
    payment: row.payment,
    installments: Number(row.installments || 1),
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}
