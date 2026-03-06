#!/bin/bash

# RealtyFlow Deployment Script
echo "🚀 Initialiserer opplasting til https://github.com/freddybremseth-coder/RealtyFlow.git"

# Sjekk om git er initialisert
if [ ! -d ".git" ]; then
    git init
    git remote add origin https://github.com/freddybremseth-coder/RealtyFlow.git
else
    # Oppdater remote URL hvis den er feil
    current_remote=$(git remote get-url origin)
    if [ "$current_remote" != "https://github.com/freddybremseth-coder/RealtyFlow.git" ]; then
        git remote set-url origin https://github.com/freddybremseth-coder/RealtyFlow.git
        echo "Oppdatert remote-URL til https://github.com/freddybremseth-coder/RealtyFlow.git"
    fi
fi

# Legg til endringer
git add .

# Spør om commit-melding
echo "Skriv inn commit-melding (standard: 'Update from RealtyFlow AI'):"
read commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="Update from RealtyFlow AI"
fi

git commit -m "$commit_msg"

# Push
git branch -M main
git push -u origin main

echo "✅ Opplasting fullført!"
