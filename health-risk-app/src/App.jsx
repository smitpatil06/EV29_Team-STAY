import React, { useState } from 'react';
import { Activity, Heart, Droplet, AlertCircle, CheckCircle, TrendingUp, User } from 'lucide-react';

export default function App() {
  const [formData, setFormData] = useState({
    age: 50, gender: 'Male',
    cp: 1, trestbps: 120, chol: 200, fbs: 0, restecg: 0,
    thalach: 150, exang: false, oldpeak: 0.0, slope: 1, ca: 0, thal: 3,
    polyuria: false, polydipsia: false, weight_loss: false, weakness: false,
    polyphagia: false, thrush: false, blurring: false, itching: false,
    irritability: false, healing: false, paresis: false, stiffness: false,
    alopecia: false, obesity: false
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError("Backend connection failed. Ensure Flask server is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (pct) => {
    if (pct >= 70) return { level: 'High', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-500' };
    if (pct >= 40) return { level: 'Moderate', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-500' };
    return { level: 'Low', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-500' };
  };

  const symptoms = [
    { label: 'Polyuria', name: 'polyuria' }, { label: 'Polydipsia', name: 'polydipsia' },
    { label: 'Weight Loss', name: 'weight_loss' }, { label: 'Weakness', name: 'weakness' },
    { label: 'Polyphagia', name: 'polyphagia' }, { label: 'Thrush', name: 'thrush' },
    { label: 'Blurring', name: 'blurring' }, { label: 'Itching', name: 'itching' },
    { label: 'Irritability', name: 'irritability' }, { label: 'Healing', name: 'healing' },
    { label: 'Paresis', name: 'paresis' }, { label: 'Stiffness', name: 'stiffness' },
    { label: 'Alopecia', name: 'alopecia' }, { label: 'Obesity', name: 'obesity' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <Activity className="w-10 h-10 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ENVISION Health AI</h1>
              <p className="text-sm text-gray-500">Early Risk Prediction System</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 space-y-6">
            {/* Demographics */}
            <div className="border-b pb-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Demographics</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Age</label>
                  <input name="age" type="number" value={formData.age} onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cardiovascular */}
            <div className="border-b pb-6">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-semibold">Cardiovascular Vitals</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Chest Pain (1-4)</label>
                  <input name="cp" type="number" value={formData.cp} onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">BP (mmHg)</label>
                  <input name="trestbps" type="number" value={formData.trestbps} onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cholesterol</label>
                  <input name="chol" type="number" value={formData.chol} onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max HR</label>
                  <input name="thalach" type="number" value={formData.thalach} onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Oldpeak</label>
                  <input name="oldpeak" type="number" step="0.1" value={formData.oldpeak} onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="exang" checked={formData.exang} onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Ex. Angina</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Diabetes Symptoms */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Droplet className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold">Metabolic Symptoms</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {symptoms.map(s => (
                  <label key={s.name} className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-blue-50 cursor-pointer">
                    <input type="checkbox" name={s.name} checked={formData[s.name]} onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={handlePredict} disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Generate Risk Assessment
                </>
              )}
            </button>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Risk Assessment</h2>
            
            {results ? (
              <>
                <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${getRiskLevel(results.heart_risk).border}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Heart className="w-6 h-6 text-red-600" />
                      <h3 className="font-semibold">Heart Disease</h3>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getRiskLevel(results.heart_risk).bg} ${getRiskLevel(results.heart_risk).color}`}>
                      {getRiskLevel(results.heart_risk).level}
                    </span>
                  </div>
                  <div className="text-5xl font-bold mb-4">{results.heart_risk}%</div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-full rounded-full" style={{width: `${results.heart_risk}%`}}></div>
                  </div>
                </div>

                <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${getRiskLevel(results.diabetes_risk).border}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-6 h-6 text-purple-600" />
                      <h3 className="font-semibold">Diabetes</h3>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getRiskLevel(results.diabetes_risk).bg} ${getRiskLevel(results.diabetes_risk).color}`}>
                      {getRiskLevel(results.diabetes_risk).level}
                    </span>
                  </div>
                  <div className="text-5xl font-bold mb-4">{results.diabetes_risk}%</div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-full rounded-full" style={{width: `${results.diabetes_risk}%`}}></div>
                  </div>
                </div>

                {results.insights?.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl shadow-lg p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Preventive Care Insights
                    </h3>
                    <ul className="space-y-3">
                      {results.insights.map((insight, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="text-yellow-300">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-dashed">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Submit vitals to see results</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-12 py-6 border-t bg-white text-center text-sm text-gray-500">
        <p>ENVISION Health AI • PS02: AI-Powered Early Risk Prediction</p>
        <p className="mt-1">⚠️ Predictive tool only. Consult healthcare professionals.</p>
      </footer>
    </div>
  );
}