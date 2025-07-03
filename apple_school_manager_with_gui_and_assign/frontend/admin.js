const root = document.getElementById("root");

const form = document.createElement("form");
form.id = "addCustomerForm";
form.innerHTML = `
  <h2>Lägg till ny kund</h2>
  <input name="name" placeholder="Kundnamn" required />
  <select name="manager_type" required>
    <option value="">Välj typ av manager</option>
    <option value="school">Apple School Manager</option>
    <option value="business">Apple Business Manager</option>
  </select>
  <input name="client_id" placeholder="Client ID" required />
  <input name="team_id" placeholder="Team ID" required />
  <input name="key_id" placeholder="Key ID" required />
  <input type="file" name="pem" accept=".pem" required />
  <button>Lägg till kund</button>
`;

form.onsubmit = async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  try {
    const res = await fetch("/api/customers", {
      method: "POST",
      body: data
    });
    if (!res.ok) {
      const err = await res.json();
      alert("Fel vid tillägg: " + (err.error || res.statusText));
      return;
    }
    alert("Kund tillagd!");
    form.reset();
    await loadCustomers();
  } catch (err) {
    alert("Kunde inte lägga till kund: " + err.message);
  }
};

const listSection = document.createElement("section");
listSection.innerHTML = `
  <h2>Befintliga kunder</h2>
  <ul id="customerList"></ul>
  <div id="customerError" style="color:#e53935;margin-top:1rem;"></div>
`;

async function loadCustomers() {
  const ul = listSection.querySelector("#customerList");
  const errorDiv = listSection.querySelector("#customerError");
  ul.innerHTML = "";
  errorDiv.textContent = "";
  try {
    const res = await fetch("/api/customers");
    if (!res.ok) throw new Error("Kunde inte hämta kunder");
    const customers = await res.json();
    if (!Array.isArray(customers) || customers.length === 0) {
      ul.innerHTML = `<li style="color:#888;">Inga kunder hittades. Lägg till en kund för att börja.</li>`;
      return;
    }
    customers.forEach(c => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <b>${c.name}</b> 
          <span style="color: #666;">(${c.manager_type === 'business' ? 'Apple Business Manager' : 'Apple School Manager'})</span>
          <br>
          <small>ID: ${c.id}</small>
        </div>
        <div class="customer-actions">
          <a href="/swagger/${c.id}" class="swagger-link" target="_blank">
            Swagger UI
          </a>
          <button class="delete-btn" onclick="deleteCustomer('${c.id}')">
            Ta bort
          </button>
        </div>
      `;
      li.querySelector(".delete-btn").onclick = async () => {
        if (!confirm(`Radera kund "${c.name}"?`)) return;
        await fetch("/api/customers/" + c.id, { method: "DELETE" });
        await loadCustomers();
      };
      ul.appendChild(li);
    });
  } catch (err) {
    errorDiv.textContent = "Fel vid hämtning av kunder: " + err.message;
  }
}

root.appendChild(form);
root.appendChild(listSection);

document.getElementById("swagger-link").innerHTML = `
  <p>
    <b>Testa integrationen i Swagger:</b><br>
    Klicka på "Testa i Swagger" för önskad kund. Ange kundens ID (<code>customer_id</code>) i path-parametrarna i Swagger UI för att testa API:et mot rätt kund.<br>
    <span style="color:#888;">Swagger UI öppnas i en ny flik.</span>
  </p>
`;

loadCustomers();
