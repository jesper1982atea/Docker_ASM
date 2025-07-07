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
                    const errorData = await response.json();
                    alert("Kunde inte lägga till kund: " + (errorData.error || "Okänt fel"));
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
