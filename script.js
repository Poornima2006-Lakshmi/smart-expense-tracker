let expenses = [];

document.addEventListener("DOMContentLoaded", () => {
    loadExpenses();
    document.getElementById("expense-form").addEventListener("submit", addExpense);
});

function addExpense(e) {
    e.preventDefault();

    const amount = parseFloat(document.getElementById("amount").value);
    const description = document.getElementById("description").value;
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;

    const expense = { amount, description, category, date };
    expenses.push(expense);
    saveExpenses();
    renderExpenses();
    document.getElementById("expense-form").reset();
}

function renderExpenses() {
    const tbody = document.querySelector("#expense-table tbody");
    tbody.innerHTML = "";

    let total = 0;
    const categoryTotals = {};

    expenses.forEach((expense, index) => {
        total += expense.amount;
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${expense.date}</td>
            <td>${expense.description}</td>
            <td>${expense.category}</td>
            <td>$${expense.amount.toFixed(2)}</td>
            <td><button onclick="deleteExpense(${index})">Delete</button></td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById("total-spending").textContent = `$${total.toFixed(2)}`;
    renderChart(categoryTotals);
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    saveExpenses();
    renderExpenses();
}

function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

function loadExpenses() {
    const storedExpenses = JSON.parse(localStorage.getItem("expenses"));
    if (storedExpenses) {
        expenses = storedExpenses;
    }
    renderExpenses();
}

function renderChart(categoryTotals) {
    const ctx = document.getElementById("expense-chart").getContext("2d");
    if (window.expenseChart) {
        window.expenseChart.destroy();
    }

    window.expenseChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                label: "Category-wise Spending",
                data: Object.values(categoryTotals),
                backgroundColor: [
                    "#007BFF",
                    "#28A745",
                    "#FFC107",
                    "#DC3545",
                    "#6C757D"
                ]
            }]
        }
    });
}
