const STORAGE_KEY = "control-gastos:v1";
const ACTIVITY_STORAGE_KEY = "control-gastos:activity:v1";
const SESSION_STORAGE_KEY = "control-gastos:session:v1";
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

const planBuckets = {
  housing: {
    title: "Renta (vivienda)",
    description: "Alquiler, expensas, cuotas base y compromisos mensuales",
    color: "#2378c9",
    image: "assets/illustrations/home.svg",
    keywords: ["alquiler", "renta", "vivienda", "expensa", "hipoteca"],
  },
  services: {
    title: "Servicios",
    description: "Luz, gas, agua, internet, telefonia y streaming",
    color: "#6f45b8",
    image: "assets/illustrations/services.svg",
    keywords: ["servicio", "luz", "gas", "agua", "internet", "telefono", "telefonia", "streaming", "tv"],
  },
  food: {
    title: "Alimentacion",
    description: "Compras de supermercado, comida y articulos de consumo",
    color: "#ef3f68",
    image: "assets/illustrations/food.svg",
    keywords: ["super", "supermercado", "comida", "alimento", "alimentacion", "verduleria", "carniceria"],
  },
  transport: {
    title: "Transporte (vehiculo)",
    description: "Combustible, mantenimiento, seguro, patente y movilidad",
    color: "#f59b22",
    image: "assets/illustrations/car.svg",
    keywords: ["auto", "vehiculo", "combustible", "nafta", "seguro", "patente", "cochera", "transporte"],
  },
  savings: {
    title: "Ahorro",
    description: "Ahorro para metas familiares, proyectos y futuro",
    color: "#16a698",
    image: "assets/illustrations/piggy.svg",
    keywords: ["ahorro", "inversion", "meta", "futuro"],
  },
  education: {
    title: "Educacion",
    description: "Escuela, utiles, actividades y salidas escolares",
    color: "#6fb44f",
    image: "assets/illustrations/education.svg",
    keywords: ["educacion", "escuela", "colegio", "jardin", "utiles", "actividad"],
  },
  leisure: {
    title: "Ocio / extras",
    description: "Salidas ocasionales, gustos personales, regalos y extras",
    color: "#80868b",
    image: "assets/illustrations/leisure.svg",
    keywords: ["ocio", "salida", "regalo", "extra", "gusto", "cine", "restaurant"],
  },
  emergency: {
    title: "Fondo de emergencia",
    description: "Reserva para imprevistos, salud, arreglos y emergencias",
    color: "#f7bd31",
    image: "assets/illustrations/emergency.svg",
    keywords: ["emergencia", "imprevisto", "salud", "medico", "arreglo"],
  },
  cards: {
    title: "Tarjetas / creditos",
    description: "Consumos, cuotas, prestamos y financiaciones activas",
    color: "#315b9f",
    image: "assets/illustrations/cards.svg",
    keywords: ["tarjeta", "credito", "prestamo", "cuota"],
  },
};

const planBucketOrder = ["housing", "services", "food", "transport", "savings", "education", "leisure", "emergency", "cards"];

const frequencyLabels = {
  monthly: "Mensual",
  once: "Unica vez",
  weekly: "Semanal",
  annual: "Anual",
};

const statusLabels = {
  pending: "Pendiente",
  paid: "Pagado",
  planned: "Planificado",
  overdue: "Vencido",
};

const categoryColors = {
  fixed: planBuckets.housing.color,
  additional: planBuckets.services.color,
  casual: planBuckets.leisure.color,
  card: planBuckets.cards.color,
  credit: planBuckets.cards.color,
  future: planBuckets.savings.color,
  income: "#0d8f73",
};

const appUsers = {
  admin: "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5",
  martin: "53efce997017bfa1689372396b029257319dd8e42ef0c0781a255df123bd035a",
};

const state = {
  entries: loadLocalEntries(),
  activity: loadLocalActivity(),
  currentUser: loadSession(),
  month: currentMonth(),
  view: "dashboard",
  filter: "all",
  statusFilter: "all",
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
    activity: document.querySelector("#activityView"),
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
  statusInput: document.querySelector("#statusInput"),
  dueDayInput: document.querySelector("#dueDayInput"),
  accountInput: document.querySelector("#accountInput"),
  vendorInput: document.querySelector("#vendorInput"),
  priorityInput: document.querySelector("#priorityInput"),
  budgetInput: document.querySelector("#budgetInput"),
  tagsInput: document.querySelector("#tagsInput"),
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
  filterStatus: document.querySelector("#filterStatus"),
  searchInput: document.querySelector("#searchInput"),
  cardList: document.querySelector("#cardList"),
  creditList: document.querySelector("#creditList"),
  cardTotal: document.querySelector("#cardTotal"),
  creditTotal: document.querySelector("#creditTotal"),
  forecastGrid: document.querySelector("#forecastGrid"),
  clearBtn: document.querySelector("#clearBtn"),
  emptyTemplate: document.querySelector("#emptyStateTemplate"),
  openEntryBtn: document.querySelector("#openEntryBtn"),
  openIncomeBtn: document.querySelector("#openIncomeBtn"),
  closeEntryBtn: document.querySelector("#closeEntryBtn"),
  entryModal: document.querySelector("#entryModal"),
  savingsRate: document.querySelector("#savingsRate"),
  planSavingsRate: document.querySelector("#planSavingsRate"),
  incomeHint: document.querySelector("#incomeHint"),
  expenseHint: document.querySelector("#expenseHint"),
  balanceHint: document.querySelector("#balanceHint"),
  committedHint: document.querySelector("#committedHint"),
  trendChart: document.querySelector("#trendChart"),
  donutChart: document.querySelector("#donutChart"),
  donutLegend: document.querySelector("#donutLegend"),
  donutTotal: document.querySelector("#donutTotal"),
  alertsList: document.querySelector("#alertsList"),
  alertCount: document.querySelector("#alertCount"),
  topExpenses: document.querySelector("#topExpenses"),
  toast: document.querySelector("#toast"),
  activityList: document.querySelector("#activityList"),
  activityCount: document.querySelector("#activityCount"),
  appShell: document.querySelector("#appShell"),
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  loginUserInput: document.querySelector("#loginUserInput"),
  loginPasswordInput: document.querySelector("#loginPasswordInput"),
  loginStatus: document.querySelector("#loginStatus"),
  logoutBtn: document.querySelector("#logoutBtn"),
  rosarioTime: document.querySelector("#rosarioTime"),
  rosarioWeather: document.querySelector("#rosarioWeather"),
  weatherLabel: document.querySelector("#weatherLabel"),
  planTitle: document.querySelector("#planTitle"),
};

init();

async function init() {
  els.monthInput.value = state.month;
  els.startInput.value = state.month;
  bindEvents();
  await initAuth();
  initContextInfo();
  render();
  await syncFromSupabase();
  refreshIcons();
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

  els.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await signInWithPassword();
  });

  els.logoutBtn.addEventListener("click", signOut);

  els.cancelEditBtn.addEventListener("click", () => {
    resetForm();
    closeEntryModal();
  });

  els.filterCategory.addEventListener("change", (event) => {
    state.filter = event.target.value;
    renderEntriesTable();
  });

  els.filterStatus.addEventListener("change", (event) => {
    state.statusFilter = event.target.value;
    renderEntriesTable();
  });

  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderEntriesTable();
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  });

  document.querySelectorAll("[data-plan-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.planView;
      render();
    });
  });

  document.querySelectorAll("[data-plan-open]").forEach((button) => {
    button.addEventListener("click", () => {
      resetForm();
      applyPreset(button.dataset.planOpen === "income" ? "income" : "fixed");
      els.formMode.textContent = button.dataset.planOpen === "income" ? "Nuevo ingreso" : "Nuevo gasto";
      openEntryModal();
    });
  });

  els.openEntryBtn.addEventListener("click", () => {
    resetForm();
    applyPreset("fixed");
    els.formMode.textContent = "Nuevo gasto";
    openEntryModal();
  });
  els.openIncomeBtn.addEventListener("click", () => {
    resetForm();
    applyPreset("income");
    els.formMode.textContent = "Nuevo ingreso";
    openEntryModal();
  });
  els.closeEntryBtn.addEventListener("click", closeEntryModal);
  els.entryModal.addEventListener("click", (event) => {
    if (event.target === els.entryModal) closeEntryModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeEntryModal();
  });

  els.clearBtn.addEventListener("click", clearAll);
  window.addEventListener("resize", () => renderDashboard());
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
    status: els.statusInput.value,
    dueDay: Number(els.dueDayInput.value || 0),
    account: els.accountInput.value.trim(),
    vendor: els.vendorInput.value.trim(),
    priority: els.priorityInput.value,
    budget: Number(els.budgetInput.value || 0),
    tags: parseTags(els.tagsInput.value),
    notes: els.notesInput.value.trim(),
    createdAt: new Date().toISOString(),
  };
}

async function saveEntry(entry) {
  if (!ensureCanWrite()) return;
  if (!entry.name || !entry.start || entry.amount <= 0) return;
  const existingIndex = state.entries.findIndex((item) => item.id === entry.id);
  const action = existingIndex >= 0 ? "updated" : "created";

  if (existingIndex >= 0) {
    state.entries[existingIndex] = { ...state.entries[existingIndex], ...entry };
  } else {
    state.entries.push(entry);
  }

  await persist(entry);
  await addActivity(action, entry);
  resetForm();
  closeEntryModal();
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
  els.statusInput.value = "pending";
  els.priorityInput.value = "normal";
  els.startInput.value = state.month;
}

function openEntryModal() {
  els.entryModal.classList.add("open");
  els.entryModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  setTimeout(() => els.nameInput.focus(), 0);
}

function closeEntryModal() {
  els.entryModal.classList.remove("open");
  els.entryModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
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
  els.statusInput.value = entry.status || "pending";
  els.dueDayInput.value = entry.dueDay || "";
  els.accountInput.value = entry.account || "";
  els.vendorInput.value = entry.vendor || "";
  els.priorityInput.value = entry.priority || "normal";
  els.budgetInput.value = entry.budget || "";
  els.tagsInput.value = (entry.tags || []).join(", ");
  els.notesInput.value = entry.notes || "";
  state.view = "dashboard";
  render();
  openEntryModal();
  els.nameInput.focus();
}

async function deleteEntry(id) {
  if (!ensureCanWrite()) return;
  const entry = state.entries.find((item) => item.id === id);
  state.entries = state.entries.filter((item) => item.id !== id);
  await deleteRemote(id);
  if (entry) await addActivity("deleted", entry);
  persistLocal();
  render();
}

function render() {
  renderShell();
  renderDashboard();
  renderEntriesTable();
  renderCards();
  renderForecast();
  renderActivity();
  refreshIcons();
}

function renderShell() {
  els.monthTitle.textContent = formatMonth(state.month);
  els.navTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === state.view));
  Object.entries(els.views).forEach(([view, element]) => {
    element.classList.toggle("active", view === state.view);
  });
  document.body.classList.toggle("dashboard-mode", state.view === "dashboard");
}

function renderDashboard() {
  const active = entriesForMonth(state.month);
  const incomes = active.filter((item) => item.kind === "income");
  const expenseItems = active.filter((item) => item.kind === "expense");
  const income = sum(incomes);
  const expenses = sum(expenseItems);
  const balance = income - expenses;
  const committed = sum(expenseItems.filter((item) => item.frequency !== "once"));
  const committedRate = income ? Math.round((committed / income) * 100) : 0;
  const savingsRate = income ? Math.round((balance / income) * 100) : 0;

  els.incomeTotal.textContent = money(income);
  els.expenseTotal.textContent = money(expenses);
  els.balanceTotal.textContent = money(balance);
  els.committedTotal.textContent = money(committed);
  els.incomeHint.textContent = `${incomes.length} ingresos`;
  els.expenseHint.textContent = `${expenseItems.length} gastos`;
  els.balanceHint.textContent = balance >= 0 ? "Margen positivo" : "Deficit mensual";
  els.committedHint.textContent = income ? `${Math.round((expenses / income) * 100)}%` : "0%";
  els.savingsRate.textContent = `${savingsRate}% ahorro`;
  els.planSavingsRate.textContent = `${savingsRate}% ahorro`;
  els.itemCount.textContent = `${active.length} items`;
  els.planTitle.textContent = formatMonth(state.month);

  const rows = planRows(expenseItems).sort((a, b) => planBucketOrder.indexOf(a.key) - planBucketOrder.indexOf(b.key));

  els.categoryBars.innerHTML = "";
  if (!rows.length) {
    els.categoryBars.append(emptyState());
    renderDonut([], income);
    renderAlerts({ income, expenses, balance, committed, committedRate, expenseItems });
    renderTopExpenses(expenseItems);
    renderTrendChart();
    return;
  }

  rows.forEach((plan) => {
    const row = document.createElement("div");
    const percent = income ? Math.round((plan.total / income) * 1000) / 10 : 0;
    row.className = "plan-row";
    row.innerHTML = `
      <div class="plan-row-icon" style="background: ${plan.color}">
        <img src="${plan.image}" alt="">
      </div>
      <div class="plan-row-copy">
        <strong style="color: ${plan.color}">${plan.title}</strong>
        <span>${plan.description}</span>
      </div>
      <strong class="plan-row-money" style="color: ${plan.color}">${money(plan.total)}</strong>
      <strong class="plan-row-percent">${formatPercent(percent)}</strong>
    `;
    els.categoryBars.append(row);
  });

  renderDonut(rows, income);
  renderAlerts({ income, expenses, balance, committed, committedRate, expenseItems });
  renderTopExpenses(expenseItems);
  renderTrendChart();
}

function renderEntriesTable() {
  const rows = state.entries
    .filter((item) => state.filter === "all" || item.category === state.filter)
    .filter((item) => state.statusFilter === "all" || entryStatus(item) === state.statusFilter)
    .filter((item) => matchesSearch(item, state.search))
    .sort((a, b) => a.start.localeCompare(b.start) || a.name.localeCompare(b.name));

  els.entriesTable.innerHTML = "";
  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="9">${emptyState().outerHTML}</td>`;
    els.entriesTable.append(tr);
    return;
  }

  rows.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Concepto">
        <strong>${escapeHtml(item.name)}</strong>
        <div class="muted">${escapeHtml(item.notes || "")}</div>
      </td>
      <td data-label="Categoria"><span class="pill">${categoryLabels[item.category]}</span></td>
      <td data-label="Frecuencia">${frequencyLabels[item.frequency]}</td>
      <td data-label="Periodo">${periodLabel(item)}</td>
      <td data-label="Medio">${paymentLabel(item)}</td>
      <td data-label="Estado"><span class="status-pill ${entryStatus(item)}">${statusLabels[entryStatus(item)]}</span></td>
      <td data-label="Vence">${dueLabel(item)}</td>
      <td data-label="Monto mes">${money(monthlyAmount(item, state.month))}</td>
      <td data-label="Acciones">
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

function renderActivity() {
  if (!els.activityList) return;
  const rows = [...state.activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 80);
  els.activityList.innerHTML = "";
  els.activityCount.textContent = `${rows.length} eventos`;

  if (!rows.length) {
    els.activityList.append(emptyState());
    return;
  }

  rows.forEach((event) => {
    const item = document.createElement("article");
    item.className = `activity-item ${event.action}`;
    item.innerHTML = `
      <div class="activity-mark">${activityIcon(event.action)}</div>
      <div>
        <strong>${activityTitle(event)}</strong>
        <p>${escapeHtml(event.detail)}</p>
      </div>
      <time>${formatDateTime(event.createdAt)}</time>
    `;
    els.activityList.append(item);
  });
}

function renderTopExpenses(expenseItems) {
  const rows = expenseItems
    .map((item) => ({ ...item, monthAmount: monthlyAmount(item, state.month) }))
    .sort((a, b) => b.monthAmount - a.monthAmount)
    .slice(0, 4);

  els.topExpenses.innerHTML = "";
  const tips = [
    {
      icon: "list-checks",
      title: "Segui tus gastos",
      text: rows[0] ? `Mayor rubro: ${escapeHtml(itemLabel(rows[0]))}.` : "Carga gastos para ver prioridades.",
    },
    {
      icon: "banknote",
      title: "Controla efectivo",
      text: "Usa efectivo o transferencias para medir mejor.",
    },
    {
      icon: "shopping-basket",
      title: "Planifica compras",
      text: "Agrupa compras y evita pagos impulsivos.",
    },
    {
      icon: "bar-chart-3",
      title: "Revisa cada mes",
      text: "Ajusta importes y presupuestos al cerrar el periodo.",
    },
  ];

  tips.forEach((tip) => {
    const div = document.createElement("div");
    div.className = "tip-item";
    div.innerHTML = `
      <i data-lucide="${tip.icon}"></i>
      <div>
        <strong>${tip.title}</strong>
        <span>${tip.text}</span>
      </div>
    `;
    els.topExpenses.append(div);
  });
}

function renderAlerts(summary) {
  const alerts = [];
  const cardTotal = sum(summary.expenseItems.filter((item) => item.category === "card"));
  const creditTotal = sum(summary.expenseItems.filter((item) => item.category === "credit"));
  const futureCount = state.entries.filter((item) => item.category === "future" && monthDiff(state.month, item.start) > 0).length;
  const overdueCount = entriesForMonth(state.month).filter((item) => entryStatus(item) === "overdue").length;
  const budgetAlerts = budgetUsage(summary.expenseItems).filter((item) => item.budget > 0 && item.total > item.budget);

  if (summary.income === 0) {
    alerts.push({ level: "warning", title: "Sin ingresos", text: "Carga ingresos para medir margen real." });
  }
  if (overdueCount > 0) {
    alerts.push({ level: "danger", title: "Vencimientos", text: `${overdueCount} movimientos vencidos.` });
  }
  if (budgetAlerts.length > 0) {
    alerts.push({ level: "warning", title: "Presupuesto", text: `${budgetAlerts.length} rubros pasados de limite.` });
  }
  if (summary.balance < 0) {
    alerts.push({ level: "danger", title: "Deficit", text: `${money(Math.abs(summary.balance))} arriba de ingresos.` });
  }
  if (summary.committedRate > 70) {
    alerts.push({ level: "warning", title: "Fijos altos", text: `${summary.committedRate}% comprometido antes de casuales.` });
  }
  if (cardTotal + creditTotal > summary.income * 0.35 && summary.income > 0) {
    alerts.push({ level: "warning", title: "Deuda pesada", text: `${money(cardTotal + creditTotal)} entre tarjetas y creditos.` });
  }
  if (futureCount > 0) {
    alerts.push({ level: "good", title: "Plan futuro", text: `${futureCount} gastos futuros cargados.` });
  }
  if (!alerts.length) {
    alerts.push({ level: "good", title: "Mes sano", text: "Sin alertas fuertes por ahora." });
  }

  els.alertsList.innerHTML = "";
  els.alertCount.textContent = String(alerts.length);
  alerts.slice(0, 4).forEach((alert) => {
    const div = document.createElement("div");
    div.className = `alert-item ${alert.level}`;
    div.innerHTML = `
      <strong><span>${alert.title}</span></strong>
      <div class="muted">${alert.text}</div>
    `;
    els.alertsList.append(div);
  });
}

function renderDonut(rows, baseTotal = 0) {
  const canvas = els.donutChart;
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const center = size / 2;
  const radius = Math.max(70, center - 12);
  const total = rows.reduce((acc, row) => acc + row.total, 0);
  const percentBase = baseTotal || total;

  ctx.clearRect(0, 0, size, size);
  els.donutLegend.innerHTML = "";
  els.donutTotal.textContent = money(total);

  if (!total) {
    drawEmptyDonut(ctx, center, radius);
    return;
  }

  let start = -Math.PI / 2;
  rows.forEach((plan) => {
    const value = plan.total;
    const angle = (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = plan.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    const middle = start + angle / 2;
    const labelPercent = (value / percentBase) * 100;
    if (angle > 0.22) {
      const labelRadius = radius * .63;
      const x = center + Math.cos(middle) * labelRadius;
      const y = center + Math.sin(middle) * labelRadius;
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 18px Roboto Condensed, Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(7, 26, 52, .38)";
      ctx.shadowBlur = 4;
      ctx.fillText(formatPercent(labelPercent), x, y);
      ctx.shadowBlur = 0;
    }
    start += angle;

    const row = document.createElement("div");
    row.className = "legend-row";
    row.innerHTML = `
      <span class="legend-dot" style="background: ${plan.color}"></span>
      <span>${plan.title}</span>
      <strong>${formatPercent(Math.round((value / percentBase) * 1000) / 10)}</strong>
    `;
    els.donutLegend.append(row);
  });
}

function drawEmptyDonut(ctx, center, radius) {
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.lineWidth = 28;
  ctx.strokeStyle = "#dbe3ee";
  ctx.stroke();
}

function renderTrendChart() {
  const canvas = els.trendChart;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  const width = Math.max(Math.floor(rect.width * scale), 320);
  const height = Math.floor(180 * scale);
  canvas.width = width;
  canvas.height = height;
  ctx.scale(scale, scale);

  const cssWidth = width / scale;
  const cssHeight = height / scale;
  const pad = 28;
  const months = nextMonths(state.month, 12);
  const points = months.map((month) => {
    const rows = entriesForMonth(month);
    const income = sum(rows.filter((item) => item.kind === "income"), month);
    const expenses = sum(rows.filter((item) => item.kind === "expense"), month);
    return { month, income, expenses, balance: income - expenses };
  });
  const max = Math.max(...points.flatMap((point) => [point.income, point.expenses]), 1);

  ctx.clearRect(0, 0, cssWidth, cssHeight);
  drawGrid(ctx, cssWidth, cssHeight, pad);
  drawLine(ctx, points.map((point) => point.income), max, cssWidth, cssHeight, pad, "#2fbf9b");
  drawLine(ctx, points.map((point) => point.expenses), max, cssWidth, cssHeight, pad, "#c9873f");
  drawLine(ctx, points.map((point) => Math.max(point.balance, 0)), max, cssWidth, cssHeight, pad, "#6d7df2");

  ctx.fillStyle = "#647084";
  ctx.font = "700 11px Manrope, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Ingresos", pad, 14);
  ctx.fillStyle = "#2fbf9b";
  ctx.fillRect(pad + 52, 6, 18, 4);
  ctx.fillStyle = "#647084";
  ctx.fillText("Gastos", pad + 86, 14);
  ctx.fillStyle = "#c9873f";
  ctx.fillRect(pad + 128, 6, 18, 4);
}

function drawGrid(ctx, width, height, pad) {
  ctx.strokeStyle = "#e5ebf3";
  ctx.lineWidth = 1;
  for (let index = 0; index < 4; index += 1) {
    const y = pad + ((height - pad * 2) / 3) * index;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(width - pad, y);
    ctx.stroke();
  }
}

function drawLine(ctx, values, max, width, height, pad, color) {
  const graphWidth = width - pad * 2;
  const graphHeight = height - pad * 2;
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = pad + (graphWidth / Math.max(values.length - 1, 1)) * index;
    const y = pad + graphHeight - (value / max) * graphHeight;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
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

function planRows(expenseItems) {
  const rows = new Map();
  expenseItems.forEach((item) => {
    const bucketKey = planBucketFor(item);
    const bucket = planBuckets[bucketKey];
    const current = rows.get(bucketKey) || { ...bucket, key: bucketKey, total: 0 };
    current.total += monthlyAmount(item, state.month);
    rows.set(bucketKey, current);
  });
  return [...rows.values()].filter((row) => row.total > 0);
}

function planBucketFor(item) {
  const text = normalizeText(`${item.name} ${item.notes || ""} ${categoryLabels[item.category] || ""}`);
  const match = Object.entries(planBuckets).find(([, bucket]) => bucket.keywords.some((keyword) => text.includes(keyword)));
  if (match) return match[0];
  if (item.category === "fixed") return "housing";
  if (item.category === "additional") return "services";
  if (item.category === "card" || item.category === "credit") return "cards";
  if (item.category === "future") return "savings";
  return "leisure";
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function formatPercent(value) {
  return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(value || 0)}%`;
}

function itemLabel(item) {
  return planBuckets[planBucketFor(item)]?.title || categoryLabels[item.category] || item.name;
}

function formatMonth(value) {
  const [year, month] = value.split("-").map(Number);
  const formatted = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
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

function persistActivityLocal() {
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(state.activity));
}

function loadLocalActivity() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
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
    status: category === "future" ? "planned" : "pending",
    dueDay: 0,
    account: "",
    vendor: "",
    priority: "normal",
    budget: 0,
    tags: [],
    notes: "",
    createdAt: new Date().toISOString(),
  };
}

async function clearAll() {
  if (!ensureCanWrite()) return;
  if (!state.entries.length) return;
  if (!confirm("Seguro que queres borrar todos los movimientos? Esta accion no se puede deshacer.")) return;
  const typed = prompt('Escribi "BORRAR" para confirmar.');
  if (typed !== "BORRAR") {
    showToast("Borrado cancelado", "warning");
    return;
  }
  const deletedCount = state.entries.length;
  state.entries = [];
  await clearRemote();
  await addActivity("cleared", { name: "Todos los movimientos", amount: deletedCount, category: "all", kind: "expense" });
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
  if (!state.currentUser?.name) {
    state.entries = [];
    state.activity = [];
    persistLocal();
    persistActivityLocal();
    render();
    return;
  }
  document.body.classList.add("is-syncing");
  const { data, error } = await supabaseClient
    .from(tableName())
    .select("*")
    .eq("user_name", state.currentUser.name)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Supabase sync failed:", error.message);
    document.body.classList.remove("is-syncing");
    showToast("No se pudo sincronizar", "warning");
    return;
  }

  state.entries = data.map(fromDbEntry);
  const { data: activityData, error: activityError } = await supabaseClient
    .from(activityTableName())
    .select("*")
    .eq("user_name", state.currentUser.name)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!activityError && activityData) {
    state.activity = activityData.map(fromDbActivity);
    persistActivityLocal();
  }

  persistLocal();
  render();
  document.body.classList.remove("is-syncing");
  showToast("Datos sincronizados", "success");
}

async function persist(entry) {
  persistLocal();
  if (!supabaseClient) {
    showToast("Movimiento guardado", "success");
    return;
  }

  const { error } = await supabaseClient
    .from(tableName())
    .upsert(toDbEntry(entry), { onConflict: "id" });

  if (error) console.error("Supabase save failed:", error.message);
  showToast(error ? "Guardado local, Supabase fallo" : "Movimiento guardado", error ? "warning" : "success");
}

async function persistMany(entries) {
  persistLocal();
  if (!supabaseClient) {
    showToast("Ejemplo cargado", "success");
    return;
  }

  const { error } = await supabaseClient
    .from(tableName())
    .upsert(entries.map(toDbEntry), { onConflict: "id" });

  if (error) console.error("Supabase bulk save failed:", error.message);
  showToast(error ? "Ejemplo guardado local" : "Ejemplo cargado", error ? "warning" : "success");
}

async function deleteRemote(id) {
  if (!supabaseClient) {
    showToast("Movimiento borrado", "success");
    return;
  }
  const { error } = await supabaseClient.from(tableName()).delete().eq("id", id).eq("user_name", state.currentUser.name);
  if (error) console.error("Supabase delete failed:", error.message);
  showToast(error ? "Borrado local, Supabase fallo" : "Movimiento borrado", error ? "warning" : "success");
}

async function clearRemote() {
  if (!supabaseClient) {
    showToast("Datos borrados", "success");
    return;
  }
  const { error } = await supabaseClient.from(tableName()).delete().eq("user_name", state.currentUser.name);
  if (error) console.error("Supabase clear failed:", error.message);
  showToast(error ? "Borrado local, Supabase fallo" : "Datos borrados", error ? "warning" : "success");
}

function tableName() {
  return supabaseConfig.table || "entries";
}

function activityTableName() {
  return supabaseConfig.activityTable || "activity_logs";
}

function toDbEntry(entry) {
  return {
    id: entry.id,
    user_name: state.currentUser?.name || "",
    name: entry.name,
    kind: entry.kind,
    category: entry.category,
    amount: entry.amount,
    start: entry.start,
    frequency: entry.frequency,
    duration: entry.duration || 0,
    payment: entry.payment,
    installments: entry.installments || 1,
    status: entry.status || "pending",
    due_day: entry.dueDay || 0,
    account: entry.account || "",
    vendor: entry.vendor || "",
    priority: entry.priority || "normal",
    budget: entry.budget || 0,
    tags: entry.tags || [],
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
    status: row.status || "pending",
    dueDay: Number(row.due_day || 0),
    account: row.account || "",
    vendor: row.vendor || "",
    priority: row.priority || "normal",
    budget: Number(row.budget || 0),
    tags: row.tags || [],
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

async function addActivity(action, entry) {
  const event = {
    id: newId(),
    action,
    entryId: entry.id || "",
    entryName: entry.name || "Movimiento",
    actorName: currentActorName(),
    amount: Number(entry.amount || 0),
    kind: entry.kind || "expense",
    category: entry.category || "uncategorized",
    detail: activityDetail(action, entry),
    createdAt: new Date().toISOString(),
  };

  state.activity.unshift(event);
  state.activity = state.activity.slice(0, 120);
  persistActivityLocal();
  renderActivity();

  if (!supabaseClient) return;
  const { error } = await supabaseClient.from(activityTableName()).insert(toDbActivity(event));
  if (error) console.error("Supabase activity log failed:", error.message);
}

function activityDetail(action, entry) {
  const amount = entry.amount ? money(entry.amount) : "";
  const category = categoryLabels[entry.category] || entry.category || "Sin categoria";
  const base = `${entry.name || "Movimiento"} ${amount} - ${category}`;
  if (action === "created") return `Carga creada: ${base}`;
  if (action === "updated") return `Movimiento modificado: ${base}`;
  if (action === "deleted") return `Movimiento eliminado: ${base}`;
  if (action === "cleared") return `Borrado total ejecutado. Movimientos eliminados: ${entry.amount || 0}`;
  return base;
}

function activityTitle(event) {
  const labels = {
    created: "Carga",
    updated: "Modificacion",
    deleted: "Eliminacion",
    cleared: "Borrado total",
  };
  const action = labels[event.action] || "Actividad";
  return `${action} - ${event.actorName || "Usuario"}`;
}

function activityIcon(action) {
  const icons = {
    created: "+",
    updated: "↻",
    deleted: "−",
    cleared: "⌫",
  };
  return icons[action] || "•";
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toDbActivity(event) {
  return {
    id: event.id,
    user_name: state.currentUser?.name || "",
    action: event.action,
    entry_id: event.entryId,
    entry_name: event.entryName,
    actor_name: event.actorName || currentActorName(),
    amount: event.amount,
    kind: event.kind,
    category: event.category,
    detail: event.detail,
    created_at: event.createdAt,
  };
}

function fromDbActivity(row) {
  return {
    id: row.id,
    action: row.action,
    entryId: row.entry_id || "",
    entryName: row.entry_name || "",
    actorName: row.actor_name || "",
    amount: Number(row.amount || 0),
    kind: row.kind || "",
    category: row.category || "",
    detail: row.detail || "",
    createdAt: row.created_at,
  };
}

function currentActorName() {
  return state.currentUser?.name || "Usuario";
}

async function initAuth() {
  renderAuth();
}

async function signInWithPassword() {
  const username = normalizeUsername(els.loginUserInput.value);
  const password = els.loginPasswordInput.value;
  if (!username || !password) {
    showToast("Ingresa usuario y contrasena", "warning");
    return;
  }

  const passwordHash = await sha256(password);
  if (appUsers[username] !== passwordHash) {
    showToast("Usuario o contrasena incorrectos", "warning");
    els.loginStatus.textContent = "No se pudo ingresar. Revisa usuario y contrasena.";
    return;
  }

  state.currentUser = { name: username };
  saveSession(state.currentUser);
  els.loginPasswordInput.value = "";
  renderAuth();
  await syncFromSupabase();
  showToast("Ingreso correcto", "success");
}

async function signOut() {
  clearSession();
  state.currentUser = null;
  state.entries = [];
  state.activity = [];
  persistLocal();
  persistActivityLocal();
  renderAuth();
  render();
  showToast("Sesion cerrada", "success");
}

function renderAuth() {
  const loggedIn = Boolean(state.currentUser?.name);
  document.body.classList.toggle("auth-required", !loggedIn);
  els.appShell.setAttribute("aria-hidden", loggedIn ? "false" : "true");
  els.loginScreen.setAttribute("aria-hidden", loggedIn ? "true" : "false");
  els.logoutBtn.classList.toggle("hidden", !loggedIn);
  els.logoutBtn.textContent = loggedIn ? `Salir (${currentActorName()})` : "Salir";
}

function ensureCanWrite() {
  if (state.currentUser?.name) return true;
  showToast("Ingresa con tu usuario primero", "warning");
  return false;
}

function normalizeUsername(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]/g, "");
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function saveSession(user) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY));
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function initContextInfo() {
  updateRosarioTime();
  fetchRosarioWeather();
  setInterval(updateRosarioTime, 30000);
  setInterval(fetchRosarioWeather, 30 * 60 * 1000);
}

function updateRosarioTime() {
  if (!els.rosarioTime) return;
  els.rosarioTime.textContent = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

async function fetchRosarioWeather() {
  if (!els.rosarioWeather) return;
  try {
    const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-32.9468&longitude=-60.6393&current=temperature_2m,weather_code&timezone=America%2FArgentina%2FCordoba");
    const data = await response.json();
    const temp = Math.round(data.current?.temperature_2m);
    const code = data.current?.weather_code;
    els.rosarioWeather.textContent = Number.isFinite(temp) ? `${temp}°` : "--°";
    els.weatherLabel.textContent = weatherCodeLabel(code);
  } catch (error) {
    console.error("Weather fetch failed:", error);
    els.weatherLabel.textContent = "Clima";
    els.rosarioWeather.textContent = "--°";
  }
}

function weatherCodeLabel(code) {
  if ([0, 1].includes(code)) return "Despejado";
  if ([2, 3].includes(code)) return "Nublado";
  if ([45, 48].includes(code)) return "Niebla";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "Lluvia";
  if ([95, 96, 99].includes(code)) return "Tormenta";
  return "Clima";
}

function refreshIcons() {
  if (window.lucide?.createIcons) window.lucide.createIcons();
}

function applyPreset(category) {
  els.categoryInput.value = category;
  els.kindInput.value = category === "income" ? "income" : "expense";
  if (category === "income") {
    els.paymentInput.value = "transfer";
    els.frequencyInput.value = "monthly";
    els.statusInput.value = "paid";
  }
  if (category === "card") els.paymentInput.value = "card";
  if (category === "credit") els.paymentInput.value = "credit";
  if (category === "future") els.statusInput.value = "planned";
  if (category === "fixed") els.frequencyInput.value = "monthly";
}

function parseTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function matchesSearch(item, search) {
  if (!search) return true;
  const haystack = [
    item.name,
    item.notes,
    item.account,
    item.vendor,
    ...(item.tags || []),
  ].join(" ").toLowerCase();
  return haystack.includes(search);
}

function entryStatus(entry) {
  if (entry.status === "paid") return "paid";
  if (entry.status === "planned") return "planned";
  if (entry.status === "overdue") return "overdue";
  if (entry.dueDay && isActiveInMonth(entry, state.month)) {
    const now = new Date();
    const [year, month] = state.month.split("-").map(Number);
    const dueDate = new Date(year, month - 1, entry.dueDay);
    if (state.month === currentMonth() && dueDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      return "overdue";
    }
  }
  return "pending";
}

function dueLabel(entry) {
  if (!entry.dueDay) return "-";
  return `Dia ${entry.dueDay}`;
}

function budgetUsage(expenseItems) {
  const usage = expenseItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = { category: item.category, total: 0, budget: 0 };
    acc[item.category].total += monthlyAmount(item, state.month);
    acc[item.category].budget = Math.max(acc[item.category].budget, item.budget || 0);
    return acc;
  }, {});
  return Object.values(usage);
}

let toastTimer;

function showToast(message, type = "success") {
  if (!els.toast) return;
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.className = `toast show ${type}`;
  toastTimer = setTimeout(() => {
    els.toast.className = "toast";
  }, 2400);
}
