document.addEventListener('DOMContentLoaded', function() {
    const root = document.getElementById('root');
    
    // Create the form HTML
    root.innerHTML = `
        <section>
            <form id="customerForm">
                <h2 id="formTitle">Lägg till ny kund</h2>
                <input type="hidden" id="editingCustomerId" />
                <input name="name" placeholder="Kundnamn" required />
                <select name="manager_type" required>
                    <option value="">Välj typ av manager</option>
                    <option value="school">Apple School Manager</option>
                    <option value="business">Apple Business Manager</option>
                </select>
                <input name="client_id" placeholder="Client ID" required />
                <input name="team_id" placeholder="Team ID" required />
                <input name="key_id" placeholder="Key ID" required />
                <input type="file" name="pem" accept=".pem" id="pemFile" />
                <small id="pemNote" style="flex-basis: 100%; color: #666;">PEM-fil krävs för nya kunder</small>
                <button type="submit" id="submitBtn">Lägg till kund</button>
                <button type="button" id="cancelBtn" style="display: none; background: #666;" onclick="cancelEdit()">Avbryt</button>
            </form>
        </section>
        <section>
            <h2>Befintliga kunder</h2>
            <ul id="customerList"></ul>
        </section>
    `;

    const form = document.getElementById('customerForm');
    const customerList = document.getElementById('customerList');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        const editingId = document.getElementById('editingCustomerId').value;
        
        try {
            let url = '/api/customers';
            let method = 'POST';
            
            if (editingId) {
                url = `/api/customers/${editingId}`;
                method = 'PUT';
            }
            
            const response = await fetch(url, {
                method: method,
                body: formData
            });
            
            if (response.ok) {
                form.reset();
                cancelEdit();
                loadCustomers();
                alert(editingId ? 'Kund uppdaterad!' : 'Kund tillagd!');
            } else {
                const error = await response.json();
                alert('Fel: ' + (error.error || 'Okänt fel'));
            }
        } catch (error) {
            alert('Fel vid ' + (editingId ? 'uppdatering' : 'uppladdning') + ': ' + error.message);
        }
    });

    async function loadCustomers() {
        try {
            const response = await fetch('/api/customers');
            const customers = await response.json();
            
            customerList.innerHTML = customers.map(customer => `
                <li>
                    <div>
                        <b>${customer.name}</b> 
                        <span style="color: #666;">(${customer.manager_type === 'business' ? 'Apple Business Manager' : 'Apple School Manager'})</span>
                        <br>
                        <small>ID: ${customer.id}</small>
                    </div>
                    <div class="customer-actions">
                        <button class="edit-btn" onclick="editCustomer('${customer.id}')">
                            Redigera
                        </button>
                        <a href="/swagger/${customer.id}" class="swagger-link" target="_blank">
                            Swagger UI
                        </a>
                        <button class="delete-btn" onclick="deleteCustomer('${customer.id}')">
                            Ta bort
                        </button>
                    </div>
                </li>
            `).join('');
        } catch (error) {
            console.error('Fel vid laddning av kunder:', error);
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
