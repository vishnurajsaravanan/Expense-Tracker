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
    
    // Handle window resize for better chart responsiveness
    window.addEventListener('resize', function() {
        setTimeout(() => {
            if (overviewChart) {
                overviewChart.resize();
            }
            if (monthlyChart) {
                monthlyChart.resize();
            }
        }, 100);
    });
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
    // Group transactions by month
    const groupedTransactions = groupTransactionsByMonth();
    
    transactionsListElement.innerHTML = '';
    
    if (Object.keys(groupedTransactions).length === 0) {
        transactionsListElement.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No transactions yet. Add your first transaction above!</p>';
        return;
    }
    
    // Sort months in descending order (most recent first)
    const sortedMonths = Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a));
    
    sortedMonths.forEach(monthKey => {
        const monthData = groupedTransactions[monthKey];
        const monthElement = createMonthGroupElement(monthKey, monthData);
        transactionsListElement.appendChild(monthElement);
    });
}

// Group transactions by month
function groupTransactionsByMonth() {
    const grouped = {};
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!grouped[monthKey]) {
            grouped[monthKey] = {
                transactions: [],
                totals: {
                    income: 0,
                    expense: 0,
                    savings: 0,
                    'credit-card': 0
                }
            };
        }
        
        grouped[monthKey].transactions.push(transaction);
        grouped[monthKey].totals[transaction.type] += transaction.amount;
    });
    
    return grouped;
}

// Create month group element
function createMonthGroupElement(monthKey, monthData) {
    const div = document.createElement('div');
    div.className = 'month-group';
    
    const date = new Date(monthKey + '-01');
    const monthName = date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long' 
    });
    
    const netAmount = monthData.totals.income - monthData.totals.expense - monthData.totals.savings - monthData.totals['credit-card'];
    
    div.innerHTML = `
        <div class="month-header">
            <h4>${monthName}</h4>
            <div class="month-summary">
                <span class="month-net ${netAmount >= 0 ? 'positive' : 'negative'}">
                    Net: ${formatCurrency(Math.abs(netAmount))} ${netAmount >= 0 ? '💰' : '💸'}
                </span>
            </div>
        </div>
        <div class="month-totals">
            <span class="total-item income">Income: ${formatCurrency(monthData.totals.income)}</span>
            <span class="total-item expense">Expenses: ${formatCurrency(monthData.totals.expense)}</span>
            <span class="total-item savings">Savings: ${formatCurrency(monthData.totals.savings)}</span>
            <span class="total-item credit-card">Credit Card: ${formatCurrency(monthData.totals['credit-card'])}</span>
        </div>
        <div class="month-transactions">
            ${monthData.transactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(transaction => createTransactionElement(transaction).outerHTML)
                .join('')}
        </div>
    `;
    
    return div;
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
    
    // Calculate total for scaling
    const totalAmount = totals.income + totals.expense + totals.savings + totals['credit-card'];
    
    // Determine chart size based on data
    const chartHeight = totalAmount > 0 ? Math.max(300, Math.min(500, 300 + (totalAmount / 1000) * 50)) : 300;
    
    // Set canvas height dynamically
    const canvas = document.getElementById('overviewChart');
    canvas.style.height = `${chartHeight}px`;
    
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
                            size: Math.max(10, Math.min(14, 12 + (totalAmount / 10000)))
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const percentage = totalAmount > 0 ? ((value / totalAmount) * 100).toFixed(1) : 0;
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
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
    
    // Calculate maximum value for scaling
    const allValues = [...monthlyData.income, ...monthlyData.expenses, ...monthlyData.savings, ...monthlyData.creditCard];
    const maxValue = Math.max(...allValues, 1);
    
    // Determine chart height based on data complexity and values
    const hasData = allValues.some(value => value > 0);
    const dataPoints = monthlyData.labels.length;
    const chartHeight = hasData ? Math.max(300, Math.min(600, 300 + (maxValue / 1000) * 30 + dataPoints * 20)) : 300;
    
    // Set canvas height dynamically
    const canvas = document.getElementById('monthlyChart');
    canvas.style.height = `${chartHeight}px`;
    
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
                },
                {
                    label: 'Net Amount',
                    data: monthlyData.net,
                    type: 'line',
                    borderColor: '#9C27B0',
                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    pointBackgroundColor: '#9C27B0',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
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
                        },
                        font: {
                            size: Math.max(10, Math.min(12, 11 + (maxValue / 10000)))
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: Math.max(10, Math.min(12, 11 + (dataPoints / 6)))
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: Math.max(10, Math.min(14, 12 + (maxValue / 10000)))
                        }
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
        creditCard: [],
        net: []
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
        
        const netAmount = monthTotals.income - monthTotals.expense - monthTotals.savings - monthTotals['credit-card'];
        
        monthlyData.income.push(monthTotals.income);
        monthlyData.expenses.push(monthTotals.expense);
        monthlyData.savings.push(monthTotals.savings);
        monthlyData.creditCard.push(monthTotals['credit-card']);
        monthlyData.net.push(netAmount);
    }
    
    return monthlyData;
}

// Update charts
function updateCharts() {
    if (overviewChart) {
        const totals = calculateTotals();
        const totalAmount = totals.income + totals.expense + totals.savings + totals['credit-card'];
        
        // Update chart height based on new data
        const chartHeight = totalAmount > 0 ? Math.max(300, Math.min(500, 300 + (totalAmount / 1000) * 50)) : 300;
        const canvas = document.getElementById('overviewChart');
        canvas.style.height = `${chartHeight}px`;
        
        overviewChart.data.datasets[0].data = [
            totals.income, 
            totals.expense, 
            totals.savings, 
            totals['credit-card']
        ];
        
        // Update font sizes
        overviewChart.options.plugins.legend.labels.font.size = Math.max(10, Math.min(14, 12 + (totalAmount / 10000)));
        
        overviewChart.update();
    }
    
    if (monthlyChart) {
        const monthlyData = getMonthlyData();
        const allValues = [...monthlyData.income, ...monthlyData.expenses, ...monthlyData.savings, ...monthlyData.creditCard, ...monthlyData.net];
        const maxValue = Math.max(...allValues, 1);
        const hasData = allValues.some(value => value > 0);
        const dataPoints = monthlyData.labels.length;
        
        // Update chart height based on new data
        const chartHeight = hasData ? Math.max(300, Math.min(600, 300 + (maxValue / 1000) * 30 + dataPoints * 20)) : 300;
        const canvas = document.getElementById('monthlyChart');
        canvas.style.height = `${chartHeight}px`;
        
        monthlyChart.data.labels = monthlyData.labels;
        monthlyChart.data.datasets[0].data = monthlyData.income;
        monthlyChart.data.datasets[1].data = monthlyData.expenses;
        monthlyChart.data.datasets[2].data = monthlyData.savings;
        monthlyChart.data.datasets[3].data = monthlyData.creditCard;
        monthlyChart.data.datasets[4].data = monthlyData.net;
        
        // Update font sizes
        monthlyChart.options.scales.y.ticks.font.size = Math.max(10, Math.min(12, 11 + (maxValue / 10000)));
        monthlyChart.options.scales.x.ticks.font.size = Math.max(10, Math.min(12, 11 + (dataPoints / 6)));
        monthlyChart.options.plugins.legend.labels.font.size = Math.max(10, Math.min(14, 12 + (maxValue / 10000)));
        
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

// Function to calculate optimal chart dimensions based on data
function calculateChartDimensions(data, chartType = 'overview') {
    if (chartType === 'overview') {
        const totalAmount = data.reduce((sum, value) => sum + value, 0);
        return {
            height: totalAmount > 0 ? Math.max(300, Math.min(500, 300 + (totalAmount / 1000) * 50)) : 300,
            fontSize: Math.max(10, Math.min(14, 12 + (totalAmount / 10000)))
        };
    } else {
        const maxValue = Math.max(...data, 1);
        const dataPoints = data.length;
        return {
            height: Math.max(300, Math.min(600, 300 + (maxValue / 1000) * 30 + dataPoints * 20)),
            fontSize: Math.max(10, Math.min(14, 12 + (maxValue / 10000)))
        };
    }
}

// Initialize with sample data (uncomment the line below to add sample data)
// addSampleData();