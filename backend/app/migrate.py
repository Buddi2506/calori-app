"""Bring the database schema up to date with Alembic on startup."""
import logging
import os

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from .database import engine

logger = logging.getLogger(__name__)

ALEMBIC_INI = os.path.join(os.path.dirname(__file__), "..", "alembic.ini")
BASELINE_REVISION = "0001"


def run_migrations() -> None:
    cfg = Config(ALEMBIC_INI)
    tables = set(inspect(engine).get_table_names())

    # Databases created before Alembic was in use already have the baseline tables
    # but no alembic_version row: record them as being at the baseline first.
    if "users" in tables and "alembic_version" not in tables:
        logger.info("Existing database without migration history; stamping baseline %s", BASELINE_REVISION)
        command.stamp(cfg, BASELINE_REVISION)

    command.upgrade(cfg, "head")
