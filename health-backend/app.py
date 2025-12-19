from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Global variables for models
heart_model = None
diabetes_model = None
heart_scaler = None
diabetes_scaler = None

def load_and_train_models():
    """Load datasets and train ML models"""
    global heart_model, diabetes_model, heart_scaler, diabetes_scaler
    
    try:
        # === HEART DISEASE MODEL ===
        logger.info("Loading heart disease dataset...")
        heart_df = pd.read_csv('heart.csv')
        
        # Drop Serial No if exists
        if 'Serial No' in heart_df.columns:
            heart_df = heart_df.drop(columns=['Serial No'])
        
        # Map target variable: 1 (no disease) -> 0, 2 (disease) -> 1
        heart_df['heart_disease'] = heart_df['heart_disease'].map({1: 0, 2: 1})
        
        # Separate features and target
        X_heart = heart_df.drop(columns=['heart_disease'])
        y_heart = heart_df['heart_disease']
        
        # Scale features for better performance
        heart_scaler = StandardScaler()
        X_heart_scaled = heart_scaler.fit_transform(X_heart)
        
        # Train Random Forest with optimized parameters
        heart_model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        heart_model.fit(X_heart_scaled, y_heart)
        logger.info(f"Heart model trained. Score: {heart_model.score(X_heart_scaled, y_heart):.3f}")
        
        # === DIABETES MODEL ===
        logger.info("Loading diabetes dataset...")
        diabetes_df = pd.read_csv('diabetes_data_upload.csv')
        
        # Define binary columns
        binary_cols = [
            'Polyuria', 'Polydipsia', 'sudden weight loss', 'weakness',
            'Polyphagia', 'Genital thrush', 'visual blurring', 'Itching',
            'Irritability', 'delayed healing', 'partial paresis',
            'muscle stiffness', 'Alopecia', 'Obesity'
        ]
        
        # Map Yes/No to 1/0
        for col in binary_cols:
            diabetes_df[col] = diabetes_df[col].map({'Yes': 1, 'No': 0})
        
        # Map Gender
        diabetes_df['Gender'] = diabetes_df['Gender'].map({'Male': 1, 'Female': 0})
        
        # Map target: Positive -> 1, Negative -> 0
        diabetes_df['class'] = diabetes_df['class'].map({'Positive': 1, 'Negative': 0})
        
        # Separate features and target
        X_diabetes = diabetes_df.drop(columns=['class'])
        y_diabetes = diabetes_df['class']
        
        # Scale features
        diabetes_scaler = StandardScaler()
        X_diabetes_scaled = diabetes_scaler.fit_transform(X_diabetes)
        
        # Train Random Forest
        diabetes_model = RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        diabetes_model.fit(X_diabetes_scaled, y_diabetes)
        logger.info(f"Diabetes model trained. Score: {diabetes_model.score(X_diabetes_scaled, y_diabetes):.3f}")
        
        # Save models
        joblib.dump(heart_model, 'heart_model.pkl')
        joblib.dump(diabetes_model, 'diabetes_model.pkl')
        joblib.dump(heart_scaler, 'heart_scaler.pkl')
        joblib.dump(diabetes_scaler, 'diabetes_scaler.pkl')
        logger.info("Models saved successfully")
        
        return True
        
    except Exception as e:
        logger.error(f"Error training models: {str(e)}")
        return False

def generate_insights(data, heart_prob, diabetes_prob):
    """Generate personalized preventive care insights"""
    insights = []
    
    # Heart disease insights
    if heart_prob > 0.7:
        insights.append("⚠️ HIGH CARDIAC RISK: Schedule immediate ECG and cardiology consultation.")
    elif heart_prob > 0.5:
        insights.append("🔴 Elevated cardiac risk detected. Recommend comprehensive lipid profile and stress test.")
    elif heart_prob > 0.3:
        insights.append("🟡 Moderate cardiac risk. Consider lifestyle modifications and regular monitoring.")
    
    # Specific cardiac parameters
    if data.get('chol', 0) > 240:
        insights.append("💊 High cholesterol (>240 mg/dL). Dietary modifications and statin therapy may be indicated.")
    
    if data.get('trestbps', 0) > 140:
        insights.append("🩺 Elevated blood pressure (>140 mmHg). Implement DASH diet and monitor regularly.")
    
    if data.get('oldpeak', 0) > 2.0:
        insights.append("📊 Significant ST depression detected. Cardiac stress testing recommended.")
    
    # Diabetes insights
    if diabetes_prob > 0.7:
        insights.append("⚠️ HIGH DIABETES RISK: Immediate HbA1c and fasting glucose testing required.")
    elif diabetes_prob > 0.5:
        insights.append("🔴 Elevated diabetes risk. Schedule glucose tolerance test and endocrinology consultation.")
    elif diabetes_prob > 0.3:
        insights.append("🟡 Moderate diabetes risk. Implement dietary changes and regular glucose monitoring.")
    
    # Diabetes symptoms
    if data.get('polyuria') or data.get('polydipsia'):
        insights.append("💧 Classic diabetes symptoms present (polyuria/polydipsia). Urgent evaluation needed.")
    
    if data.get('obesity'):
        insights.append("⚖️ Obesity detected. Weight management program crucial for reducing both cardiac and metabolic risks.")
    
    # Combined risk
    if heart_prob > 0.5 and diabetes_prob > 0.5:
        insights.append("⚠️ COMBINED HIGH RISK: Comprehensive metabolic and cardiovascular assessment essential.")
    
    # Age-specific
    age = data.get('age', 0)
    if age > 60 and (heart_prob > 0.4 or diabetes_prob > 0.4):
        insights.append("👴 Age-related risk factors present. Recommend comprehensive geriatric assessment.")
    
    return insights

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    try:
        data = request.json
        logger.info(f"Prediction request received for age: {data.get('age', 'N/A')}")
        
        # === HEART DISEASE PREDICTION ===
        heart_features = pd.DataFrame([{
            'age': float(data.get('age', 50)),
            'sex': 1.0 if data.get('gender') == 'Male' else 0.0,
            'chest_pain_type': float(data.get('cp', 1)),
            'resting_blood_pressure': float(data.get('trestbps', 120)),
            'serum_cholestoral': float(data.get('chol', 200)),
            'fasting_blood_sugar': 1.0 if float(data.get('fbs', 0)) > 120 else 0.0,
            'resting_ecg': float(data.get('restecg', 0)),
            'max_heart_rate': float(data.get('thalach', 150)),
            'exercise_induced_angina': 1.0 if data.get('exang', False) else 0.0,
            'oldpeak': float(data.get('oldpeak', 0.0)),
            'st_slope': float(data.get('slope', 1)),
            'major_vessels_count': float(data.get('ca', 0)),
            'thal': float(data.get('thal', 3))
        }])
        
        # Scale and predict
        heart_scaled = heart_scaler.transform(heart_features)
        heart_prob = heart_model.predict_proba(heart_scaled)[0][1] * 100
        
        # === DIABETES PREDICTION ===
        diabetes_features = pd.DataFrame([{
            'Age': float(data.get('age', 50)),
            'Gender': 1 if data.get('gender') == 'Male' else 0,
            'Polyuria': 1 if data.get('polyuria', False) else 0,
            'Polydipsia': 1 if data.get('polydipsia', False) else 0,
            'sudden weight loss': 1 if data.get('weight_loss', False) else 0,
            'weakness': 1 if data.get('weakness', False) else 0,
            'Polyphagia': 1 if data.get('polyphagia', False) else 0,
            'Genital thrush': 1 if data.get('thrush', False) else 0,
            'visual blurring': 1 if data.get('blurring', False) else 0,
            'Itching': 1 if data.get('itching', False) else 0,
            'Irritability': 1 if data.get('irritability', False) else 0,
            'delayed healing': 1 if data.get('healing', False) else 0,
            'partial paresis': 1 if data.get('paresis', False) else 0,
            'muscle stiffness': 1 if data.get('stiffness', False) else 0,
            'Alopecia': 1 if data.get('alopecia', False) else 0,
            'Obesity': 1 if data.get('obesity', False) else 0
        }])
        
        # Scale and predict
        diabetes_scaled = diabetes_scaler.transform(diabetes_features)
        diabetes_prob = diabetes_model.predict_proba(diabetes_scaled)[0][1] * 100
        
        # Generate insights
        insights = generate_insights(data, heart_prob / 100, diabetes_prob / 100)
        
        response = {
            'heart_risk': round(heart_prob, 2),
            'diabetes_risk': round(diabetes_prob, 2),
            'insights': insights,
            'status': 'success'
        }
        
        logger.info(f"Prediction successful - Heart: {heart_prob:.1f}%, Diabetes: {diabetes_prob:.1f}%")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': heart_model is not None and diabetes_model is not None
    })

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get information about trained models"""
    try:
        info = {
            'heart_model': {
                'type': 'RandomForestClassifier',
                'features': list(heart_scaler.feature_names_in_) if hasattr(heart_scaler, 'feature_names_in_') else [],
                'n_estimators': heart_model.n_estimators if heart_model else None
            },
            'diabetes_model': {
                'type': 'RandomForestClassifier',
                'features': list(diabetes_scaler.feature_names_in_) if hasattr(diabetes_scaler, 'feature_names_in_') else [],
                'n_estimators': diabetes_model.n_estimators if diabetes_model else None
            }
        }
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting ENVISION Health AI Backend...")
    
    # Try to load existing models, otherwise train new ones
    try:
        heart_model = joblib.load('heart_model.pkl')
        diabetes_model = joblib.load('diabetes_model.pkl')
        heart_scaler = joblib.load('heart_scaler.pkl')
        diabetes_scaler = joblib.load('diabetes_scaler.pkl')
        logger.info("Loaded existing models")
    except:
        logger.info("Training new models...")
        if not load_and_train_models():
            logger.error("Failed to train models. Exiting.")
            exit(1)
    
    logger.info("Server ready on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)