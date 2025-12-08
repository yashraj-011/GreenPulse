from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional, Tuple

import pandas as pd
import joblib
import shap
import numpy as np

# ------------------------------------------------------
# PATHS (adjust only if your folder moves)
# ------------------------------------------------------
import os
from pathlib import Path

# Get the directory where this script is located
BASE_DIR = Path(__file__).parent.absolute()
MODEL_PATH = BASE_DIR / "Models" / "xgb_multi_24_48_72.pkl"
FEATURE_PATH = BASE_DIR / "Models" / "feature_cols.pkl"

app = FastAPI(title="AQI Forecasting API (SIH 2025)")

model = None
feature_names: List[str] = []
explainer_24 = None
explainer_48 = None
explainer_72 = None

# ------------------------------------------------------
# 1️⃣ CANONICAL STATION → TRAINING CODES + ALIASES
#    (Cleaned from your 77 entries, grouped into clusters)
# ------------------------------------------------------
CANONICAL_STATION_MAP: Dict[str, Dict[str, Any]] = {
    "Alipur": {
        "codes": [36, 39],
        "aliases": ["5024_Alipur", "Alipur_Delhi_DPCC"],
    },
    "Anand Vihar": {
        "codes": [35, 40],
        "aliases": ["301_Anand_Vihar", "Anand_Vihar_Delhi_DPCC"],
    },
    "Ashok Vihar": {
        "codes": [16, 41],
        "aliases": ["1420_Ashok_Vihar", "Ashok_Vihar_Delhi_DPCC"],
    },
    "Aya Nagar": {
        "codes": [5, 42],
        "aliases": ["108_Aya_Nagar", "Aya_Nagar_Delhi_IMD"],
    },
    "Bawana": {
        "codes": [31, 43],
        "aliases": ["1560_Bawana", "Bawana_Delhi_DPCC"],
    },
    "Burari Crossing": {
        "codes": [1, 44],
        "aliases": ["104_Burari_Crossing", "Burari_Crossing_Delhi_IMD"],
    },
    "CRRI Mathura Road": {
        "codes": [0, 45],
        "aliases": ["103_CRRI_Mathura_Road", "CRRI_Mathura_Road_Delhi_IMD"],
    },
    "Chandni Chowk": {
        "codes": [37, 46],
        "aliases": ["5393_Chandni_Chowk", "Chandni_Chowk_Delhi_IITM"],
    },
    "DTU": {
        "codes": [11, 47],
        "aliases": ["118_DTU", "DTU_Delhi_CPCB"],
    },
    "Dr. Karni Singh Shooting Range": {
        "codes": [17, 48],
        "aliases": [
            "1421_Dr._Karni_Singh_Shooting_Range",
            "DrKSS_Delhi_DPCC",
        ],
    },
    "Dwarka Sector 8": {
        "codes": [18, 49],
        "aliases": [
            "1422_Dwarka-Sector_8_Delhi_DPCC_",
            "Dwarka_Sector_8_Delhi_DPCC_",
        ],
    },
    "IGI Airport": {
        "codes": [3, 50],
        "aliases": ["106_IGI_Airport_(T3)", "IGI_Airport__T3__Delhi_IMD"],
    },
    "IHBAS Dilshad Garden": {
        "codes": [8, 51],
        "aliases": [
            "114_IHBAS_Dilshad_Garden",
            "IHBAS_Dilshad_Garden_Delhi_CPCB",
        ],
    },
    "ITO": {
        "codes": [10, 52],
        "aliases": ["117_ITO", "ITO_Delhi_CPCB"],
    },
    "Jahangirpuri": {
        "codes": [19, 53],
        "aliases": ["1423_Jahangirpuri", "Jahangirpuri_Delhi_DPCC"],
    },
    "Jawaharlal Nehru Stadium": {
        "codes": [20, 54],
        "aliases": [
            "1424_Jawaharlal_Nehru_Stadium",
            "Jawaharlal_Nehru_Stadium_Delhi_DPCC",
        ],
    },
    "Lodhi Road": {
        "codes": [6, 38, 55, 56],
        "aliases": [
            "109_Lodhi_Road",
            "5395_Lodhi_Road",
            "Lodhi_Road_Delhi_IITM",
            "Lodhi_Road_Delhi_IMD",
        ],
    },
    "Major Dhyan Chand Stadium": {
        "codes": [21, 57],
        "aliases": [
            "1425_Major_Dhyan_Chand_National_Stadium",
            "Major_Dhyan_Chand_National_Stadium_Delhi_DPCC",
        ],
    },
    "Mandir Marg": {
        "codes": [13, 58],
        "aliases": ["122_Mandir_Marg", "Mandir_Marg_Delhi_DPCC"],
    },
    "Mundka": {
        "codes": [32, 59],
        "aliases": ["1561_Mundka", "Mundka_Delhi_DPCC"],
    },
    "NSIT Dwarka": {
        "codes": [9, 60],
        "aliases": ["115_NSIT_Dwarka", "NSIT_Dwarka_Delhi_CPCB"],
    },
    "Najafgarh": {
        "codes": [23, 61],
        "aliases": ["1427_Najafgarh", "Najafgarh_Delhi_DPCC"],
    },
    "Narela": {
        "codes": [22, 62],
        "aliases": ["1426_Narela", "Narela_Delhi_DPCC"],
    },
    "Nehru Nagar": {
        "codes": [25, 63],
        "aliases": ["1429_Nehru_Nagar", "Nehru_Nagar_Delhi_DPCC"],
    },
    "North Campus DU": {
        "codes": [2, 64],
        "aliases": ["105_North_Campus_DU", "North_Campus_DU_Delhi_IMD"],
    },
    "Okhla Phase 2": {
        "codes": [24, 65],
        "aliases": ["1428_Okhla_Phase-2", "Okhla_Phase_2_Delhi_DPCC"],
    },
    "Patparganj": {
        "codes": [27, 66],
        "aliases": ["1431_Patparganj", "Patparganj_Delhi_DPCC"],
    },
    "Punjabi Bagh": {
        "codes": [15, 67],
        "aliases": ["125_Punjabi_Bagh", "Punjabi_Bagh_Delhi_DPCC"],
    },
    "Pusa": {
        "codes": [4, 34, 68, 69],
        "aliases": ["107_Pusa", "1563_Pusa", "Pusa_Delhi_DPCC", "Pusa_Delhi_IMD"],
    },
    "R K Puram": {
        "codes": [14, 70],
        "aliases": ["124_R_K_Puram", "R_K_Puram_Delhi_DPCC"],
    },
    "Rohini": {
        "codes": [26, 71],
        "aliases": ["1430_Rohini", "Rohini_Delhi_DPCC"],
    },
    "Shadipur": {
        "codes": [7, 72],
        "aliases": ["113_Shadipur", "Shadipur_Delhi_CPCB"],
    },
    "Sirifort": {
        "codes": [12, 73],
        "aliases": ["119_Sirifort", "Sirifort_Delhi_CPCB"],
    },
    "Sonia Vihar": {
        "codes": [28, 74],
        "aliases": ["1432_Sonia_Vihar", "Sonia_Vihar_Delhi_DPCC"],
    },
    "Sri Aurobindo Marg": {
        "codes": [33, 75],
        "aliases": ["1562_Sri_Aurobindo_Marg", "Sri_Aurobindo_Marg_Delhi_DPCC"],
    },
    "Vivek Vihar": {
        "codes": [30, 76],
        "aliases": ["1435_Vivek_Vihar", "Vivek_Vihar_Delhi_DPCC"],
    },
    "Wazirpur": {
        "codes": [29, 77],
        "aliases": ["1434_Wazirpur", "Wazirpur_Delhi_DPCC"],
    },
    "Anand Vihar (301)": {  # optional separate alias if you want
        "codes": [35],
        "aliases": ["301_Anand_Vihar"],
    },
}


# ------------------------------------------------------
# 2️⃣ INPUT MODELS
# ------------------------------------------------------
class InputData(BaseModel):
    data: Dict[str, Any]


class StationForecastRequest(BaseModel):
    station_name: str  # e.g. "Punjabi Bagh, Delhi, Delhi, India"
    data: Dict[str, Any]  # feature dict WITHOUT station_code (we'll inject)


# ------------------------------------------------------
# 3️⃣ HELPERS
# ------------------------------------------------------
def _make_df_from_features(data: Dict[str, Any]) -> pd.DataFrame:
    """
    Build a single-row DataFrame in the exact feature order the model expects.
    """
    row = []
    for f in feature_names:
        if f not in data:
            raise KeyError(f"Missing feature: {f}")
        row.append(data[f])
    return pd.DataFrame([row], columns=feature_names)


def _predict_single(data: Dict[str, Any]):
    """
    Run model + SHAP for a single feature vector (with station_code already set).
    Returns (preds, shap_24, shap_48, shap_72) as numpy arrays.
    """
    df = _make_df_from_features(data)

    preds = model.predict(df)[0]  # shape (3,)
    shap_24 = explainer_24.shap_values(df)[0]
    shap_48 = explainer_48.shap_values(df)[0]
    shap_72 = explainer_72.shap_values(df)[0]

    # ensure numpy
    preds = np.array(preds, dtype=float)
    shap_24 = np.array(shap_24, dtype=float)
    shap_48 = np.array(shap_48, dtype=float)
    shap_72 = np.array(shap_72, dtype=float)

    return preds, shap_24, shap_48, shap_72


def _shap_array_to_dict(shap_arr: np.ndarray) -> Dict[str, float]:
    """
    Convert SHAP array to {feature_name: value} dict.
    """
    return {feature_names[i]: float(shap_arr[i]) for i in range(len(feature_names))}


def _resolve_canonical_station(station_name: str) -> Optional[str]:
    """
    Fuzzy match:
    - input: "Punjabi Bagh, Delhi, Delhi, India"
    - output: "Punjabi Bagh"

    Strategy:
    - lower() compare
    - check if canonical name substring in station_name
    - if multiple matches -> choose longest canonical name
    """
    s = station_name.lower().strip()
    candidates: List[str] = []

    for canon in CANONICAL_STATION_MAP.keys():
        c_low = canon.lower()
        if c_low in s or s in c_low:
            candidates.append(canon)

    if not candidates:
        return None

    # pick the most specific (longest name)
    best = max(candidates, key=len)
    return best


def _average_across_station_codes(
    base_data: Dict[str, Any], 
    codes: List[int]
) -> Tuple[np.ndarray, Dict[str, Dict[str, float]]]:

    """
    For a given base feature vector (without station_code), run the model
    for each station_code in 'codes' and average both forecast and SHAP.
    """
    if not codes:
        raise ValueError("No station codes provided")

    n = len(codes)
    preds_acc = np.zeros(3, dtype=float)
    shap24_acc = np.zeros(len(feature_names), dtype=float)
    shap48_acc = np.zeros(len(feature_names), dtype=float)
    shap72_acc = np.zeros(len(feature_names), dtype=float)

    for code in codes:
        d = dict(base_data)
        d["station_code"] = code
        preds, s24, s48, s72 = _predict_single(d)

        preds_acc += preds
        shap24_acc += s24
        shap48_acc += s48
        shap72_acc += s72

    preds_mean = preds_acc / n
    shap24_mean = shap24_acc / n
    shap48_mean = shap48_acc / n
    shap72_mean = shap72_acc / n

    contribution = {
        "24h": _shap_array_to_dict(shap24_mean),
        "48h": _shap_array_to_dict(shap48_mean),
        "72h": _shap_array_to_dict(shap72_mean),
    }

    return preds_mean, contribution


# ------------------------------------------------------
# 4️⃣ LOAD MODEL & SHAP ON STARTUP
# ------------------------------------------------------
@app.on_event("startup")
def load_all():
    global model, feature_names, explainer_24, explainer_48, explainer_72

    print("🔄 Loading XGBoost multi-output model...")
    model = joblib.load(MODEL_PATH)

    print("🔄 Loading feature list...")
    feature_names = joblib.load(FEATURE_PATH)

    print("🔄 Building SHAP explainers for 24/48/72h...")
    explainer_24 = shap.TreeExplainer(model.estimators_[0])
    explainer_48 = shap.TreeExplainer(model.estimators_[1])
    explainer_72 = shap.TreeExplainer(model.estimators_[2])

    print("✅ Model + features + SHAP loaded successfully.")


# ------------------------------------------------------
# 5️⃣ ROUTES
# ------------------------------------------------------

@app.get("/features")
def get_features():
    """
    Existing endpoint: used by Node backend to fetch feature order.
    """
    return {"features": [str(f) for f in feature_names]}


@app.get("/stations")
def list_stations():
    """
    List canonical stations and their training codes.
    Useful for frontend dropdowns.
    """
    out = []
    for name, meta in CANONICAL_STATION_MAP.items():
        out.append(
            {
                "name": name,
                "codes": meta.get("codes", []),
                "aliases": meta.get("aliases", []),
            }
        )
    return {"stations": out}


@app.post("/predict")
def predict(input_data: InputData):
    """
    Original behavior:
    - expects full feature dict WITH 'station_code'
    - returns forecast + SHAP for that exact feature vector
    """
    data = input_data.data

    # check required features
    missing = [f for f in feature_names if f not in data]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing features: {missing}",
        )

    if "station_code" not in data:
        raise HTTPException(
            status_code=400,
            detail="Feature 'station_code' is required in /predict",
        )

    try:
        preds, s24, s48, s72 = _predict_single(data)
    except KeyError as e:
        raise HTTPException(status_code=400, detail=str(e))

    contribution = {
        "24h": _shap_array_to_dict(s24),
        "48h": _shap_array_to_dict(s48),
        "72h": _shap_array_to_dict(s72),
    }

    return {
        "forecast": {
            "24h": float(preds[0]),
            "48h": float(preds[1]),
            "72h": float(preds[2]),
        },
        "contribution": contribution,
    }


@app.post("/predict_station")
def predict_station(req: StationForecastRequest):
    """
    New endpoint:
    - req.station_name: free text ("Punjabi Bagh, Delhi, Delhi, India")
    - req.data: feature dict WITHOUT 'station_code' (we'll inject)
    - We:
        1. Fuzzy match station_name → canonical
        2. Get all training station_codes for that canonical
        3. Run model for each code
        4. Average predictions & SHAP
    """
    # 1) resolve canonical
    canonical = _resolve_canonical_station(req.station_name)
    if canonical is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown station name: {req.station_name}",
        )

    meta = CANONICAL_STATION_MAP.get(canonical)
    codes = meta.get("codes", [])
    if not codes:
        raise HTTPException(
            status_code=400,
            detail=f"No station codes configured for canonical '{canonical}'",
        )

    # 2) ensure all required NON-station features exist
    base_data = dict(req.data)  # copy
    if "station_code" in base_data:
        # ignore client-provided station_code to avoid conflicts
        base_data.pop("station_code")

    missing = [f for f in feature_names if f not in base_data and f != "station_code"]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing features (excluding station_code): {missing}",
        )

    # 3) average across all codes
    try:
        preds_mean, contrib = _average_across_station_codes(base_data, codes)
    except KeyError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "station": canonical,
        "codes_used": codes,
        "forecast": {
            "24h": float(preds_mean[0]),
            "48h": float(preds_mean[1]),
            "72h": float(preds_mean[2]),
        },
        "contribution": contrib,
    }


# ------------------------------------------------------
# 6️⃣ RUN SERVER (for local testing)
# ------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("fastapis:app", host="0.0.0.0", port=8000, reload=True)
