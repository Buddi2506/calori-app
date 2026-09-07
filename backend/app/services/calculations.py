from ..models.food import Food

def calculate_nutrients(food: Food, quantity_g: float) -> dict:
    ratio = quantity_g / 100.0 if quantity_g else 0
    return {
        "calories": food.calories * ratio,
        "protein": food.protein * ratio,
        "carbohydrates": food.carbohydrates * ratio,
        "fat": food.fat * ratio,
        "fiber": food.fiber * ratio,
        "sodium": food.sodium * ratio,
        "potassium": food.potassium * ratio,
        "iron": food.iron * ratio,
        "calcium": food.calcium * ratio,
        "vitamin_c": food.vitamin_c * ratio,
        "vitamin_d": food.vitamin_d * ratio,
        "vitamin_b12": food.vitamin_b12 * ratio,
        "magnesium": food.magnesium * ratio,
        "zinc": food.zinc * ratio,
        "saturated_fat": food.saturated_fat * ratio,
        "cholesterol": food.cholesterol * ratio
    }
