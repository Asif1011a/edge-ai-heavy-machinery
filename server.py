"""
Tata Digital Twin — Real Data Backend
Streams real sensor data from ai4i2020_enriched_for_digital_twin.csv
Runs trained Failure_pred.joblib model for live failure probability
WebSocket endpoint: ws://localhost:8000/ws
"""

import json, asyncio, math, time, traceback
from pathlib import Path
from typing import Optional

import pandas as pd
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="Tata Digital Twin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── LOAD DATA ─────────────────────────────────────────────────────────────────
BASE = Path(__file__).parent
CSV  = BASE / "ai4i2020_enriched_for_digital_twin.csv"
MODEL_PATH = BASE / "Failure_pred_compat.joblib"

print("Loading CSV...")
df = pd.read_csv(CSV)
print(f"  Loaded {len(df)} rows, {len(df.columns)} columns")

# ─── LOAD MODEL ────────────────────────────────────────────────────────────────
model = None
model_features = None
try:
    import joblib
    model = joblib.load(MODEL_PATH)
    # Detect feature columns the model was trained on
    if hasattr(model, "feature_names_in_"):
        model_features = list(model.feature_names_in_)
    else:
        # Most likely trained on these 5 standard features from the AI4I dataset
        model_features = [
            "Air temperature [K]",
            "Process temperature [K]",
            "Rotational speed [rpm]",
            "Torque [Nm]",
            "Tool wear [min]",
        ]
    print(f"  Model loaded: {type(model).__name__}")
    print(f"  Features: {model_features}")
except Exception as e:
    print(f"  Model load failed ({e}), using analytical fallback")

def predict_failure_probability(row: pd.Series) -> float:
    """Return 0-100 failure probability using model or analytical fallback."""
    if model is not None:
        try:
            # Pass as numpy array (no feature names) to avoid sklearn warnings
            X = np.array([[
                float(row.get("Air temperature [K]", 298.1)),
                float(row.get("Process temperature [K]", 308.6)),
                float(row.get("Rotational speed [rpm]", 1551)),
                float(row.get("Torque [Nm]", 42.8)),
                float(row.get("Tool wear [min]", 0)),
            ]])
            proba = model.predict_proba(X)[0]
            return float(proba[1]) * 100.0
        except Exception as e:
            print(f"Model prediction failed: {e}")
            traceback.print_exc()
            pass  # fall through to analytical

    # ── Analytical fallback (physics-based heuristic) ──────────────────────────
    rpm   = row.get("Rotational speed [rpm]", 1500)
    torq  = row.get("Torque [Nm]", 40)
    wear  = row.get("Tool wear [min]", 0)
    t_air = row.get("Air temperature [K]", 298)
    t_pro = row.get("Process temperature [K]", 308)
    tdiff = t_pro - t_air

    score = 0.0
    # Tool wear contribution (0-40 pts)
    score += min(wear / 250.0, 1.0) * 40.0
    # Torque contribution (0-25 pts)
    score += max(0, (torq - 40) / 30.0) * 25.0
    # RPM extremes (0-20 pts)
    if rpm > 2200 or rpm < 1300:
        score += min(abs(rpm - 1800) / 600.0, 1.0) * 20.0
    # Temperature delta (0-15 pts)
    score += min(max(tdiff - 8.0, 0) / 12.0, 1.0) * 15.0
    # Direct failure flag
    if row.get("Machine failure", 0):
        score = max(score, 82.0)
    return min(score, 99.9)

# ─── MACHINE ASSIGNMENT ────────────────────────────────────────────────────────
# 12 machines → each streams from a different slice of the CSV
MACHINE_IDS = [
    "CNC-01", "CNC-02", "CNC-03", "CNC-04",
    "ROB-01", "ROB-02",
    "CONV-01", "CONV-02",
    "ASSM-01", "INSP-01", "PACK-01",
    "AI-HUB",
]

# Assign each machine a start offset so they stream different rows
MACHINE_OFFSETS = {mid: (i * 800) % len(df) for i, mid in enumerate(MACHINE_IDS)}
machine_cursors = dict(MACHINE_OFFSETS)

def get_next_row(machine_id: str) -> dict:
    """Return the next real CSV row for a given machine, cycling forever."""
    idx  = machine_cursors[machine_id] % len(df)
    row  = df.iloc[idx]
    machine_cursors[machine_id] = (idx + 1) % len(df)

    failure_prob = predict_failure_probability(row)

    # Compute health score (inverse of failure probability, influenced by wear)
    wear        = float(row.get("Tool wear [min]", 0))
    health      = max(5.0, 100.0 - failure_prob * 0.6 - wear * 0.15)
    health      = round(min(health, 99.9), 1)

    # Derive status from failure probability
    fp = failure_prob
    if fp >= 80 or int(row.get("Machine failure", 0)) == 1:
        status = "Critical"
    elif fp >= 60:
        status = "High Risk"
    elif fp >= 35:
        status = "Warning"
    else:
        status = "Healthy"

    # AI recommendations based on flags
    flags = {
        "twf": int(row.get("TWF", 0)),
        "hdf": int(row.get("HDF", 0)),
        "pwf": int(row.get("PWF", 0)),
        "osf": int(row.get("OSF", 0)),
        "rnf": int(row.get("RNF", 0)),
    }
    active_flags = [k.upper() for k, v in flags.items() if v]
    if "TWF" in active_flags:
        rec = "Tool Wear Failure detected. Replace cutting tool immediately and run surface quality inspection before resuming production."
    elif "HDF" in active_flags:
        rec = "Heat Dissipation Failure. Reduce rotational speed by 15%, check coolant flow rate, and inspect heat exchanger."
    elif "PWF" in active_flags:
        rec = "Power Failure mode active. Verify electrical supply stability, check motor winding resistance and drive inverter."
    elif "OSF" in active_flags:
        rec = "Overstrain Failure detected. Reduce torque load by 20%, inspect spindle bearings, and verify workpiece clamping."
    elif status == "Critical":
        rec = f"Critical failure probability ({fp:.1f}%). Schedule immediate preventive maintenance. Estimated downtime: {float(row.get('Estimated_Downtime_Hours', 1)):.1f} hrs."
    elif status == "High Risk":
        rec = f"High failure risk ({fp:.1f}%). Plan maintenance within 24 hours. Monitor torque and tool wear closely."
    elif status == "Warning":
        rec = f"Elevated risk ({fp:.1f}%). Increase monitoring frequency. Check lubrication and sensor calibration."
    else:
        rec = "Machine operating within normal parameters. Continue scheduled monitoring and preventive maintenance program."

    return {
        "machine_id":          machine_id,
        "air_temperature":     round(float(row["Air temperature [K]"]), 2),
        "process_temperature": round(float(row["Process temperature [K]"]), 2),
        "rotational_speed":    int(row["Rotational speed [rpm]"]),
        "torque":              round(float(row["Torque [Nm]"]), 2),
        "tool_wear":           int(row["Tool wear [min]"]),
        "machine_failure":     int(row.get("Machine failure", 0)),
        "energy_consumption":  round(float(row.get("Power_Consumption_kWh", 12.0)), 2),
        "machine_load":        round(float(row.get("Machine_Load_Percent", 60.0)), 1),
        "carbon_emission":     round(float(row.get("Carbon_Emission_kgCO2", 5.0)), 3),
        "production_output":   int(row.get("Production_Output_Units", 80)),
        "predicted_downtime":  round(float(row.get("Estimated_Downtime_Hours", 0.0)), 2),
        "financial_loss":      round(float(row.get("Estimated_Loss_INR", 0.0)), 0),
        "failure_probability": round(failure_prob, 2),
        "health_score":        health,
        "status":              status,
        "recommendation":      rec,
        "model_used":          model is not None,
        "data_source":         "real",     # tells the frontend this is real data
        "row_index":           int(idx),
        **flags,
    }

# ─── ACTIVE CONNECTIONS ────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, msg: str):
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

manager = ConnectionManager()

# ─── BACKGROUND STREAMER ───────────────────────────────────────────────────────
async def streamer():
    """Broadcast real sensor data every 3 seconds."""
    while True:
        try:
            if manager.active:
                batch = [get_next_row(mid) for mid in MACHINE_IDS]
                await manager.broadcast(json.dumps({"type": "batch", "machines": batch}))
        except Exception:
            traceback.print_exc()
        await asyncio.sleep(3.0)

@app.on_event("startup")
async def startup():
    asyncio.create_task(streamer())

# ─── ENDPOINTS ─────────────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    # Send initial snapshot immediately on connect
    try:
        snapshot = [get_next_row(mid) for mid in MACHINE_IDS]
        await ws.send_text(json.dumps({"type": "batch", "machines": snapshot}))
        while True:
            # Keep alive — actual data is pushed by the streamer task
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        manager.disconnect(ws)
    except Exception:
        manager.disconnect(ws)

@app.get("/api/status")
def root():
    return {
        "status": "running",
        "model_loaded": model is not None,
        "csv_rows": len(df),
        "machines": MACHINE_IDS,
    }

@app.get("/predict/{machine_id}")
def predict(machine_id: str):
    if machine_id not in MACHINE_IDS:
        return {"error": "unknown machine"}
    return get_next_row(machine_id)

# ─── SERVE FRONTEND (React / Vite) ─────────────────────────────────────────────
dist_path = BASE / "dist"
if dist_path.exists():
    app.mount("/assets", StaticFiles(directory=dist_path / "assets"), name="assets")

    @app.get("/{catchall:path}")
    def serve_frontend(catchall: str):
        file_path = dist_path / catchall
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(dist_path / "index.html")
else:
    @app.get("/")
    def no_frontend():
        return {"error": "Frontend not built. Run 'npm run build'."}


# ─── WHAT-IF SIMULATION ENDPOINT ───────────────────────────────────────────────
from pydantic import BaseModel

class SimulateRequest(BaseModel):
    air_temperature: float = 298.1
    process_temperature: float = 308.6
    rotational_speed: int = 1551
    torque: float = 42.8
    tool_wear: int = 0

@app.post("/simulate")
def simulate(req: SimulateRequest):
    """Run ML model (or analytical fallback) on user-supplied sensor values."""
    row = pd.Series({
        "Air temperature [K]":     req.air_temperature,
        "Process temperature [K]": req.process_temperature,
        "Rotational speed [rpm]":  req.rotational_speed,
        "Torque [Nm]":             req.torque,
        "Tool wear [min]":         req.tool_wear,
        "Machine failure": 0,
        "TWF": 0, "HDF": 0, "PWF": 0, "OSF": 0, "RNF": 0,
    })

    failure_prob = predict_failure_probability(row)
    wear         = float(req.tool_wear)
    health       = max(5.0, 100.0 - failure_prob * 0.6 - wear * 0.15)
    health       = round(min(health, 99.9), 1)

    # Derived flags
    tdiff = req.process_temperature - req.air_temperature
    power = req.rotational_speed * req.torque
    twf = 1 if req.tool_wear > 200 and failure_prob > 60 else 0
    hdf = 1 if tdiff > 12 and failure_prob > 50 else 0
    pwf = 1 if power > 100000 and failure_prob > 55 else 0
    osf = 1 if req.torque > 62 and failure_prob > 65 else 0

    # Energy estimate: proportional to RPM × Torque (simplified)
    energy = round((power / 9550) * 1.05, 2)  # kW approx

    fp = failure_prob
    if fp >= 80: status = "Critical"
    elif fp >= 60: status = "High Risk"
    elif fp >= 35: status = "Warning"
    else: status = "Healthy"

    if twf:
        rec = "Tool Wear Failure predicted. Replace cutting tool before resuming."
    elif hdf:
        rec = "Heat Dissipation Failure predicted. Reduce speed, check coolant."
    elif pwf:
        rec = "Power Failure predicted. Verify electrical supply and drive inverter."
    elif osf:
        rec = "Overstrain predicted. Reduce torque load by 20%."
    elif status == "Critical":
        rec = f"Critical failure probability ({fp:.1f}%). Halt machine immediately."
    elif status == "High Risk":
        rec = f"High risk ({fp:.1f}%). Schedule maintenance within 24 hours."
    elif status == "Warning":
        rec = f"Elevated risk ({fp:.1f}%). Increase monitoring frequency."
    else:
        rec = "Parameters within safe operating range."

    return {
        "failure_probability": round(failure_prob, 2),
        "health_score":        health,
        "status":              status,
        "energy_estimate_kw":  energy,
        "recommendation":      rec,
        "twf": twf, "hdf": hdf, "pwf": pwf, "osf": osf,
        "model_used":          model is not None,
    }


# ─── ECO-MODE ENDPOINT ─────────────────────────────────────────────────────────
@app.get("/eco/snapshot")
def eco_snapshot():
    """Return current machine data with eco-mode energy multiplier applied (0.78)."""
    ECO_FACTOR = 0.78
    SPEED_FACTOR = 0.90   # RPM reduced by 10%
    OUTPUT_FACTOR = 0.93  # slight production dip

    batch = []
    for mid in MACHINE_IDS:
        row_data = get_next_row(mid)
        row_data["energy_consumption"]  = round(row_data["energy_consumption"] * ECO_FACTOR, 2)
        row_data["carbon_emission"]     = round(row_data["carbon_emission"] * ECO_FACTOR, 3)
        row_data["rotational_speed"]    = int(row_data["rotational_speed"] * SPEED_FACTOR)
        row_data["production_output"]   = int(row_data["production_output"] * OUTPUT_FACTOR)
        row_data["eco_mode"]            = True
        batch.append(row_data)
    return {"type": "eco_batch", "machines": batch}

