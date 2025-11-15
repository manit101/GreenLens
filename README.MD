# GreenLens — Carbon Footprint Calculator (Environment & Sustainability)

GreenLens is a simple, hackathon-friendly project that helps users estimate and visualize the carbon footprint of daily activities (commute, food, electricity use). The app uses the Climatiq API to fetch emission factors, accepts user activity inputs (km travelled, energy used, etc.), computes CO₂e totals, and visualizes emissions over time with charts. Optionally, offset suggestions are provided via the Gold Standard API.

Live demo: https://green-lens-frontend-5mk6.vercel.app/

## Objective

Estimate a user's daily carbon footprint from common activities and present the results with easy-to-read daily/weekly charts to help people understand and reduce their emissions.

## Features

- Enter daily activities (commute, electricity, food-related estimates)
- Fetch emission factors from the Climatiq API
- Calculate total CO₂e (kg or g) per activity and aggregate totals
- Visualize emissions over time (daily / weekly charts via Chart.js)
- Persist activity history (simple backend + DB)
- Bonus: retrieve offset suggestions via Gold Standard API (optional)

## Why this works

- Tangible and relatable: tracks common actions like travel and electricity
- Teaches API consumption, unit conversion, and basic calculations
- Good fit for Green Tech hackathons and workshops

## Tech stack

- Frontend: React (Vite / Create React App) + Chart.js
- Backend: Node.js + Express
- Database: (project contains a model — likely MongoDB) — adapt to your environment
- APIs: Climatiq (required), Gold Standard (optional)
- Tools: Postman for API testing, nodemon for development

## API Providers

- Climatiq: https://www.climatiq.io/docs — used to fetch emission factors for travel, energy, etc.
- Gold Standard (optional): https://api.goldstandard.org — used to suggest offset projects

## Repository structure (relevant parts)

- `Backend/` — Node/Express API, controllers, models, routes
- `frontend/` — React app, components, styles, services (API helper)

## Environment / Prerequisites

- Node.js (>=16 recommended)
- npm
- (Optional) MongoDB or connection string if using a hosted DB
- Climatiq API key (sign up at https://www.climatiq.io)
- (Optional) Gold Standard API key

Create a `.env` file in `Backend/` with values similar to:

CLIMATIQ_API_KEY=your_climatiq_api_key
GOLD_STANDARD_API_KEY=your_gold_standard_api_key  # optional
MONGODB_URI=your_mongodb_connection_string
PORT=5000

Keep these secret (do not commit `.env`).

## Setup and Run (local)

Open a terminal (zsh) and run:

# Backend
cd Backend
npm install
# create .env as described above
npm run dev     # or `node server.js` / `npm start` depending on scripts

# Frontend
cd ../frontend
npm install
npm run dev     # or `npm start`

Notes:
- If you use `nodemon` on macOS and hit permission issues (e.g. "bad interpreter: /usr/bin/env: Operation not permitted"), try removing quarantine attributes or moving the project out of restricted folders like `Downloads`, or run via `npx nodemon`.
- If you see CORS errors, ensure the backend port matches the frontend `api.js` base URL and that the backend sets appropriate CORS headers.

## How it works (high level)

1. Frontend collects user inputs (km travelled, electricity kWh, food estimates, etc.).
2. Frontend or backend calls Climatiq with relevant parameters to get emission factors.
3. The app multiplies activity quantities by emission factors to compute CO₂e for each activity.
4. Emissions are stored in the backend and displayed with Chart.js in daily/weekly views.
5. Optionally, app calls Gold Standard API to fetch offset suggestions and estimated costs.

## Postman

A Postman collection (if present) can be used to test backend endpoints. Import the collection and set the environment variables (base URL, API keys) accordingly.

## Testing and Validation

- Validate calculations against Climatiq response units (gCO2e / kWh, gCO2e / km, etc.).
- Provide unit conversion helpers in `frontend/src/utils` to keep consistent units.

## Deployment

- Frontend is deployed (example): https://green-lens-frontend-5mk6.vercel.app/
- Backend can be deployed to Heroku, Railway, Render, or other Node hosts. Ensure environment variables (Climatiq key, DB URI) are set in the hosting provider.

## Contributing

Contributions are welcome. Open an issue or submit a pull request with a clear description of the change.

## License

This project is provided as-is for educational purposes. Add a license file if needed.

