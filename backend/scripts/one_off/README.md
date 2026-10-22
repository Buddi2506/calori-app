# One-off scripts

These scripts were run once by hand to fix data in an existing database. Their changes are
already in the live database, and new installs get the same schema from Alembic migrations
(`backend/alembic/versions/`). They are kept for reference only.

| Script | What it did |
| --- | --- |
| `migration_users.py` | Added the `users` table and `user_id` columns, and moved existing records to the admin account. Now covered by migration `0001`. |
| `patch_micronutrients.py` | Corrected B12, D, zinc, magnesium and iron values and recalculated diary entries. |
| `patch_all_micronutrients.py` | Filled in fiber and mineral values from ICMR-NIN / IFCT tables. |
| `add_egg_white_boiled.py` | Added boiled egg white foods. |

Schema changes now go in a new migration instead of a script like these:

```bash
docker exec calori_backend alembic revision --autogenerate -m "describe the change"
```

The backend applies pending migrations automatically when it starts.
