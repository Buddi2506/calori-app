from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/caloriedb"
    REDIS_URL: str = "redis://localhost:6379/0"
    USDA_API_KEY: str = "DEMO_KEY"
    OPEN_FOOD_FACTS_URL: str = "https://world.openfoodfacts.org"
    USDA_BASE_URL: str = "https://api.nal.usda.gov/fdc/v1"

    class Config:
        env_file = ".env"

settings = Settings()
