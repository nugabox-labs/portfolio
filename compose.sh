#!/usr/bin/env bash
set -euo pipefail

MODE="prod"
ACTION=""

for arg in "$@"; do
  case "$arg" in
    --dev) MODE="dev" ;;
    up) ACTION="up" ;;
    down) ACTION="down" ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: ./compose.sh [--dev] up|down"
      exit 1
      ;;
  esac
done

if [[ -z "$ACTION" ]]; then
  echo "Usage: ./compose.sh [--dev] up|down"
  exit 1
fi

# 1337~1339 범위에서 비어있는 첫 포트를 찾는다.
find_free_port() {
  local start="$1"
  local port="$start"
  while [[ "$port" -le 1339 ]]; do
    if ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "$port"
      return 0
    fi
    port=$((port + 1))
  done
  echo "$start"
}

if [[ "$MODE" == "dev" ]]; then
  COMPOSE_FILE="docker-compose.dev.yml"
  SERVICE_LABEL="개발(dev)"
  if [[ "$ACTION" == "up" ]]; then
    export DEV_PORT="${DEV_PORT:-$(find_free_port 1337)}"
  fi
else
  COMPOSE_FILE="docker-compose.yml"
  SERVICE_LABEL="운영(prod)"
  if [[ "$ACTION" == "up" ]]; then
    export PORT="${PORT:-$(find_free_port 1337)}"
  fi
fi

if [[ ! -f .env ]]; then
  echo "경고: .env 파일이 없습니다. .env.example을 참고해 .env를 먼저 만들어주세요."
fi

if [[ "$ACTION" == "up" ]]; then
  echo "[$SERVICE_LABEL] $COMPOSE_FILE 로 up -d --build"
  docker compose -f "$COMPOSE_FILE" up -d --build
  if [[ "$MODE" == "dev" ]]; then
    echo "-> http://localhost:${DEV_PORT}"
  else
    echo "-> http://localhost:${PORT}"
  fi
else
  echo "[$SERVICE_LABEL] $COMPOSE_FILE 로 down"
  docker compose -f "$COMPOSE_FILE" down
fi
