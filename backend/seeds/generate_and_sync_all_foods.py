import os
import sys
import json

# Set up paths
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal, Base
from app.models.food import Food

NUTRIENT_KEYS = [
    "calories", "protein", "carbohydrates", "fat", "fiber", "sugar",
    "sodium", "potassium", "iron", "calcium", "vitamin_c", "vitamin_d",
    "vitamin_b12", "magnesium", "zinc", "saturated_fat", "trans_fat", "cholesterol",
]

# We will define helper function to construct entries quickly
def create_food(name, telugu, category, unit, unit_weight, cals, pro, carb, fat, fiber=0.0, sugar=0.0, ca=0.0, fe=0.0, k=0.0, na=0.0, mg=0.0, zn=0.0, vit_c=0.0, sat_fat=0.0, chol=0.0):
    return {
        "name": name,
        "name_local": telugu,
        "category": category,
        "source": "local",
        "serving_size_g": 100,
        "serving_unit": unit,
        "serving_unit_weight_g": float(unit_weight),
        "calories": float(cals),
        "protein": float(pro),
        "carbohydrates": float(carb),
        "fat": float(fat),
        "saturated_fat": float(sat_fat),
        "fiber": float(fiber),
        "sugar": float(sugar),
        "calcium": float(ca),
        "iron": float(fe),
        "magnesium": float(mg),
        "potassium": float(k),
        "sodium": float(na),
        "zinc": float(zn),
        "vitamin_c": float(vit_c),
        "cholesterol": float(chol)
    }

FOODS_TO_ADD = []

# ==============================================================================
# 1. CEREALS, GRAINS & STAPLE FOODS (RAW & COOKED)
# ==============================================================================
FOODS_TO_ADD.extend([
    # Rice variants (Raw & Cooked)
    create_food("White Rice (Raw)", "తెల్ల బియ్యం (పచ్చివి)", "Rice & Grains", "cup", 180, 360, 6.8, 80.0, 0.6, fiber=1.3, ca=10, fe=0.8, k=115, na=5),
    create_food("White Rice (Cooked)", "తెల్ల అన్నం (వండినది)", "Rice & Grains", "cup", 150, 130, 2.7, 28.2, 0.3, fiber=0.4, ca=10, fe=0.2, k=35, na=2),
    create_food("Raw Rice (Raw)", "పచ్చి బియ్యం", "Rice & Grains", "cup", 180, 356, 6.7, 79.2, 0.5, fiber=1.2, ca=10, fe=0.7, k=110, na=5),
    create_food("Raw Rice (Cooked)", "పచ్చి బియ్యం అన్నం", "Rice & Grains", "cup", 150, 130, 2.6, 28.0, 0.3, fiber=0.4, ca=10, fe=0.2, k=35),
    create_food("Basmati Rice (Raw)", "బాస్మతి బియ్యం (పచ్చివి)", "Rice & Grains", "cup", 180, 350, 7.5, 77.0, 0.8, fiber=1.4, ca=12, fe=1.0, k=120, na=4),
    create_food("Basmati Rice (Cooked)", "బాస్మతి అన్నం (వండినది)", "Rice & Grains", "cup", 150, 125, 3.0, 26.5, 0.4, fiber=0.5, ca=11, fe=0.3, k=40, na=2),
    create_food("Brown Rice (Raw)", "బ్రౌన్ రైస్ (పచ్చిది)", "Rice & Grains", "cup", 180, 362, 7.5, 76.0, 2.7, fiber=3.5, ca=23, fe=1.8, k=268, na=7, mg=143),
    create_food("Brown Rice (Cooked)", "బ్రౌన్ రైస్ అన్నం (వండినది)", "Rice & Grains", "cup", 150, 123, 2.7, 25.6, 1.0, fiber=1.6, ca=10, fe=0.5, k=86, na=3, mg=44),
    create_food("Parboiled Rice / Boiled Rice (Raw)", "ఉప్పుడు బియ్యం (పచ్చివి)", "Rice & Grains", "cup", 180, 352, 7.4, 77.5, 0.6, fiber=1.8, ca=15, fe=1.2, k=140, na=5),
    create_food("Parboiled Rice / Boiled Rice (Cooked)", "ఉప్పుడు బియ్యం అన్నం", "Rice & Grains", "cup", 150, 125, 2.8, 27.0, 0.3, fiber=0.6, ca=12, fe=0.4, k=45, na=2),
    create_food("Red Rice (Raw)", "ఎర్ర బియ్యం (పచ్చివి)", "Rice & Grains", "cup", 180, 360, 7.0, 77.0, 2.5, fiber=3.8, ca=20, fe=2.2, k=250, na=6, mg=120),
    create_food("Red Rice (Cooked)", "ఎర్ర బియ్యం అన్నం", "Rice & Grains", "cup", 150, 120, 2.5, 25.0, 0.9, fiber=1.4, ca=8, fe=0.7, k=80, na=2, mg=40),
    create_food("Black Rice (Raw)", "నల్ల బియ్యం (పచ్చివి)", "Rice & Grains", "cup", 180, 356, 8.5, 75.0, 3.2, fiber=4.7, ca=22, fe=3.5, k=280, na=6, mg=130),
    create_food("Black Rice (Cooked)", "నల్ల బియ్యం అన్నం", "Rice & Grains", "cup", 150, 135, 3.2, 27.0, 1.1, fiber=1.8, ca=9, fe=1.2, k=90, na=2, mg=45),
    create_food("Broken Rice / Nookalu (Raw)", "బియ్యం నూకలు (పచ్చివి)", "Rice & Grains", "cup", 160, 350, 6.5, 78.0, 0.6, fiber=1.2, ca=10, fe=0.7, k=110),
    create_food("Broken Rice Porridge / Nookala Java (Cooked)", "నూకల జావ (గంజి)", "Rice & Grains", "glass", 250, 55, 1.3, 12.0, 0.2, fiber=0.3, ca=8, fe=0.2, k=30),
    create_food("Hand-Pounded Rice / Danchina Biyyam (Raw)", "దంపుడు బియ్యం (పచ్చివి)", "Rice & Grains", "cup", 180, 355, 7.8, 75.5, 2.0, fiber=3.2, ca=25, fe=2.0, k=240, mg=110),
    create_food("Hand-Pounded Rice / Danchina Biyyam (Cooked)", "దంపుడు బియ్యం అన్నం", "Rice & Grains", "cup", 150, 125, 2.9, 26.0, 0.8, fiber=1.2, ca=11, fe=0.6, k=75, mg=35),
    create_food("Ponni Rice (Raw)", "పొన్ని బియ్యం (పచ్చివి)", "Rice & Grains", "cup", 180, 355, 6.8, 79.0, 0.6, fiber=1.4, ca=11, fe=0.8, k=115),
    create_food("Ponni Rice (Cooked)", "పొన్ని బియ్యం అన్నం", "Rice & Grains", "cup", 150, 128, 2.7, 27.5, 0.3, fiber=0.5, ca=10, fe=0.3, k=38),
    create_food("Idli Rice (Raw)", "ఇడ్లీ బియ్యం (పచ్చివి)", "Rice & Grains", "cup", 180, 352, 7.0, 78.0, 0.6, fiber=1.5, ca=12, fe=1.0, k=120),
    create_food("Dosa Rice (Raw)", "దోస బియ్యం (పచ్చివి)", "Rice & Grains", "cup", 180, 354, 6.8, 78.5, 0.6, fiber=1.4, ca=11, fe=0.9, k=118),

    # Rice flakes, flour, bran
    create_food("Rice Flakes / Poha / Atukulu (Raw)", "అటుకులు (పచ్చివి)", "Rice & Grains", "cup", 60, 346, 6.6, 77.3, 1.2, fiber=2.8, ca=20, fe=20.0, k=110, na=10),
    create_food("Rice Flakes / Soaked Atukulu (Cooked/Wet)", "నానబెట్టిన అటుకులు", "Rice & Grains", "cup", 120, 150, 3.0, 33.0, 0.5, fiber=1.3, ca=10, fe=8.0, k=50),
    create_food("Rice Flour / Biyyam Pindi", "బియ్యం పిండి", "Rice & Grains", "cup", 120, 366, 6.0, 80.0, 1.4, fiber=2.4, ca=10, fe=0.5, k=76, na=5),
    create_food("Rice Bran", "వరి తవుడు", "Rice & Grains", "tbsp", 10, 316, 13.4, 49.7, 20.9, fiber=21.0, ca=57, fe=18.5, k=1485, mg=781, na=5),

    # Wheat & Breads
    create_food("Whole Wheat Grain (Raw)", "గోధుమలు (పచ్చివి)", "Rice & Grains", "cup", 180, 340, 12.0, 71.0, 1.7, fiber=11.0, ca=35, fe=3.9, k=360, mg=120),
    create_food("Maida / Refined Wheat Flour", "మైదా పిండి", "Rice & Grains", "cup", 120, 364, 10.3, 76.3, 1.0, fiber=2.7, ca=15, fe=1.2, k=107, na=2),
    create_food("Wheat Rava / Samba Rava (Raw)", "గోధుమ రవ్వ (పచ్చిది)", "Rice & Grains", "cup", 160, 345, 11.5, 72.0, 1.5, fiber=9.5, ca=30, fe=3.5, k=340, mg=110),
    create_food("Broken Wheat / Dalia (Raw)", "దలియా / గోధుమ రవ్వ", "Rice & Grains", "cup", 160, 342, 12.0, 71.5, 1.6, fiber=10.0, ca=32, fe=3.8, k=350),
    create_food("Broken Wheat Porridge / Dalia Khichdi (Cooked)", "ఉడికించిన దలియా", "Rice & Grains", "cup", 180, 95, 3.2, 19.5, 0.5, fiber=3.0, ca=12, fe=1.1, k=110),
    create_food("Wheat Bran", "గోధుమ తవుడు", "Rice & Grains", "tbsp", 8, 216, 15.6, 64.5, 4.3, fiber=42.8, ca=73, fe=10.6, k=1182, mg=611, na=2),
    create_food("Vermicelli / Semiya (Raw)", "సేమియా (పచ్చిది)", "Rice & Grains", "cup", 100, 360, 10.0, 76.0, 1.0, fiber=2.5, ca=18, fe=1.5, k=120),
    create_food("Vermicelli / Semiya Boiled (Cooked)", "ఉడకబెట్టిన సేమియా", "Rice & Grains", "cup", 150, 130, 3.5, 27.0, 0.4, fiber=1.0, ca=8, fe=0.5, k=40),
    create_food("Wheat Noodles (Boiled/Cooked)", "నూడుల్స్ (ఉడికించినవి)", "Rice & Grains", "cup", 140, 138, 4.5, 25.0, 2.1, fiber=1.8, ca=15, fe=1.2, k=45, na=180),
    create_food("Whole Wheat Bread", "గోధుమ బ్రెడ్", "Breads", "slice", 30, 247, 13.0, 41.3, 3.4, fiber=7.0, ca=107, fe=2.5, k=254, na=450),
    create_food("White Bread", "వైట్ బ్రెడ్", "Breads", "slice", 28, 265, 9.0, 49.0, 3.2, fiber=2.7, ca=144, fe=3.6, k=100, na=490),
    create_food("Multigrain Bread", "మల్టీగ్రెయిన్ బ్రెడ్", "Breads", "slice", 32, 250, 12.0, 43.0, 3.8, fiber=6.5, ca=120, fe=2.8, k=230, na=440),
    create_food("Pav / Bread Bun", "పావ్ / బన్", "Breads", "piece", 50, 270, 8.5, 52.0, 3.0, fiber=2.5, ca=80, fe=2.0, k=120, na=480),
    create_food("Tea Rusk", "రస్క్", "Snacks", "piece", 15, 410, 9.0, 75.0, 8.5, fiber=3.5, ca=40, fe=2.5, na=280),

    # Millets (Raw & Cooked)
    create_food("Kodo Millet / Arikelu (Raw)", "అరికెలు (పచ్చివి)", "Rice & Grains", "cup", 150, 353, 8.3, 65.9, 1.4, fiber=9.8, ca=27, fe=0.5, k=144, mg=130),
    create_food("Kodo Millet Cooked / Arike Annam", "అరికె అన్నం (వండినది)", "Rice & Grains", "cup", 150, 115, 2.7, 22.0, 0.5, fiber=3.2, ca=9, fe=0.2, k=50, mg=45),
    create_food("Barnyard Millet Cooked / Ooda Annam", "ఊద అన్నం (వండినది)", "Rice & Grains", "cup", 150, 105, 2.1, 21.0, 0.7, fiber=3.1, ca=7, fe=1.6, k=65),
    create_food("Proso Millet / Variga (Raw)", "వరిగెలు (పచ్చివి)", "Rice & Grains", "cup", 150, 356, 12.5, 70.4, 3.1, fiber=6.3, ca=14, fe=0.8, k=200, mg=153),
    create_food("Proso Millet Cooked / Variga Annam", "వరిగె అన్నం (వండినది)", "Rice & Grains", "cup", 150, 118, 4.1, 23.0, 1.0, fiber=2.1, ca=5, fe=0.3, k=68),
    create_food("Browntop Millet / Andu Korralu (Raw)", "అండు కొర్రలు (పచ్చివి)", "Rice & Grains", "cup", 150, 338, 11.5, 69.0, 1.9, fiber=12.5, ca=28, fe=7.7, k=250, mg=120),
    create_food("Browntop Millet Cooked / Andu Korra Annam", "అండు కొర్ర అన్నం", "Rice & Grains", "cup", 150, 112, 3.8, 22.0, 0.6, fiber=4.1, ca=9, fe=2.5, k=80),
    create_food("Millet Flour (Multi-Millet)", "చిరుధాన్యాల పిండి", "Rice & Grains", "cup", 120, 345, 10.5, 68.0, 3.0, fiber=10.0, ca=95, fe=4.5, k=310),
    create_food("Millet Rava", "మిల్లెట్ రవ్వ", "Rice & Grains", "cup", 150, 348, 10.0, 70.0, 2.5, fiber=8.5, ca=40, fe=3.8, k=270),
    create_food("Millet Flakes", "మిల్లెట్ అటుకులు", "Rice & Grains", "cup", 60, 340, 9.5, 71.0, 2.0, fiber=7.5, ca=35, fe=4.0, k=260),

    # Corn & Pseudo-grains
    create_food("Sweet Corn (Raw)", "స్వీట్ కార్న్ (పచ్చిది)", "Vegetables", "cup", 145, 86, 3.3, 18.7, 1.4, fiber=2.0, ca=2, fe=0.5, k=270, na=15),
    create_food("Sweet Corn Boiled / Steamed", "ఉడకబెట్టిన స్వీట్ కార్న్", "Vegetables", "cup", 145, 96, 3.4, 21.0, 1.5, fiber=2.4, ca=3, fe=0.5, k=218, na=1),
    create_food("Roasted Corn on the Cob / Butta", "కాల్చిన మొక్కజొన్న పొత్తు", "Snacks", "piece", 150, 110, 4.0, 23.0, 1.5, fiber=2.8, ca=4, fe=0.8, k=280),
    create_food("Cornmeal (Raw)", "మొక్కజొన్న రవ్వ", "Rice & Grains", "cup", 150, 362, 8.1, 76.9, 3.6, fiber=7.3, ca=6, fe=3.5, k=287),
    create_food("Popcorn (Air-Popped)", "పాప్‌కార్న్ (ఆయిల్ లేకుండా)", "Snacks", "cup", 8, 387, 12.9, 77.8, 4.5, fiber=14.5, ca=7, fe=3.2, k=329, na=7),
    create_food("Popcorn (Butter / Salted)", "పాప్‌కార్న్ (బటర్)", "Snacks", "cup", 10, 450, 10.0, 65.0, 20.0, fiber=11.0, ca=8, fe=2.8, k=300, na=550),
    create_food("Barley / Yavalu (Raw)", "బార్లీ గింజలు (పచ్చివి)", "Rice & Grains", "cup", 180, 354, 12.5, 73.5, 2.3, fiber=17.3, ca=33, fe=3.6, k=452, mg=133),
    create_food("Barley Water / Cooked Barley", "బార్లీ నీళ్ళు / అన్నం", "Rice & Grains", "glass", 250, 45, 1.2, 9.8, 0.3, fiber=1.8, ca=8, fe=0.5, k=55),
    create_food("Rolled Oats (Raw)", "రోల్డ్ ఓట్స్ (పచ్చివి)", "Rice & Grains", "cup", 80, 389, 16.9, 66.3, 6.9, fiber=10.6, ca=54, fe=4.7, k=429, mg=177),
    create_food("Oats Porridge / Oatmeal (Cooked with Water)", "ఉడికించిన ఓట్స్ జావ", "Rice & Grains", "cup", 200, 71, 2.5, 12.0, 1.5, fiber=1.7, ca=15, fe=1.0, k=70),
    create_food("Quinoa (Raw)", "క్వినోవా గింజలు (పచ్చివి)", "Rice & Grains", "cup", 170, 368, 14.1, 64.2, 6.1, fiber=7.0, ca=47, fe=4.6, k=563, mg=197),
    create_food("Quinoa (Cooked)", "క్వినోవా (వండినది)", "Rice & Grains", "cup", 185, 120, 4.4, 21.3, 1.9, fiber=2.8, ca=17, fe=1.5, k=172, mg=64),
    create_food("Amaranth Grain / Rajgira (Raw)", "రాజ్‌గిరా గింజలు (పచ్చివి)", "Rice & Grains", "cup", 180, 371, 13.6, 65.2, 7.0, fiber=6.7, ca=159, fe=7.6, k=508, mg=248),
    create_food("Amaranth Grain Cooked / Rajgira Porridge", "రాజ్‌గిరా జావ", "Rice & Grains", "cup", 200, 102, 3.8, 18.7, 1.6, fiber=2.1, ca=47, fe=2.1, k=135),
    create_food("Buckwheat / Kuttu (Raw)", "కుట్టు / బక్‌వీట్ (పచ్చిది)", "Rice & Grains", "cup", 170, 343, 13.2, 71.5, 3.4, fiber=10.0, ca=18, fe=2.2, k=460, mg=231),
    create_food("Buckwheat Groats (Cooked)", "ఉడికించిన కుట్టు", "Rice & Grains", "cup", 170, 92, 3.4, 19.9, 0.6, fiber=2.7, ca=7, fe=0.8, k=88),
])

# ==============================================================================
# 2. PULSES, DALS & LEGUMES (RAW & COOKED)
# ==============================================================================
FOODS_TO_ADD.extend([
    create_food("Whole Pigeon Pea / Whole Toor (Raw)", "కంది గింజలు (పచ్చివి)", "Legumes & Pulses", "cup", 180, 340, 22.0, 61.0, 1.6, fiber=15.5, ca=75, fe=5.2, k=1380),
    create_food("Yellow Split Moong Dal (Cooked)", "ఉడికించిన పెసరపప్పు", "Legumes & Pulses", "cup", 150, 105, 7.5, 18.5, 0.4, fiber=5.0, ca=25, fe=1.3, k=410),
    create_food("Whole Green Gram / Pesalu (Boiled)", "ఉడకబెట్టిన పెసలు", "Legumes & Pulses", "cup", 150, 115, 8.0, 19.5, 0.5, fiber=5.5, ca=40, fe=1.8, k=430),
    create_food("Moong Sprouts (Boiled / Steamed)", "ఉడకబెట్టిన పెసర మొలకలు", "Legumes & Pulses", "cup", 120, 42, 3.5, 7.5, 0.3, fiber=2.2, ca=18, fe=1.1, k=160),
    create_food("Whole Black Gram / Minumulu (Boiled)", "ఉడకబెట్టిన నల్ల మినుములు", "Legumes & Pulses", "cup", 150, 120, 8.5, 20.0, 0.6, fiber=6.0, ca=55, fe=2.5, k=330),
    create_food("Split Urad Dal (Cooked)", "ఉడికించిన మినపపప్పు", "Legumes & Pulses", "cup", 150, 116, 8.2, 19.8, 0.5, fiber=5.8, ca=50, fe=2.3, k=320),
    create_food("Chana Dal (Cooked / Boiled)", "ఉడకబెట్టిన శనగపప్పు", "Legumes & Pulses", "cup", 150, 125, 7.5, 20.0, 1.8, fiber=6.2, ca=22, fe=1.8, k=270),
    create_food("Masoor Dal / Red Lentils (Raw)", "ఎర్ర కందిపప్పు / మసూర్ దాల్ (పచ్చిది)", "Legumes & Pulses", "cup", 180, 352, 24.6, 63.4, 1.1, fiber=10.7, ca=35, fe=6.5, k=677, mg=122),
    create_food("Masoor Dal / Red Lentils (Cooked)", "ఉడికించిన మసూర్ దాల్", "Legumes & Pulses", "cup", 150, 116, 9.0, 20.1, 0.4, fiber=7.9, ca=19, fe=3.3, k=369, mg=36),
    create_food("Whole Black Lentils / Sabut Masoor (Raw)", "నల్ల మసూర్ గింజలు (పచ్చివి)", "Legumes & Pulses", "cup", 180, 345, 24.0, 60.0, 1.3, fiber=11.5, ca=40, fe=6.8, k=700),
    create_food("Whole Black Lentils / Sabut Masoor (Cooked)", "ఉడకబెట్టిన నల్ల మసూర్", "Legumes & Pulses", "cup", 150, 118, 8.8, 19.5, 0.5, fiber=8.0, ca=21, fe=3.2, k=360),
    create_food("Moth Beans / Matki (Raw)", "మట్కీ గింజలు (పచ్చివి)", "Legumes & Pulses", "cup", 180, 343, 23.0, 61.5, 1.6, fiber=10.0, ca=150, fe=10.8, k=1190),
    create_food("Moth Beans / Matki (Boiled / Sprouted)", "ఉడకబెట్టిన మట్కీ గింజలు", "Legumes & Pulses", "cup", 150, 117, 8.0, 21.0, 0.6, fiber=4.5, ca=52, fe=3.5, k=410),
    create_food("Horsegram / Ulavalu (Boiled)", "ఉడకబెట్టిన ఉలవలు", "Legumes & Pulses", "cup", 150, 118, 8.2, 20.5, 0.3, fiber=2.8, ca=95, fe=2.5, k=380),
    create_food("Cowpeas / Bobbarlu / Lobia (Boiled)", "ఉడకబెట్టిన అలసందలు / బొబ్బర్లు", "Legumes & Pulses", "cup", 150, 116, 7.8, 20.8, 0.5, fiber=4.1, ca=38, fe=2.7, k=388),
    create_food("Field Beans / Avarekalu (Raw)", "చిక్కుడు గింజలు / అనపకాయ గింజలు", "Legumes & Pulses", "cup", 150, 340, 24.0, 58.0, 1.5, fiber=9.0, ca=130, fe=6.0, k=1050),
    create_food("Field Beans / Avarekalu (Boiled)", "ఉడకబెట్టిన అనప గింజలు", "Legumes & Pulses", "cup", 150, 120, 8.5, 20.0, 0.6, fiber=4.2, ca=45, fe=2.1, k=360),
    create_food("Broad Beans / Hyacinth Beans (Boiled)", "ఉడకబెట్టిన చిక్కుడుకాయ", "Vegetables", "cup", 150, 55, 4.2, 9.5, 0.4, fiber=4.0, ca=60, fe=1.6, k=280),
    create_food("Kidney Beans / Rajma (Boiled)", "ఉడకబెట్టిన రాజ్మా", "Legumes & Pulses", "cup", 150, 127, 8.7, 22.8, 0.5, fiber=7.4, ca=35, fe=2.9, k=405, mg=45),
    create_food("Black-Eyed Peas (Boiled)", "ఉడకబెట్టిన అలసందలు", "Legumes & Pulses", "cup", 150, 115, 7.7, 21.0, 0.5, fiber=4.0, ca=40, fe=2.6, k=385),
    create_food("Soybeans (Raw Dry)", "సోయాబీన్స్ (పచ్చివి)", "Legumes & Pulses", "cup", 180, 446, 36.5, 30.2, 19.9, fiber=9.3, ca=277, fe=15.7, k=1797, mg=280),
    create_food("Soybeans (Boiled)", "ఉడకబెట్టిన సోయాబీన్స్", "Legumes & Pulses", "cup", 150, 173, 16.6, 9.9, 9.0, fiber=6.0, ca=102, fe=5.1, k=515, mg=86),
    create_food("Green Peas (Boiled)", "ఉడకబెట్టిన పచ్చి బఠాణీలు", "Vegetables", "cup", 140, 84, 5.4, 15.6, 0.4, fiber=5.5, ca=27, fe=1.5, k=244, vit_c=14.2),
    create_food("Dried White Peas / Batani (Raw Dry)", "ఎండిన తెల్ల బఠాణీలు (పచ్చివి)", "Legumes & Pulses", "cup", 180, 341, 24.5, 60.0, 1.2, fiber=15.0, ca=55, fe=4.4, k=980),
    create_food("Dried White Peas / Batani (Boiled / Ragda)", "ఉడకబెట్టిన తెల్ల బఠాణీలు (గుగ్గిళ్ళు)", "Legumes & Pulses", "cup", 150, 118, 8.3, 21.1, 0.5, fiber=5.2, ca=20, fe=1.5, k=340),
    create_food("Sprouted Mixed Pulses (Raw)", "మొలకల మిశ్రమం (పచ్చివి)", "Legumes & Pulses", "cup", 100, 35, 3.5, 6.5, 0.3, fiber=2.5, ca=25, fe=1.5, k=180, vit_c=16.0),
    create_food("Sprouted Mixed Pulses (Steamed/Boiled)", "ఉడకబెట్టిన మొలకలు", "Legumes & Pulses", "cup", 120, 48, 4.0, 8.5, 0.4, fiber=2.8, ca=28, fe=1.6, k=190),
    create_food("Pappula Podi (Roasted Gram Powder)", "పప్పుల పొడి (పుట్నాల పొడి)", "Spices & Condiments", "tbsp", 15, 390, 20.0, 56.0, 9.5, fiber=9.0, ca=60, fe=7.5, k=750, na=550),
])

# ==============================================================================
# 3. VEGETABLES, GOURDS, ROOTS & TUBERS (RAW & COOKED)
# ==============================================================================
FOODS_TO_ADD.extend([
    create_food("Potato / Bangaladumpa (Raw)", "బంగాళాదుంప (పచ్చిది)", "Vegetables", "piece", 150, 77, 2.0, 17.5, 0.1, fiber=2.2, ca=12, fe=0.8, k=421, na=6, vit_c=19.7),
    create_food("Potato / Bangaladumpa (Boiled without Skin)", "ఉడకబెట్టిన బంగాళాదుంప", "Vegetables", "piece", 130, 87, 1.9, 20.1, 0.1, fiber=1.8, ca=8, fe=0.7, k=379, na=4, vit_c=13.0),
    create_food("Tomato (Cooked / Stewed)", "టమాటో కూర / ఉడికించినది", "Vegetables", "cup", 150, 22, 1.0, 4.8, 0.3, fiber=1.4, ca=13, fe=0.5, k=250, vit_c=16.0),
    create_food("Onion / Ullipaya (Sauteed / Cooked)", "వేపిన ఉల్లిపాయ", "Vegetables", "cup", 100, 65, 1.4, 11.0, 2.2, fiber=2.0, ca=25, fe=0.3, k=160),
    create_food("Carrot (Boiled / Steamed)", "ఉడకబెట్టిన క్యారెట్", "Vegetables", "cup", 120, 35, 0.8, 8.2, 0.2, fiber=3.0, ca=30, fe=0.3, k=235, vit_c=3.6),
    create_food("Beetroot (Boiled / Steamed)", "ఉడకబెట్టిన బీట్‌రూట్", "Vegetables", "cup", 120, 44, 1.7, 10.0, 0.2, fiber=2.0, ca=16, fe=0.8, k=305, vit_c=3.6),
    create_food("Radish / Mullangi (Cooked / Sambar)", "ఉడికించిన ముల్లంగి", "Vegetables", "cup", 120, 18, 0.8, 3.8, 0.2, fiber=1.6, ca=26, fe=0.3, k=220),
    create_food("Turnip / Shaljam (Raw)", "టర్నిప్ (పచ్చిది)", "Vegetables", "piece", 100, 28, 0.9, 6.4, 0.1, fiber=1.8, ca=30, fe=0.3, k=191, vit_c=21.0),
    create_food("Turnip / Shaljam (Boiled / Cooked)", "ఉడికించిన టర్నిప్", "Vegetables", "cup", 130, 22, 0.7, 5.1, 0.1, fiber=2.0, ca=33, fe=0.2, k=177, vit_c=11.6),
    create_food("Cabbage (Cooked / Poriyal)", "ఉడికించిన క్యాబేజీ కూర", "Vegetables", "cup", 120, 30, 1.4, 5.5, 0.8, fiber=2.4, ca=40, fe=0.5, k=180),
    create_food("Cauliflower / Gobi (Raw)", "కాలీఫ్లవర్ (పచ్చిది)", "Vegetables", "cup", 100, 25, 1.9, 5.0, 0.3, fiber=2.0, ca=22, fe=0.4, k=299, vit_c=48.2),
    create_food("Cauliflower / Gobi (Boiled / Steamed)", "ఉడికించిన కాలీఫ్లవర్", "Vegetables", "cup", 120, 23, 1.8, 4.1, 0.5, fiber=2.3, ca=16, fe=0.4, k=142, vit_c=44.3),
    create_food("Broccoli (Boiled / Steamed)", "ఉడికించిన బ్రోకలీ", "Vegetables", "cup", 120, 35, 2.4, 7.2, 0.4, fiber=3.3, ca=40, fe=0.7, k=293, vit_c=64.9),
    create_food("Capsicum / Bell Pepper (Cooked / Sauteed)", "వేపిన క్యాప్సికం", "Vegetables", "cup", 120, 28, 1.0, 5.2, 0.8, fiber=1.8, ca=12, fe=0.5, k=160, vit_c=70.0),
    create_food("French Beans (Boiled / Cooked)", "ఉడికించిన బీన్స్", "Vegetables", "cup", 120, 35, 1.9, 7.9, 0.3, fiber=3.2, ca=44, fe=1.0, k=210, vit_c=9.7),
    create_food("Cluster Beans / Goruchikkudu (Boiled)", "ఉడకబెట్టిన గోరుచిక్కుడు", "Vegetables", "cup", 120, 20, 3.2, 0.6, 0.2, fiber=3.2, ca=130, fe=1.1, k=190),
    create_food("Dosakaya / Yellow Cucumber (Cooked / Dal)", "ఉడికించిన దోసకాయ", "Vegetables", "cup", 130, 18, 0.8, 3.5, 0.2, fiber=1.2, ca=20, fe=0.4, k=140),
    create_food("Zucchini (Raw)", "జుకిని (పచ్చిది)", "Vegetables", "piece", 150, 17, 1.2, 3.1, 0.3, fiber=1.0, ca=16, fe=0.4, k=261, vit_c=17.9),
    create_food("Zucchini (Cooked / Boiled)", "ఉడికించిన జుకిని", "Vegetables", "cup", 120, 15, 1.1, 2.7, 0.4, fiber=1.1, ca=15, fe=0.3, k=230, vit_c=12.0),
    create_food("Pumpkin / Teepi Gummadikaya (Boiled / Cooked)", "ఉడికించిన గుమ్మడికాయ", "Vegetables", "cup", 140, 20, 0.7, 4.9, 0.1, fiber=1.1, ca=15, fe=0.6, k=230),
    create_food("Ash Gourd / Boodida Gummadikaya (Boiled in Stew)", "ఉడికించిన బూడిద గుమ్మడికాయ", "Vegetables", "cup", 140, 14, 0.4, 2.8, 0.1, fiber=2.5, ca=25, fe=0.3, k=95),
    create_food("Bottle Gourd / Sorakaya (Boiled / Stewed)", "ఉడికించిన సొరకాయ", "Vegetables", "cup", 140, 15, 0.6, 3.2, 0.2, fiber=1.2, ca=24, fe=0.3, k=130),
    create_food("Ridge Gourd / Beerakaya (Cooked)", "ఉడికించిన బీరకాయ కూర", "Vegetables", "cup", 140, 20, 0.8, 3.5, 0.5, fiber=1.1, ca=16, fe=0.4, k=120),
    create_food("Snake Gourd / Potlakaya (Cooked)", "ఉడికించిన పొట్లకాయ", "Vegetables", "cup", 140, 20, 0.7, 3.6, 0.5, fiber=1.2, ca=24, fe=0.4, k=115),
    create_food("Bitter Gourd / Kakarakaya (Cooked / Boiled)", "ఉడికించిన కాకరకాయ", "Vegetables", "cup", 120, 21, 1.1, 4.3, 0.2, fiber=2.5, ca=17, fe=0.4, k=280, vit_c=65.0),
    create_food("Brinjal / Vankaya (Cooked / Curry)", "వంకాయ కూర (వండినది)", "Vegetables", "cup", 130, 35, 1.0, 5.8, 1.5, fiber=2.5, ca=15, fe=0.4, k=180),
    create_food("Raw Banana / Aratikaya (Boiled)", "ఉడకబెట్టిన అరటికాయ", "Vegetables", "cup", 130, 85, 1.1, 21.0, 0.2, fiber=2.4, ca=6, fe=0.4, k=320),
    create_food("Raw Papaya (Raw)", "పచ్చి బొప్పాయి (పచ్చిది)", "Vegetables", "cup", 140, 32, 0.6, 7.2, 0.1, fiber=2.6, ca=24, fe=0.4, k=210, vit_c=40.0),
    create_food("Raw Papaya (Cooked / Curry)", "పచ్చి బొప్పాయి కూర", "Vegetables", "cup", 140, 38, 0.8, 7.5, 0.8, fiber=2.3, ca=22, fe=0.3, k=190),
    create_food("Raw Jackfruit / Panasa Pottu (Raw)", "పనస పొట్టు (పచ్చిది)", "Vegetables", "cup", 120, 50, 1.5, 10.0, 0.4, fiber=3.8, ca=30, fe=0.8, k=280),
    create_food("Raw Jackfruit Curry / Panasa Pottu Kura", "పనస పొట్టు కూర", "Vegetables", "cup", 150, 95, 2.0, 14.0, 3.8, fiber=4.5, ca=35, fe=1.0, k=310),
    create_food("Chow Chow / Chayote (Raw)", "చౌ చౌ / బెంగళూరు వంకాయ (పచ్చిది)", "Vegetables", "piece", 150, 19, 0.8, 4.5, 0.1, fiber=1.7, ca=17, fe=0.3, k=125, vit_c=7.7),
    create_food("Chow Chow / Chayote (Boiled / Cooked)", "ఉడికించిన చౌ చౌ", "Vegetables", "cup", 130, 24, 0.7, 5.1, 0.3, fiber=2.2, ca=19, fe=0.3, k=110),
    create_food("Mushroom (Button, Raw)", "పుట్టగొడుగులు / పుట్టకొడుగులు (పచ్చివి)", "Vegetables", "cup", 70, 22, 3.1, 3.3, 0.3, fiber=1.0, ca=3, fe=0.5, k=318, na=5),
    create_food("Mushroom (Cooked / Sauteed)", "వేపిన పుట్టగొడుగులు", "Vegetables", "cup", 120, 45, 3.6, 5.0, 1.8, fiber=1.5, ca=5, fe=0.7, k=350),
    create_food("Okra / Bendakaya (Cooked / Stewed)", "బెండకాయ కూర (వండినది)", "Vegetables", "cup", 130, 38, 1.8, 7.0, 0.8, fiber=3.0, ca=75, fe=0.6, k=280, vit_c=18.0),

    # Roots & Tubers
    create_food("Elephant Foot Yam / Kandagadda (Raw)", "కందగడ్డ (పచ్చిది)", "Roots & Tubers", "cup", 150, 118, 1.5, 27.9, 0.2, fiber=4.1, ca=50, fe=0.6, k=500),
    create_food("Elephant Foot Yam / Kandagadda (Boiled)", "ఉడకబెట్టిన కందగడ్డ", "Roots & Tubers", "cup", 150, 110, 1.4, 25.0, 0.2, fiber=3.8, ca=45, fe=0.5, k=460),
    create_food("Colocasia / Arbi / Chamadumpa (Boiled)", "ఉడకబెట్టిన చామదుంప", "Roots & Tubers", "piece", 70, 110, 1.4, 25.5, 0.2, fiber=3.9, ca=40, fe=0.6, k=550),
    create_food("Tapioca / Cassava / Karrapendalam (Raw)", "కర్రపెండలం (పచ్చిది)", "Roots & Tubers", "cup", 150, 160, 1.4, 38.1, 0.3, fiber=1.8, ca=16, fe=0.3, k=271),
    create_food("Tapioca / Cassava (Boiled)", "ఉడకబెట్టిన కర్రపెండలం", "Roots & Tubers", "cup", 150, 155, 1.3, 37.0, 0.2, fiber=1.7, ca=15, fe=0.3, k=250),
    create_food("Raw Turmeric Root / Pasupu Kommulu", "పచ్చి పసుపు కొమ్ములు", "Roots & Tubers", "piece", 15, 60, 1.5, 13.0, 0.5, fiber=3.0, ca=20, fe=3.5, k=300),
    create_food("Lotus Root / Kamala Dumpa (Raw)", "కమలం దుంప (పచ్చిది)", "Roots & Tubers", "cup", 100, 74, 2.6, 17.2, 0.1, fiber=4.9, ca=45, fe=1.2, k=556, vit_c=44.0),
    create_food("Lotus Root (Boiled / Cooked)", "ఉడికించిన కమలం దుంప", "Roots & Tubers", "cup", 120, 66, 1.6, 16.0, 0.1, fiber=3.1, ca=26, fe=0.9, k=363, vit_c=27.4),
    create_food("Purple Yam / Kanda (Boiled)", "ఉడికించిన ఊదా కంద", "Roots & Tubers", "cup", 150, 120, 1.5, 27.5, 0.2, fiber=4.0, ca=30, fe=0.5, k=450),
])

# ==============================================================================
# 4. GREEN LEAFY VEGETABLES (RAW & COOKED)
# ==============================================================================
FOODS_TO_ADD.extend([
    create_food("Spinach / Palak (Boiled / Cooked)", "ఉడికించిన పాలకూర", "Leafy Greens", "cup", 130, 23, 3.0, 3.8, 0.3, fiber=2.4, ca=136, fe=3.6, k=466, mg=87, vit_c=9.8),
    create_food("Amaranth / Thotakura (Cooked / Dal)", "తోటకూర (వండినది)", "Leafy Greens", "cup", 130, 25, 2.8, 4.5, 0.4, fiber=2.8, ca=280, fe=3.8, k=350, vit_c=25.0),
    create_food("Red Amaranth / Erra Thotakura (Raw)", "ఎర్ర తోటకూర (పచ్చిది)", "Leafy Greens", "cup", 50, 25, 2.6, 4.2, 0.3, fiber=2.6, ca=270, fe=4.5, k=360, vit_c=45.0),
    create_food("Red Amaranth / Erra Thotakura (Cooked)", "ఎర్ర తోటకూర (వండినది)", "Leafy Greens", "cup", 130, 27, 2.8, 4.4, 0.5, fiber=2.7, ca=260, fe=4.0, k=340),
    create_food("Malabar Spinach / Bachali Kura (Cooked)", "బచ్చలికూర (వండినది)", "Leafy Greens", "cup", 130, 22, 2.0, 3.6, 0.4, fiber=2.2, ca=115, fe=1.4, k=480),
    create_food("Gongura / Sorrel Leaves (Cooked / Dal)", "ఉడికించిన గోంగూర", "Leafy Greens", "cup", 130, 30, 2.0, 4.5, 0.5, fiber=3.0, ca=145, fe=3.2, k=300),
    create_food("Fenugreek Leaves / Menthi Kura (Cooked)", "మెంతికూర (వండినది)", "Leafy Greens", "cup", 130, 45, 4.2, 5.8, 1.0, fiber=3.4, ca=380, fe=2.0, k=420),
    create_food("Drumstick Leaves / Munagaku (Cooked)", "మునగాకు కూర (వండినది)", "Leafy Greens", "cup", 100, 68, 8.5, 8.0, 1.6, fiber=2.2, ca=430, fe=3.8, k=320, vit_c=35.0),
    create_food("Radish Leaves / Mullangi Aakulu (Raw)", "ముల్లంగి ఆకులు (పచ్చివి)", "Leafy Greens", "cup", 50, 22, 2.2, 3.5, 0.4, fiber=1.8, ca=260, fe=4.2, k=330, vit_c=81.0),
    create_food("Radish Leaves / Mullangi Aakulu (Cooked)", "ముల్లంగి ఆకుల కూర", "Leafy Greens", "cup", 100, 25, 2.0, 3.8, 0.5, fiber=2.0, ca=240, fe=3.8, k=300),
    create_food("Mustard Greens / Sarson (Raw)", "ఆవ ఆకులు (పచ్చివి)", "Leafy Greens", "cup", 56, 27, 2.9, 4.7, 0.4, fiber=3.2, ca=115, fe=1.6, k=384, vit_c=70.0),
    create_food("Mustard Greens / Sarson (Cooked)", "ఆవ ఆకుల కూర", "Leafy Greens", "cup", 140, 26, 2.7, 4.5, 0.5, fiber=2.8, ca=104, fe=1.4, k=282, vit_c=25.0),
    create_food("Bathua / Chenopodium Leaves (Raw)", "పప్పుకూర / బథువా ఆకులు", "Leafy Greens", "cup", 50, 30, 3.7, 4.0, 0.7, fiber=3.0, ca=280, fe=4.0, k=450),
    create_food("Dill Leaves / Sabbasige / Soya Kura (Raw)", "సోయా కూర (పచ్చిది)", "Leafy Greens", "cup", 50, 43, 3.5, 7.0, 1.1, fiber=2.1, ca=208, fe=6.6, k=738, vit_c=85.0),
    create_food("Colocasia Leaves / Chamadumpa Aakulu (Raw)", "చామదుంప ఆకులు (పచ్చివి)", "Leafy Greens", "cup", 50, 42, 4.4, 6.7, 0.7, fiber=3.7, ca=107, fe=2.2, k=460, vit_c=52.0),
    create_food("Purslane / Gangavayala Kura (Raw)", "గంగవాయల కూర / పప్పుకూర (పచ్చిది)", "Leafy Greens", "cup", 50, 16, 1.3, 3.4, 0.1, fiber=1.5, ca=65, fe=2.0, k=494, mg=68, vit_c=21.0),
    create_food("Chukkakura / Green Sorrel (Raw)", "చుక్కకూర (పచ్చిది)", "Leafy Greens", "cup", 50, 22, 2.0, 3.2, 0.5, fiber=2.0, ca=120, fe=2.5, k=390, vit_c=48.0),
    create_food("Ponnaganti Kura / Water Spinach (Raw)", "పొన్నగంటి కూర (పచ్చిది)", "Leafy Greens", "cup", 50, 19, 2.6, 3.1, 0.2, fiber=2.1, ca=77, fe=1.7, k=312, vit_c=55.0),
    create_food("Avisa Kura / Agathi Leaves (Raw)", "అవిశ కూర (పచ్చిది)", "Leafy Greens", "cup", 50, 65, 8.4, 8.3, 1.4, fiber=2.2, ca=1130, fe=3.9, k=400, vit_c=73.0),
])

# ==============================================================================
# 5. FRUITS (FRESH, DRIED, LOCAL TELUGU VARIETIES)
# ==============================================================================
FOODS_TO_ADD.extend([
    create_food("Lime / Nimma Pandu (Fresh)", "నిమ్మ పండు", "Fruits", "piece", 45, 30, 0.7, 10.5, 0.2, fiber=2.8, ca=33, fe=0.6, k=102, vit_c=29.1),
    create_food("Pear / Berikkai (Fresh)", "బేరి పండు", "Fruits", "piece", 150, 57, 0.4, 15.2, 0.1, fiber=3.1, ca=9, fe=0.2, k=116, vit_c=4.3),
    create_food("Fresh Figs / Seema Athi Pandu", "మేడి పండు / అత్తి పండు (తాజాది)", "Fruits", "piece", 50, 74, 0.8, 19.2, 0.3, fiber=2.9, ca=35, fe=0.4, k=232, vit_c=2.0),
    create_food("Kiwi (Fresh)", "కివి పండు", "Fruits", "piece", 75, 61, 1.1, 14.7, 0.5, fiber=3.0, ca=34, fe=0.3, k=312, vit_c=92.7),
    create_food("Strawberry (Fresh)", "స్ట్రాబెర్రీ పండు", "Fruits", "cup", 150, 32, 0.7, 7.7, 0.3, fiber=2.0, ca=16, fe=0.4, k=153, vit_c=58.8),
    create_food("Blueberry (Fresh)", "బ్లూబెర్రీ పండు", "Fruits", "cup", 148, 57, 0.7, 14.5, 0.3, fiber=2.4, ca=6, fe=0.3, k=77, vit_c=9.7),
    create_food("Peach (Fresh)", "పీచ్ పండు", "Fruits", "piece", 150, 39, 0.9, 9.5, 0.3, fiber=1.5, ca=6, fe=0.3, k=190, vit_c=6.6),
    create_food("Plum / Regu Pandu (Fresh)", "ప్లమ్ / రేగు పండు", "Fruits", "piece", 65, 46, 0.7, 11.4, 0.3, fiber=1.4, ca=6, fe=0.2, k=157, vit_c=9.5),
    create_food("Apricot (Fresh)", "జల్దరు పండు / ఆప్రికాట్", "Fruits", "piece", 35, 48, 1.4, 11.1, 0.4, fiber=2.0, ca=13, fe=0.4, k=259, vit_c=10.0),
    create_food("Dragon Fruit / Pitaya (Fresh)", "డ్రాగన్ ఫ్రూట్", "Fruits", "piece", 250, 60, 1.2, 13.0, 0.0, fiber=2.9, ca=18, fe=0.7, k=350, vit_c=9.0),
    create_food("Totapuri Mango", "తోతాపురి మామిడి పండు", "Fruits", "piece", 250, 58, 0.7, 14.5, 0.3, fiber=1.5, ca=10, fe=0.2, k=160, vit_c=32.0),
    create_food("Dasheri Mango", "దశేరి మామిడి పండు", "Fruits", "piece", 200, 62, 0.8, 15.5, 0.4, fiber=1.6, ca=11, fe=0.2, k=170, vit_c=35.0),
    create_food("Alphonso Mango", "అల్ఫోన్సో మామిడి పండు", "Fruits", "piece", 220, 65, 0.8, 16.2, 0.4, fiber=1.7, ca=12, fe=0.2, k=180, vit_c=38.0),
    create_food("Indian Jujube / Ganga Regu Pandu", "గంగరేగు పండు", "Fruits", "piece", 20, 79, 1.2, 20.2, 0.2, fiber=3.0, ca=21, fe=0.5, k=250, vit_c=69.0),
    create_food("Bael / Bilva Pandu / Stone Apple", "మారేడు పండు / బిల్వ పండు", "Fruits", "piece", 150, 137, 1.8, 31.8, 0.3, fiber=2.9, ca=85, fe=0.7, k=600, vit_c=8.0),
    create_food("Wood Apple / Velaga Pandu", "వెలగ పండు", "Fruits", "piece", 120, 134, 7.1, 31.0, 0.6, fiber=5.0, ca=130, fe=0.6, k=580),
    create_food("Karonda / Vakkaya (Raw Fruit)", "వాక్కాయ (పచ్చిది)", "Fruits", "piece", 5, 42, 1.1, 10.0, 0.2, fiber=1.6, ca=21, fe=1.3, vit_c=9.0),
    create_food("Star Fruit / Kamrakh", "స్టార్ ఫ్రూట్ / కమరక్", "Fruits", "piece", 90, 31, 1.0, 6.7, 0.3, fiber=2.8, ca=3, fe=0.1, k=133, vit_c=34.4),
    create_food("Palmyra Fruit / Taati Munjalu (Fresh)", "తాటి ముంజలు", "Fruits", "piece", 40, 43, 0.8, 10.0, 0.1, fiber=1.0, ca=27, fe=1.0, k=150, na=10),
])

# ==============================================================================
# 6. NUTS & SEEDS
# ==============================================================================
FOODS_TO_ADD.extend([
    create_food("Almonds (Soaked & Peeled)", "నానబెట్టిన బాదం పప్పు", "Seeds & Nuts", "piece", 1.2, 570, 21.0, 20.0, 49.0, fiber=11.0, ca=260, fe=3.6, k=700, mg=260),
    create_food("Almonds (Dry Roasted)", "వేయించిన బాదం పప్పు", "Seeds & Nuts", "piece", 1.2, 595, 21.5, 21.0, 52.0, fiber=10.5, ca=265, fe=3.7, k=720, mg=270),
    create_food("Brazil Nuts", "బ్రెజిల్ నట్స్", "Seeds & Nuts", "piece", 4.0, 659, 14.3, 12.3, 67.1, fiber=7.5, ca=160, fe=2.4, k=659, mg=376),
    create_food("Hazelnuts", "హాజెల్ నట్స్", "Seeds & Nuts", "piece", 1.5, 628, 15.0, 16.7, 60.8, fiber=9.7, ca=114, fe=4.7, k=680, mg=163),
    create_food("Macadamia Nuts", "మకాడమియా నట్స్", "Seeds & Nuts", "piece", 2.5, 718, 7.9, 13.8, 75.8, fiber=8.6, ca=85, fe=3.7, k=368, mg=130),
    create_food("Pecans", "పీకాన్ నట్స్", "Seeds & Nuts", "piece", 2.0, 691, 9.2, 13.9, 72.0, fiber=9.6, ca=70, fe=2.5, k=410, mg=121),
    create_food("Pine Nuts / Chilgoza", "పైన్ నట్స్ / చిల్గోజా", "Seeds & Nuts", "tbsp", 10, 673, 13.7, 13.1, 68.4, fiber=3.7, ca=16, fe=5.5, k=597, mg=251),
    create_food("Chestnuts (Boiled / Roasted)", "చెస్టనట్స్", "Seeds & Nuts", "piece", 10, 131, 2.0, 27.8, 1.4, fiber=3.0, ca=19, fe=0.9, k=484),
    create_food("Masala Peanuts (Deep Fried)", "మసాలా వేరుశనగ పల్లీలు", "Snacks", "handful", 30, 590, 20.0, 25.0, 48.0, fiber=6.0, ca=80, fe=3.5, k=620, na=650),
    create_food("Peanut Butter (Smooth / Crunchy)", "పీనట్ బటర్", "Seeds & Nuts", "tbsp", 16, 588, 25.0, 20.0, 50.0, fiber=6.0, ca=43, fe=1.9, k=649, na=420),
    create_food("Watermelon Seeds (Magaz / Dry)", "పుచ్చ గింజల పప్పు (మగజ్)", "Seeds & Nuts", "tbsp", 10, 557, 28.3, 15.3, 47.4, fiber=4.0, ca=54, fe=7.3, k=648, mg=515, zn=10.2),
    create_food("Fennel Seeds / Sompu", "సోంపు గింజలు", "Spices & Condiments", "tsp", 3, 345, 15.8, 52.3, 14.9, fiber=39.8, ca=1196, fe=18.5, k=1694, mg=385),
    create_food("Poppy Seeds / Gasagasalu", "గసగసాలు", "Spices & Condiments", "tsp", 3, 525, 18.0, 28.1, 41.6, fiber=19.5, ca=1438, fe=9.8, k=719, mg=347),
    create_food("Carom Seeds / Ajwain / Vamu", "వాము", "Spices & Condiments", "tsp", 3, 305, 16.0, 43.0, 25.0, fiber=39.0, ca=1525, fe=13.7, k=1400),
    create_food("Nigella Seeds / Kalonji", "కలోంజి / నల్ల జీలకర్ర", "Spices & Condiments", "tsp", 3, 375, 18.0, 44.0, 22.0, fiber=10.0, ca=930, fe=66.0, k=1780),
    create_food("Garden Cress Seeds / Aliv / Adityalu", "ఆదిత్యాలు / అలీవ్ గింజలు", "Seeds & Nuts", "tbsp", 10, 454, 25.0, 33.0, 24.0, fiber=8.0, ca=377, fe=100.0, k=606, mg=430),
    create_food("Basil Seeds / Sabja Seeds", "సబ్జా గింజలు", "Seeds & Nuts", "tbsp", 10, 430, 14.8, 63.8, 13.8, fiber=22.6, ca=240, fe=7.5, k=160, mg=31.0),
])

# ==============================================================================
# 7. SPICES, MASALAS & COOKING OILS
# ==============================================================================
FOODS_TO_ADD.extend([
    create_food("Dry Red Chilli (Whole)", "ఎండు మిరపకాయలు", "Spices & Condiments", "piece", 2, 324, 10.6, 56.6, 5.8, fiber=28.7, ca=160, fe=7.8, k=1870),
    create_food("Guntur Chilli Powder", "గుంటూరు కారం పొడి", "Spices & Condiments", "tsp", 3, 290, 12.5, 54.0, 15.0, fiber=33.0, ca=150, fe=18.0, k=1980),
    create_food("Byadgi Chilli Powder", "బ్యాడ్గి కారం పొడి (రంగు కారం)", "Spices & Condiments", "tsp", 3, 275, 11.5, 58.0, 13.0, fiber=35.0, ca=160, fe=16.0, k=1900),
    create_food("Green Cardamom / Elakulu", "యాలకులు", "Spices & Condiments", "piece", 0.5, 311, 10.8, 68.5, 6.7, fiber=28.0, ca=383, fe=14.0, k=1119),
    create_food("Black Cardamom / Nalla Elakulu", "నల్ల యాలకులు (పెద్ద యాలకులు)", "Spices & Condiments", "piece", 2, 280, 8.5, 65.0, 5.5, fiber=26.0, ca=400, fe=12.0),
    create_food("Cinnamon / Dalchina Chekka", "దాల్చిన చెక్క", "Spices & Condiments", "stick", 3, 247, 4.0, 80.6, 1.2, fiber=53.1, ca=1002, fe=8.3, k=431),
    create_food("Cloves / Lavangalu", "లవంగాలు", "Spices & Condiments", "piece", 0.2, 274, 6.0, 65.5, 13.0, fiber=33.9, ca=632, fe=11.8, k=1020),
    create_food("Bay Leaf / Biryani Aaku", "బిర్యానీ ఆకు", "Spices & Condiments", "leaf", 1, 313, 7.6, 75.0, 8.4, fiber=26.3, ca=834, fe=43.0, k=529),
    create_food("Star Anise / Anasa Puvvu", "అనాస పువ్వు", "Spices & Condiments", "piece", 1.5, 337, 18.0, 50.0, 16.0, fiber=14.6, ca=646, fe=37.0, k=1441),
    create_food("Mace / Japatri", "జాపత్రి", "Spices & Condiments", "piece", 1, 475, 6.7, 50.5, 32.4, fiber=20.2, ca=252, fe=13.9, k=463),
    create_food("Nutmeg / Jajikaya", "జాజికాయ", "Spices & Condiments", "piece", 5, 525, 5.8, 49.3, 36.3, fiber=20.8, ca=184, fe=3.0, k=350),
    create_food("Asafoetida / Hing / Inguva", "ఇంగువ", "Spices & Condiments", "pinch", 0.5, 290, 4.0, 67.8, 1.1, fiber=4.1, ca=690, fe=39.0),
    create_food("Saffron / Kunkuma Puvvu", "కుంకుమ పువ్వు", "Spices & Condiments", "pinch", 0.1, 310, 11.4, 65.4, 5.9, fiber=3.9, ca=111, fe=11.1, k=1724),
    create_food("Kokum (Dry)", "కోకుం", "Spices & Condiments", "piece", 3, 60, 1.0, 14.0, 0.2, fiber=2.0, ca=25, fe=0.8),
    create_food("Sambar Powder", "సాంబార్ పొడి", "Spices & Condiments", "tbsp", 10, 335, 12.0, 55.0, 11.0, fiber=18.0, ca=310, fe=14.0, k=1100, na=400),
    create_food("Rasam Powder", "రసం పొడి", "Spices & Condiments", "tbsp", 10, 320, 11.5, 53.0, 10.0, fiber=17.0, ca=290, fe=15.0, k=1150, na=420),
    create_food("Garam Masala Powder", "గరం మసాలా పొడి", "Spices & Condiments", "tsp", 3, 350, 11.0, 52.0, 14.0, fiber=19.0, ca=400, fe=16.0, k=1200),
    create_food("Curry Powder (Indian Blend)", "కరి మసాలా పొడి", "Spices & Condiments", "tbsp", 10, 325, 12.7, 58.2, 13.8, fiber=33.2, ca=480, fe=29.6, k=1543),
    create_food("Idli Karam Podi", "ఇడ్లీ కారం పొడి", "Spices & Condiments", "tbsp", 15, 375, 18.0, 48.0, 12.0, fiber=12.0, ca=210, fe=6.5, k=620, na=680),
    create_food("Sesame Podi / Nuvvula Podi", "నువ్వుల పొడి", "Spices & Condiments", "tbsp", 15, 510, 16.5, 26.0, 38.0, fiber=10.0, ca=750, fe=11.0, k=480, na=550),
    create_food("Coconut Podi / Kobbari Podi", "కొబ్బరి పొడి", "Spices & Condiments", "tbsp", 15, 520, 10.0, 24.0, 42.0, fiber=12.0, ca=150, fe=4.5, k=420, na=580),
    create_food("Garlic Podi / Vellulli Karam", "వెల్లుల్లి కారం పొడి", "Spices & Condiments", "tbsp", 15, 310, 10.0, 48.0, 9.0, fiber=11.0, ca=180, fe=6.0, k=650, na=750),

    # Oils & Fats
    create_food("Sunflower Oil", "సన్‌ఫ్లవర్ నూనె", "Spices & Condiments", "tbsp", 14, 884, 0, 0, 100, sat_fat=10.3),
    create_food("Rice Bran Oil", "రైస్ బ్రాన్ నూనె", "Spices & Condiments", "tbsp", 14, 884, 0, 0, 100, sat_fat=19.7),
    create_food("Mustard Oil", "ఆవ నూనె", "Spices & Condiments", "tbsp", 14, 884, 0, 0, 100, sat_fat=11.6),
    create_food("Soybean Oil", "సోయాబీన్ నూనె", "Spices & Condiments", "tbsp", 14, 884, 0, 0, 100, sat_fat=15.6),
    create_food("Canola Oil", "కెనోలా నూనె", "Spices & Condiments", "tbsp", 14, 884, 0, 0, 100, sat_fat=7.0),
    create_food("Olive Oil (Extra Virgin)", "ఆలివ్ నూనె", "Spices & Condiments", "tbsp", 14, 884, 0, 0, 100, sat_fat=13.8),
    create_food("Corn Oil", "మొక్కజొన్న నూనె", "Spices & Condiments", "tbsp", 14, 884, 0, 0, 100, sat_fat=12.9),
    create_food("Safflower Oil", "కుసుమ నూనె", "Spices & Condiments", "tbsp", 14, 884, 0, 0, 100, sat_fat=9.0),
    create_food("Palm Oil", "పామ్ ఆయిల్", "Spices & Condiments", "tbsp", 14, 884, 0, 0, 100, sat_fat=49.3),
    create_food("Vanaspati / Dalda (Hydrogenated Fat)", "వనస్పతి / డాల్డా", "Spices & Condiments", "tbsp", 14, 884, 0, 0, 100, sat_fat=52.0),
    create_food("Desi Butter / Venna (Unsalted White Butter)", "వెన్న (తెల్ల వెన్న)", "Dairy", "tbsp", 14, 717, 0.9, 0.1, 81.1, sat_fat=51.4, chol=215),
    create_food("Buffalo Ghee", "గేదె నెయ్యి", "Spices & Condiments", "tsp", 5, 900, 0, 0, 100, sat_fat=65.0, chol=260),
    create_food("Fresh Dairy Cream (Malai)", "పాల మీగడ (మలై)", "Dairy", "tbsp", 15, 345, 2.2, 3.5, 37.0, sat_fat=23.0, chol=110),
    create_food("Coconut Cream / Thick Coconut Milk", "చిక్కని కొబ్బరి పాలు", "Dairy", "cup", 200, 230, 2.3, 5.5, 24.0, sat_fat=21.0, ca=16, fe=1.6, k=260),
])

# ==============================================================================
# 8. DAIRY & MILK PRODUCTS
# ==============================================================================
FOODS_TO_ADD.extend([
    create_food("Double-Toned Milk (1.5% Fat)", "డబుల్ టోన్డ్ పాలు", "Dairy", "glass", 200, 48, 3.2, 4.8, 1.5, ca=125, k=150, na=48),
    create_food("Skimmed Milk (0.5% Fat)", "వెన్న తీసిన పాలు (స్కిమ్డ్)", "Dairy", "glass", 200, 35, 3.4, 4.9, 0.5, ca=130, k=155, na=50),
    create_food("Greek Yogurt (Plain Unsweetened)", "గ్రీక్ యోగర్ట్", "Dairy", "cup", 150, 59, 10.0, 3.6, 0.4, ca=110, k=141, na=36),
    create_food("Lassi (Sweet)", "తీపి లస్సీ", "Beverage", "glass", 250, 85, 2.5, 14.5, 2.0, ca=95, k=120),
    create_food("Lassi (Salt / Spiced)", "ఉప్పు లస్సీ", "Beverage", "glass", 250, 45, 2.5, 4.0, 2.0, ca=95, k=120, na=180),
    create_food("Mango Lassi", "మామిడి లస్సీ", "Beverage", "glass", 250, 105, 2.6, 18.5, 2.2, ca=90, k=140),
    create_food("Cottage Cheese / Paneer (Pan-Fried)", "వేయించిన పన్నీర్", "Dairy", "cup", 100, 320, 18.0, 3.0, 26.0, ca=450, k=110),
    create_food("Processed Cheese (Slice/Block)", "చీజ్ (ప్రాసెస్డ్)", "Dairy", "slice", 20, 330, 18.0, 2.0, 27.0, ca=650, na=1200),
    create_food("Whole Milk Powder", "పాల పొడి (హోల్ మిల్క్)", "Dairy", "tbsp", 10, 496, 26.3, 38.4, 26.7, ca=912, k=1330, na=371),
    create_food("Condensed Milk (Sweetened)", "కండెన్స్డ్ మిల్క్", "Dairy", "tbsp", 20, 321, 7.9, 54.4, 8.7, ca=284, k=371, na=127),
    create_food("Khoa / Mawa (Unsweetened)", "కోవా / మావా", "Dairy", "piece", 30, 380, 14.5, 22.0, 26.0, ca=650, k=320),
    create_food("Shrikhand (Cardamom / Saffron)", "శ్రీఖండ్", "Sweets & Desserts", "cup", 100, 260, 7.0, 38.0, 9.0, ca=180, k=150),
    create_food("Curd Rice / Daddojanam (Temple / Home Style)", "దద్దోజనం / పెరుగన్నం (తాళింపుతో)", "Rice dishes", "cup", 200, 145, 3.8, 22.5, 4.5, fiber=0.5, ca=110, k=120, na=280),
])

# ==============================================================================
# 9. EGGS (RAW & COOKED)
# ==============================================================================
FOODS_TO_ADD.extend([
    create_food("Egg Yolk (Raw)", "కోడిగుడ్డు పచ్చసొన (పచ్చిది)", "Dairy & Eggs", "piece", 17, 322, 15.9, 3.6, 26.5, ca=129, fe=2.7, k=109, na=48, chol=1085),
    create_food("Egg Yolk (Boiled)", "ఉడకబెట్టిన గుడ్డు పచ్చసొన", "Dairy & Eggs", "piece", 17, 320, 15.8, 3.5, 26.0, ca=125, fe=2.6, k=105, chol=1080),
    create_food("Scrambled Egg / Plain Egg Bhurji", "గుడ్డు పొరుటు / భుర్జీ", "Non-vegetarian", "plate", 150, 165, 11.5, 2.0, 12.5, ca=65, fe=1.8, k=150, na=320, chol=320),
    create_food("Omelette (Plain / Indian Style with Onion)", "ఆమ్లెట్ (ఉల్లిపాయలతో)", "Non-vegetarian", "piece", 80, 180, 12.0, 2.5, 13.5, ca=60, fe=1.8, k=160, na=340, chol=350),
    create_food("Duck Egg (Whole Raw)", "బాతు గుడ్డు (పచ్చిది)", "Dairy & Eggs", "piece", 70, 185, 12.8, 1.5, 13.8, ca=64, fe=3.9, k=222, na=146, chol=884),
    create_food("Duck Egg (Boiled)", "ఉడకబెట్టిన బాతు గుడ్డు", "Dairy & Eggs", "piece", 70, 185, 12.8, 1.5, 13.8, ca=64, fe=3.9, k=222, chol=884),
    create_food("Quail Egg (Whole Raw)", "బటయేరు / కౌజు పిట్ట గుడ్డు (పచ్చిది)", "Dairy & Eggs", "piece", 9, 158, 13.0, 0.4, 11.1, ca=64, fe=3.7, k=132, chol=844),
    create_food("Quail Egg (Boiled)", "ఉడకబెట్టిన కౌజు పిట్ట గుడ్డు", "Dairy & Eggs", "piece", 9, 158, 13.0, 0.4, 11.1, ca=64, fe=3.7, k=132, chol=844),
])

# ==============================================================================
# 10. CHICKEN & POULTRY (RAW & COOKED)
# ==============================================================================
FOODS_TO_ADD.extend([
    create_food("Chicken Breast (Cooked / Grilled)", "చికెన్ బ్రెస్ట్ (వండినది / గ్రిల్డ్)", "Meat & Poultry", "piece", 150, 165, 31.0, 0, 3.6, sat_fat=1.0, ca=15, fe=1.0, k=330, na=74, chol=85),
    create_food("Chicken Thigh (Raw Boneless)", "చికెన్ థై / తొడ మాంసం (పచ్చిది)", "Meat & Poultry", "piece", 120, 140, 19.5, 0, 6.8, sat_fat=1.9, ca=12, fe=1.1, k=250, na=80, chol=80),
    create_food("Chicken Thigh (Cooked / Roasted)", "చికెన్ థై (వండినది)", "Meat & Poultry", "piece", 100, 190, 26.0, 0, 9.5, sat_fat=2.7, ca=14, fe=1.3, k=300, na=85, chol=95),
    create_food("Chicken Drumstick / Leg (Raw)", "చికెన్ లెగ్ పీస్ (పచ్చిది)", "Meat & Poultry", "piece", 100, 135, 19.0, 0, 6.5, sat_fat=1.8, ca=11, fe=1.1, k=240, na=85, chol=75),
    create_food("Chicken Drumstick / Leg (Cooked / Roasted)", "చికెన్ లెగ్ పీస్ (వండినది)", "Meat & Poultry", "piece", 80, 175, 24.5, 0, 8.5, sat_fat=2.3, ca=13, fe=1.2, k=280, na=90, chol=90),
    create_food("Chicken Wings (Raw)", "చికెన్ వింగ్స్ (పచ్చివి)", "Meat & Poultry", "piece", 60, 190, 18.0, 0, 13.0, sat_fat=3.7, ca=15, fe=1.0, k=210, na=80, chol=80),
    create_food("Chicken Wings (Cooked / Baked)", "చికెన్ వింగ్స్ (వండినవి)", "Meat & Poultry", "piece", 50, 240, 23.0, 0, 16.5, sat_fat=4.8, ca=18, fe=1.2, k=240, na=85, chol=95),
    create_food("Chicken Liver (Cooked / Fry)", "చికెన్ లివర్ వేపుడు", "Meat & Poultry", "cup", 120, 165, 24.0, 1.0, 6.5, sat_fat=2.1, ca=14, fe=12.0, k=280, na=110, chol=480),
    create_food("Chicken Gizzard (Raw)", "చికెన్ గిజ్జార్డ్ / బోన్లెస్ పార్ట్ (పచ్చిది)", "Meat & Poultry", "cup", 120, 94, 17.7, 0, 2.1, sat_fat=0.6, ca=11, fe=2.4, k=237, na=78, chol=194),
    create_food("Chicken Heart (Raw)", "చికెన్ గుండె (పచ్చిది)", "Meat & Poultry", "cup", 100, 153, 15.6, 0.7, 9.3, sat_fat=2.6, ca=19, fe=5.9, k=132, na=73, chol=136),
    create_food("Chicken Keema / Mince (Cooked)", "చికెన్ కీమా (వండినది)", "Meat & Poultry", "cup", 150, 185, 25.0, 1.0, 9.0, sat_fat=2.6, ca=15, fe=1.4, k=280, na=340, chol=90),
    create_food("Country Chicken / Natu Kodi (Cooked Curry)", "నాటు కోడి కూర (వండినది)", "Meat & Poultry", "cup", 200, 195, 25.0, 2.0, 10.0, sat_fat=2.8, ca=20, fe=2.0, k=290, na=360),
    create_food("Turkey Meat (Raw Breast)", "టర్కీ మాంసం (పచ్చిది)", "Meat & Poultry", "cup", 120, 114, 23.7, 0, 1.5, sat_fat=0.4, ca=14, fe=1.4, k=300, na=68, chol=62),
    create_food("Duck Meat (Raw with Skin)", "బాతు మాంసం (పచ్చిది)", "Meat & Poultry", "cup", 120, 201, 18.3, 0, 14.0, sat_fat=4.8, ca=12, fe=2.7, k=270, na=74, chol=84),
    create_food("Chicken 65 (Deep Fried Restaurant Style)", "చికెన్ 65", "Non-vegetarian", "plate", 150, 280, 22.0, 8.0, 18.0, sat_fat=3.8, ca=25, fe=1.5, k=260, na=580),
    create_food("Kodi Vepudu / Andhra Chicken Fry", "కోడి వేపుడు (ఆంధ్రా చికెన్ ఫ్రై)", "Non-vegetarian", "cup", 150, 260, 24.0, 4.0, 16.5, sat_fat=3.5, ca=22, fe=1.6, k=280, na=520),
    create_food("Chicken Roast (South Indian Style)", "చికెన్ రోస్ట్", "Non-vegetarian", "cup", 150, 230, 25.0, 3.5, 13.0, sat_fat=3.0, ca=20, fe=1.5, k=290, na=480),
    create_food("Chicken Pulao (Home Style)", "చికెన్ పులావ్", "Rice dishes", "plate", 300, 175, 9.5, 23.0, 5.0, fiber=0.8, ca=20, fe=1.2, k=160, na=360),
])

# ==============================================================================
# 11. MUTTON, GOAT & LAMB (RAW & COOKED)
# ==============================================================================
FOODS_TO_ADD.extend([
    create_food("Mutton / Goat Meat with Bone (Cooked Curry)", "మటన్ కూర (వండినది)", "Meat & Poultry", "cup", 200, 210, 22.0, 3.0, 12.5, sat_fat=4.8, ca=18, fe=3.2, k=320, na=380, chol=85),
    create_food("Mutton Boneless (Cooked / Sukka)", "మటన్ బోన్‌లెస్ (వండినది)", "Meat & Poultry", "cup", 150, 240, 26.0, 1.5, 14.5, sat_fat=5.8, ca=20, fe=3.5, k=340, na=390, chol=90),
    create_food("Goat Liver / Mutton Liver (Cooked / Fry)", "మటన్ లివర్ వేపుడు", "Meat & Poultry", "cup", 120, 190, 26.0, 4.0, 7.5, sat_fat=2.5, ca=16, fe=14.0, k=320, na=120, chol=420),
    create_food("Goat Kidney (Raw)", "మేక గుండెకాయ / కిడ్నీ (పచ్చిది)", "Meat & Poultry", "piece", 60, 105, 16.5, 0.8, 3.8, sat_fat=1.2, ca=13, fe=6.4, k=260, na=180, chol=410),
    create_food("Goat Brain / Bheja (Raw)", "మేక మెదడు / భేజా (పచ్చిది)", "Meat & Poultry", "piece", 100, 138, 10.5, 1.0, 10.3, sat_fat=2.5, ca=15, fe=2.3, k=280, chol=2100),
    create_food("Goat Brain Fry / Bheja Fry (Cooked)", "భేజా ఫ్రై (వండినది)", "Meat & Poultry", "cup", 120, 220, 12.0, 2.5, 18.0, sat_fat=4.5, ca=20, fe=2.5, k=290, chol=1800),
    create_food("Goat Trotters / Paya Soup (Cooked)", "పాయా సూప్ / కాళ్ళ చారు", "Meat & Poultry", "cup", 200, 110, 12.0, 1.5, 6.0, sat_fat=2.2, ca=85, fe=1.8, k=180, na=420),
    create_food("Mutton Keema / Mince (Cooked)", "మటన్ కీమా (వండినది)", "Meat & Poultry", "cup", 150, 225, 23.0, 2.0, 14.0, sat_fat=5.5, ca=18, fe=3.2, k=310, na=380, chol=88),
    create_food("Mutton Chops (Cooked / Tawa Roast)", "మటన్ చాప్స్ (వండినవి)", "Meat & Poultry", "piece", 80, 250, 24.0, 1.0, 16.5, sat_fat=6.5, ca=20, fe=3.0, k=320, chol=95),
    create_food("Rayalaseema Mutton Curry", "రాయలసీమ మటన్ కూర", "Meat & Poultry", "cup", 200, 230, 22.0, 3.5, 14.0, sat_fat=5.2, ca=22, fe=3.4, k=340, na=410),
    create_food("Mutton Vepudu / Andhra Mutton Fry", "మటన్ వేపుడు", "Meat & Poultry", "cup", 150, 270, 25.0, 3.0, 17.5, sat_fat=6.8, ca=20, fe=3.3, k=330, na=450),
])

# ==============================================================================
# 12. FISH & SEAFOOD (RAW & COOKED)
# ==============================================================================
FOODS_TO_ADD.extend([
    create_food("Mrigal Fish (Raw)", "మిరిగల్ చేప (పచ్చిది)", "Fish & Seafood", "cup", 100, 100, 19.5, 0, 2.0, sat_fat=0.5, ca=35, fe=1.1, k=280, na=65),
    create_food("Tilapia (Raw)", "తిలాపియా చేప (పచ్చిది)", "Fish & Seafood", "piece", 120, 96, 20.1, 0, 1.7, sat_fat=0.6, ca=10, fe=0.6, k=302, na=52),
    create_food("Tilapia (Grilled / Cooked)", "తిలాపియా గ్రిల్డ్", "Fish & Seafood", "piece", 100, 128, 26.0, 0, 2.7, sat_fat=0.9, ca=14, fe=0.7, k=380, na=56),
    create_food("Pangasius / Basa (Raw)", "బాసా చేప (పచ్చిది)", "Fish & Seafood", "piece", 120, 90, 15.0, 0, 3.0, sat_fat=1.0, ca=15, fe=0.5, k=250, na=60),
    create_food("Murrel / Korameenu (Raw)", "కొరమీను చేప (పచ్చిది)", "Fish & Seafood", "piece", 150, 105, 20.5, 0, 2.2, sat_fat=0.6, ca=40, fe=1.2, k=310, na=65),
    create_food("Murrel / Korameenu Pulusu (Cooked)", "కొరమీను చేపల పులుసు", "Fish & Seafood", "cup", 200, 135, 18.5, 4.0, 5.0, sat_fat=1.0, ca=45, fe=1.4, k=320, na=360),
    create_food("Catfish / Marpu (Raw)", "మార్పు చేప (పచ్చిది)", "Fish & Seafood", "piece", 120, 105, 18.5, 0, 3.2, sat_fat=0.8, ca=25, fe=1.0, k=280),
    create_food("Sardine / Mathi (Raw)", "మత్తి / నూనె కవ్వళ్ళు చేప (పచ్చిది)", "Fish & Seafood", "piece", 50, 135, 19.5, 0, 6.0, sat_fat=1.5, ca=180, fe=2.2, k=340, na=90),
    create_food("Sardine / Mathi Curry (Cooked)", "మత్తి చేపల కూర", "Fish & Seafood", "cup", 150, 165, 18.0, 3.5, 8.5, sat_fat=2.0, ca=190, fe=2.4, k=350, na=340),
    create_food("Mackerel / Kanagurtha (Raw)", "కనగుర్త చేప (పచ్చిది)", "Fish & Seafood", "piece", 100, 160, 20.0, 0, 8.5, sat_fat=2.2, ca=40, fe=1.4, k=330, na=80),
    create_food("Mackerel Fry (Cooked)", "కనగుర్త చేప వేపుడు", "Fish & Seafood", "piece", 80, 210, 22.0, 2.0, 12.5, sat_fat=3.0, ca=45, fe=1.6, k=340, na=360),
    create_food("Tuna (Raw Fresh)", "ట్యూనా చేప (పచ్చిది)", "Fish & Seafood", "piece", 100, 130, 28.0, 0, 1.3, sat_fat=0.4, ca=10, fe=1.3, k=440, na=45),
    create_food("Tuna Canned in Water (Drained)", "క్యాన్డ్ ట్యూనా", "Fish & Seafood", "cup", 150, 116, 25.5, 0, 1.0, sat_fat=0.3, ca=11, fe=1.5, k=237, na=330),
    create_food("Hilsa / Ilish (Raw)", "పులస చేప / ఇలిష్ (పచ్చిది)", "Fish & Seafood", "piece", 120, 220, 17.5, 0, 16.5, sat_fat=4.5, ca=180, fe=2.1, k=310, na=70),
    create_food("Anchovy / Nethallu (Raw)", "నెత్తళ్ళు చేపలు (పచ్చివి)", "Fish & Seafood", "cup", 100, 100, 20.0, 0, 2.0, sat_fat=0.5, ca=250, fe=3.0, k=320, na=100),
    create_food("Anchovy Fry / Nethallu Vepudu (Cooked)", "నెత్తళ్ళ వేపుడు", "Fish & Seafood", "cup", 100, 190, 22.0, 3.0, 10.0, sat_fat=2.0, ca=260, fe=3.2, k=330, na=420),
    create_food("Salmon (Raw)", "సాల్మన్ చేప (పచ్చిది)", "Fish & Seafood", "piece", 120, 142, 20.0, 0, 6.3, sat_fat=1.0, ca=12, fe=0.8, k=363, na=50),
    create_food("Salmon (Cooked / Pan Seared)", "సాల్మన్ గ్రిల్డ్", "Fish & Seafood", "piece", 100, 180, 25.0, 0, 8.5, sat_fat=1.5, ca=15, fe=1.0, k=420, na=60),
    create_food("Fish Fry (South Indian Rava/Masala Fry)", "చేపల వేపుడు", "Fish & Seafood", "piece", 100, 210, 21.0, 4.0, 12.0, sat_fat=2.5, ca=40, fe=1.4, k=310, na=420),
    create_food("Fish Biryani", "చేపల బిర్యానీ", "Rice dishes", "plate", 350, 160, 9.0, 22.0, 4.0, fiber=0.7, ca=30, fe=1.2, k=180, na=340),

    # Seafood & Shellfish
    create_food("Royyala Vepudu (Andhra Prawn Fry)", "రొయ్యల వేపుడు", "Fish & Seafood", "cup", 150, 180, 24.0, 4.0, 7.5, sat_fat=1.2, ca=65, fe=2.0, na=480),
    create_food("Royyala Pulusu (Prawn Tangy Curry)", "రొయ్యల పులుసు", "Fish & Seafood", "cup", 200, 125, 18.0, 5.0, 3.8, sat_fat=0.7, ca=60, fe=1.8, na=420),
    create_food("Crab / Peethalu (Raw Edible Meat)", "పీతలు (పచ్చి మాంసం)", "Fish & Seafood", "cup", 100, 87, 18.1, 0, 1.1, sat_fat=0.2, ca=89, fe=0.7, k=329, na=293),
    create_food("Crab Curry / Peethala Iguru", "పీతల ఇగురు / కూర", "Fish & Seafood", "cup", 200, 130, 17.5, 4.0, 5.0, sat_fat=0.9, ca=95, fe=1.1, na=440),
    create_food("Lobster (Raw Meat)", "రాతి రొయ్య / లాబ్‌స్టర్ (పచ్చిది)", "Fish & Seafood", "piece", 150, 90, 19.0, 0.5, 0.9, sat_fat=0.2, ca=96, fe=0.3, k=230, na=296),
    create_food("Squid / Cuttlefish (Raw)", "స్క్విడ్ / సముద్రపు చేప (పచ్చిది)", "Fish & Seafood", "cup", 100, 92, 15.6, 3.1, 1.4, sat_fat=0.4, ca=32, fe=0.7, k=246, na=44),
    create_food("Mussels (Raw Meat)", "చిప్పలు / కల్వాయిలు (పచ్చివి)", "Fish & Seafood", "cup", 100, 86, 11.9, 3.7, 2.2, sat_fat=0.4, ca=26, fe=4.0, k=268, na=286),
    create_food("Clams / Oysters (Raw)", "ముత్యపు చిప్పలు (పచ్చివి)", "Fish & Seafood", "cup", 100, 68, 7.0, 3.9, 2.5, sat_fat=0.6, ca=45, fe=7.0, k=156, na=90),
])

# ==============================================================================
# 13. REGIONAL BREAKFASTS, RICE, CURRIES & SWEETS
# ==============================================================================
FOODS_TO_ADD.extend([
    # Breakfast
    create_food("Ragi Idli (Steamed)", "రాగి ఇడ్లీ", "Breakfast", "piece", 60, 120, 3.8, 24.0, 0.8, fiber=2.8, ca=85, fe=1.2, na=130),
    create_food("Ragi Dosa", "రాగి దోస", "Breakfast", "piece", 80, 160, 4.2, 28.0, 3.5, fiber=3.2, ca=110, fe=1.5, na=160),
    create_food("Millet Idli", "మిల్లెట్ ఇడ్లీ", "Breakfast", "piece", 60, 115, 4.0, 23.0, 0.7, fiber=2.5, ca=20, fe=1.1, na=120),
    create_food("Millet Dosa", "మిల్లెట్ దోస", "Breakfast", "piece", 80, 155, 4.5, 27.0, 3.2, fiber=3.0, ca=25, fe=1.4, na=150),
    create_food("Adai (Mixed Lentil Dosa)", "అడై (పప్పుల దోస)", "Breakfast", "piece", 90, 190, 7.5, 28.0, 5.5, fiber=4.5, ca=45, fe=2.2, na=210),
    create_food("Korra Upma (Foxtail Millet Upma)", "కొర్ర ఉప్మా", "Breakfast", "cup", 180, 170, 5.2, 28.0, 4.2, fiber=3.8, ca=25, fe=1.8, na=240),
    create_food("Mysore Bonda", "మైసూర్ బోండా", "Breakfast", "piece", 50, 180, 3.5, 22.0, 8.8, fiber=1.2, na=220),

    # Rice
    create_food("Lemon Rice / Nimmakaya Pulihora", "నిమ్మకాయ పులిహోర", "Rice dishes", "cup", 200, 185, 3.5, 34.0, 4.5, fiber=1.2, ca=25, fe=1.0, na=340),
    create_food("Jeera Rice (with Ghee)", "జీరా రైస్", "Rice dishes", "cup", 200, 175, 3.2, 31.0, 4.5, fiber=1.0, ca=30, fe=1.4, na=280),
    create_food("Ghee Rice / Neyyi Annam", "నెయ్యి అన్నం", "Rice dishes", "cup", 200, 210, 3.2, 32.0, 7.5, fiber=0.8, ca=20, fe=0.8, na=260),
    create_food("Veg Fried Rice (Indo-Chinese)", "వెజ్ ఫ్రైడ్ రైస్", "Restaurant & Fast Foods", "plate", 250, 170, 3.8, 28.0, 4.8, fiber=1.8, ca=25, fe=1.1, na=450),
    create_food("Schezwan Fried Rice", "షెజ్వాన్ ఫ్రైడ్ రైస్", "Restaurant & Fast Foods", "plate", 250, 185, 4.0, 29.0, 6.0, fiber=2.0, ca=28, fe=1.3, na=520),
    create_food("Egg Biryani", "ఎగ్ బిర్యానీ", "Rice dishes", "plate", 350, 170, 6.5, 26.0, 4.5, fiber=1.2, ca=35, fe=1.5, na=380),
    create_food("Vegetable Pulao", "వెజ్ పులావ్", "Rice dishes", "cup", 200, 160, 3.5, 28.0, 3.8, fiber=2.2, ca=30, fe=1.2, na=320),

    # Pappu & Curries
    create_food("Mudda Pappu (Thick Toor Dal with Ghee)", "ముద్దపప్పు (నెయ్యితో)", "Dal", "cup", 150, 145, 9.0, 18.0, 4.0, fiber=4.5, ca=35, fe=2.0, na=250),
    create_food("Tomato Pappu (Andhra Style)", "టమాటో పప్పు", "Dal", "cup", 200, 85, 4.8, 12.0, 2.0, fiber=3.0, ca=32, fe=1.4, na=280),
    create_food("Beerakaya Pappu (Ridge Gourd Dal)", "బీరకాయ పప్పు", "Dal", "cup", 200, 80, 4.5, 11.5, 1.8, fiber=2.8, ca=30, fe=1.3, na=270),
    create_food("Bachali Kura Pappu (Malabar Spinach Dal)", "బచ్చలికూర పప్పు", "Dal", "cup", 200, 88, 5.0, 12.0, 2.0, fiber=3.2, ca=65, fe=1.8, na=280),
    create_food("Dal Tadka (Restaurant Style)", "దాల్ తడ్కా", "Dal", "cup", 200, 120, 6.0, 14.5, 4.5, fiber=3.5, ca=40, fe=1.8, na=340),
    create_food("Dal Makhani (Black Dal with Butter)", "దాల్ మఖానీ", "Restaurant & Fast Foods", "cup", 200, 165, 6.8, 16.0, 8.5, fiber=4.2, ca=75, fe=2.5, na=380),
    create_food("Vankaya Pulusu (Brinjal Tangy Stew)", "వంకాయ పులుసు", "Vegetables", "cup", 200, 58, 1.2, 8.5, 2.2, fiber=2.2, ca=25, fe=0.6, na=310),
    create_food("Kakarakaya Vepudu (Bitter Gourd Fry)", "కాకరకాయ వేపుడు", "Vegetables", "cup", 120, 145, 2.0, 12.0, 10.0, fiber=3.5, ca=30, fe=0.8, na=290),
    create_food("Kakarakaya Pulusu (Sweet & Sour Bitter Gourd)", "కాకరకాయ పులుసు / బెల్లం పులుసు", "Vegetables", "cup", 200, 95, 1.8, 16.0, 2.5, fiber=2.8, ca=35, fe=0.8, na=320),
    create_food("Munagakaya Kura (Drumstick Masala Curry)", "మునగకాయ కూర", "Vegetables", "cup", 150, 85, 2.8, 10.0, 3.8, fiber=3.0, ca=40, fe=0.8, na=290),
    create_food("Carrot Beans Poriyal / Kura", "క్యారెట్ బీన్స్ వేపుడు", "Vegetables", "cup", 130, 75, 2.0, 8.5, 3.8, fiber=3.2, ca=45, fe=0.8, na=260),
    create_food("Chikkudukaya Kura (Broad Beans Curry)", "చిక్కుడుకాయ కూర", "Vegetables", "cup", 150, 90, 4.5, 11.0, 3.2, fiber=4.2, ca=65, fe=1.5, na=280),

    # Chutneys & Pachadi
    create_food("Tomato Pachadi (Roti Pachadi)", "టమాటో రోటి పచ్చడి", "Pachadi & Chutneys", "tbsp", 20, 95, 1.8, 8.0, 6.2, fiber=2.0, ca=25, fe=1.0, na=450),
    create_food("Vankaya Pachadi (Roasted Brinjal Chutney)", "వంకాయ రోటి పచ్చడి", "Pachadi & Chutneys", "tbsp", 20, 80, 1.5, 6.5, 5.5, fiber=2.2, ca=20, fe=0.8, na=420),
    create_food("Dosakaya Pachadi", "దోసకాయ రోటి పచ్చడి", "Pachadi & Chutneys", "tbsp", 20, 75, 1.4, 6.0, 5.0, fiber=1.8, ca=22, fe=0.7, na=410),
    create_food("Beerakaya Thokku Pachadi (Ridge Gourd Peel Chutney)", "బీరకాయ పొట్టు పచ్చడి", "Pachadi & Chutneys", "tbsp", 20, 85, 1.8, 6.5, 5.8, fiber=3.0, ca=30, fe=1.2, na=430),
    create_food("Dondakaya Pachadi", "దొండకాయ పచ్చడి", "Pachadi & Chutneys", "tbsp", 20, 80, 1.5, 6.0, 5.5, fiber=2.0, ca=25, fe=0.9, na=420),
    create_food("Green Chilli Chutney / Pachi Mirapakaya Tokku", "పచ్చి మిరపకాయల తొక్కు", "Pachadi & Chutneys", "tsp", 10, 90, 1.5, 8.0, 6.0, fiber=2.0, ca=20, fe=1.5, na=550),

    # Rasam, Sambar & Charu
    create_food("Tomato Rasam", "టమాటో రసం", "Sambar & Rasam", "cup", 200, 35, 1.0, 6.0, 0.8, fiber=0.8, ca=18, fe=0.6, k=160, na=310),
    create_food("Lemon Rasam / Nimmakaya Charu", "నిమ్మకాయ రసం", "Sambar & Rasam", "cup", 200, 30, 0.8, 5.5, 0.6, fiber=0.5, ca=16, fe=0.5, k=130, na=300),
    create_food("Garlic Rasam / Vellulli Charu", "వెల్లుల్లి చారు", "Sambar & Rasam", "cup", 200, 42, 1.5, 7.0, 1.0, fiber=0.8, ca=25, fe=0.8, k=170, na=320),
    create_food("Pappu Charu (Andhra Style Dal Soup)", "పప్పు చారు", "Sambar & Rasam", "cup", 200, 65, 3.0, 10.0, 1.5, fiber=1.8, ca=35, fe=1.2, k=210, na=340),

    # Snacks & Sweets
    create_food("Onion Pakoda", "ఉల్లిపాయ పకోడి", "Snacks", "plate", 100, 315, 6.5, 32.0, 18.0, fiber=3.5, ca=40, fe=2.2, na=380),
    create_food("Mirchi Bajji (Andhra Style Stuffed)", "మిరపకాయ బజ్జి", "Snacks", "piece", 60, 160, 3.5, 18.0, 8.5, fiber=2.0, ca=30, fe=1.5, na=310),
    create_food("Janthikalu / Murukulu", "జంతికలు / మురుకులు", "Snacks", "piece", 25, 125, 2.2, 15.0, 6.5, fiber=0.8, na=180),
    create_food("Gavvalu (Sweet Jaggery Shells)", "తీపి గవ్వలు (బెల్లం)", "Snacks", "piece", 15, 68, 1.1, 11.5, 2.0, ca=12, fe=0.8),
    create_food("Poornam Boorelu", "పూర్ణం బూరెలు", "Sweets & Desserts", "piece", 50, 175, 3.2, 28.0, 5.8, fiber=1.5, ca=25, fe=1.2),
    create_food("Ariselu (Jaggery & Rice Flour Sweet with Ghee)", "అరిసెలు (నేతి అరిసెలు)", "Sweets & Desserts", "piece", 45, 195, 2.0, 32.0, 7.0, ca=30, fe=1.8),
    create_food("Pootharekulu (Paper Sweet with Sugar/Jaggery)", "పూతరేకులు (బెల్లం / డ్రై ఫ్రూట్స్)", "Sweets & Desserts", "piece", 30, 140, 2.0, 22.0, 5.0, ca=18, fe=0.9),
    create_food("Kajjikayalu (Coconut Stuffed Puffs)", "కజ్జికాయలు", "Sweets & Desserts", "piece", 40, 185, 3.0, 24.0, 8.5, ca=15, fe=1.0),
    create_food("Kobbari Louz (Coconut Jaggery Balls)", "కొబ్బరి లౌజ్ / ఉండలు", "Sweets & Desserts", "piece", 30, 130, 1.5, 18.0, 6.0, fiber=2.0, ca=18, fe=1.1),
    create_food("Rice Payasam / Paramannam (with Jaggery & Ghee)", "పరమాన్నం (బెల్లం క్షీరాన్నం)", "Sweets & Desserts", "cup", 150, 240, 4.0, 42.0, 6.5, ca=85, fe=1.5),
    create_food("Besan Laddu", "శనగపిండి లడ్డు", "Sweets & Desserts", "piece", 40, 205, 4.2, 23.0, 11.0, ca=22, fe=1.4),
    create_food("Boondi Laddu", "బూందీ లడ్డు", "Sweets & Desserts", "piece", 45, 215, 3.5, 28.0, 10.0, ca=20, fe=1.2),
    create_food("Rava Laddu", "రవ్వ లడ్డు", "Sweets & Desserts", "piece", 35, 160, 2.5, 24.0, 6.0, ca=18, fe=0.8),
    create_food("Mysore Pak (Ghee)", "మైసూర్ పాక్ (నెయ్యి)", "Sweets & Desserts", "piece", 40, 220, 2.8, 22.0, 14.0, ca=25, fe=1.0),
    create_food("Gulab Jamun", "గులాబ్ జామూన్", "Sweets & Desserts", "piece", 40, 145, 2.5, 24.0, 4.5, ca=55, fe=0.4),
    create_food("Jalebi", "జిలేబీ", "Sweets & Desserts", "piece", 30, 130, 1.0, 24.0, 3.5, ca=12, fe=0.5),
    create_food("Rasgulla", "రసగుల్లా", "Sweets & Desserts", "piece", 50, 110, 3.5, 22.0, 1.0, ca=90, fe=0.3),
    create_food("Rasmalai", "రసమలై", "Sweets & Desserts", "piece", 60, 170, 5.0, 22.0, 7.0, ca=150, fe=0.4),
    create_food("Carrot Halwa / Gajar Ka Halwa", "క్యారెట్ హల్వా", "Sweets & Desserts", "cup", 120, 210, 3.5, 30.0, 8.5, fiber=2.0, ca=95, fe=1.1),
    create_food("Suji Halwa / Kesari (with Ghee)", "రవ్వ కేసరి / హల్వా", "Sweets & Desserts", "cup", 120, 240, 3.0, 38.0, 8.5, ca=20, fe=0.8),

    # Pickles
    create_food("Nimmakaya Pachadi (Lemon Pickle with Oil)", "నిమ్మకాయ పచ్చడి", "Pickles", "tbsp", 20, 120, 1.2, 8.0, 9.5, fiber=1.5, na=2400),
    create_food("Allam Nilva Pachadi (Ginger Pickle)", "అల్లం నిల్వ పచ్చడి", "Pickles", "tbsp", 20, 145, 1.5, 16.0, 8.5, fiber=1.2, na=2200),
    create_food("Pandumirchi Pachadi (Red Ripe Chilli Pickle)", "పండుమిరపకాయ పచ్చడి", "Pickles", "tbsp", 20, 150, 2.0, 12.0, 10.5, fiber=2.5, na=2600),
    create_food("Usirikaya Pachadi (Whole Amla Pickle with Oil)", "ఉసిరికాయ పచ్చడి", "Pickles", "tbsp", 20, 135, 1.1, 10.0, 10.0, fiber=2.0, vit_c=80.0, na=2300),

    # Indian Breads & Restaurant Foods
    create_food("Phulka (Oil-Free Puffed Roti)", "పుల్కా (నూనె లేకుండా)", "Breads", "piece", 30, 70, 2.8, 15.0, 0.4, fiber=2.4, ca=10, fe=0.9, k=75),
    create_food("Tandoori Roti (Whole Wheat)", "తందూరి రొట్టె", "Breads", "piece", 45, 115, 3.8, 24.0, 0.7, fiber=3.5, ca=15, fe=1.2, k=110),
    create_food("Plain Naan", "ప్లెయిన్ నాన్", "Breads", "piece", 80, 240, 7.0, 42.0, 5.0, fiber=2.0, ca=40, fe=2.0, na=360),
    create_food("Butter Naan", "బటర్ నాన్", "Breads", "piece", 90, 290, 7.2, 43.0, 10.0, fiber=2.0, ca=45, fe=2.0, na=390),
    create_food("Garlic Naan", "గార్లిక్ నాన్", "Breads", "piece", 90, 275, 7.5, 44.0, 8.0, fiber=2.2, ca=48, fe=2.1, na=410),
    create_food("Aloo Paratha (with Butter)", "ఆలూ పరోటా", "Breads", "piece", 120, 280, 5.5, 38.0, 12.0, fiber=3.5, ca=35, fe=2.0, na=380),
    create_food("Gobi Paratha", "గోబీ పరోటా", "Breads", "piece", 120, 250, 6.0, 35.0, 10.0, fiber=4.0, ca=40, fe=1.8, na=360),
    create_food("Paneer Paratha", "పన్నీర్ పరోటా", "Breads", "piece", 130, 320, 11.0, 36.0, 15.0, fiber=3.2, ca=180, fe=2.2, na=390),
    create_food("Methi Paratha", "మెంతి పరోటా", "Breads", "piece", 80, 210, 5.0, 28.0, 9.0, fiber=3.5, ca=70, fe=2.2, na=320),
    create_food("Lachha Paratha", "లచ్చా పరోటా", "Breads", "piece", 80, 260, 5.0, 32.0, 13.0, fiber=2.5, ca=20, fe=1.5, na=340),
    create_food("Bhatura (Deep Fried)", "భటూరా", "Breads", "piece", 90, 290, 6.5, 36.0, 14.0, fiber=1.8, na=310),
    create_food("Chole Bhature (1 Bhatura + Chole Curry)", "చోలే భటూరే", "Restaurant & Fast Foods", "plate", 300, 480, 14.0, 58.0, 22.0, fiber=8.5, ca=90, fe=4.5, na=720),
    create_food("Pav Bhaji (2 Pavs + Bhaji Curry)", "పావ్ భాజీ", "Restaurant & Fast Foods", "plate", 300, 410, 10.5, 56.0, 16.0, fiber=6.5, ca=80, fe=3.8, na=850),
    create_food("Chilli Chicken (Indo-Chinese)", "చిల్లీ చికెన్", "Restaurant & Fast Foods", "plate", 180, 240, 20.0, 11.0, 13.0, ca=25, fe=1.5, na=750),
    create_food("Chilli Paneer (Indo-Chinese)", "చిల్లీ పన్నీర్", "Restaurant & Fast Foods", "plate", 180, 280, 13.0, 14.0, 19.0, ca=280, fe=1.8, na=780),
    create_food("Gobi Manchurian (Dry/Gravy)", "గోబీ మంచూరియన్", "Restaurant & Fast Foods", "plate", 180, 210, 4.5, 24.0, 11.0, fiber=3.5, ca=35, fe=1.5, na=720),
    create_food("Paneer Butter Masala", "పన్నీర్ బటర్ మసాలా", "Restaurant & Fast Foods", "cup", 200, 310, 12.0, 12.0, 24.0, ca=310, fe=2.0, na=580),
    create_food("Butter Chicken / Murgh Makhani", "బటర్ చికెన్", "Restaurant & Fast Foods", "cup", 200, 280, 21.0, 9.0, 18.0, ca=45, fe=2.0, na=620),
    create_food("Makki Roti (Corn Flour Roti)", "మక్కీ రోటీ", "Breads", "piece", 60, 160, 3.8, 30.0, 3.0, fiber=3.2, ca=10, fe=1.6),
    create_food("Multigrain Roti", "మల్టీగ్రెయిన్ రొట్టె", "Breads", "piece", 40, 110, 4.0, 21.0, 1.2, fiber=3.8, ca=35, fe=1.8),

    # Beverages & Sugars
    create_food("Sattu Drink (Roasted Gram Flour with Spices)", "సత్తు పానీయం", "Beverage", "glass", 250, 120, 6.5, 18.0, 2.0, fiber=3.5, ca=30, fe=2.8, na=210),
    create_food("Sugarcane Juice / Cheruku Rasam (Fresh)", "చెరకు రసం", "Beverage", "glass", 250, 180, 0.5, 45.0, 0.1, ca=30, fe=1.2, k=140),
    create_food("Jaggery / Bellam", "బెల్లం", "Sugars & Sweeteners", "tbsp", 15, 383, 0.4, 95.0, 0.1, ca=80, fe=2.6, k=140, mg=40),
    create_food("Palm Jaggery / Thati Bellam", "తాటి బెల్లం", "Sugars & Sweeteners", "tbsp", 15, 375, 1.0, 92.0, 0.1, ca=120, fe=4.5, k=180, mg=55),
    create_food("Honey (Pure Natural)", "తేనె", "Sugars & Sweeteners", "tbsp", 21, 304, 0.3, 82.4, 0.0, ca=6, fe=0.4, k=52, na=4),
    create_food("White Sugar", "తెల్ల పంచదార", "Sugars & Sweeteners", "tsp", 4, 387, 0, 100.0, 0),
    create_food("Brown Sugar", "బ్రౌన్ షుగర్", "Sugars & Sweeteners", "tsp", 4, 380, 0.1, 98.0, 0, ca=83, fe=0.7, k=133),

    # Salt
    create_food("Table Salt (Iodized)", "ఉప్పు (అయోడైజ్డ్)", "Spices & Condiments", "tsp", 5, 0, 0, 0, 0, na=38758),
    create_food("Black Salt / Kala Namak", "నల్ల ఉప్పు", "Spices & Condiments", "tsp", 5, 0, 0, 0, 0, fe=12.0, na=36000),
    create_food("Rock Salt / Saindhava Lavanam", "సైంధవ లవణం (రాక్ సాల్ట్)", "Spices & Condiments", "tsp", 5, 0, 0, 0, 0, ca=40, fe=2.5, k=80, na=37000),
])

def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Load existing south_indian_foods.json
    json_path = os.path.join(os.path.dirname(__file__), "south_indian_foods.json")
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            all_foods_json = json.load(f)
    except Exception:
        all_foods_json = []

    existing_names_set = {x["name"].strip().lower() for x in all_foods_json}

    added_count = 0
    db_inserted = 0
    db_skipped = 0

    for item in FOODS_TO_ADD:
        norm_name = item["name"].strip().lower()
        if norm_name not in existing_names_set:
            all_foods_json.append(item)
            existing_names_set.add(norm_name)
            added_count += 1

        # Check DB
        db_rec = db.query(Food).filter(Food.name == item["name"].strip()).first()
        if not db_rec:
            food_kwargs = {
                "name": item["name"].strip(),
                "name_local": item.get("name_local", ""),
                "category": item.get("category", "General"),
                "source": "local",
                "source_id": None,
                "serving_size_g": 100,
                "serving_unit": item.get("serving_unit", "g"),
                "serving_unit_weight_g": item.get("serving_unit_weight_g", 100.0),
                "is_custom": False,
            }
            for k in NUTRIENT_KEYS:
                food_kwargs[k] = round(float(item.get(k, 0.0) or 0.0), 3)

            db.add(Food(**food_kwargs))
            db_inserted += 1
        else:
            db_skipped += 1

    db.commit()

    # Write back full JSON
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_foods_json, f, ensure_ascii=False, indent=2)

    total_local_in_db = db.query(Food).filter(Food.source == "local").count()
    print(f"Sync complete!")
    print(f"Added to JSON: {added_count} items (Total in JSON: {len(all_foods_json)})")
    print(f"Inserted into DB: {db_inserted} items (Skipped/Already in DB: {db_skipped})")
    print(f"Total Local Foods in DB: {total_local_in_db}")

    db.close()

if __name__ == "__main__":
    run()
