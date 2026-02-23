#!/bin/bash

# Fichier de test pour l'authentification API Kairos WebScan

echo "=== Test 1: Login ==="
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "gallagher@gmail.com", "password": "Gallagher09."}')

echo "Réponse complète:"
echo "$LOGIN_RESPONSE"
echo ""

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -oP '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Token extrait: $ACCESS_TOKEN"
else
  echo "Erreur: Impossible d'extraire le token"
  echo "$LOGIN_RESPONSE" | jq .
  exit 1
fi

echo ""
echo "=== Test 2: Récupérer le profil avec le token ==="
PROFILE_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/auth/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

echo "Réponse du profil:"
echo "$PROFILE_RESPONSE"
echo ""

STATUS=$(echo "$PROFILE_RESPONSE" | grep -oP '"status":[0-9]*')
if [ ! -z "$STATUS" ]; then
  echo "Status HTTP: $STATUS"
fi

echo ""
echo "=== Test 3: Récupérer les bannettes avec le token ==="
BANNETTES_RESPONSE=$(curl -s -X GET "http://localhost:8000/bannettes/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

echo "Réponse des bannettes:"
echo "$BANNETTES_RESPONSE"
echo ""

STATUS=$(echo "$BANNETTES_RESPONSE" | grep -oP '"status":[0-9]*')
if [ ! -z "$STATUS" ]; then
  echo "Status HTTP: $STATUS"
fi

echo ""
echo "=== Analyse du token JWT ==="
echo "Token décodé:"
echo "$ACCESS_TOKEN" | jq -R 'split(".") | .[0] | @base64d' 2>/dev/null || echo "Erreur de décodage"
