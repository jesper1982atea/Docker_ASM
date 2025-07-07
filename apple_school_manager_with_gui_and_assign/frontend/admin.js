document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("root");
    const swaggerLinkContainer = document.getElementById("swagger-link");

    const render = () => {
        root.innerHTML = `
            <form id="addCustomerForm">
                <h2 id="formTitle">Lägg till ny kund</h2>
                <input type="hidden" id="editingCustomerId" />
                <input type="text" name="name" placeholder="Kundnamn" required />
                <input type="text" name="client_and_team_id" placeholder="Client/Team ID" required />
                <input type="text" name="key_id" placeholder="Key ID" required />
                <input type="file" name="pem" id="pemFile" required />
                <small id="pemNote">PEM-fil krävs för nya kunder.</small>
                <select name="manager_type">
                    <option value="school">School Manager</option>
                    <option value="business">Business Manager</option>
                </select>
                <button type="submit" id="submitBtn">Lägg till</button>
                <button type="button" id="cancelBtn" style="display:none;">Avbryt</button>
            </form>
            <ul id="customerList"></ul>
        `;

        const customerList = document.getElementById("customerList");
        const addCustomerForm = document.getElementById("addCustomerForm");
        const cancelBtn = document.getElementById("cancelBtn");

        const fetchCustomers = async () => {
            try {
                const response = await fetch("/api/customers");
                const customers = await response.json();
                customerList.innerHTML = "";
                customers.forEach(customer => {
                    const li = document.createElement("li");
                    li.innerHTML = `
                        <div class="customer-info">
                            <b>${customer.name}</b> (Typ: ${customer.manager_type || 'school'})
                            <div class="token-status" id="status-${customer.id}">Kontrollerar status...</div>
                        </div>
                        <div class="customer-actions">
                            <a href="/frontend/customer-devices.html?customer=${customer.id}" class="swagger-link">Hantera enheter</a>
                            <a href="/swagger/${customer.id}" class="swagger-link" target="_blank">API</a>
                            <button class="edit-btn" data-id="${customer.id}">Redigera</button>
                            <button class="delete-btn" data-id="${customer.id}">Ta bort</button>
                        </div>
                    `;
                    customerList.appendChild(li);
                    checkTokenStatus(customer.id);
                });
            } catch (error) {
                console.error("Kunde inte hämta kunder:", error);
                customerList.innerHTML = "<li>Kunde inte ladda kundlistan.</li>";
            }
        };

        const checkTokenStatus = async (customerId) => {
            const statusEl = document.getElementById(`status-${customerId}`);
            try {
                const response = await fetch(`/api/${customerId}/token-status`);
                const data = await response.json();
                
                if (data.status === 'valid') {
                    const expiresIn = data.token_expires_in;
                    if (expiresIn && expiresIn > 0) {
                        const hours = Math.floor(expiresIn / 3600);
                        const minutes = Math.floor((expiresIn % 3600) / 60);
                        statusEl.textContent = `✓ Token Active (${hours}h ${minutes}m left)`;
                    } else {
                        statusEl.textContent = '✓ Token Active';
                    }
                    statusEl.className = 'token-status token-valid';
                } else {
                    statusEl.textContent = `⚠ ${data.message}`;
                    statusEl.className = 'token-status token-expired';
                }
            } catch (error) {
                statusEl.textContent = "Fel vid statuskontroll";
                statusEl.className = 'token-status token-error';
            }
        };

        const resetForm = () => {
            addCustomerForm.reset();
            document.getElementById('editingCustomerId').value = '';
            document.getElementById('formTitle').textContent = 'Lägg till ny kund';
            document.getElementById('submitBtn').textContent = 'Lägg till';
            document.getElementById('cancelBtn').style.display = 'none';
            document.getElementById('pemFile').required = true;
            document.getElementById('pemNote').textContent = 'PEM-fil krävs för nya kunder.';
        };

        addCustomerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(addCustomerForm);
            const customerId = document.getElementById('editingCustomerId').value;
            
            const clientAndTeamId = formData.get('client_and_team_id');
            formData.append('client_id', clientAndTeamId);
            formData.append('team_id', clientAndTeamId);
            formData.delete('client_and_team_id');

            const url = customerId ? `/api/customers/${customerId}` : "/api/customers";
            const method = customerId ? "PUT" : "POST";

            try {
                const response = await fetch(url, { method, body: formData });
                if (response.ok) {
                    fetchCustomers();
                    resetForm();
                } else {
                    const errorData = await response.json();
                    alert(`Kunde inte ${customerId ? 'uppdatera' : 'lägga till'} kund: ` + (errorData.error || "Okänt fel"));
                }
            } catch (error) {
                console.error(`Fel vid ${customerId ? 'uppdatering' : 'tillägg'} av kund:`, error);
                alert("Ett nätverksfel uppstod.");
            }
        });

        customerList.addEventListener("click", async (e) => {
            const target = e.target;
            const customerId = target.dataset.id;

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
