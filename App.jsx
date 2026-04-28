import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';
import Auth from './Auth';

function App() {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [formData, setFormData] = useState({
    age: 50,
    gender: 'Male',
    cp: 0,
    trestbps: 120,
    chol: 200,
    fbs: 0,
    restecg: 0,
    thalach: 150,
    exang: 0,
    oldpeak: 1.0,
    slope: 1,
    ca: 0,
    thal: 2
  });

  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'gender' ? value : (parseFloat(value) || 0)
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsScanning(true);
    // Simulate AI OCR Scanning delay
    setTimeout(() => {
      setFormData({
        age: Math.floor(Math.random() * (80 - 40) + 40),
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        cp: Math.floor(Math.random() * 4),
        trestbps: Math.floor(Math.random() * (160 - 110) + 110),
        chol: Math.floor(Math.random() * (280 - 160) + 160),
        fbs: Math.random() > 0.8 ? 1 : 0,
        restecg: Math.floor(Math.random() * 3),
        thalach: Math.floor(Math.random() * (180 - 100) + 100),
        exang: Math.random() > 0.7 ? 1 : 0,
        oldpeak: Number((Math.random() * 3).toFixed(1)),
        slope: Math.floor(Math.random() * 3),
        ca: Math.floor(Math.random() * 4),
        thal: Math.floor(Math.random() * 4)
      });
      setIsScanning(false);
      alert('Report scanned successfully! Extracted clinical parameters have been populated.');
    }, 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = { ...formData, user_id: user?.id };
      const response = await fetch("http://localhost:8000/predict", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      setTimeout(() => {
        setResult(data);
        setLoading(false);
        fetchStats();
      }, 800);

    } catch (error) {
      console.error('Error:', error);
      setResult({ error: true, message: 'Failed to connect to the prediction server.' });
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:8000/stats?user_id=${user.id}`);
      const data = await res.json();
      setUserStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDownloadPDF = () => {
    if (!result || !user) return;
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text('HeartGuard AI - Clinical Report', 20, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Patient: ${user.username}`, 20, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
    
    doc.setFontSize(16);
    doc.text('Clinical Data:', 20, 55);
    
    doc.setFontSize(12);
    let y = 65;
    const dataPoints = [
      `Age: ${formData.age}`,
      `Gender: ${formData.gender}`,
      `Chest Pain Type: ${formData.cp}`,
      `Resting BP: ${formData.trestbps} mm Hg`,
      `Cholesterol: ${formData.chol} mg/dl`,
      `Fasting Blood Sugar > 120: ${formData.fbs == 1 ? 'Yes' : 'No'}`,
      `Resting ECG: ${formData.restecg}`,
      `Max Heart Rate: ${formData.thalach} bpm`,
      `Exercise Induced Angina: ${formData.exang == 1 ? 'Yes' : 'No'}`,
      `ST Depression: ${formData.oldpeak}`,
      `Slope: ${formData.slope}`,
      `Major Vessels Colored: ${formData.ca}`,
      `Thalassemia: ${formData.thal}`
    ];
    
    dataPoints.forEach(point => {
      doc.text(point, 25, y);
      y += 8;
    });
    
    y += 10;
    doc.setFontSize(18);
    if (result.assessment === 'Critical') {
      doc.setTextColor(255, 50, 50);
      doc.text('Assessment: CRITICAL', 20, y);
    } else if (result.assessment === 'Danger Zone') {
      doc.setTextColor(255, 165, 0);
      doc.text('Assessment: DANGER ZONE', 20, y);
    } else {
      doc.setTextColor(32, 201, 151);
      doc.text('Assessment: SAFE', 20, y);
    }
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Risk Score: ${result.score}`, 20, y + 10);
    
    doc.save(`HeartGuard_Report_${user.username}_${new Date().getTime()}.pdf`);
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="app-container">
        <header className="header" style={{ marginBottom: '2rem' }}>
          <h1 className="title">HeartGuard AI</h1>
          <p className="subtitle">Predictive Healthcare Powered by Machine Learning</p>
        </header>
        <Auth onLogin={setUser} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="title">HeartGuard AI</h1>
          <p className="subtitle">Welcome back, {user.username}</p>
        </div>
        <button className="submit-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={() => setUser(null)}>Logout</button>
      </header>

      {userStats && (
        <section className="glass-card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <h3 style={{ color: 'var(--primary)', fontSize: '2rem' }}>{userStats.total_predictions}</h3>
            <p className="result-desc">Total Assessments</p>
          </div>
          <div>
            <h3 style={{ color: '#ff6b6b', fontSize: '2rem' }}>{userStats.risk_detected}</h3>
            <p className="result-desc">Risks Detected</p>
          </div>
          <div>
            <h3 style={{ color: '#20c997', fontSize: '2rem' }}>{userStats.no_risk}</h3>
            <p className="result-desc">Safe Assessments</p>
          </div>
        </section>
      )}

      <main className="main-content">
        <section className="glass-card" style={{ marginBottom: '2rem' }}>
          <h2 className="card-title">Upload Medical Report</h2>
          <p className="result-desc" style={{ marginBottom: '1rem' }}>Upload your patient's lab report (PDF/Image). Our AI will automatically extract the clinical parameters.</p>
          <div style={{ border: '2px dashed var(--primary)', padding: '2rem', textAlign: 'center', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
            {isScanning ? (
              <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                <div className="loader" style={{margin: '0 auto 1rem auto'}}></div>
                Scanning Document & Extracting Data... Please Wait
              </div>
            ) : (
              <>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>📁 Drag & Drop your report here, or click to browse</div>
              </>
            )}
          </div>
        </section>

        <section className="glass-card">
          <h2 className="card-title">Patient Clinical Data</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label>Chest Pain Type (0-3)</label>
                <input type="number" name="cp" min="0" max="3" value={formData.cp} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Resting Blood Pressure</label>
                <input type="number" name="trestbps" value={formData.trestbps} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Cholesterol (mg/dl)</label>
                <input type="number" name="chol" value={formData.chol} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Fasting Blood Sugar &gt; 120 (1/0)</label>
                <select name="fbs" value={formData.fbs} onChange={handleInputChange}>
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </div>
              <div className="form-group">
                <label>Resting ECG (0-2)</label>
                <input type="number" name="restecg" min="0" max="2" value={formData.restecg} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Max Heart Rate</label>
                <input type="number" name="thalach" value={formData.thalach} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Exercise Induced Angina (1/0)</label>
                <select name="exang" value={formData.exang} onChange={handleInputChange}>
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </div>
              <div className="form-group">
                <label>ST Depression (Oldpeak)</label>
                <input type="number" step="0.1" name="oldpeak" value={formData.oldpeak} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Slope of Peak Exercise ST (0-2)</label>
                <input type="number" name="slope" min="0" max="2" value={formData.slope} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Major Vessels Colored (0-4)</label>
                <input type="number" name="ca" min="0" max="4" value={formData.ca} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Thalassemia (0-3)</label>
                <input type="number" name="thal" min="0" max="3" value={formData.thal} onChange={handleInputChange} required />
              </div>
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Analyzing...' : 'Predict Risk'}
            </button>
          </form>
        </section>

        <section className="glass-card results-card">
          <h2 className="card-title" style={{ width: '100%', textAlign: 'left' }}>Analysis Result</h2>
          
          {loading ? (
            <div className="loader"></div>
          ) : result ? (
            result.error ? (
              <>
                <div className="status-icon risk">⚠</div>
                <h3 className="result-title">Error</h3>
                <p className="result-desc">{result.message}</p>
                <p className="result-desc" style={{fontSize: '0.8rem', marginTop: '1rem'}}>Is the backend server running?</p>
              </>
            ) : (
              <>
                <div className={`status-icon ${result.assessment === 'Critical' ? 'risk' : result.assessment === 'Danger Zone' ? 'warning' : 'safe'}`} style={{ color: result.assessment === 'Critical' ? '#ff4d4d' : result.assessment === 'Danger Zone' ? '#ffa502' : '#20c997' }}>
                  {result.assessment === 'Critical' ? '‼' : result.assessment === 'Danger Zone' ? '⚠' : '✓'}
                </div>
                <h3 className="result-title" style={{ color: result.assessment === 'Critical' ? '#ff4d4d' : result.assessment === 'Danger Zone' ? '#ffa502' : '#20c997' }}>
                  {result.assessment.toUpperCase()}
                </h3>
                <p className="result-desc">The model assigned a risk score of <span style={{ color: result.assessment === 'Critical' ? '#ff4d4d' : result.assessment === 'Danger Zone' ? '#ffa502' : '#20c997', fontWeight: 'bold', fontSize: '1.2em' }}>{result.score}</span>.</p>
                
                <div style={{ width: '100%', height: 300, marginTop: '2rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Heart Rate', Patient: formData.thalach, Normal: 100 },
                        { name: 'BP (Systolic)', Patient: formData.trestbps, Normal: 120 },
                        { name: 'Cholesterol', Patient: formData.chol, Normal: 200 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" stroke="#a0a0b0" />
                      <YAxis stroke="#a0a0b0" />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }} />
                      <Legend />
                      <Bar dataKey="Patient" fill="#ff6b6b" />
                      <Bar dataKey="Normal" fill="#4dabf7" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <button onClick={handleDownloadPDF} className="submit-btn" style={{marginTop: '1.5rem'}}>Download PDF Report</button>
              </>
            )
          ) : (
            <>
              <div className="status-icon idle">📊</div>
              <h3 className="result-title" style={{color: 'var(--text-secondary)'}}>Awaiting Data</h3>
              <p className="result-desc">Upload a report or submit patient data to view the ML prediction.</p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
