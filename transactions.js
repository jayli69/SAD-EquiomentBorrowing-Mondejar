// ============================================================
// Borrow Transaction Module: Create, Return, Overdue, Search/Filter
// ============================================================

let allTransactions = [];
let currentUserId = null;

// ---------- LOAD / READ ----------
async function loadTransactions() {
  const { data, error } = await supabaseClient
    .from("borrow_transactions")
    .select("*, equipment(equipment_name, asset_code)")
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    alert("Failed to load transactions: " + error.message);
    return;
  }

  // Apply overdue detection (client-side, per BR-09 / Section X)
  allTransactions = data.map((t) => applyOverdueStatus(t));
  renderTransactionsTable(allTransactions);
  updateDashboard();
}

function applyOverdueStatus(t) {
  if (t.status !== "Returned") {
    const due = new Date(t.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    if (today > due) {
      t.status = "Overdue";
    }
  }
  return t;
}

function renderTransactionsTable(list) {
  const tbody = document.getElementById("transactionsTableBody");
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-row">No transactions found.</td></tr>`;
    return;
  }

  list.forEach((t) => {
    const equipmentLabel = t.equipment
      ? `${t.equipment.equipment_name} (${t.equipment.asset_code})`
      : "—";

    const statusClass =
      t.status === "Returned" ? "badge-green" : t.status === "Overdue" ? "badge-red" : "badge-orange";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${equipmentLabel}</td>
      <td>${t.borrower_name}</td>
      <td>${t.borrower_type}</td>
      <td>${t.department}</td>
      <td>${t.date_borrowed}</td>
      <td>${t.due_date}</td>
      <td><span class="badge ${statusClass}">${t.status}</span></td>
      <td>
        ${
          t.status !== "Returned"
            ? `<button class="btn-small" onclick="returnEquipment(${t.id}, ${t.equipment_id})">Return Equipment</button>`
            : `<span class="muted">Returned ${t.date_returned}</span>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------- CREATE (Record Borrowing) ----------
const transactionForm = document.getElementById("transactionForm");
if (transactionForm) {
  transactionForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const equipment_id = document.getElementById("txEquipment").value;
    const borrower_name = document.getElementById("txBorrowerName").value.trim();
    const borrower_type = document.getElementById("txBorrowerType").value;
    const department = document.getElementById("txDepartment").value.trim();
    const date_borrowed = document.getElementById("txDateBorrowed").value;
    const due_date = document.getElementById("txDueDate").value;

    // BR-04: Borrower name must be provided
    if (!borrower_name) {
      alert("Borrower name must be provided.");
      return;
    }
    // BR-03: Only available equipment may be borrowed
    if (!equipment_id) {
      alert("No available equipment selected.");
      return;
    }
    // BR-05: Due date cannot be earlier than the borrowing date
    if (new Date(due_date) < new Date(date_borrowed)) {
      alert("Due date cannot be earlier than the borrowing date.");
      return;
    }

    // Insert transaction (BR-06: new transaction gets Borrowed status)
    const { error: txError } = await supabaseClient.from("borrow_transactions").insert([
      {
        equipment_id,
        borrower_name,
        borrower_type,
        department,
        date_borrowed,
        due_date,
        status: "Borrowed",
        user_id: currentUserId,
      },
    ]);

    if (txError) {
      alert("Failed to record borrowing: " + txError.message);
      return;
    }

    // BR-07: Borrowed equipment becomes unavailable
    const { error: eqError } = await supabaseClient
      .from("equipment")
      .update({ availability: "Borrowed" })
      .eq("id", equipment_id);

    if (eqError) {
      alert("Transaction saved, but failed to update equipment availability: " + eqError.message);
    }

    closeTransactionModal();
    await loadEquipment();
    await loadTransactions();
  });
}

function openAddTransaction() {
  document.getElementById("transactionForm").reset();
  document.getElementById("txDateBorrowed").value = new Date().toISOString().split("T")[0];
  document.getElementById("transactionModal").classList.add("active");
}

function closeTransactionModal() {
  document.getElementById("transactionModal").classList.remove("active");
}

// ---------- RETURN EQUIPMENT ----------
async function returnEquipment(transactionId, equipmentId) {
  const tx = allTransactions.find((t) => t.id === transactionId);

  // BR-12: A returned transaction cannot be returned a second time
  if (tx && tx.status === "Returned") {
    alert("This transaction has already been returned.");
    return;
  }

  const confirmed = confirm("Mark this equipment as returned?");
  if (!confirmed) return;

  const today = new Date().toISOString().split("T")[0];

  // 1. Update transaction: status -> Returned, date_returned -> today
  const { error: txError } = await supabaseClient
    .from("borrow_transactions")
    .update({ status: "Returned", date_returned: today })
    .eq("id", transactionId);

  if (txError) {
    alert("Failed to update transaction: " + txError.message);
    return;
  }

  // 2. BR-08: Returned equipment becomes available again
  const { error: eqError } = await supabaseClient
    .from("equipment")
    .update({ availability: "Available" })
    .eq("id", equipmentId);

  if (eqError) {
    alert("Transaction returned, but failed to update equipment availability: " + eqError.message);
  }

  await loadEquipment();
  await loadTransactions();
}

// ---------- SEARCH / FILTER ----------
function searchAndFilterTransactions() {
  const query = document.getElementById("transactionSearch").value.trim().toLowerCase();
  const statusFilter = document.getElementById("transactionStatusFilter").value;

  let filtered = allTransactions.filter((t) => {
    const equipmentName = t.equipment ? t.equipment.equipment_name.toLowerCase() : "";
    const assetCode = t.equipment ? t.equipment.asset_code.toLowerCase() : "";
    const matchesQuery =
      t.borrower_name.toLowerCase().includes(query) ||
      equipmentName.includes(query) ||
      assetCode.includes(query);
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  renderTransactionsTable(filtered);
}
