'''import joblib

path = r"B:\SIH2\AI-Pollution-Forecast-and-Policy-Dashboard\backend\Models\station_to_code.pkl"

station_map = joblib.load(path)

for name, code in station_map.items():
    print(name, "=>", code)'''

import joblib
m = joblib.load("B:\SIH2\AI-Pollution-Forecast-and-Policy-Dashboard\ML\Models\station_to_code.pkl")
for k,v in m.items():
    print(k, "=>", v)


