#!/bin/sh

# Substituir variáveis de ambiente no HTML
if [ ! -z "$API_URL" ]; then
  echo "Configurando API_URL: $API_URL"
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|window.API_URL=.*|window.API_URL="$API_URL";|g" {} \;
fi

exit 0