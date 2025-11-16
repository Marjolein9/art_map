require('dotenv').config();
const express = require('express');
const cors = require('cors');
const countriesData = require('./data/countries');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to Art Map Game API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Game routes
app.get('/api/game/random-country', (req, res) => {
  const randomIndex = Math.floor(Math.random() * countriesData.length);
  const country = countriesData[randomIndex];
  res.json({ country });
});

app.get('/api/game/countries', (req, res) => {
  res.json({ countries: countriesData });
});

app.post('/api/game/check-answer', (req, res) => {
  const { selectedCountryIso, targetCountryIso } = req.body;

  if (!selectedCountryIso || !targetCountryIso) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const isCorrect = selectedCountryIso === targetCountryIso;
  const targetCountry = countriesData.find(c => c.iso === targetCountryIso);

  res.json({
    correct: isCorrect,
    targetCountry: targetCountry || null
  });
});

app.get('/api/game/country-neighbors/:iso', (req, res) => {
  const { iso } = req.params;
  const country = countriesData.find(c => c.iso === iso);

  if (!country) {
    return res.status(404).json({ error: 'Country not found' });
  }

  res.json({
    country: country.name,
    iso: country.iso,
    neighbors: country.neighbors
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
