let expenses = [];
let editId = null;
let chartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  // Load theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") document.body.classList.add("dark");

  // Load expenses
  expenses = loadExpenses();

  // Events
  document.getElementById("expense-form").addEventListener("submit", onSubmitExpense);
  document.getElementById("cancel-edit").addEventListener("click", cancelEdit);

  document.getElementById("filter-category").addEventListener("change", render);
  document.getElementById("filter-date").addEventListener("change", render);
  document.getElementById("clear-filters").addEventListener("click", clearFilters);

  document.getElementById("export-csv").addEventListener("click", exportToCSV);

  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

  // Initial render
  render();
});

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function onSubmitExpense(e) {
  e.preventDefault();

  const amountEl = document.getElementById("amount");
  const descriptionEl = document.getElementById("description");
  const categoryEl = document.getElementById("category");
  const dateEl = document.getElementById("date");

  const amount = Number(amountEl.value);
  const description = descriptionEl.value.trim();
  const category = categoryEl.value;
  const date = dateEl.value;

  if (!amount || amount <= 0 || !description || !category || !date) {
    alert("Please fill all fields correctly.");
    return;
  }

  if (editId) {
    // Update
    const idx = expenses.findIndex(x => x.id === editId);
    if (idx !== -1) {
      expenses[idx] = { id: editId, amount, description, category, date };
    }
    cancelEdit();
  } else {
    // Add
    expenses.push({ id: uid(), amount, description, category, date });
  }

  saveExpenses(expenses);
  document.getElementById("expense-form").reset();
  render();
}

function startEdit(id) {
  const exp = expenses.find(x => x.id === id);
  if (!exp) return;

  editId = id;

  document.getElementById("amount").value = exp.amount;
  document.getElementById("description").value = exp.description;
  document.getElementById("category").value = exp.category;
  document.getElementById("date").value = exp.date;

  document.getElementById("form-title").textContent = "Edit Expense";
  document.getElementById("submit-btn").textContent = "Update Expense";
  document.getElementById("cancel-edit").style.display = "inline-block";
}

function cancelEdit() {
  editId = null;
  document.getElementById("expense-form").reset();
  document.getElementById("form-title").textContent = "Add Expense";
  document.getElementById("submit-btn").textContent = "Add Expense";
  document.getElementById("cancel-edit").style.display = "none";
}

function deleteExpense(id) {
  expenses = expenses.filter(x => x.id !== id);
  saveExpenses(expenses);
  render();
}

function getFilters() {
  const cat = document.getElementById("filter-category").value;
  const date = document.getElementById("filter-date").value;

  return { cat, date };
}

function clearFilters() {
  document.getElementById("filter-category").value = "All";
  document.getElementById("filter-date").value = "";
  render();
}

function applyFilters(list) {
  const { cat, date } = getFilters();

  return list.filter(exp => {
    const okCat = (cat === "All") || (exp.category === cat);
    const okDate = (!date) || (exp.date === date);
    return okCat && okDate;
  });
}

function render() {
  const tbody = document.querySelector("#expense-table tbody");
  tbody.innerHTML = "";

  const filtered = applyFilters(expenses);

  document.getElementById("empty-text").style.display = filtered.length ? "none" : "block";

  let total = 0;
  const categoryTotals = {};

  // Sort by date (newest first)
  filtered
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .forEach(exp => {
      total += exp.amount;
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="Date">${exp.date}</td>
        <td data-label="Description">${escapeHtml(exp.description)}</td>
        <td data-label="Category">${exp.category}</td>
        <td data-label="Amount">₹${exp.amount.toFixed(2)}</td>
        <td data-label="Actions">
          <button class="btn secondary" onclick="startEdit('${exp.id}')">Edit</button>
          <button class="btn secondary" onclick="deleteExpense('${exp.id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  document.getElementById("total-spending").textContent = `₹${total.toFixed(2)}`;

  renderChart(categoryTotals);
}

function renderChart(categoryTotals) {
  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  const ctx = document.getElementById("expense-chart").getContext("2d");

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        label: "Category-wise Spending",
        data,
        backgroundColor: ["#007BFF", "#28A745", "#FFC107", "#DC3545", "#6C757D"]
      }]
    },
    options: {
      responsive: true
    }
  });
}

function exportToCSV() {
  if (!expenses.length) {
    alert("No expenses to export!");
    return;
  }

  const header = ["Date", "Description", "Category", "Amount"];
  const rows = expenses.map(e => [e.date, e.description, e.category, e.amount]);

  const csvContent = [header, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "expenses.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}

function saveExpenses(data) {
  localStorage.setItem("expenses", JSON.stringify(data));
}

function loadExpenses() {
  const stored = localStorage.getItem("expenses");
  try {
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

// Make functions available for inline onclick
window.startEdit = startEdit;
window.deleteExpense = deleteExpense;
