from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./data/{{projectName}}.db"
    secret_key: str = "{{secretKey}}"
    cors_origins: list[str] = ["http://localhost:5173"]
    session_cookie_name: str = "session_token"
    session_expiry_days: int = 30

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
