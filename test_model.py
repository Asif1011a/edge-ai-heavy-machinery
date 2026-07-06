import joblib
import pandas as pd
import numpy as np
from pathlib import Path
import traceback

BASE = Path("c:/Users/zamza/Downloads/tata")
CSV = BASE / "ai4i2020_enriched_for_digital_twin.csv"
MODEL_PATH = BASE / "Failure_pred_compat.joblib"

df = pd.read_csv(CSV)
print("Loaded CSV")
model = joblib.load(MODEL_PATH)
print("Loaded Model:", type(model).__name__)

row = df.iloc[0]
X = np.array([[
    float(row.get("Air temperature [K]", 298.1)),
    float(row.get("Process temperature [K]", 308.6)),
    float(row.get("Rotational speed [rpm]", 1551)),
    float(row.get("Torque [Nm]", 42.8)),
    float(row.get("Tool wear [min]", 0)),
]])
print("Input shape:", X.shape)

try:
    proba = model.predict_proba(X)
    print("Probability:", proba)
except Exception as e:
    print("Prediction failed!")
    traceback.print_exc()
