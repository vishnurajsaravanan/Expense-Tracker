// Global variables to store data
let transactions = JSON.parse(localStorage.getItem('expenseTrackerData')) || [];
let overviewChart = null;
let monthlyChart = null;

// DOM elements
const cashInHandElement = document.getElementById('cashInHand');
const totalIncomeElement = document.getElementById('totalIncome');
const totalExpensesElement = document.getElementById('totalExpenses');
const totalSavingsElement = document.getElementById('totalSavings');
const totalCreditCardElement = document.getElementById('totalCreditCard');
const transactionsListElement = document.getElementById('transactionsList');

// Form elements
const incomeForm = document.getElementById('incomeForm');
const expenseForm = document.getElementById('expenseForm');
const savingsForm = document.getElementById('savingsForm');
const creditCardForm = document.getElementById('creditCardForm');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    updateAllDisplays();
    initializeCharts();
    setupEventListeners();
});

// Setup event listeners for forms
function setupEventListeners() {
    incomeForm.addEventListener('submit', handleIncomeSubmit);
    expenseForm.addEventListener('submit', handleExpenseSubmit);
    savingsForm.addEventListener('submit', handleSavingsSubmit);
    creditCardForm.addEventListener('submit', handleCreditCardSubmit);
}

// Handle form submissions
function handleIncomeSubmit(e) {
    e.preventDefault();
    const description = document.getElementById('incomeDescription').value;
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    
    if (amount > 0) {
        addTransaction('income', description, amount);
        incomeForm.reset();
    }
}

function handleExpenseSubmit(e) {
    e.preventDefault();
    const description = document.getElementById('expenseDescription').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    
    if (amount > 0) {
        addTransaction('expense', description, amount);
        expenseForm.reset();
    }
}

function handleSavingsSubmit(e) {
    e.preventDefault();
    const description = document.getElementById('savingsDescription').value;
    const amount = parseFloat(document.getElementById('savingsAmount').value);
    
    if (amount > 0) {
        addTransaction('savings', description, amount);
        savingsForm.reset();
    }
}

function handleCreditCardSubmit(e) {
    e.preventDefault();
    const description = document.getElementById('creditCardDescription').value;
    const amount = parseFloat(document.getElementById('creditCardAmount').value);
    
    if (amount > 0) {
        addTransaction('credit-card', description, amount);
        creditCardForm.reset();
    }
}

// Add a new transaction
function addTransaction(type, description, amount) {
    const transaction = {
        id: Date.now(),
        type: type,
        description: description,
        amount: amount,
        date: new Date().toISOString(),
        month: new Date().getMonth(),
        year: new Date().getFullYear()
    };
    
    transactions.push(transaction);
    saveToLocalStorage();
    updateAllDisplays();
    updateCharts();
}

// Calculate totals
function calculateTotals() {
    const totals = {
        income: 0,
        expense: 0,
        savings: 0,
        'credit-card': 0
    };
    
    transactions.forEach(transaction => {
        totals[transaction.type] += transaction.amount;
    });
    
    return totals;
}

// Calculate cash in hand
function calculateCashInHand() {
    const totals = calculateTotals();
    return totals.income - totals.expense - totals.savings - totals['credit-card'];
}

// Update all displays
function updateAllDisplays() {
    const totals = calculateTotals();
    const cashInHand = calculateCashInHand();
    
    // Update summary cards
    totalIncomeElement.textContent = formatCurrency(totals.income);
    totalExpensesElement.textContent = formatCurrency(totals.expense);
    totalSavingsElement.textContent = formatCurrency(totals.savings);
    totalCreditCardElement.textContent = formatCurrency(totals['credit-card']);
    
    // Update cash in hand
    cashInHandElement.textContent = formatCurrency(cashInHand);
    
    // Update cash in hand color based on value
    if (cashInHand >= 0) {
        cashInHandElement.style.color = '#4CAF50';
    } else {
        cashInHandElement.style.color = '#f44336';
    }
    
    // Update transactions list
    updateTransactionsList();
}

// Update transactions list
function updateTransactionsList() {
    const recentTransactions = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
    
    transactionsListElement.innerHTML = '';
    
    if (recentTransactions.length === 0) {
        transactionsListElement.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No transactions yet. Add your first transaction above!</p>';
        return;
    }
    
    recentTransactions.forEach(transaction => {
        const transactionElement = createTransactionElement(transaction);
        transactionsListElement.appendChild(transactionElement);
    });
}

// Create transaction element
function createTransactionElement(transaction) {
    const div = document.createElement('div');
    div.className = 'transaction-item';
    
    const date = new Date(transaction.date);
    const formattedDate = date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const typeIcons = {
        'income': '💰',
        'expense': '💸',
        'savings': '💾',
        'credit-card': '💳'
    };
    
    div.innerHTML = `
        <div class="transaction-info">
            <div class="transaction-description">
                ${typeIcons[transaction.type]} ${transaction.description}
            </div>
            <div class="transaction-date">${formattedDate}</div>
        </div>
        <div class="transaction-amount ${transaction.type}">
            ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
        </div>
    `;
    
    return div;
}

// Format currency in Indian Rupees
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('expenseTrackerData', JSON.stringify(transactions));
}

// Initialize charts
function initializeCharts() {
    createOverviewChart();
    createMonthlyChart();
}

// Create overview chart
function createOverviewChart() {
    const ctx = document.getElementById('overviewChart').getContext('2d');
    
    const totals = calculateTotals();
    
    overviewChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expenses', 'Savings', 'Credit Card Bills'],
            datasets: [{
                data: [totals.income, totals.expense, totals.savings, totals['credit-card']],
                backgroundColor: [
                    '#4CAF50',
                    '#f44336',
                    '#2196F3',
                    '#FF9800'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            return `${label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            }
        }
    });
}

// Create monthly chart
function createMonthlyChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    const monthlyData = getMonthlyData();
    
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthlyData.labels,
            datasets: [
                {
                    label: 'Income',
                    data: monthlyData.income,
                    backgroundColor: '#4CAF50',
                    borderColor: '#4CAF50',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: monthlyData.expenses,
                    backgroundColor: '#f44336',
                    borderColor: '#f44336',
                    borderWidth: 1
                },
                {
                    label: 'Savings',
                    data: monthlyData.savings,
                    backgroundColor: '#2196F3',
                    borderColor: '#2196F3',
                    borderWidth: 1
                },
                {
                    label: 'Credit Card Bills',
                    data: monthlyData.creditCard,
                    backgroundColor: '#FF9800',
                    borderColor: '#FF9800',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            }
        }
    });
}

// Get monthly data for chart
function getMonthlyData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const currentYear = new Date().getFullYear();
    const monthlyData = {
        labels: [],
        income: [],
        expenses: [],
        savings: [],
        creditCard: []
    };
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
        const month = new Date(currentYear, new Date().getMonth() - i, 1);
        const monthIndex = month.getMonth();
        const monthYear = month.getFullYear();
        
        monthlyData.labels.push(months[monthIndex]);
        
        // Filter transactions for this month
        const monthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === monthIndex && 
                   transactionDate.getFullYear() === monthYear;
        });
        
        // Calculate totals for this month
        const monthTotals = {
            income: 0,
            expense: 0,
            savings: 0,
            'credit-card': 0
        };
        
        monthTransactions.forEach(t => {
            monthTotals[t.type] += t.amount;
        });
        
        monthlyData.income.push(monthTotals.income);
        monthlyData.expenses.push(monthTotals.expense);
        monthlyData.savings.push(monthTotals.savings);
        monthlyData.creditCard.push(monthTotals['credit-card']);
    }
    
    return monthlyData;
}

// Update charts
function updateCharts() {
    if (overviewChart) {
        const totals = calculateTotals();
        overviewChart.data.datasets[0].data = [
            totals.income, 
            totals.expense, 
            totals.savings, 
            totals['credit-card']
        ];
        overviewChart.update();
    }
    
    if (monthlyChart) {
        const monthlyData = getMonthlyData();
        monthlyChart.data.labels = monthlyData.labels;
        monthlyChart.data.datasets[0].data = monthlyData.income;
        monthlyChart.data.datasets[1].data = monthlyData.expenses;
        monthlyChart.data.datasets[2].data = monthlyData.savings;
        monthlyChart.data.datasets[3].data = monthlyData.creditCard;
        monthlyChart.update();
    }
}

// Add some sample data for demonstration
function addSampleData() {
    if (transactions.length === 0) {
        const sampleData = [
            { type: 'income', description: 'Salary', amount: 50000 },
            { type: 'expense', description: 'Rent', amount: 15000 },
            { type: 'expense', description: 'Groceries', amount: 5000 },
            { type: 'savings', description: 'Emergency Fund', amount: 10000 },
            { type: 'credit-card', description: 'Credit Card Bill', amount: 8000 },
            { type: 'income', description: 'Freelance Work', amount: 15000 },
            { type: 'expense', description: 'Utilities', amount: 3000 },
            { type: 'savings', description: 'Investment', amount: 5000 }
        ];
        
        sampleData.forEach((item, index) => {
            const date = new Date();
            date.setDate(date.getDate() - index);
            
            const transaction = {
                id: Date.now() + index,
                type: item.type,
                description: item.description,
                amount: item.amount,
                date: date.toISOString(),
                month: date.getMonth(),
                year: date.getFullYear()
            };
            
            transactions.push(transaction);
        });
        
        saveToLocalStorage();
        updateAllDisplays();
        updateCharts();
    }
}

// Initialize with sample data (uncomment the line below to add sample data)
// addSampleData();