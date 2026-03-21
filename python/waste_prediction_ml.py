import pandas as pd
import numpy as np
from sklearn.linear_model import (
    LinearRegression
)
from sklearn.ensemble import (
    RandomForestRegressor
)
from sklearn.model_selection import (
    train_test_split
)
from sklearn.metrics import (
    mean_squared_error, r2_score
)
import json

print("🧠 AstraCity Waste Prediction ML Model")
print("=" * 50)

# ══════════════════════════════════
# STEP 1: Generate Training Data
# Based on real HSR Layout parameters
# ══════════════════════════════════
print("\n📦 Generating training dataset...")

np.random.seed(42)
n_samples = 1000

# Real HSR Layout zone data
zones_base = [
    {"zone": "B2", "buildings": 2189,
     "population": 8756, "commercial": 47},
    {"zone": "C3", "buildings": 2082,
     "population": 8328, "commercial": 41},
    {"zone": "B3", "buildings": 1734,
     "population": 6936, "commercial": 12},
    {"zone": "B1", "buildings": 1383,
     "population": 5532, "commercial": 12},
    {"zone": "C2", "buildings": 554,
     "population": 2216, "commercial": 7},
    {"zone": "C1", "buildings": 276,
     "population": 1104, "commercial": 5},
    {"zone": "D4", "buildings": 203,
     "population": 812, "commercial": 1},
    {"zone": "A3", "buildings": 473,
     "population": 1892, "commercial": 4}
]

# Generate training samples
training_data = []

for _ in range(n_samples):
    # Random zone
    zone = np.random.choice(zones_base)
    
    # Features with variation
    population = zone["population"] * (
        1 + np.random.normal(0, 0.05)
    )
    buildings = zone["buildings"] * (
        1 + np.random.normal(0, 0.03)
    )
    commercial_count = zone["commercial"]
    rainfall = np.random.choice([
        np.random.uniform(0, 5),   # dry
        np.random.uniform(5, 15),  # normal
        np.random.uniform(15, 50)  # heavy
    ], p=[0.4, 0.4, 0.2])
    temperature = np.random.uniform(22, 35)
    festival = np.random.choice(
        [0, 1], p=[0.85, 0.15]
    )
    day_of_week = np.random.randint(0, 7)
    
    # Commercial score
    commercial_score = (
        commercial_count * 2.5 +
        buildings * 0.01
    )
    
    # True waste (ground truth)
    # Based on BBMP per-capita rates
    base_waste = 23.26 # tons/day
    # Source: CPCB 0.5kg × 46,517 people
    
    # Apply real-world factors
    if rainfall > 10:
        base_waste *= 1.15
    if rainfall > 25:
        base_waste *= 1.25
    if festival:
        base_waste *= 1.22
    if day_of_week in [5, 6]:  # weekend
        base_waste *= 1.10
    
    # Add realistic noise
    waste = base_waste * (
        1 + np.random.normal(0, 0.08)
    )
    
    training_data.append({
        "zone": zone["zone"],
        "population": round(population),
        "buildings": round(buildings),
        "commercial_count": commercial_count,
        "commercial_score": round(
            commercial_score, 2
        ),
        "rainfall": round(rainfall, 1),
        "temperature": round(temperature, 1),
        "festival": festival,
        "day_of_week": day_of_week,
        "waste_tons": round(waste, 3)
    })

df = pd.DataFrame(training_data)
print(f"✅ Generated {len(df)} training samples")
print(f"   Waste range: "
      f"{df['waste_tons'].min():.2f} - "
      f"{df['waste_tons'].max():.2f} tons")
print(f"   Mean waste: "
      f"{df['waste_tons'].mean():.2f} tons")

# ══════════════════════════════════
# STEP 2: Feature Engineering
# ══════════════════════════════════
print("\n📦 Feature Engineering...")

# Features for model
features = [
    "population",
    "buildings",
    "commercial_count",
    "commercial_score",
    "rainfall",
    "temperature",
    "festival",
    "day_of_week"
]

X = df[features]
y = df["waste_tons"]

# Train/test split
X_train, X_test, y_train, y_test = (
    train_test_split(
        X, y, 
        test_size=0.2,
        random_state=42
    )
)

print(f"✅ Training samples: {len(X_train)}")
print(f"✅ Test samples: {len(X_test)}")

# ══════════════════════════════════
# STEP 3: Train Models
# ══════════════════════════════════
print("\n📦 Training Models...")

# Model 1: Linear Regression
lr_model = LinearRegression()
lr_model.fit(X_train, y_train)
lr_pred = lr_model.predict(X_test)
lr_r2 = r2_score(y_test, lr_pred)
lr_rmse = np.sqrt(
    mean_squared_error(y_test, lr_pred)
)

print(f"\n📊 Linear Regression:")
print(f"   R² Score: {lr_r2:.4f}")
print(f"   RMSE: {lr_rmse:.4f} tons")

# Model 2: Random Forest
rf_model = RandomForestRegressor(
    n_estimators=100,
    max_depth=10,
    random_state=42
)
rf_model.fit(X_train, y_train)
rf_pred = rf_model.predict(X_test)
rf_r2 = r2_score(y_test, rf_pred)
rf_rmse = np.sqrt(
    mean_squared_error(y_test, rf_pred)
)

print(f"\n📊 Random Forest:")
print(f"   R² Score: {rf_r2:.4f}")
print(f"   RMSE: {rf_rmse:.4f} tons")

# Choose best model
best_model = (
    rf_model if rf_r2 > lr_r2 
    else lr_model
)
best_name = (
    "Random Forest" if rf_r2 > lr_r2 
    else "Linear Regression"
)
print(f"\n🏆 Best Model: {best_name}")

# ══════════════════════════════════
# STEP 4: Feature Importance
# ══════════════════════════════════
print("\n📦 Feature Importance...")

if hasattr(best_model, 
           'feature_importances_'):
    importance = pd.DataFrame({
        'feature': features,
        'importance': (
            best_model.feature_importances_
        )
    }).sort_values(
        'importance', ascending=False
    )
    print("\nTop Features:")
    for _, row in importance.iterrows():
        bar = "█" * int(
            row['importance'] * 50
        )
        print(f"  {row['feature']:20s} "
              f"{bar} "
              f"{row['importance']:.3f}")

# ══════════════════════════════════
# STEP 5: Predict for HSR Layout
# ══════════════════════════════════
print("\n📦 HSR Layout Predictions...")

scenarios = [
    {
        "name": "Normal Day",
        "population": 220000,
        "buildings": 9471,
        "commercial_count": 137,
        "commercial_score": 437.5,
        "rainfall": 5,
        "temperature": 28,
        "festival": 0,
        "day_of_week": 2
    },
    {
        "name": "Monsoon Day",
        "population": 220000,
        "buildings": 9471,
        "commercial_count": 137,
        "commercial_score": 437.5,
        "rainfall": 25,
        "temperature": 24,
        "festival": 0,
        "day_of_week": 2
    },
    {
        "name": "Diwali Festival",
        "population": 220000,
        "buildings": 9471,
        "commercial_count": 137,
        "commercial_score": 437.5,
        "rainfall": 2,
        "temperature": 26,
        "festival": 1,
        "day_of_week": 5
    },
    {
        "name": "Ganesh Chaturthi",
        "population": 220000,
        "buildings": 9471,
        "commercial_count": 137,
        "commercial_score": 437.5,
        "rainfall": 15,
        "temperature": 27,
        "festival": 1,
        "day_of_week": 6
    }
]

predictions = []
print("\nScenario Predictions:")
print("-" * 40)

for scenario in scenarios:
    name = scenario.pop("name")
    X_pred = pd.DataFrame([scenario])
    waste = best_model.predict(X_pred)[0]
    
    print(f"📍 {name}:")
    print(f"   Predicted waste: "
          f"{waste:.2f} tons/day")
    
    predictions.append({
        "scenario": name,
        "predicted_waste_tons": round(
            waste, 2
        ),
        "model": best_name,
        "r2_score": round(
            rf_r2 if best_name == 
            "Random Forest" else lr_r2, 4
        )
    })

# ══════════════════════════════════
# STEP 6: Save Results
# ══════════════════════════════════
print("\n📦 Saving Results...")

import os
# Create dirs if missing
os.makedirs('../../public/data', exist_ok=True)

# Save predictions
with open(
    '../../public/data/ml_predictions.json',
    'w'
) as f:
    json.dump({
        "model": best_name,
        "r2_score": round(
            rf_r2 if best_name == 
            "Random Forest" else lr_r2, 4
        ),
        "rmse": round(
            rf_rmse if best_name == 
            "Random Forest" else lr_rmse, 4
        ),
        "training_samples": len(X_train),
        "features": features,
        "predictions": predictions,
        "hsr_layout_baseline": {
            "normal": predictions[0][
                "predicted_waste_tons"
            ],
            "monsoon": predictions[1][
                "predicted_waste_tons"
            ],
            "festival_diwali": predictions[2][
                "predicted_waste_tons"
            ],
            "festival_ganesh": predictions[3][
                "predicted_waste_tons"
            ]
        }
    }, f, indent=2)

# Save training data
df.to_csv(
    '../../public/data/training_data.csv',
    index=False
)

print("✅ ml_predictions.json saved")
print("✅ training_data.csv saved")

print("\n" + "=" * 50)
print("🏆 ML MODEL SUMMARY")
print("=" * 50)
print(f"Model: {best_name}")
print(f"R² Score: "
      f"{rf_r2 if best_name == 'Random Forest' else lr_r2:.4f}")
print(f"Training samples: {len(X_train)}")
print(f"Features used: {len(features)}")
print(f"\nHSR Layout Predictions:")
for p in predictions:
    print(f"  {p['scenario']:25s}: "
          f"{p['predicted_waste_tons']:.2f} "
          f"tons/day")
print("=" * 50)
