#!/bin/bash

TARGET_25=19046
TARGET_50=38092
NOTIFIED_25=false
NOTIFIED_50=false

while true; do
  if [ -f sync-final.log ]; then
    CURRENT=$(grep -oP 'Pág \d+ \| \K\d+' sync-final.log | tail -1)
    
    if [ ! -z "$CURRENT" ]; then
      if [ "$CURRENT" -ge "$TARGET_25" ] && [ "$NOTIFIED_25" = false ]; then
        echo "🎯 25% ATINGIDO! ($CURRENT leads sincronizados)"
        NOTIFIED_25=true
      fi
      
      if [ "$CURRENT" -ge "$TARGET_50" ] && [ "$NOTIFIED_50" = false ]; then
        echo "🎯 50% ATINGIDO! ($CURRENT leads sincronizados)"
        NOTIFIED_50=true
      fi
      
      # Se atingiu 50%, pode parar o monitor
      if [ "$NOTIFIED_50" = true ]; then
        exit 0
      fi
    fi
  fi
  
  sleep 30
done
