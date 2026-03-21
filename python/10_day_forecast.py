import json
import random
from datetime import datetime, timedelta

def generate_forecast():
    print("📈 Generating 10-Day Waste Forecast Data...")
    
    forecast = []
    start_date = datetime(2026, 3, 22)
    
    # Static realistic environmental factors for the simulation
    weather_scenarios = [
        {"desc": "Clear Summer", "temp": 33.5, "rain": 0},
        {"desc": "Hot & Dry", "temp": 35.2, "rain": 0},
        {"desc": "Unseasonal Light Rain", "temp": 28.1, "rain": 4.5},
        {"desc": "Thunderstorm/Heavy Rain", "temp": 25.0, "rain": 28.0},
        {"desc": "Overcast", "temp": 27.5, "rain": 1.5}
    ]
    
    festivals = {
        "2026-03-25": "Ugadi Preparations",
        "2026-03-26": "Ugadi Festival peak",
        "2026-03-29": "Sunday Rama Navami Event"
    }

    # HSR Layout Baseline Total Daily Waste (tons)
    BASE_WASTE_TPD = 19.78  # 0.5kg/day * core stats

    for i in range(10):
        current_date = start_date + timedelta(days=i)
        date_str = current_date.strftime("%Y-%m-%d")
        day_name = current_date.strftime("%A")
        
        # 1. Deterministic Scenarios
        if i in [3, 4]: # Thunderstorms on day 3/4
            weather = weather_scenarios[3]
        elif i in [2, 8]: 
            weather = weather_scenarios[2]
        else:
            weather = random.choice([weather_scenarios[0], weather_scenarios[1]])

        temp = weather["temp"]
        rain = weather["rain"]
        weather_desc = weather["desc"]

        # 2. Check for festival
        festival_name = festivals.get(date_str, "None")
        is_festival = 1 if festival_name != "None" else 0

        # 3. Day Multipliers
        day_of_week = current_date.weekday()
        is_weekend = 1 if day_of_week in [5, 6] else 0

        # --- MULTIPLIER MATH MODEL ---
        mult_wet = 1.0
        mult_dry = 1.0

        if rain > 20: mult_wet += 0.25
        elif rain > 0: mult_wet += 0.08
        if temp > 34: mult_dry += 0.12
        if is_festival: mult_wet, mult_dry = mult_wet + 0.35, mult_dry + 0.15
        if is_weekend: mult_wet, mult_dry = mult_wet + 0.10, mult_dry + 0.05

        # 60% Wet, 30% Dry, 10% Hazardous
        base_wet, base_dry, base_haz = BASE_WASTE_TPD * 0.60, BASE_WASTE_TPD * 0.30, BASE_WASTE_TPD * 0.10

        predicted_wet = round(base_wet * mult_wet * (1 + random.normalvariate(0, 0.02)), 2)
        predicted_dry = round(base_dry * mult_dry * (1 + random.normalvariate(0, 0.02)), 2)
        predicted_haz = round(base_haz * (1 + random.normalvariate(0, 0.02)), 2)
        total = round(predicted_wet + predicted_dry + predicted_haz, 2)

        # Adjusted Thresholds for Alerts
        capacity_dry = 7.5
        capacity_wet = 14.5

        forecast.append({
            "date": date_str,
            "day": day_name[:3],  # short
            "day_full": day_name,
            "weather": weather_desc,
            "temp": temp,
            "rain_mm": rain,
            "is_festival": is_festival,
            "festival": festival_name,
            "is_weekend": is_weekend,
            "predicted_wet_tons": predicted_wet,
            "predicted_dry_tons": predicted_dry,
            "predicted_haz_tons": predicted_haz,
            "total_waste_tons": total,
            "capacity_wet_tons": capacity_wet,
            "capacity_dry_tons": capacity_dry,
            "is_overflow": 1 if predicted_wet > capacity_wet or predicted_dry > capacity_dry else 0
        })

    # Save Results
    with open('public/data/10_day_forecast.json', 'w') as f:
        json.dump(forecast, f, indent=2)
    print("✅ 10_day_forecast.json generated successfully")

if __name__ == "__main__":
    generate_forecast()
