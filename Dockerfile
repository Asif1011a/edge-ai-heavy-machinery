# Build stage for React frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage for FastAPI backend
FROM python:3.10-slim
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and ML models
COPY server.py .
COPY ai4i2020_enriched_for_digital_twin.csv .
COPY Failure_pred_compat.joblib .

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Hugging Face Spaces uses port 7860 by default
EXPOSE 7860

# Run the unified app
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]
