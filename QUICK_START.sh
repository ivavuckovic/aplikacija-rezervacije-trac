#!/bin/bash

# ✂ Salon Lepote "Trač" — Quick Start Script
# Ovaj skript postavlja i pokreće sve servise

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✂ SALON LEPOTE TRAČ — QUICK START                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Check prerequisites
echo "📋 Provjera preduvjeta..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nije instaliran. Preuzmi sa https://nodejs.org"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker nije instaliran. Preuzmi sa https://www.docker.com"
    exit 1
fi

echo "✅ Node.js verzija: $(node --version)"
echo "✅ Docker verzija: $(docker --version)"
echo ""

# 2. Install dependencies
echo "📦 Instaliranje zavisnosti..."
npm install
echo "✅ Zavisnosti instalovane"
echo ""

# 3. Setup environment
echo "⚙️  Postavljanje .env fajla..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env kreiran iz .env.example"
        echo "⚠️  OBAVEZNO popuni EXCHANGE_RATE_KEY u .env fajlu!"
        echo "   Besplatan API: https://www.exchangerate-api.com"
    else
        echo "❌ .env.example nije pronađen"
        exit 1
    fi
else
    echo "✅ .env već postoji"
fi
echo ""

# 4. Start Docker Compose
echo "🐳 Pokretanje Docker Compose servisa..."
echo "   (Ovo može potrajati ~30 sekundi na prvi put)"
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Čekanje da se servisi inicijaliziraju..."
sleep 15

# 5. Check health
echo ""
echo "🏥 Provjera zdravlja servisa..."

for i in {1..10}; do
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        echo "✅ Backend A.1 je spreman"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "⚠️  Backend A.1 nije odgovara (pokušaj curl http://localhost:4000/health)"
    else
        echo "   ⏳ Čekanje Backend A.1... ($i/10)"
        sleep 3
    fi
done

for i in {1..10}; do
    if curl -s http://localhost:4001/health > /dev/null 2>&1; then
        echo "✅ Backend A.2 je spreman"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "⚠️  Backend A.2 nije odgovara (pokušaj curl http://localhost:4001/health)"
    else
        echo "   ⏳ Čekanje Backend A.2... ($i/10)"
        sleep 3
    fi
done

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ SALON TRAČ JE POKRENUT!                                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📱 Klijentski portal (Frontend A.1):"
echo "   http://localhost:3000"
echo ""
echo "📊 Reporting portal (Frontend A.2):"
echo "   http://localhost:3001"
echo ""
echo "🔌 Backend A.1 API:"
echo "   http://localhost:4000"
echo ""
echo "🔌 Backend A.2 API:"
echo "   http://localhost:4001"
echo ""
echo "🐰 RabbitMQ Management:"
echo "   http://localhost:15672"
echo "   Korisnik: trac_rabbit"
echo "   Lozinka: trac_rabbit_secret"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Dokumentacija:"
echo "   • README.md — Arhitektura i setup"
echo "   • CHECKLIST.md — Pre-pokretanja checklist"
echo "   • KORAK_14_FINISHED.md — Finalni status"
echo ""
echo "🛑 Za zaustavljanje servisa:"
echo "   npm run docker:down"
echo ""
echo "📋 Za logove:"
echo "   docker-compose logs -f backend-a1"
echo ""
