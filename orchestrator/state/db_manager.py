from __future__ import annotations

import json
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Any


class StateDatabase:
    def __init__(self, db_path: str | Path) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _get_connection(self) -> sqlite3.Connection:
        connection = sqlite3.connect(str(self.db_path))
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        connection = self._get_connection()
        try:
            connection.execute("PRAGMA journal_mode=WAL;")
            connection.execute("PRAGMA synchronous=NORMAL;")
            connection.execute("PRAGMA wal_autocheckpoint=1000;")
            connection.execute("PRAGMA foreign_keys=ON;")
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS state (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
                """
            )
        finally:
            connection.close()

    @contextmanager
    def transaction(self) -> Iterator[sqlite3.Connection]:
        connection = self._get_connection()
        try:
            connection.execute("BEGIN IMMEDIATE")
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def upsert(self, key: str, value: Any) -> None:
        serialized_value = json.dumps(value)
        with self.transaction() as connection:
            connection.execute(
                """
                INSERT INTO state (key, value)
                VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (key, serialized_value),
            )

    def get(self, key: str) -> Any | None:
        connection = self._get_connection()
        try:
            row = connection.execute(
                "SELECT value FROM state WHERE key = ?",
                (key,),
            ).fetchone()
        finally:
            connection.close()

        if row is None:
            return None

        raw_value = row["value"]
        try:
            return json.loads(raw_value)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Malformed JSON stored for key '{key}'") from exc

    def delete(self, key: str) -> bool:
        with self.transaction() as connection:
            cursor = connection.execute("DELETE FROM state WHERE key = ?", (key,))
            return cursor.rowcount > 0

    def list_keys(self) -> list[str]:
        connection = self._get_connection()
        try:
            rows = connection.execute("SELECT key FROM state ORDER BY key ASC").fetchall()
        finally:
            connection.close()
        return [str(row["key"]) for row in rows]