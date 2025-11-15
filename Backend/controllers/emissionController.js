const axios = require('axios');
const Activity = require('../models/Activity');

// New Climatiq API URL
const CLIMATIQ_API_KEY = process.env.CLIMATIQ_API_KEY;
const CLIMATIQ_API_URL = 'https://api.climatiq.io/estimate';

/**
 * Calculate emissions for commute
 */
const calculateCommuteEmissions = async (distance, transportMode) => {
  try {
    // New valid transport emission factor IDs from Climatiq (UUIDs)
  const emissionFactors = {
  car: "3b0d35f0-967e-4da1-ae44-30c75e5a1f15",
  bus: "a140eb1a-bb10-4da8-8645-2d93ea0b474d",
  train: "2fca0e4c-9e14-4f87-9af4-dcd5cb1cf14a",
  plane: "8f8ad788-148d-4173-8e04-dfa0e5c94b2b",
  motorcycle: "dc16e39d-8572-432a-8225-5082bcde55e5",
  bicycle: null,
  walking: null
};

    const factorId = emissionFactors[transportMode] || emissionFactors.car;

    // For bicycle/walking → no emissions
    if (!factorId) return 0;

    const response = await axios.post(
      CLIMATIQ_API_URL,
      {
        emission_factor: { id: factorId },
        parameters: {
          distance: distance,
          distance_unit: 'km'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${CLIMATIQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.co2e || 0;

  } catch (error) {
    console.error('Commute API error:', error.response?.data || error.message);

    const fallback = {
      car: 0.21,
      bus: 0.089,
      train: 0.041,
      plane: 0.255,
      motorcycle: 0.113,
      bicycle: 0,
      walking: 0
    };

    return (fallback[transportMode] || fallback.car) * distance;
  }
};

/**
 * Calculate food emissions
 */
const calculateFoodEmissions = async (foodType, quantity, unit = 'kg') => {
  try {
    let quantityKg = quantity;

    if (unit === 'g') quantityKg = quantity / 1000;
    if (unit === 'lb') quantityKg = quantity * 0.453592;

    const factors = {
      beef: 27.0,
      pork: 12.1,
      chicken: 6.9,
      fish: 5.1,
      dairy: 3.2,
      vegetables: 2.0,
      fruits: 1.1,
      grains: 2.7
    };

    return quantityKg * (factors[foodType] || 2.0);

  } catch (error) {
    console.error('Food error:', error.message);
    return 0;
  }
};

/**
 * Calculate electricity emissions
 */
const calculateElectricityEmissions = async (energyConsumed, energyUnit = 'kwh') => {
  try {
    let kWh = energyConsumed;
    if (energyUnit === 'mwh') kWh = energyConsumed * 1000;

    // Working electricity factor ID (you tested this in Postman)
    const electricityFactorId = "0de2d70a-4704-48f4-b862-1a86da206dd3";

    const response = await axios.post(
      CLIMATIQ_API_URL,
      {
        emission_factor: { id: electricityFactorId },
        parameters: {
          energy: kWh,
          energy_unit: "kWh"
        }
      },
      {
        headers: {
          "Authorization": `Bearer ${CLIMATIQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.co2e || 0;

  } catch (error) {
    console.error('Electricity error:', error.response?.data || error.message);
    return 0.475 * energyConsumed;
  }
};

/**
 * Main calculator
 */
const calculateEmissions = async (req, res) => {
  try {
    const { activityType, ...body } = req.body;
    let co2e = 0;

    if (activityType === "commute") {
      co2e = await calculateCommuteEmissions(body.distance, body.transportMode);
    } else if (activityType === "food") {
      co2e = await calculateFoodEmissions(body.foodType, body.quantity, body.unit);
    } else if (activityType === "electricity") {
      co2e = await calculateElectricityEmissions(body.energyConsumed, body.energyUnit);
    } else {
      return res.status(400).json({ error: "Invalid activity type" });
    }

    res.json({ success: true, co2e, unit: "kg" });

  } catch (error) {
    res.status(500).json({ error: "Calculation failed", message: error.message });
  }
};

/**
 * Get total emissions
 */
const getTotalEmissions = async (req, res) => {
  try {
    const { userId = "default-user", startDate, endDate } = req.query;
    const query = { userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const activities = await Activity.find(query);
    const total = activities.reduce((sum, a) => sum + a.co2e, 0);

    res.json({
      success: true,
      totalCo2e: total,
      count: activities.length,
      activities
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch", message: error.message });
  }
};

/**
 * Group emissions
 */
const getEmissionsByPeriod = async (req, res) => {
  try {
    const { userId = "default-user", period = "day", days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const data = await Activity.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    const grouped = {};

    data.forEach(a => {
      const d = new Date(a.date);
      let key = d.toISOString().split("T")[0];

      if (period === "week") {
        const ws = new Date(d);
        ws.setDate(d.getDate() - d.getDay());
        key = ws.toISOString().split("T")[0];
      }

      if (!grouped[key]) grouped[key] = { date: key, co2e: 0 };
      grouped[key].co2e += a.co2e;
    });

    res.json({
      success: true,
      data: Object.values(grouped)
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to group", message: error.message });
  }
};

module.exports = {
  calculateEmissions,
  getTotalEmissions,
  getEmissionsByPeriod,
  calculateCommuteEmissions,
  calculateFoodEmissions,
  calculateElectricityEmissions
};