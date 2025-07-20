# 1. Bygg React-frontend med Node.js
FROM node:20 AS frontend-build

WORKDIR /app/frontend

COPY apple_school_manager_with_gui_and_assign/react-frontend/package*.json ./
RUN npm install

COPY apple_school_manager_with_gui_and_assign/react-frontend/ ./
RUN npm run build

# 2. Python/Flask-backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y gcc libffi-dev curl && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY apple_school_manager_with_gui_and_assign/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiera backendkod
COPY apple_school_manager_with_gui_and_assign/ .

# Kopiera byggd React-app till rätt plats
COPY --from=frontend-build /app/frontend/dist react-frontend/dist

# Skapa mappar som behövs
RUN mkdir -p admin_api/customers

# Sätt Python-path
ENV PYTHONPATH="/app:${PYTHONPATH}"

EXPOSE 6000

# Hälsokoll
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:6000/health || exit 1

CMD ["python", "app.py"]