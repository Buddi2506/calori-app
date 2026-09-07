import os
import sys
import json

# Ensure app imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal, Base
from app.models.food import Food

NEW_FOODS = [
    # ─── 1. FRUITS ─────────────────────────────────────────────────────────────
    {
        "name": "Banana / Arati Pandu (Fresh)",
        "name_local": "అరటి పండు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 120.0,
        "calories": 89.0, "protein": 1.1, "carbohydrates": 22.8, "fat": 0.3, "saturated_fat": 0.1,
        "fiber": 2.6, "sugar": 12.2, "calcium": 5.0, "iron": 0.3, "magnesium": 27.0, "sodium": 1.0, "potassium": 358.0, "vitamin_c": 8.7, "zinc": 0.2
    },
    {
        "name": "Yelakki Banana / Chakkarakeli",
        "name_local": "చక్కెరకేళి అరటి పండు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 65.0,
        "calories": 95.0, "protein": 1.2, "carbohydrates": 24.5, "fat": 0.3, "saturated_fat": 0.1,
        "fiber": 2.8, "sugar": 14.0, "calcium": 6.0, "iron": 0.4, "magnesium": 28.0, "potassium": 370.0, "vitamin_c": 9.0
    },
    {
        "name": "Robusta Banana / Pacharathi",
        "name_local": "పచ్చారటి పండు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 140.0,
        "calories": 88.0, "protein": 1.1, "carbohydrates": 22.5, "fat": 0.3, "saturated_fat": 0.1,
        "fiber": 2.5, "sugar": 12.0, "calcium": 5.0, "iron": 0.3, "potassium": 350.0, "vitamin_c": 8.5
    },
    {
        "name": "Mango / Mamidi Pandu (Banganapalli)",
        "name_local": "బంగినపల్లి మామిడి పండు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 250.0,
        "calories": 60.0, "protein": 0.8, "carbohydrates": 15.0, "fat": 0.4, "saturated_fat": 0.1,
        "fiber": 1.6, "sugar": 13.7, "calcium": 11.0, "iron": 0.2, "magnesium": 10.0, "potassium": 168.0, "vitamin_c": 36.4
    },
    {
        "name": "Papaya / Boppayi Pandu (Fresh)",
        "name_local": "బొప్పాయి పండు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 43.0, "protein": 0.5, "carbohydrates": 10.8, "fat": 0.3, "saturated_fat": 0.1,
        "fiber": 1.7, "sugar": 7.8, "calcium": 20.0, "iron": 0.3, "magnesium": 21.0, "potassium": 182.0, "vitamin_c": 60.9
    },
    {
        "name": "Guava / Jama Pandu (White/Pink)",
        "name_local": "జామ పండు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 100.0,
        "calories": 68.0, "protein": 2.6, "carbohydrates": 14.3, "fat": 0.9, "saturated_fat": 0.3,
        "fiber": 5.4, "sugar": 8.9, "calcium": 18.0, "iron": 0.3, "magnesium": 22.0, "potassium": 417.0, "vitamin_c": 228.3
    },
    {
        "name": "Pomegranate / Danimma Pandu",
        "name_local": "దానిమ్మ పండు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 83.0, "protein": 1.7, "carbohydrates": 18.7, "fat": 1.2, "saturated_fat": 0.1,
        "fiber": 4.0, "sugar": 13.7, "calcium": 10.0, "iron": 0.3, "magnesium": 12.0, "potassium": 236.0, "vitamin_c": 10.2
    },
    {
        "name": "Sapota / Chikoo",
        "name_local": "సపోటా పండు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 75.0,
        "calories": 83.0, "protein": 0.4, "carbohydrates": 20.0, "fat": 1.1, "saturated_fat": 0.2,
        "fiber": 5.3, "sugar": 14.0, "calcium": 21.0, "iron": 0.8, "magnesium": 12.0, "potassium": 193.0, "vitamin_c": 14.7
    },
    {
        "name": "Sweet Lime / Mosambi / Bathakkai",
        "name_local": "బత్తాయి పండు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 130.0,
        "calories": 43.0, "protein": 0.8, "carbohydrates": 10.0, "fat": 0.3, "saturated_fat": 0.1,
        "fiber": 1.2, "sugar": 8.0, "calcium": 40.0, "iron": 0.7, "potassium": 200.0, "vitamin_c": 50.0
    },
    {
        "name": "Orange / Kamala Pandu",
        "name_local": "కమలా పండు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 130.0,
        "calories": 47.0, "protein": 0.9, "carbohydrates": 11.8, "fat": 0.1, "saturated_fat": 0.0,
        "fiber": 2.4, "sugar": 9.4, "calcium": 40.0, "iron": 0.1, "potassium": 181.0, "vitamin_c": 53.2
    },
    {
        "name": "Watermelon / Puccha Kaya",
        "name_local": "పుచ్చకాయ",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 30.0, "protein": 0.6, "carbohydrates": 7.6, "fat": 0.2, "saturated_fat": 0.0,
        "fiber": 0.4, "sugar": 6.2, "calcium": 7.0, "iron": 0.2, "magnesium": 10.0, "potassium": 112.0, "vitamin_c": 8.1
    },
    {
        "name": "Muskmelon / Kharbuja",
        "name_local": "ఖర్బూజ",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 160.0,
        "calories": 34.0, "protein": 0.8, "carbohydrates": 8.2, "fat": 0.2, "saturated_fat": 0.0,
        "fiber": 0.9, "sugar": 7.9, "calcium": 9.0, "iron": 0.2, "potassium": 267.0, "vitamin_c": 36.7
    },
    {
        "name": "Custard Apple / Sitaphal",
        "name_local": "సీతాఫలం",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 150.0,
        "calories": 94.0, "protein": 2.1, "carbohydrates": 23.6, "fat": 0.3, "saturated_fat": 0.1,
        "fiber": 4.4, "sugar": 18.0, "calcium": 24.0, "iron": 0.6, "magnesium": 21.0, "potassium": 247.0, "vitamin_c": 36.3
    },
    {
        "name": "Amla / Indian Gooseberry / Usirikaya",
        "name_local": "ఉసిరికాయ",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 20.0,
        "calories": 44.0, "protein": 0.9, "carbohydrates": 10.2, "fat": 0.6, "saturated_fat": 0.1,
        "fiber": 4.3, "calcium": 25.0, "iron": 1.2, "potassium": 198.0, "vitamin_c": 600.0
    },
    {
        "name": "Grapes (Green / Seedless)",
        "name_local": "ద్రాక్ష పండ్లు (ఆకుపచ్చ)",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 69.0, "protein": 0.7, "carbohydrates": 18.1, "fat": 0.2, "saturated_fat": 0.1,
        "fiber": 0.9, "sugar": 15.5, "calcium": 10.0, "iron": 0.4, "potassium": 191.0, "vitamin_c": 3.2
    },
    {
        "name": "Grapes (Black / Paneer Draksha)",
        "name_local": "నల్ల ద్రాక్ష పండ్లు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 72.0, "protein": 0.8, "carbohydrates": 19.0, "fat": 0.3, "saturated_fat": 0.1,
        "fiber": 1.2, "sugar": 16.0, "calcium": 14.0, "iron": 0.5, "potassium": 205.0, "vitamin_c": 4.0
    },
    {
        "name": "Pineapple / Anasa Pandu (Fresh)",
        "name_local": "అనాస పండు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 165.0,
        "calories": 50.0, "protein": 0.5, "carbohydrates": 13.1, "fat": 0.1, "saturated_fat": 0.0,
        "fiber": 1.4, "sugar": 9.9, "calcium": 13.0, "iron": 0.3, "magnesium": 12.0, "potassium": 109.0, "vitamin_c": 47.8
    },
    {
        "name": "Jackfruit / Panasa Pandu (Ripe Segments)",
        "name_local": "పనస తొనలు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 30.0,
        "calories": 95.0, "protein": 1.7, "carbohydrates": 23.2, "fat": 0.6, "saturated_fat": 0.2,
        "fiber": 1.5, "sugar": 19.1, "calcium": 24.0, "iron": 0.6, "magnesium": 29.0, "potassium": 448.0, "vitamin_c": 13.7
    },
    {
        "name": "Apple / Seema Regu (Fresh)",
        "name_local": "యాపిల్",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 180.0,
        "calories": 52.0, "protein": 0.3, "carbohydrates": 13.8, "fat": 0.2, "saturated_fat": 0.0,
        "fiber": 2.4, "sugar": 10.4, "calcium": 6.0, "iron": 0.1, "potassium": 107.0, "vitamin_c": 4.6
    },
    {
        "name": "Indian Blackberry / Jamun / Alleredu",
        "name_local": "నేరేడు పండు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 10.0,
        "calories": 60.0, "protein": 0.7, "carbohydrates": 14.0, "fat": 0.2, "saturated_fat": 0.0,
        "fiber": 0.6, "sugar": 12.0, "calcium": 15.0, "iron": 1.2, "potassium": 79.0, "vitamin_c": 18.0
    },
    {
        "name": "Tender Coconut Water / Kobbari Neellu",
        "name_local": "లేత కొబ్బరి నీళ్ళు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "glass",
        "serving_unit_weight_g": 200.0,
        "calories": 19.0, "protein": 0.7, "carbohydrates": 3.7, "fat": 0.2, "saturated_fat": 0.1,
        "fiber": 1.1, "sugar": 2.6, "calcium": 24.0, "iron": 0.3, "magnesium": 25.0, "sodium": 105.0, "potassium": 250.0, "vitamin_c": 2.4
    },
    {
        "name": "Tender Coconut Meat / Malai",
        "name_local": "లేత కొబ్బరి మలై",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 80.0,
        "calories": 140.0, "protein": 1.8, "carbohydrates": 6.0, "fat": 12.0, "saturated_fat": 10.5,
        "fiber": 3.5, "calcium": 12.0, "iron": 0.8, "potassium": 280.0
    },
    {
        "name": "Dates / Kharjooram (Dry/Fresh)",
        "name_local": "ఖర్జూరం",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 10.0,
        "calories": 277.0, "protein": 1.8, "carbohydrates": 75.0, "fat": 0.2, "saturated_fat": 0.0,
        "fiber": 6.7, "sugar": 66.5, "calcium": 64.0, "iron": 1.0, "magnesium": 54.0, "potassium": 696.0
    },
    {
        "name": "Dry Figs / Anjeer",
        "name_local": "అంజీర పండ్లు",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 20.0,
        "calories": 249.0, "protein": 3.3, "carbohydrates": 63.9, "fat": 0.9, "saturated_fat": 0.1,
        "fiber": 9.8, "sugar": 47.9, "calcium": 162.0, "iron": 2.0, "potassium": 680.0
    },
    {
        "name": "Raisins / Kishmish",
        "name_local": "ఎండు ద్రాక్ష / కిస్మిస్",
        "category": "Fruits",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 15.0,
        "calories": 299.0, "protein": 3.1, "carbohydrates": 79.2, "fat": 0.5, "saturated_fat": 0.1,
        "fiber": 3.7, "sugar": 59.2, "calcium": 50.0, "iron": 1.9, "potassium": 749.0
    },

    # ─── 2. VEGETABLES & GREENS ────────────────────────────────────────────────
    {
        "name": "Gongura (Sorrel Leaves, Raw)",
        "name_local": "గోంగూర (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 50.0,
        "calories": 28.0, "protein": 1.8, "carbohydrates": 4.2, "fat": 0.4, "saturated_fat": 0.1,
        "fiber": 2.8, "calcium": 140.0, "iron": 3.5, "potassium": 310.0, "vitamin_c": 20.0
    },
    {
        "name": "Thotakura (Amaranth Leaves, Raw)",
        "name_local": "తోటకూర (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 50.0,
        "calories": 23.0, "protein": 2.5, "carbohydrates": 4.0, "fat": 0.3, "saturated_fat": 0.1,
        "fiber": 2.5, "calcium": 260.0, "iron": 4.0, "potassium": 340.0, "vitamin_c": 43.0
    },
    {
        "name": "Bachali Kura (Malabar Spinach, Raw)",
        "name_local": "బచ్చలికూర (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 50.0,
        "calories": 19.0, "protein": 1.8, "carbohydrates": 3.4, "fat": 0.3, "saturated_fat": 0.1,
        "fiber": 2.1, "calcium": 109.0, "iron": 1.2, "potassium": 510.0, "vitamin_c": 102.0
    },
    {
        "name": "Menthi Kura (Fenugreek Leaves, Raw)",
        "name_local": "మెంతికూర (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 40.0,
        "calories": 49.0, "protein": 4.4, "carbohydrates": 6.0, "fat": 0.9, "saturated_fat": 0.2,
        "fiber": 3.5, "calcium": 395.0, "iron": 1.9, "potassium": 450.0, "vitamin_c": 52.0
    },
    {
        "name": "Curry Leaves / Karivepaku (Fresh)",
        "name_local": "కరివేపాకు",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "sprig",
        "serving_unit_weight_g": 5.0,
        "calories": 108.0, "protein": 6.1, "carbohydrates": 18.7, "fat": 1.0, "saturated_fat": 0.2,
        "fiber": 6.4, "calcium": 830.0, "iron": 0.9, "potassium": 400.0
    },
    {
        "name": "Coriander Leaves / Kothimeera (Fresh)",
        "name_local": "కొత్తిమీర",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "bunch",
        "serving_unit_weight_g": 50.0,
        "calories": 23.0, "protein": 2.1, "carbohydrates": 3.7, "fat": 0.5, "saturated_fat": 0.1,
        "fiber": 2.8, "calcium": 67.0, "iron": 1.8, "potassium": 521.0, "vitamin_c": 27.0
    },
    {
        "name": "Mint Leaves / Pudina (Fresh)",
        "name_local": "పుదీనా",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "bunch",
        "serving_unit_weight_g": 30.0,
        "calories": 44.0, "protein": 3.3, "carbohydrates": 8.4, "fat": 0.7, "saturated_fat": 0.2,
        "fiber": 6.8, "calcium": 200.0, "iron": 5.0, "potassium": 458.0, "vitamin_c": 31.8
    },
    {
        "name": "Ridge Gourd / Beerakaya (Raw)",
        "name_local": "బీరకాయ (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 200.0,
        "calories": 16.0, "protein": 0.7, "carbohydrates": 3.4, "fat": 0.2, "saturated_fat": 0.0,
        "fiber": 0.5, "calcium": 18.0, "iron": 0.4, "potassium": 140.0
    },
    {
        "name": "Snake Gourd / Potlakaya (Raw)",
        "name_local": "పొట్లకాయ (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 150.0,
        "calories": 18.0, "protein": 0.6, "carbohydrates": 3.3, "fat": 0.3, "saturated_fat": 0.0,
        "fiber": 0.6, "calcium": 26.0, "iron": 0.3, "potassium": 130.0
    },
    {
        "name": "Ivy Gourd / Dondakaya / Tindora (Raw)",
        "name_local": "దొండకాయ (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 100.0,
        "calories": 18.0, "protein": 1.2, "carbohydrates": 3.1, "fat": 0.1, "saturated_fat": 0.0,
        "fiber": 1.6, "calcium": 40.0, "iron": 1.4, "potassium": 150.0
    },
    {
        "name": "Ash Gourd / Boodida Gummadikaya (Raw)",
        "name_local": "బూడిద గుమ్మడికాయ (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 13.0, "protein": 0.4, "carbohydrates": 3.0, "fat": 0.2, "saturated_fat": 0.0,
        "fiber": 2.9, "calcium": 30.0, "iron": 0.4, "potassium": 110.0
    },
    {
        "name": "Yellow Pumpkin / Teepi Gummadikaya (Raw)",
        "name_local": "తీపి గుమ్మడికాయ (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 120.0,
        "calories": 26.0, "protein": 1.0, "carbohydrates": 6.5, "fat": 0.1, "saturated_fat": 0.0,
        "fiber": 0.5, "calcium": 21.0, "iron": 0.8, "potassium": 340.0
    },
    {
        "name": "Bitter Gourd / Kakarakaya (Raw)",
        "name_local": "కాకరకాయ (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 100.0,
        "calories": 17.0, "protein": 1.0, "carbohydrates": 3.7, "fat": 0.2, "saturated_fat": 0.0,
        "fiber": 2.8, "calcium": 19.0, "iron": 0.4, "potassium": 296.0, "vitamin_c": 84.0
    },
    {
        "name": "Drumstick / Mulakkada (Raw)",
        "name_local": "మునగకాయ (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 50.0,
        "calories": 37.0, "protein": 2.1, "carbohydrates": 8.5, "fat": 0.2, "saturated_fat": 0.0,
        "fiber": 3.2, "calcium": 30.0, "iron": 0.4, "potassium": 259.0, "vitamin_c": 120.0
    },
    {
        "name": "Moringa Leaves / Munagaku (Raw)",
        "name_local": "మునగాకు (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 40.0,
        "calories": 64.0, "protein": 9.4, "carbohydrates": 8.3, "fat": 1.4, "saturated_fat": 0.3,
        "fiber": 2.0, "calcium": 440.0, "iron": 4.0, "potassium": 337.0, "vitamin_c": 51.7
    },
    {
        "name": "Raw Banana / Aratikaya (Raw)",
        "name_local": "అరటికాయ (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 150.0,
        "calories": 89.0, "protein": 1.1, "carbohydrates": 22.8, "fat": 0.3, "saturated_fat": 0.1,
        "fiber": 2.6, "calcium": 5.0, "iron": 0.3, "potassium": 358.0
    },
    {
        "name": "Raw Mango / Pachi Mamidikaya (Raw)",
        "name_local": "పచ్చి మామిడికాయ",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 150.0,
        "calories": 60.0, "protein": 0.8, "carbohydrates": 15.0, "fat": 0.4, "saturated_fat": 0.1,
        "fiber": 2.5, "calcium": 14.0, "iron": 0.2, "potassium": 160.0, "vitamin_c": 40.0
    },
    {
        "name": "Colocasia / Taro Root / Chamagadda (Raw)",
        "name_local": "చామగడ్డ (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 80.0,
        "calories": 112.0, "protein": 1.5, "carbohydrates": 26.5, "fat": 0.2, "saturated_fat": 0.0,
        "fiber": 4.1, "calcium": 43.0, "iron": 0.6, "potassium": 591.0
    },
    {
        "name": "Sweet Potato / Chilagada Dhumpa (Raw)",
        "name_local": "చిలగడదుంప (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 130.0,
        "calories": 86.0, "protein": 1.6, "carbohydrates": 20.1, "fat": 0.1, "saturated_fat": 0.0,
        "fiber": 3.0, "calcium": 30.0, "iron": 0.6, "potassium": 337.0
    },
    {
        "name": "Radish / Mullangi (Raw)",
        "name_local": "ముల్లంగి (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 100.0,
        "calories": 16.0, "protein": 0.7, "carbohydrates": 3.4, "fat": 0.1, "saturated_fat": 0.0,
        "fiber": 1.6, "calcium": 25.0, "iron": 0.3, "potassium": 233.0, "vitamin_c": 14.8
    },
    {
        "name": "Green Peas / Batani (Fresh Raw)",
        "name_local": "పచ్చి బఠాణీలు",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 140.0,
        "calories": 81.0, "protein": 5.4, "carbohydrates": 14.5, "fat": 0.4, "saturated_fat": 0.1,
        "fiber": 5.7, "calcium": 25.0, "iron": 1.5, "potassium": 244.0, "vitamin_c": 40.0
    },
    {
        "name": "Green Chilies / Pachi Mirapakayalu",
        "name_local": "పచ్చి మిరపకాయలు",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 5.0,
        "calories": 40.0, "protein": 1.9, "carbohydrates": 8.8, "fat": 0.4, "saturated_fat": 0.1,
        "fiber": 1.5, "calcium": 14.0, "iron": 1.0, "potassium": 322.0, "vitamin_c": 242.0
    },
    {
        "name": "Ginger / Allam (Fresh Raw)",
        "name_local": "అల్లం (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "inch",
        "serving_unit_weight_g": 10.0,
        "calories": 80.0, "protein": 1.8, "carbohydrates": 17.8, "fat": 0.8, "saturated_fat": 0.2,
        "fiber": 2.0, "calcium": 16.0, "iron": 0.6, "potassium": 415.0, "vitamin_c": 5.0
    },
    {
        "name": "Garlic / Vellulli (Fresh Raw)",
        "name_local": "వెల్లుల్లి (పచ్చిది)",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "clove",
        "serving_unit_weight_g": 3.0,
        "calories": 149.0, "protein": 6.4, "carbohydrates": 33.1, "fat": 0.5, "saturated_fat": 0.1,
        "fiber": 2.1, "calcium": 181.0, "iron": 1.7, "potassium": 401.0, "vitamin_c": 31.2
    },
    {
        "name": "Lemon / Nimma Kaya (Fresh)",
        "name_local": "నిమ్మకాయ",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 50.0,
        "calories": 29.0, "protein": 1.1, "carbohydrates": 9.3, "fat": 0.3, "saturated_fat": 0.0,
        "fiber": 2.8, "calcium": 26.0, "iron": 0.6, "potassium": 138.0, "vitamin_c": 53.0
    },

    # ─── 3. GRAINS, MILLETS & FLOURS ──────────────────────────────────────────
    {
        "name": "Sona Masoori Raw Rice (Dry)",
        "name_local": "సోనా మసూరి బియ్యం",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 180.0,
        "calories": 356.0, "protein": 6.8, "carbohydrates": 79.5, "fat": 0.5, "saturated_fat": 0.1,
        "fiber": 1.3, "calcium": 10.0, "iron": 0.8, "potassium": 115.0
    },
    {
        "name": "Ragi / Finger Millet (Grain/Flour)",
        "name_local": "రాగులు / రాగి పిండి",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 120.0,
        "calories": 328.0, "protein": 7.3, "carbohydrates": 72.0, "fat": 1.3, "saturated_fat": 0.3,
        "fiber": 11.5, "calcium": 344.0, "iron": 3.9, "potassium": 408.0, "magnesium": 137.0
    },
    {
        "name": "Ragi Mudde / Ragi Sankati",
        "name_local": "రాగి ముద్ద / రాగి సంగటి",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 200.0,
        "calories": 90.0, "protein": 2.3, "carbohydrates": 19.0, "fat": 0.5, "saturated_fat": 0.1,
        "fiber": 3.0, "calcium": 110.0, "iron": 1.2, "potassium": 130.0
    },
    {
        "name": "Ragi Malt / Ragi Java (with Buttermilk)",
        "name_local": "రాగి జావ (మజ్జిగతో)",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "glass",
        "serving_unit_weight_g": 250.0,
        "calories": 38.0, "protein": 1.3, "carbohydrates": 7.2, "fat": 0.5, "saturated_fat": 0.2,
        "fiber": 1.2, "calcium": 60.0, "iron": 0.5, "potassium": 80.0
    },
    {
        "name": "Jowar / Jonnalu (Grain/Flour)",
        "name_local": "జొన్నలు / జొన్న పిండి",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 120.0,
        "calories": 349.0, "protein": 10.4, "carbohydrates": 72.6, "fat": 1.9, "saturated_fat": 0.5,
        "fiber": 9.7, "calcium": 25.0, "iron": 4.1, "potassium": 350.0
    },
    {
        "name": "Jowar Roti / Jonna Rotte",
        "name_local": "జొన్న రొట్టె",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 50.0,
        "calories": 270.0, "protein": 8.0, "carbohydrates": 56.0, "fat": 1.6, "saturated_fat": 0.4,
        "fiber": 7.5, "calcium": 20.0, "iron": 3.0, "potassium": 280.0
    },
    {
        "name": "Bajra / Sajjalu (Grain/Flour)",
        "name_local": "సజ్జలు / సజ్జ పిండి",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 120.0,
        "calories": 361.0, "protein": 11.6, "carbohydrates": 67.5, "fat": 5.0, "saturated_fat": 0.9,
        "fiber": 11.5, "calcium": 42.0, "iron": 8.0, "potassium": 390.0, "magnesium": 137.0
    },
    {
        "name": "Bajra Roti / Sajja Rotte",
        "name_local": "సజ్జ రొట్టె",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 50.0,
        "calories": 280.0, "protein": 9.0, "carbohydrates": 52.0, "fat": 4.0, "saturated_fat": 0.8,
        "fiber": 9.0, "calcium": 32.0, "iron": 6.2, "potassium": 300.0
    },
    {
        "name": "Foxtail Millet / Korralu (Grain)",
        "name_local": "కొర్రలు (పచ్చివి)",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 351.0, "protein": 12.3, "carbohydrates": 60.1, "fat": 4.3, "saturated_fat": 0.8,
        "fiber": 8.0, "calcium": 31.0, "iron": 2.8, "potassium": 250.0
    },
    {
        "name": "Foxtail Millet Cooked / Korra Annam",
        "name_local": "కొర్ర అన్నం",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 93.0, "protein": 3.2, "carbohydrates": 17.3, "fat": 1.2, "saturated_fat": 0.2,
        "fiber": 2.1, "calcium": 10.0, "iron": 0.9, "potassium": 80.0
    },
    {
        "name": "Little Millet / Samalu (Grain)",
        "name_local": "సామలు",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 341.0, "protein": 7.7, "carbohydrates": 67.0, "fat": 4.7, "saturated_fat": 0.8,
        "fiber": 7.6, "calcium": 17.0, "iron": 9.3, "potassium": 129.0
    },
    {
        "name": "Barnyard Millet / Udalu",
        "name_local": "ఊదలు",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 307.0, "protein": 6.2, "carbohydrates": 65.5, "fat": 2.2, "saturated_fat": 0.4,
        "fiber": 9.8, "calcium": 20.0, "iron": 5.0, "potassium": 200.0
    },
    {
        "name": "Wheat Atta (Whole Wheat Flour)",
        "name_local": "గోధుమ పిండి",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 120.0,
        "calories": 340.0, "protein": 12.1, "carbohydrates": 71.2, "fat": 1.7, "saturated_fat": 0.3,
        "fiber": 10.7, "calcium": 34.0, "iron": 3.9, "potassium": 363.0
    },
    {
        "name": "Suji / Bombay Rava (Semolina)",
        "name_local": "బొంబాయి రవ్వ",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 160.0,
        "calories": 360.0, "protein": 12.7, "carbohydrates": 72.8, "fat": 1.0, "saturated_fat": 0.2,
        "fiber": 3.9, "calcium": 17.0, "iron": 1.2, "potassium": 186.0
    },
    {
        "name": "Idly Rava / Rice Rava",
        "name_local": "ఇడ్లీ రవ్వ",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 160.0,
        "calories": 350.0, "protein": 6.5, "carbohydrates": 78.0, "fat": 0.6, "saturated_fat": 0.1,
        "fiber": 1.4, "calcium": 10.0, "iron": 0.8, "potassium": 110.0
    },
    {
        "name": "Murmura / Borugulu / Puffed Rice",
        "name_local": "మరమరాలు / బొరుగులు",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 20.0,
        "calories": 383.0, "protein": 6.5, "carbohydrates": 87.0, "fat": 0.5, "saturated_fat": 0.1,
        "fiber": 1.5, "calcium": 12.0, "iron": 6.0, "sodium": 150.0
    },
    {
        "name": "Besan / Senaga Pindi (Gram Flour)",
        "name_local": "శనగపిండి",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 100.0,
        "calories": 387.0, "protein": 22.4, "carbohydrates": 57.8, "fat": 6.7, "saturated_fat": 0.7,
        "fiber": 10.8, "calcium": 45.0, "iron": 4.9, "potassium": 846.0, "magnesium": 133.0
    },
    {
        "name": "Sabudana / Saggubiyyam (Tapioca)",
        "name_local": "సగ్గుబియ్యం",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 358.0, "protein": 0.2, "carbohydrates": 88.7, "fat": 0.2, "saturated_fat": 0.0,
        "fiber": 0.9, "calcium": 20.0, "iron": 1.5, "potassium": 11.0
    },

    # ─── 4. DALS, PULSES & LEGUMES ─────────────────────────────────────────────
    {
        "name": "Toor Dal / Kandi Pappu (Raw / Dry)",
        "name_local": "కందిపప్పు (పచ్చిది)",
        "category": "Legumes & Pulses",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 343.0, "protein": 22.3, "carbohydrates": 60.4, "fat": 1.7, "saturated_fat": 0.3,
        "fiber": 15.0, "calcium": 73.0, "iron": 5.1, "potassium": 1392.0, "magnesium": 183.0
    },
    {
        "name": "Cooked Toor Dal / Plain Kandi Pappu",
        "name_local": "ఉడికించిన కందిపప్పు",
        "category": "Legumes & Pulses",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 110.0, "protein": 7.2, "carbohydrates": 19.3, "fat": 0.5, "saturated_fat": 0.1,
        "fiber": 4.8, "calcium": 24.0, "iron": 1.6, "potassium": 450.0
    },
    {
        "name": "Moong Dal / Pesara Pappu (Raw / Dry)",
        "name_local": "పెసరపప్పు (పచ్చిది)",
        "category": "Legumes & Pulses",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 347.0, "protein": 24.5, "carbohydrates": 59.9, "fat": 1.2, "saturated_fat": 0.3,
        "fiber": 16.3, "calcium": 75.0, "iron": 3.9, "potassium": 1246.0, "magnesium": 127.0
    },
    {
        "name": "Cooked Moong Dal / Plain Pesara Pappu",
        "name_local": "ఉడికించిన పెసరపప్పు",
        "category": "Legumes & Pulses",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 105.0, "protein": 7.5, "carbohydrates": 18.5, "fat": 0.4, "saturated_fat": 0.1,
        "fiber": 5.0, "calcium": 25.0, "iron": 1.3, "potassium": 410.0
    },
    {
        "name": "Whole Green Moong / Pesalu (Raw)",
        "name_local": "పెసలు (పచ్చివి)",
        "category": "Legumes & Pulses",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 334.0, "protein": 24.0, "carbohydrates": 56.7, "fat": 1.3, "saturated_fat": 0.3,
        "fiber": 16.3, "calcium": 132.0, "iron": 4.8, "potassium": 1250.0
    },
    {
        "name": "Moong Sprouts (Raw)",
        "name_local": "మొలకెత్తిన పెసలు (పచ్చివి)",
        "category": "Legumes & Pulses",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 100.0,
        "calories": 30.0, "protein": 3.0, "carbohydrates": 5.9, "fat": 0.2, "saturated_fat": 0.0,
        "fiber": 1.8, "calcium": 13.0, "iron": 0.9, "potassium": 149.0, "vitamin_c": 13.2
    },
    {
        "name": "Chana Dal / Senaga Pappu (Raw)",
        "name_local": "శనగపప్పు (పచ్చిది)",
        "category": "Legumes & Pulses",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 372.0, "protein": 20.8, "carbohydrates": 59.8, "fat": 5.6, "saturated_fat": 0.6,
        "fiber": 18.3, "calcium": 56.0, "iron": 5.3, "potassium": 800.0
    },
    {
        "name": "Urad Dal / Minapa Pappu (Split Raw)",
        "name_local": "మినపపప్పు (పచ్చిది)",
        "category": "Legumes & Pulses",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 347.0, "protein": 24.0, "carbohydrates": 58.9, "fat": 1.4, "saturated_fat": 0.3,
        "fiber": 18.3, "calcium": 154.0, "iron": 7.6, "potassium": 983.0
    },
    {
        "name": "Horsegram / Ulavalu (Raw / Dry)",
        "name_local": "ఉలవలు (పచ్చివి)",
        "category": "Legumes & Pulses",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 321.0, "protein": 22.0, "carbohydrates": 57.2, "fat": 0.5, "saturated_fat": 0.1,
        "fiber": 5.3, "calcium": 287.0, "iron": 6.8, "potassium": 1100.0
    },
    {
        "name": "Ulavacharu (Horsegram Stew)",
        "name_local": "ఉలవచారు",
        "category": "Legumes & Pulses",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 60.0, "protein": 3.2, "carbohydrates": 9.0, "fat": 1.2, "saturated_fat": 0.2,
        "fiber": 1.5, "calcium": 50.0, "iron": 1.5, "potassium": 180.0
    },
    {
        "name": "Cowpeas / Alasandalu / Lobia (Raw)",
        "name_local": "అలసందలు (పచ్చివి)",
        "category": "Legumes & Pulses",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 180.0,
        "calories": 336.0, "protein": 23.5, "carbohydrates": 60.0, "fat": 1.3, "saturated_fat": 0.3,
        "fiber": 10.6, "calcium": 110.0, "iron": 8.3, "potassium": 1112.0
    },
    {
        "name": "Alasanda Vada (Lobia Vada)",
        "name_local": "అలసంద వడ",
        "category": "Snacks",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 40.0,
        "calories": 300.0, "protein": 10.0, "carbohydrates": 30.0, "fat": 16.0, "saturated_fat": 2.5,
        "fiber": 5.0, "sodium": 320.0
    },
    {
        "name": "MLA Pesarattu (with Upma filling)",
        "name_local": "ఉప్మా పెసరట్టు (MLA పెసరట్టు)",
        "category": "Breakfast",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 160.0,
        "calories": 210.0, "protein": 7.2, "carbohydrates": 28.5, "fat": 7.5, "saturated_fat": 1.8,
        "fiber": 3.8, "sodium": 280.0
    },

    # ─── 5. SPICES, CONDIMENTS & COOKING OILS ──────────────────────────────────
    {
        "name": "Turmeric Powder / Pasupu",
        "name_local": "పసుపు",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tsp",
        "serving_unit_weight_g": 3.0,
        "calories": 354.0, "protein": 7.8, "carbohydrates": 64.9, "fat": 9.9, "saturated_fat": 3.1,
        "fiber": 21.1, "iron": 41.4, "potassium": 2525.0
    },
    {
        "name": "Red Chili Powder / Karam Podi",
        "name_local": "కారం పొడి",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tsp",
        "serving_unit_weight_g": 3.0,
        "calories": 282.0, "protein": 12.0, "carbohydrates": 56.6, "fat": 14.3, "saturated_fat": 2.1,
        "fiber": 34.8, "iron": 17.3, "potassium": 1950.0
    },
    {
        "name": "Cumin Seeds / Jeera",
        "name_local": "జీలకర్ర",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tsp",
        "serving_unit_weight_g": 3.0,
        "calories": 375.0, "protein": 17.8, "carbohydrates": 44.2, "fat": 22.3, "saturated_fat": 1.5,
        "fiber": 10.5, "calcium": 931.0, "iron": 66.4, "potassium": 1788.0
    },
    {
        "name": "Mustard Seeds / Aavalu",
        "name_local": "ఆవాలు",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tsp",
        "serving_unit_weight_g": 3.0,
        "calories": 508.0, "protein": 26.1, "carbohydrates": 28.1, "fat": 36.2, "saturated_fat": 2.0,
        "fiber": 12.2, "calcium": 266.0, "iron": 9.2, "potassium": 738.0
    },
    {
        "name": "Fenugreek Seeds / Menthulu",
        "name_local": "మెంతులు",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tsp",
        "serving_unit_weight_g": 3.0,
        "calories": 323.0, "protein": 23.0, "carbohydrates": 58.3, "fat": 6.4, "saturated_fat": 1.5,
        "fiber": 24.6, "calcium": 176.0, "iron": 33.5, "potassium": 770.0
    },
    {
        "name": "Coriander Seeds / Dhaniyalu",
        "name_local": "ధనియాలు",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 6.0,
        "calories": 298.0, "protein": 12.4, "carbohydrates": 54.9, "fat": 17.8, "saturated_fat": 1.0,
        "fiber": 41.9, "calcium": 709.0, "iron": 16.3, "potassium": 1267.0
    },
    {
        "name": "Black Pepper / Miriyalu",
        "name_local": "మిరియాలు",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tsp",
        "serving_unit_weight_g": 3.0,
        "calories": 251.0, "protein": 10.4, "carbohydrates": 64.0, "fat": 3.3, "saturated_fat": 1.4,
        "fiber": 25.3, "calcium": 443.0, "iron": 9.7, "potassium": 1329.0
    },
    {
        "name": "Tamarind Pulp / Chintha Pandu",
        "name_local": "చింతపండు గుజ్జు",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 15.0,
        "calories": 239.0, "protein": 2.8, "carbohydrates": 62.5, "fat": 0.6, "saturated_fat": 0.1,
        "fiber": 5.1, "calcium": 74.0, "iron": 2.8, "potassium": 628.0
    },
    {
        "name": "Groundnut Oil / Verusenaga Nune",
        "name_local": "వేరుశనగ నూనె",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 14.0,
        "calories": 884.0, "protein": 0.0, "carbohydrates": 0.0, "fat": 100.0, "saturated_fat": 17.0
    },
    {
        "name": "Sesame Oil / Nuvvula Nune",
        "name_local": "నువ్వుల నూనె",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 14.0,
        "calories": 884.0, "protein": 0.0, "carbohydrates": 0.0, "fat": 100.0, "saturated_fat": 14.2
    },
    {
        "name": "Coconut Oil / Kobbari Nune",
        "name_local": "కొబ్బరి నూనె",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 14.0,
        "calories": 862.0, "protein": 0.0, "carbohydrates": 0.0, "fat": 100.0, "saturated_fat": 87.0
    },
    {
        "name": "Kandi Podi (Gunpowder / Paruppu Podi)",
        "name_local": "కంది పొడి",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 15.0,
        "calories": 380.0, "protein": 20.0, "carbohydrates": 55.0, "fat": 8.0, "saturated_fat": 1.2,
        "fiber": 12.0, "iron": 5.0, "sodium": 600.0
    },
    {
        "name": "Nalla Karam Podi",
        "name_local": "నల్ల కారం పొడి",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 15.0,
        "calories": 360.0, "protein": 16.0, "carbohydrates": 50.0, "fat": 10.0, "saturated_fat": 1.5,
        "fiber": 14.0, "iron": 7.0, "sodium": 750.0
    },
    {
        "name": "Karivepaku Podi (Curry Leaves Podi)",
        "name_local": "కరివేపాకు పొడి",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 15.0,
        "calories": 340.0, "protein": 15.0, "carbohydrates": 48.0, "fat": 9.0, "saturated_fat": 1.2,
        "fiber": 15.0, "calcium": 420.0, "iron": 6.0, "sodium": 650.0
    },
    {
        "name": "Avakaya Pachadi (Andhra Mango Pickle)",
        "name_local": "ఆవకాయ పచ్చడి",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 20.0,
        "calories": 210.0, "protein": 3.0, "carbohydrates": 12.0, "fat": 16.0, "saturated_fat": 2.5,
        "fiber": 3.0, "sodium": 2800.0
    },
    {
        "name": "Tomato Nilva Pachadi (Tomato Pickle)",
        "name_local": "టమాటో నిల్వ పచ్చడి",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 20.0,
        "calories": 180.0, "protein": 2.5, "carbohydrates": 14.0, "fat": 12.0, "saturated_fat": 2.0,
        "fiber": 2.5, "sodium": 2400.0
    },
    {
        "name": "Gongura Nilva Pachadi (Andhra Pickle)",
        "name_local": "గోంగూర నిల్వ పచ్చడి",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 20.0,
        "calories": 175.0, "protein": 3.0, "carbohydrates": 10.0, "fat": 13.0, "saturated_fat": 2.1,
        "fiber": 3.5, "iron": 3.0, "sodium": 2300.0
    },
    {
        "name": "Allam Pachadi (Ginger Chutney)",
        "name_local": "అల్లం పచ్చడి",
        "category": "Spices & Condiments",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 20.0,
        "calories": 190.0, "protein": 2.0, "carbohydrates": 22.0, "fat": 10.0, "saturated_fat": 1.5,
        "fiber": 2.0, "sodium": 1800.0
    },

    # ─── 6. NUTS & OILSEEDS ───────────────────────────────────────────────────
    {
        "name": "Cashew Nuts / Jeedipappu (Raw)",
        "name_local": "జీడిపప్పు (పచ్చిది)",
        "category": "Seeds & Nuts",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 1.5,
        "calories": 553.0, "protein": 18.2, "carbohydrates": 30.2, "fat": 43.8, "saturated_fat": 7.8,
        "fiber": 3.3, "calcium": 37.0, "iron": 6.7, "magnesium": 292.0, "potassium": 660.0, "zinc": 5.8
    },
    {
        "name": "Roasted Cashew Nuts (Ghee Roasted)",
        "name_local": "జీడిపప్పు (నేతిలో వేయించినది)",
        "category": "Seeds & Nuts",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 1.5,
        "calories": 580.0, "protein": 17.5, "carbohydrates": 29.0, "fat": 47.0, "saturated_fat": 10.0,
        "fiber": 3.0, "calcium": 35.0, "iron": 6.2, "magnesium": 280.0, "potassium": 640.0
    },
    {
        "name": "Peanuts / Groundnuts (Raw)",
        "name_local": "వేరుశనగ గుళ్ళు (పచ్చివి)",
        "category": "Seeds & Nuts",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "handful",
        "serving_unit_weight_g": 30.0,
        "calories": 567.0, "protein": 25.8, "carbohydrates": 16.1, "fat": 49.2, "saturated_fat": 6.8,
        "fiber": 8.5, "calcium": 92.0, "iron": 4.6, "magnesium": 168.0, "potassium": 705.0, "zinc": 3.3
    },
    {
        "name": "Roasted Peanuts / Verusenaga Pappu",
        "name_local": "వేయించిన పల్లీలు",
        "category": "Seeds & Nuts",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "handful",
        "serving_unit_weight_g": 30.0,
        "calories": 585.0, "protein": 26.0, "carbohydrates": 15.0, "fat": 50.0, "saturated_fat": 7.0,
        "fiber": 8.0, "calcium": 90.0, "iron": 4.2, "magnesium": 170.0, "potassium": 680.0
    },
    {
        "name": "Putnala Pappu / Dalia (Roasted Bengal Gram)",
        "name_local": "పుట్నాల పప్పు",
        "category": "Seeds & Nuts",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "handful",
        "serving_unit_weight_g": 30.0,
        "calories": 369.0, "protein": 22.5, "carbohydrates": 58.0, "fat": 5.2, "saturated_fat": 0.8,
        "fiber": 11.0, "calcium": 58.0, "iron": 9.5, "potassium": 820.0
    },
    {
        "name": "Walnuts / Akhrot",
        "name_local": "ఆక్రోట్ కాయలు",
        "category": "Seeds & Nuts",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 4.0,
        "calories": 654.0, "protein": 15.2, "carbohydrates": 13.7, "fat": 65.2, "saturated_fat": 6.1,
        "fiber": 6.7, "calcium": 98.0, "iron": 2.9, "magnesium": 158.0, "potassium": 441.0, "zinc": 3.1
    },
    {
        "name": "Pistachios / Pista (Raw Unsalted)",
        "name_local": "పిస్తా పప్పు",
        "category": "Seeds & Nuts",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 1.0,
        "calories": 562.0, "protein": 20.2, "carbohydrates": 27.5, "fat": 45.3, "saturated_fat": 5.9,
        "fiber": 10.6, "calcium": 105.0, "iron": 3.9, "magnesium": 121.0, "potassium": 1025.0, "zinc": 2.2
    },
    {
        "name": "Sesame Seeds (White / Nuvvulu)",
        "name_local": "తెల్ల నువ్వులు",
        "category": "Seeds & Nuts",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 10.0,
        "calories": 573.0, "protein": 17.7, "carbohydrates": 23.4, "fat": 49.7, "saturated_fat": 7.0,
        "fiber": 11.8, "calcium": 975.0, "iron": 14.6, "magnesium": 351.0, "potassium": 468.0, "zinc": 7.8
    },
    {
        "name": "Black Sesame Seeds / Nalla Nuvvulu",
        "name_local": "నల్ల నువ్వులు",
        "category": "Seeds & Nuts",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 10.0,
        "calories": 565.0, "protein": 18.0, "carbohydrates": 23.0, "fat": 49.0, "saturated_fat": 6.8,
        "fiber": 12.0, "calcium": 1150.0, "iron": 16.0, "magnesium": 360.0, "potassium": 480.0, "zinc": 8.2
    },
    {
        "name": "Dry Coconut Copra / Endu Kobbari",
        "name_local": "ఎండు కొబ్బరి",
        "category": "Seeds & Nuts",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 20.0,
        "calories": 660.0, "protein": 6.9, "carbohydrates": 23.7, "fat": 64.5, "saturated_fat": 57.2,
        "fiber": 16.3, "calcium": 26.0, "iron": 3.3, "potassium": 543.0
    },
    {
        "name": "Fresh Grated Coconut / Pachi Kobbari",
        "name_local": "పచ్చి కొబ్బరి తురుము",
        "category": "Seeds & Nuts",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "tbsp",
        "serving_unit_weight_g": 10.0,
        "calories": 354.0, "protein": 3.3, "carbohydrates": 15.2, "fat": 33.5, "saturated_fat": 29.7,
        "fiber": 9.0, "calcium": 14.0, "iron": 2.4, "potassium": 356.0
    },

    # ─── 7. DAIRY & SOUTH INDIAN BEVERAGES ───────────────────────────────────
    {
        "name": "Cow Milk (Whole / Full Cream)",
        "name_local": "ఆవు పాలు",
        "category": "Dairy",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "glass",
        "serving_unit_weight_g": 200.0,
        "calories": 62.0, "protein": 3.2, "carbohydrates": 4.8, "fat": 3.5, "saturated_fat": 2.2,
        "calcium": 120.0, "potassium": 150.0, "sodium": 44.0
    },
    {
        "name": "Buffalo Milk (Full Cream / Desi)",
        "name_local": "గేదె పాలు",
        "category": "Dairy",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "glass",
        "serving_unit_weight_g": 200.0,
        "calories": 100.0, "protein": 4.2, "carbohydrates": 5.2, "fat": 7.0, "saturated_fat": 4.5,
        "calcium": 180.0, "potassium": 178.0, "sodium": 52.0
    },
    {
        "name": "South Indian Filter Coffee (with Milk & Sugar)",
        "name_local": "ఫిల్టర్ కాఫీ (పాల పంచదారతో)",
        "category": "Beverage",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 57.0, "protein": 1.9, "carbohydrates": 7.3, "fat": 2.1, "saturated_fat": 1.3,
        "calcium": 70.0, "potassium": 120.0
    },
    {
        "name": "South Indian Filter Coffee (Black / Decoction)",
        "name_local": "డికాక్షన్ కాఫీ (బ్లాక్ కాఫీ)",
        "category": "Beverage",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 100.0,
        "calories": 4.0, "protein": 0.3, "carbohydrates": 0.5, "fat": 0.0, "saturated_fat": 0.0,
        "potassium": 80.0
    },
    {
        "name": "Masala Chai / Ginger Tea (with Milk & Sugar)",
        "name_local": "టీ / అల్లం టీ",
        "category": "Beverage",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 53.0, "protein": 1.7, "carbohydrates": 7.7, "fat": 1.9, "saturated_fat": 1.2,
        "calcium": 60.0
    },

    # ─── 8. POPULAR ANDHRA & SOUTH INDIAN DISHES ─────────────────────────────
    {
        "name": "Gutti Vankaya Kura (Stuffed Brinjal Curry)",
        "name_local": "గుత్తి వంకాయ కూర",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 107.0, "protein": 2.1, "carbohydrates": 8.0, "fat": 7.3, "saturated_fat": 1.2,
        "fiber": 3.0, "calcium": 30.0, "iron": 0.8, "potassium": 210.0
    },
    {
        "name": "Bendakaya Pulusu (Okra Tangy Stew)",
        "name_local": "బెండకాయ పులుసు",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 55.0, "protein": 1.3, "carbohydrates": 8.0, "fat": 2.0, "saturated_fat": 0.3,
        "fiber": 1.9, "calcium": 45.0, "iron": 0.5, "potassium": 160.0
    },
    {
        "name": "Sorakaya Pappu (Bottle Gourd Dal)",
        "name_local": "సొరకాయ పప్పు",
        "category": "Dal",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 78.0, "protein": 4.3, "carbohydrates": 11.0, "fat": 1.8, "saturated_fat": 0.3,
        "fiber": 2.5, "calcium": 35.0, "iron": 1.2, "potassium": 220.0
    },
    {
        "name": "Dosakaya Pappu (Yellow Cucumber Dal)",
        "name_local": "దోసకాయ పప్పు",
        "category": "Dal",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 80.0, "protein": 4.5, "carbohydrates": 11.5, "fat": 1.8, "saturated_fat": 0.3,
        "fiber": 2.8, "calcium": 38.0, "iron": 1.3, "potassium": 230.0
    },
    {
        "name": "Thotakura Pappu (Amaranth Leaves Dal)",
        "name_local": "తోటకూర పప్పు",
        "category": "Dal",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 83.0, "protein": 4.8, "carbohydrates": 11.0, "fat": 1.9, "saturated_fat": 0.3,
        "fiber": 3.0, "calcium": 90.0, "iron": 2.2, "potassium": 250.0
    },
    {
        "name": "Gongura Mutton Curry (Andhra Style)",
        "name_local": "గోంగూర మటన్ కూర",
        "category": "Meat & Poultry",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 130.0, "protein": 11.0, "carbohydrates": 3.0, "fat": 8.3, "saturated_fat": 3.2,
        "fiber": 1.5, "iron": 2.2, "potassium": 280.0, "sodium": 360.0
    },
    {
        "name": "Gongura Chicken Curry (Andhra Style)",
        "name_local": "గోంగూర చికెన్ కూర",
        "category": "Meat & Poultry",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 110.0, "protein": 12.0, "carbohydrates": 2.8, "fat": 5.8, "saturated_fat": 1.6,
        "fiber": 1.4, "iron": 1.8, "potassium": 250.0, "sodium": 340.0
    },
    {
        "name": "Royyala Iguru (Andhra Prawn Masala)",
        "name_local": "రొయ్యల ఇగురు",
        "category": "Fish & Seafood",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 98.0, "protein": 11.3, "carbohydrates": 3.5, "fat": 4.3, "saturated_fat": 0.8,
        "calcium": 45.0, "iron": 1.4, "sodium": 380.0
    },
    {
        "name": "Chepala Pulusu (Nellore Fish Curry)",
        "name_local": "నెల్లూరు చేపల పులుసు",
        "category": "Fish & Seafood",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 83.0, "protein": 9.8, "carbohydrates": 3.3, "fat": 3.3, "saturated_fat": 0.7,
        "calcium": 35.0, "iron": 1.1, "potassium": 240.0, "sodium": 350.0
    },
    {
        "name": "Natu Kodi Pulusu (Country Chicken Curry)",
        "name_local": "నాటు కోడి పులుసు",
        "category": "Meat & Poultry",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 120.0, "protein": 12.5, "carbohydrates": 2.5, "fat": 6.5, "saturated_fat": 1.8,
        "iron": 1.5, "potassium": 240.0, "sodium": 360.0
    },
    {
        "name": "Egg Pulusu (Boiled Egg in Tangy Curry)",
        "name_local": "కోడిగుడ్డు పులుసు",
        "category": "Meat & Poultry",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "serving",
        "serving_unit_weight_g": 150.0,
        "calories": 103.0, "protein": 5.7, "carbohydrates": 7.3, "fat": 5.7, "saturated_fat": 1.6,
        "iron": 1.2, "calcium": 38.0, "sodium": 340.0
    },
    {
        "name": "Aratikaya Vepudu (Raw Banana Fry)",
        "name_local": "అరటికాయ వేపుడు",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 120.0,
        "calories": 133.0, "protein": 1.7, "carbohydrates": 18.3, "fat": 6.3, "saturated_fat": 1.0,
        "fiber": 2.7, "potassium": 280.0
    },
    {
        "name": "Dondakaya Vepudu (Ivy Gourd Fry)",
        "name_local": "దొండకాయ వేపుడు",
        "category": "Vegetables",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 120.0,
        "calories": 113.0, "protein": 1.8, "carbohydrates": 8.3, "fat": 7.9, "saturated_fat": 1.2,
        "fiber": 2.5, "calcium": 35.0, "iron": 1.2
    },
    {
        "name": "Miriyala Chaaru / Pepper Rasam",
        "name_local": "మిరియాల చారు",
        "category": "Dal",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 200.0,
        "calories": 23.0, "protein": 0.6, "carbohydrates": 3.8, "fat": 0.6, "saturated_fat": 0.1,
        "potassium": 90.0, "sodium": 280.0
    },
    {
        "name": "Atukula Upma / Poha (South Indian Style)",
        "name_local": "అటుకుల ఉప్మా",
        "category": "Breakfast",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 140.0, "protein": 3.0, "carbohydrates": 23.3, "fat": 4.0, "saturated_fat": 0.8,
        "fiber": 1.7, "iron": 4.5
    },
    {
        "name": "Semiya Upma (Vermicelli Upma)",
        "name_local": "సేమియా ఉప్మా",
        "category": "Breakfast",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 180.0,
        "calories": 128.0, "protein": 2.7, "carbohydrates": 21.1, "fat": 3.6, "saturated_fat": 0.8,
        "fiber": 1.1
    },
    {
        "name": "Chitti Garelu (Mini Medu Vadas)",
        "name_local": "చిట్టి గారెలు",
        "category": "Breakfast",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 20.0,
        "calories": 300.0, "protein": 8.8, "carbohydrates": 25.0, "fat": 18.1, "saturated_fat": 2.8,
        "fiber": 3.0, "sodium": 380.0
    },
    {
        "name": "Chekkalu / Pappu Chekkalu (Rice Crackers)",
        "name_local": "చెక్కలు / పప్పు చెక్కలు",
        "category": "Snacks",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 10.0,
        "calories": 517.0, "protein": 8.3, "carbohydrates": 60.0, "fat": 26.7, "saturated_fat": 5.0,
        "fiber": 2.5, "sodium": 420.0
    },
    {
        "name": "Sunnundalu (Urad Dal Ladoo with Ghee)",
        "name_local": "సున్నుండలు",
        "category": "Snacks",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 40.0,
        "calories": 488.0, "protein": 13.0, "carbohydrates": 60.0, "fat": 22.0, "saturated_fat": 13.5,
        "calcium": 80.0, "iron": 3.5
    },
    {
        "name": "Bobbatlu / Bakshalu / Puran Poli",
        "name_local": "బొబ్బట్లు / భక్షాలు",
        "category": "Snacks",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "piece",
        "serving_unit_weight_g": 70.0,
        "calories": 371.0, "protein": 7.9, "carbohydrates": 62.9, "fat": 10.0, "saturated_fat": 4.5,
        "calcium": 40.0, "iron": 2.8
    },
    {
        "name": "Semiya Payasam (with Milk & Ghee)",
        "name_local": "సేమియా పాయసం",
        "category": "Snacks",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "cup",
        "serving_unit_weight_g": 150.0,
        "calories": 147.0, "protein": 3.0, "carbohydrates": 23.3, "fat": 4.7, "saturated_fat": 2.8,
        "calcium": 75.0
    },
    {
        "name": "Ragi Sankati with Natu Kodi Pulusu",
        "name_local": "రాగి సంగటి + నాటు కోడి పులుసు",
        "category": "Rice & Grains",
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": "plate",
        "serving_unit_weight_g": 400.0,
        "calories": 120.0, "protein": 8.0, "carbohydrates": 12.0, "fat": 4.5, "saturated_fat": 1.2,
        "fiber": 2.0, "calcium": 70.0, "iron": 1.8
    }
]

NUTRIENT_KEYS = [
    "calories", "protein", "carbohydrates", "fat", "fiber", "sugar",
    "sodium", "potassium", "iron", "calcium", "vitamin_c", "vitamin_d",
    "vitamin_b12", "magnesium", "zinc", "saturated_fat", "trans_fat", "cholesterol",
]

def load_comprehensive():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Update south_indian_foods.json on disk
    json_path = os.path.join(os.path.dirname(__file__), "south_indian_foods.json")
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            existing = json.load(f)
    except Exception:
        existing = []

    existing_names = {x["name"].strip().lower() for x in existing}
    added_to_json = 0

    for item in NEW_FOODS:
        if item["name"].strip().lower() not in existing_names:
            existing.append(item)
            existing_names.add(item["name"].strip().lower())
            added_to_json += 1

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    print(f"Updated JSON on disk: {added_to_json} new items appended (Total: {len(existing)})")

    # 2. Insert into PostgreSQL
    inserted_db = 0
    skipped_db = 0

    for item in existing:
        name = item["name"].strip()
        existing_record = db.query(Food).filter(Food.name == name).first()
        if existing_record:
            skipped_db += 1
            continue

        serving_g = item.get("serving_size_g", 100) or 100
        factor = 100.0 / serving_g

        food_kwargs = {
            "name": name,
            "name_local": item.get("name_local", ""),
            "category": item.get("category", "General"),
            "source": "local",
            "source_id": None,
            "serving_size_g": item.get("serving_size_g", 100),
            "serving_unit": item.get("serving_unit", "g"),
            "serving_unit_weight_g": item.get("serving_unit_weight_g", 100.0),
            "is_custom": False,
        }

        for k in NUTRIENT_KEYS:
            raw_val = float(item.get(k, 0.0) or 0.0)
            food_kwargs[k] = round(raw_val * factor, 3) if serving_g != 100 else round(raw_val, 3)

        db.add(Food(**food_kwargs))
        inserted_db += 1

    db.commit()
    print(f"Database sync complete: {inserted_db} inserted into DB, {skipped_db} already existed.")
    
    total_local = db.query(Food).filter(Food.source == "local").count()
    print(f"Total local items in DB now: {total_local}")
    db.close()

if __name__ == "__main__":
    load_comprehensive()
