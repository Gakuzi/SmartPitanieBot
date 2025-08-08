#!/bin/bash

STATUS="$1"
COMMIT="$2"

TEXT="✅ Синхронизация GAS завершена\nСтатус: $STATUS\nКоммит: $COMMIT"

curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d chat_id="${TELEGRAM_CHAT_ID}" \
  -d text="$TEXT"

