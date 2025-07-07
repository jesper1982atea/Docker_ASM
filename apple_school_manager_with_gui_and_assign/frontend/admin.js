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
        this.customers = await response.json();
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

    editCustomer(customer) {
      this.editingCustomerId = customer.id;
      document.getElementById('form-title').textContent = `Redigera kund: ${customer.name}`;
      document.querySelector('input[name="name"]').value = customer.name;
      document.querySelector('input[name="client_id"]').value = customer.client_id;
      document.querySelector('input[name="team_id"]').value = customer.team_id;
      document.querySelector('input[name="key_id"]').value = customer.key_id;
      document.querySelector('select[name="manager_type"]').value = customer.manager_type || 'school';
      document.querySelector('input[name="gsx_api_key"]').value = customer.gsx_api_key || '';
      window.scrollTo(0, 0);
    },

    render() {
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
          ${this.customers.map(c => `
            <li>
              <div class="customer-info">
                <b>${c.name}</b> (Typ: ${c.manager_type || 'school'})<br>
                <small>Client ID: ${c.client_id}</small>
                ${c.gsx_api_key ? '<br><small style="color: green;">GSX API Nyckel konfigurerad</small>' : ''}
              </div>
              <div class="customer-actions">
                <a href="/customer/${c.id}/devices" class="swagger-link">Enheter</a>
                <a href="/swagger/${c.id}" target="_blank" class="swagger-link">API Docs</a>
                <button class="edit-btn" data-id="${c.id}">Redigera</button>
                <button class="delete-btn" data-id="${c.id}">Ta bort</button>
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
          this.editCustomer(customer);
        });
      });
    },

    init() {
      this.fetchCustomers();
    }
  };

  App.init();
});
            if (target.classList.contains("delete-btn")) {
                if (confirm("Är du säker på att du vill ta bort denna kund?")) {
                    try {
                        await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
                        fetchCustomers();
                    } catch (error) {
                        console.error("Kunde inte ta bort kund:", error);
                    }
                }
            } else if (target.classList.contains("edit-btn")) {
                const response = await fetch(`/api/customers/${customerId}`);
                const customer = await response.json();

                document.getElementById('editingCustomerId').value = customer.id;
                addCustomerForm.name.value = customer.name;
                addCustomerForm.client_and_team_id.value = customer.client_id; // Use client_id for the combined field
                addCustomerForm.key_id.value = customer.key_id;
                addCustomerForm.manager_type.value = customer.manager_type;

                document.getElementById('formTitle').textContent = 'Redigera kund';
                document.getElementById('submitBtn').textContent = 'Uppdatera';
                document.getElementById('cancelBtn').style.display = 'inline-block';
                document.getElementById('pemFile').required = false;
                document.getElementById('pemNote').textContent = 'Lämna tom för att behålla befintlig PEM-fil.';
                addCustomerForm.scrollIntoView({ behavior: 'smooth' });
            }
        });

        cancelBtn.addEventListener("click", resetForm);

        swaggerLinkContainer.innerHTML = `<a href="/docs" target="_blank">Öppna generell API-dokumentation (Swagger)</a>`;
        fetchCustomers();
    };

    render();
});
