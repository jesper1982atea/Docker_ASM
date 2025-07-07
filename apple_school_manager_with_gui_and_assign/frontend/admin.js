document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("root");
    const swaggerLinkContainer = document.getElementById("swagger-link");

    const render = () => {
        root.innerHTML = `
            <form id="addCustomerForm">
                <h2>Lägg till ny kund</h2>
                <input type="text" name="name" placeholder="Kundnamn" required />
                <input type="text" name="client_and_team_id" placeholder="Client/Team ID" required />
                <input type="text" name="key_id" placeholder="Key ID" required />
                <input type="file" name="pem" required />
                <select name="manager_type">
                    <option value="school">School Manager</option>
                    <option value="business">Business Manager</option>
                </select>
                <button type="submit">Lägg till</button>
            </form>
            <ul id="customerList"></ul>
        `;

        const customerList = document.getElementById("customerList");
        const addCustomerForm = document.getElementById("addCustomerForm");

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
                            <a href="/customer/${customer.id}/devices" class="swagger-link">Hantera enheter</a>
                            <a href="/swagger/${customer.id}" class="swagger-link" target="_blank">API</a>
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
                statusEl.textContent = data.message;
                statusEl.className = 'token-status'; // Reset classes
                if (data.status === 'valid') {
                    statusEl.classList.add('token-valid');
                } else if (data.status === 'invalid') {
                    statusEl.classList.add('token-expired');
                } else {
                    statusEl.classList.add('token-error');
                }
            } catch (error) {
                statusEl.textContent = "Fel vid statuskontroll";
                statusEl.className = 'token-status token-error';
            }
        };

        addCustomerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(addCustomerForm);
            
            // Hämta värdet från det kombinerade fältet
            const clientAndTeamId = formData.get('client_and_team_id');
            
            // Sätt både client_id och team_id till samma värde
            formData.append('client_id', clientAndTeamId);
            formData.append('team_id', clientAndTeamId);
            
            // Ta bort det kombinerade fältet så det inte skickas med
            formData.delete('client_and_team_id');

            try {
                const response = await fetch("/api/customers", {
                    method: "POST",
                    body: formData,
                });
                if (response.ok) {
                    fetchCustomers();
                    addCustomerForm.reset();
                } else {
                    const error = await response.json();
                    alert("Kunde inte lägga till kund: " + (error.error || "Okänt fel"));
                }
            } catch (error) {
                console.error("Fel vid tillägg av kund:", error);
                alert("Ett nätverksfel uppstod.");
            }
        });

        customerList.addEventListener("click", async (e) => {
            if (e.target.classList.contains("delete-btn")) {
                const customerId = e.target.dataset.id;
                if (confirm("Är du säker på att du vill ta bort denna kund?")) {
                    try {
                        await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
                        fetchCustomers();
                    } catch (error) {
                        console.error("Kunde inte ta bort kund:", error);
                    }
                }
            }
        });

        swaggerLinkContainer.innerHTML = `<a href="/docs" target="_blank">Öppna generell API-dokumentation (Swagger)</a>`;
        fetchCustomers();
    };

    render();
});
            
            const tokenElement = document.getElementById(`token-${customerId}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'valid') {
                    const expiresIn = data.token_expires_in;
                    if (expiresIn && expiresIn > 0) {
                        const hours = Math.floor(expiresIn / 3600);
                        const minutes = Math.floor((expiresIn % 3600) / 60);
                        tokenElement.textContent = `✓ Token Active (${hours}h ${minutes}m left)`;
                    } else {
                        tokenElement.textContent = '✓ Token Active';
                    }
                    tokenElement.className = 'token-status token-valid';
                } else if (data.status === 'rate_limited') {
                    tokenElement.textContent = '⚠ Rate Limited by Apple';
                    tokenElement.className = 'token-status token-expired';
                } else if (data.status === 'configuration_error') {
                    tokenElement.textContent = '✗ Config Error: ' + data.message;
                    tokenElement.className = 'token-status token-error';
                } else {
                    tokenElement.textContent = '⚠ Token Issue: ' + data.message;
                    tokenElement.className = 'token-status token-expired';
                }
            } else if (response.status === 401) {
                const data = await response.json();
                tokenElement.textContent = '✗ Token Invalid: ' + (data.message || 'Unauthorized');
                tokenElement.className = 'token-status token-error';
            } else if (response.status === 404) {
                tokenElement.textContent = '✗ Config Error: Check customer setup';
                tokenElement.className = 'token-status token-error';
            } else {
                tokenElement.textContent = `✗ HTTP ${response.status}`;
                tokenElement.className = 'token-status token-error';
            }
        } catch (error) {
            console.error(`Token check failed for customer ${customerId}:`, error);
            const tokenElement = document.getElementById(`token-${customerId}`);
            tokenElement.textContent = '✗ Network Error: ' + error.message;
            tokenElement.className = 'token-status token-error';
        }
    }
    
    window.editCustomer = async function(customerId) {
        try {
            const response = await fetch(`/api/customers/${customerId}`);
            const customer = await response.json();
            
            // Fyll i formuläret med befintlig data
            document.getElementById('editingCustomerId').value = customerId;
            document.querySelector('input[name="name"]').value = customer.name;
            document.querySelector('select[name="manager_type"]').value = customer.manager_type;
            document.querySelector('input[name="client_id"]').value = customer.client_id;
            document.querySelector('input[name="team_id"]').value = customer.team_id;
            document.querySelector('input[name="key_id"]').value = customer.key_id;
            
            // Uppdatera UI för redigeringsläge
            document.getElementById('formTitle').textContent = 'Redigera kund';
            document.getElementById('submitBtn').textContent = 'Uppdatera kund';
            document.getElementById('cancelBtn').style.display = 'inline-block';
            document.getElementById('pemFile').required = false;
            document.getElementById('pemNote').textContent = 'PEM-fil är valfri vid redigering (lämna tom för att behålla befintlig)';
            
            // Scrolla till formuläret
            document.getElementById('customerForm').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            alert('Fel vid laddning av kunddata: ' + error.message);
        }
    };

    window.cancelEdit = function() {
        document.getElementById('editingCustomerId').value = '';
        document.getElementById('formTitle').textContent = 'Lägg till ny kund';
        document.getElementById('submitBtn').textContent = 'Lägg till kund';
        document.getElementById('cancelBtn').style.display = 'none';
        document.getElementById('pemFile').required = true;
        document.getElementById('pemNote').textContent = 'PEM-fil krävs för nya kunder';
        form.reset();
    };

    window.deleteCustomer = async function(customerId) {
        if (confirm('Är du säker på att du vill ta bort denna kund?')) {
            try {
                const response = await fetch(`/api/customers/${customerId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    loadCustomers();
                    alert('Kund borttagen!');
                } else {
                    alert('Fel vid borttagning');
                }
            } catch (error) {
                alert('Fel vid borttagning: ' + error.message);
            }
        }
    };

    // Load customers on page load
    loadCustomers();
});
