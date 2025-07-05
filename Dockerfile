FROM python:3.11-slim

WORKDIR /app

# Installera systemkrav för cryptodome och eventuella beroenden
RUN apt-get update && apt-get install -y gcc libffi-dev curl && rm -rf /var/lib/apt/lists/*

# Kopiera requirements och installera Python-paket
COPY apple_school_manager_with_gui_and_assign/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiera hela projektet
COPY apple_school_manager_with_gui_and_assign/ .

# Skapa admin_api/customers katalog
RUN mkdir -p admin_api/customers

# Lägg till app-katalogen i PYTHONPATH
ENV PYTHONPATH="/app:${PYTHONPATH}"

# Exponera porten som Flask kör på
EXPOSE 6000

# Lägg till hälsokontroll
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:6000/health || exit 1

# Starta appen direkt med app.py för att använda environment variables
CMD ["python", "app.py"]
