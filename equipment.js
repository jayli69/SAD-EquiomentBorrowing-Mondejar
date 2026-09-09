// ============================================================
// Equipment Module: CRUD + Dashboard stats + Search/Filter
// ============================================================

let allEquipment = [];
let editingEquipmentId = null;

// ---------- LOAD / READ ----------
async function loadEquipment() {
  const { data, error } = await supabaseClient
    .from("equipment")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    alert("Failed to load equipment: " + error.message);
    return;
  }

  allEquipment = data;
  renderEquipmentTable(allEquipment);
  populateEquipmentDropdown(allEquipment);
  updateDashboard();
}

function renderEquipmentTable(list) {
  const tbody = document.getElementById("equipmentTableBody");
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">No equipment records found.</td></tr>`;
    return;
  }

  list.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.asset_code}</td>
      <td>${item.equipment_name}</td>
      <td>${item.category}</td>
      <td>${item.condition}</td>
      <td><span class="badge ${item.availability === "Available" ? "badge-green" : "badge-orange"}">${item.availability}</span></td>
      <td>
        <button class="btn-small" onclick="openEditEquipment(${item.id})">Edit</button>
        <button class="btn-small btn-danger" onclick="deleteEquipment(${item.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function populateEquipmentDropdown(list) {
  const select = document.getElementById("txEquipment");
  if (!select) return;
  select.innerHTML = "";
  const availableOnly = list.filter((e) => e.availability === "Available");

  if (availableOnly.length === 0) {
    select.innerHTML = `<option value="">No available equipment</option>`;
    return;
  }

  availableOnly.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = `${item.equipment_name} (${item.asset_code})`;
    select.appendChild(opt);
  });
}

// ---------- CREATE / UPDATE ----------
const equipmentForm = document.getElementById("equipmentForm");
if (equipmentForm) {
  equipmentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const equipment_name = document.getElementById("eqName").value.trim();
    const category = document.getElementById("eqCategory").value.trim();
    const asset_code = document.getElementById("eqCode").value.trim();
    const condition = document.getElementById("eqCondition").value;

    // BR-01: Equipment name cannot be empty
    if (!equipment_name) {
      alert("Equipment name cannot be empty.");
      return;
    }
    // BR-02: Asset code must be unique (checked client-side + DB unique constraint)
    if (!asset_code) {
      alert("Asset code cannot be empty.");
      return;
    }

    const duplicate = allEquipment.find(
      (e) => e.asset_code.toLowerCase() === asset_code.toLowerCase() && e.id !== editingEquipmentId
    );
    if (duplicate) {
      alert("Asset code must be unique. This code already exists.");
      return;
    }

    if (editingEquipmentId) {
      // UPDATE
      const { error } = await supabaseClient
        .from("equipment")
        .update({ equipment_name, category, asset_code, condition })
        .eq("id", editingEquipmentId);

      if (error) {
        alert("Update failed: " + error.message);
        return;
      }
    } else {
      // CREATE
      const { error } = await supabaseClient.from("equipment").insert([
        { equipment_name, category, asset_code, condition, availability: "Available" },
      ]);

      if (error) {
        alert("Add failed: " + error.message);
        return;
      }
    }

    closeEquipmentModal();
    await loadEquipment();
  });
}

function openAddEquipment() {
  editingEquipmentId = null;
  document.getElementById("equipmentModalTitle").textContent = "Add Equipment";
  document.getElementById("equipmentForm").reset();
  document.getElementById("equipmentModal").classList.add("active");
}

function openEditEquipment(id) {
  const item = allEquipment.find((e) => e.id === id);
  if (!item) return;

  editingEquipmentId = id;
  document.getElementById("equipmentModalTitle").textContent = "Edit Equipment";
  document.getElementById("eqName").value = item.equipment_name;
  document.getElementById("eqCategory").value = item.category;
  document.getElementById("eqCode").value = item.asset_code;
  document.getElementById("eqCondition").value = item.condition;
  document.getElementById("equipmentModal").classList.add("active");
}

function closeEquipmentModal() {
  document.getElementById("equipmentModal").classList.remove("active");
  editingEquipmentId = null;
}

// ---------- DELETE ----------
async function deleteEquipment(id) {
  // BR-10: Deletion requires user confirmation
  const confirmed = confirm("Delete this equipment record? This cannot be undone.");
  if (!confirmed) return;

  const { error } = await supabaseClient.from("equipment").delete().eq("id", id);
  if (error) {
    alert("Delete failed: " + error.message);
    return;
  }
  await loadEquipment();
}

// ---------- SEARCH / FILTER ----------
function searchAndFilterEquipment() {
  const query = document.getElementById("equipmentSearch").value.trim().toLowerCase();
  const availabilityFilter = document.getElementById("equipmentAvailabilityFilter").value;

  let filtered = allEquipment.filter((item) => {
    const matchesQuery =
      item.equipment_name.toLowerCase().includes(query) ||
      item.asset_code.toLowerCase().includes(query);
    const matchesAvailability =
      availabilityFilter === "All" || item.availability === availabilityFilter;
    return matchesQuery && matchesAvailability;
  });

  renderEquipmentTable(filtered);
}

// ---------- DASHBOARD ----------
async function updateDashboard() {
  const { data: transactions, error } = await supabaseClient
    .from("borrow_transactions")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  const total = allEquipment.length;
  const available = allEquipment.filter((e) => e.availability === "Available").length;
  const borrowed = allEquipment.filter((e) => e.availability === "Borrowed").length;
  const returned = transactions.filter((t) => t.status === "Returned").length;
  const overdue = transactions.filter((t) => {
    if (t.status === "Returned") return false;
    const due = new Date(t.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today > due;
  }).length;

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statAvailable").textContent = available;
  document.getElementById("statBorrowed").textContent = borrowed;
  document.getElementById("statReturned").textContent = returned;
  document.getElementById("statOverdue").textContent = overdue;
}
