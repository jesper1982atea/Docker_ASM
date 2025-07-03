# Apple School Manager - Komplett Miljö

## 🚀 Starta backend admin-API
```bash
cd admin_api
python main.py
```

## 🌐 Öppna frontend (admin-panel)
Öppna filen `frontend/index.html` i webbläsaren.

## 🛠 Flask Swagger API
```bash
cd asmapp
python app.py
```

Byggt för att administrera flera ASM-konfigurationer med ett enkelt webbgränssnitt.

## 🔑 Använda API:et för olika kunder

Alla endpoints kräver nu att du anger kundens ID i URL:en, t.ex:

```
GET /<customer_id>/devices
GET /<customer_id>/orgs
GET /<customer_id>/devices/<device_id>
```

Du kan lista alla tillgängliga kunder med:

```
GET /customers
```
