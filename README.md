# 🥗 Calori — Personal Calorie & Nutrition Tracker

A locally-hosted, Docker-based calorie and nutrition tracker optimised for Indian/South Indian (Andhra Pradesh) foods.

---

## ✨ Features

- 📖 **Daily Food Diary** — Log breakfast, lunch, dinner, and snacks
- 📊 **Progress Bars** — Visual progress toward every macro and micronutrient goal
- 🍛 **60+ South Indian Foods** pre-loaded (idly, dosa, pesarattu, sambar, gongura, biryani, and more)
- 🔍 **Food Search** — Search from local DB or fetch from Open Food Facts & USDA FoodData Central
- ⚖️ **Grams OR Pieces** — Log "2 idlies" or "150g rice"
- 🥘 **Custom Meals** — Save your favourite meal combos (e.g., "Andhra Lunch Thali"), reuse with one click
- 🎯 **Nutrition Goals** — Set daily targets for all macros and micronutrients
- 📈 **Reports** — Daily, weekly, and monthly summaries with charts and averages
- 🌐 **Offline-first** — Works without internet for all previously searched/saved foods
- 🗄️ **100% Local** — All data stored on your laptop, no cloud required

---

## 🚀 Quick Start

### Prerequisites

- Docker installed (you have Docker CLI)
- That's it!

### Start the App

```bash
cd "Calori app"
docker compose up --build
```

First start takes ~3-4 minutes (downloads images and seeds the food database).  
After that, subsequent starts take ~30 seconds.

**Open your browser:** [http://localhost:3000](http://localhost:3000)

### Stop the App

```bash
docker compose down
```

Your data is always safe in Docker volumes — stopping doesn't delete anything.

---

## 🔑 USDA API Key (Optional but Recommended)

The app uses `DEMO_KEY` by default which has rate limits. For better micronutrient data:

1. Get your **free** key at: [https://fdc.nal.usda.gov/api-key-signup.html](https://fdc.nal.usda.gov/api-key-signup.html) (30 seconds)
2. Edit `.env` file:
   ```
   USDA_API_KEY=your_actual_key_here
   ```
3. Restart: `docker compose down && docker compose up`

---

## 📁 Project Structure

```
Calori app/
├── docker-compose.yml    # Orchestrates all containers
├── .env                  # Your local config (API keys, DB password)
├── backend/              # FastAPI (Python) backend
│   ├── app/
│   │   ├── models/       # Database models
│   │   ├── routers/      # API endpoints
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Nutrition API, calculations
│   └── seeds/            # South Indian food database
└── frontend/             # React + Vite + Tailwind CSS
    └── src/
        ├── pages/        # Dashboard, Diary, Meals, Goals, Reports
        ├── components/   # Reusable UI components
        └── api/          # Backend API calls
```

---

## 🍽️ Pre-loaded Indian Foods

The app comes with accurate nutritional data for 60+ South Indian/Andhra foods:

| Category | Examples |
|---|---|
| Breakfast | Idly, Dosa, Pesarattu, Upma, Medu Vada, Pongal, Punugulu |
| Rice dishes | White rice, Pulihora, Curd rice, Chicken Biryani, Mutton Biryani |
| Dal & Sambar | Sambar, Rasam, Toor Dal Pappu, Gongura Pappu, Majjiga Pulusu |
| Vegetable curries | Gongura Pachadi, Gutti Vankaya, Bendakaya Fry, Palakura |
| Non-veg | Egg curry, Chicken curry, Fish curry (Rohu), Prawns curry |
| Breads | Chapati, Paratha, Puri |
| Dairy | Curd, Buttermilk/Majjiga, Ghee, Paneer |
| Snacks | Murukku, Mixture, Pakodi |

---

## 📊 Nutrients Tracked

**Macronutrients:** Calories, Protein, Carbohydrates, Fat, Fiber, Sugar, Saturated Fat

**Micronutrients:** Sodium, Potassium, Iron, Calcium, Vitamin C, Vitamin D, Vitamin B12, Magnesium, Zinc, Cholesterol

---

## 🐛 Troubleshooting

**App not loading?**
```bash
docker compose logs frontend
docker compose logs backend
```

**Database issues?**
```bash
docker compose down -v   # WARNING: This deletes all data
docker compose up --build
```

**Port conflicts?**
- Frontend: `localhost:3000`
- Backend API: `localhost:8000`
- If these ports are busy, edit `docker-compose.yml`
