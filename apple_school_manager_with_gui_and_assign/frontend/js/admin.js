document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "/api";
  const root = document.getElementById("root");

  const App = {
    customers: [],
    editingCustomerId: null,

    async fetchCustomers() {
      try {
        const response = await fetch(`${API_BASE_URL}/customers`);
        if (!response.ok) throw new Error("Failed to fetch customers");
        const data = await response.json();
        // Om API returnerar strängar (mappar), hämta meta för varje
        if (Array.isArray(data) && typeof data[0] === 'string') {
          // Hämta meta parallellt för alla kunder
          const customers = await Promise.all(data.map(async id => {
            try {
              const metaRes = await fetch(`${API_BASE_URL}/customers/${id}/meta`);
              if (!metaRes.ok) throw new Error();
              const meta = await metaRes.json();
              return { id, ...meta };
            } catch {
              // Om meta saknas, visa bara id
              return { id, name: id };
            }
          }));
          this.customers = customers;
        } else if (Array.isArray(data)) {
          this.customers = data;
        } else {
          this.customers = [];
        }
        console.log('Kunddata:', this.customers);
        this.render();
      } catch (error) {
        console.error("Error fetching customers:", error);
        root.innerHTML = `<p class="token-error">Error loading customers.</p>`;
      }
    },

    async handleFormSubmit(event) {
      event.preventDefault();
      const form = event.target;
      const formData = new FormData(form);
      const url = this.editingCustomerId
        ? `${API_BASE_URL}/customers/${this.editingCustomerId}`
        : `${API_BASE_URL}/customers`;
      const method = this.editingCustomerId ? "PUT" : "POST";

      try {
        const response = await fetch(url, { method, body: formData });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to save customer");
        }
        this.editingCustomerId = null;
        form.reset();
        document.getElementById('form-title').textContent = 'Lägg till ny kund';
        await this.fetchCustomers();
      } catch (error) {
        console.error("Error saving customer:", error);
        alert(`Fel: ${error.message}`);
      }
    },

    async deleteCustomer(customerId) {
      if (!confirm("Är du säker på att du vill ta bort denna kund?")) return;
      try {
        const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Kunde inte ta bort kund");
        await this.fetchCustomers();
      } catch (error) {
        console.error("Error deleting customer:", error);
        alert(`Fel: ${error.message}`);
      }
    },

    async fetchCustomerMeta(customerId) {
      try {
        const response = await fetch(`${API_BASE_URL}/customers/${customerId}/meta`);
        if (!response.ok) throw new Error("Failed to fetch customer meta");
        const meta = await response.json();
        // Gör vad du vill med meta, t.ex. visa i UI eller spara i state
        console.log('Meta för kund', customerId, meta);
        return meta;
      } catch (error) {
        console.error("Error fetching customer meta:", error);
        return null;
      }
    },

    async editCustomer(customer) {
      if (!customer) {
        alert("Kunddata saknas eller kunde inte hittas. Prova att ladda om sidan.");
        return;
      }
      this.editingCustomerId = customer.id;
      // Hämta alltid senaste meta från API när man editerar
      const meta = await this.fetchCustomerMeta(customer.id);
      if (meta) {
        document.getElementById('form-title').textContent = `Redigera kund: ${meta.name || customer.name}`;
        document.querySelector('input[name="name"]').value = meta.name || '';
        document.querySelector('input[name="client_id"]').value = meta.client_id || '';
        document.querySelector('input[name="team_id"]').value = meta.team_id || '';
        document.querySelector('input[name="key_id"]').value = meta.key_id || '';
        document.querySelector('select[name="manager_type"]').value = meta.manager_type || 'school';
        document.querySelector('input[name="gsx_api_key"]').value = meta.gsx_api_key || '';
      } else {
        // Fallback till befintlig kunddata om meta inte kunde hämtas
        document.getElementById('form-title').textContent = `Redigera kund: ${customer.name}`;
        document.querySelector('input[name="name"]').value = customer.name;
        document.querySelector('input[name="client_id"]').value = customer.client_id;
        document.querySelector('input[name="team_id"]').value = customer.team_id;
        document.querySelector('input[name="key_id"]').value = customer.key_id;
        document.querySelector('select[name="manager_type"]').value = customer.manager_type || 'school';
        document.querySelector('input[name="gsx_api_key"]').value = customer.gsx_api_key || '';
      }
      window.scrollTo(0, 0);
    },

    render() {
      const customers = Array.isArray(this.customers) ? this.customers : [];
      root.innerHTML = `
        <form id="customerForm">
          <h2 id="form-title">Lägg till ny kund</h2>
          <input type="text" name="name" placeholder="Kundnamn" required />
          <input type="text" name="client_id" placeholder="Client ID" required />
          <input type="text" name="team_id" placeholder="Team ID" required />
          <input type="text" name="key_id" placeholder="Key ID" required />
          <input type="text" name="gsx_api_key" placeholder="GSX API Nyckel (Valfritt)" />
          <select name="manager_type">
            <option value="school">School Manager</option>
            <option value="business">Business Manager</option>
          </select>
          <label>Privat nyckel (.pem fil): <input type="file" name="pem" /></label>
          <button type="submit">Spara kund</button>
        </form>
        <h2>Existerande kunder</h2>
        <ul id="customerList">
          ${customers.map(c => `
            <li>
              <div class="customer-info">
                <b>${c.name || c.id}</b> (Typ: ${c.manager_type || 'school'})<br>
                <small>Client ID: ${c.client_id || ''}</small>
                ${c.gsx_api_key ? '<br><small style="color: green;">GSX API Nyckel konfigurerad</small>' : ''}
              </div>
              <div class="customer-actions">
                <a href="/frontend/customer-devices.html?customer=${c.id}" class="swagger-link">Enheter</a>
                <a href="/swagger/${c.id}" target="_blank" class="swagger-link">API Docs</a>
                <button class="edit-btn" data-id="${c.id}">Redigera</button>
                <button class="delete-btn" data-id="${c.id}">Ta bort</button>
                <button class="meta-btn" data-id="${c.id}">Visa meta</button>
              </div>
            </li>
          `).join('')}
        </ul>
      `;

      document.getElementById("customerForm").addEventListener("submit", this.handleFormSubmit.bind(this));
      document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", () => this.deleteCustomer(btn.dataset.id));
      });
      document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const customer = this.customers.find(c => c.id === btn.dataset.id);
          if (!customer) {
            alert("Kunddata saknas eller kunde inte hittas.");
            return;
          }
          this.editCustomer(customer);
        });
      });
      document.querySelectorAll(".meta-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const meta = await this.fetchCustomerMeta(btn.dataset.id);
          if (meta) alert(JSON.stringify(meta, null, 2));
        });
      });
    },

    init() {
      this.fetchCustomers();
    }
  };

  App.init();
});
