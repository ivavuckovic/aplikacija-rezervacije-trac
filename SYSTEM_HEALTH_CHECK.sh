#!/bin/bash

# ✂ Salon Lepote "Trač" — System Health Check
# Detaljne provjere nakon pokretanja Docker Compose

set +e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✂ SALON TRAČ — SYSTEM HEALTH CHECK                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

PASSED=0
FAILED=0

# Helper funkcije
check_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}

    echo -n "🔍 $name ... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $response)"
        ((FAILED++))
    fi
}

check_container() {
    local name=$1

    echo -n "📦 Docker container: $name ... "

    status=$(docker-compose ps $name 2>/dev/null | grep -c "Up")

    if [ $status -eq 1 ]; then
        echo -e "${GREEN}✓ Running${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Not running${NC}"
        ((FAILED++))
    fi
}

check_database() {
    local container=$1
    local user=$2
    local db=$3

    echo -n "🗄 Database: $db ... "

    result=$(docker-compose exec -T $container psql -U $user -d $db -c "SELECT 1" 2>&1 | grep -c "1 row")

    if [ $result -eq 1 ]; then
        echo -e "${GREEN}✓ Connected${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Connection failed${NC}"
        ((FAILED++))
    fi
}

check_redis() {
    echo -n "⚡ Redis ... "

    result=$(docker-compose exec -T redis redis-cli ping 2>&1)

    if [[ "$result" == "PONG" ]]; then
        echo -e "${GREEN}✓ OK${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Failed${NC}"
        ((FAILED++))
    fi
}

check_rabbitmq() {
    echo -n "🐰 RabbitMQ ... "

    result=$(curl -s -u trac_rabbit:trac_rabbit_secret http://localhost:15672/api/overview 2>/dev/null | grep -c "rabbitmq_version")

    if [ $result -eq 1 ]; then
        echo -e "${GREEN}✓ OK${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Failed${NC}"
        ((FAILED++))
    fi
}

# ────────────────────────────────────────────────────────
echo "📦 DOCKER CONTAINERS"
echo "────────────────────────────────────────────────────────"
check_container "postgres-a1"
check_container "postgres-a2"
check_container "redis"
check_container "rabbitmq"
check_container "backend-a1"
check_container "worker-a1"
check_container "backend-a2"
check_container "frontend-a1"
check_container "frontend-a2"
echo ""

# ────────────────────────────────────────────────────────
echo "💾 DATABASES"
echo "────────────────────────────────────────────────────────"
check_database "postgres-a1" "trac_user" "trac_salon_db"
check_database "postgres-a2" "trac_user" "trac_reporting_db"
echo ""

# ────────────────────────────────────────────────────────
echo "⚙️ INFRASTRUCTURE"
echo "────────────────────────────────────────────────────────"
check_redis
check_rabbitmq
echo ""

# ────────────────────────────────────────────────────────
echo "🌐 API ENDPOINTS"
echo "────────────────────────────────────────────────────────"
check_service "Backend A.1 Health" "http://localhost:4000/health" "200"
check_service "Backend A.2 Health" "http://localhost:4001/health" "200"
check_service "Backend A.1 Salon Info" "http://localhost:4000/api/salon-info" "200"
check_service "Backend A.2 Summary" "http://localhost:4001/api/reports/summary" "200"
echo ""

# ────────────────────────────────────────────────────────
echo "🎨 FRONTEND APPLICATIONS"
echo "────────────────────────────────────────────────────────"
check_service "Frontend A.1 (3000)" "http://localhost:3000" "200"
check_service "Frontend A.2 (3001)" "http://localhost:3001" "200"
echo ""

# ────────────────────────────────────────────────────────
echo "📊 DATABASE TABLE COUNTS"
echo "────────────────────────────────────────────────────────"

echo -n "🔍 A.1 tables ... "
a1_tables=$(docker-compose exec -T postgres-a1 psql -U trac_user -d trac_salon_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null)
echo -e "${GREEN}$a1_tables tables${NC}"

echo -n "🔍 A.2 tables ... "
a2_tables=$(docker-compose exec -T postgres-a2 psql -U trac_user -d trac_reporting_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null)
echo -e "${GREEN}$a2_tables tables${NC}"
echo ""

# ────────────────────────────────────────────────────────
echo "🔗 NETWORK CONNECTIVITY"
echo "────────────────────────────────────────────────────────"

echo -n "Backend A.1 → PostgreSQL A.1 ... "
result=$(docker-compose exec -T backend-a1 sh -c 'nc -z postgres-a1 5432 && echo "OK" || echo "FAIL"' 2>&1)
if [[ "$result" == "OK" ]]; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED++))
fi

echo -n "Worker A.1 → RabbitMQ ... "
result=$(docker-compose exec -T worker-a1 sh -c 'nc -z rabbitmq 5672 && echo "OK" || echo "FAIL"' 2>&1)
if [[ "$result" == "OK" ]]; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED++))
fi

echo -n "Backend A.2 → PostgreSQL A.2 ... "
result=$(docker-compose exec -T backend-a2 sh -c 'nc -z postgres-a2 5432 && echo "OK" || echo "FAIL"' 2>&1)
if [[ "$result" == "OK" ]]; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED++))
fi

echo -n "Frontend A.1 → Backend A.1 ... "
result=$(docker-compose exec -T frontend-a1 sh -c 'curl -s http://backend-a1:4000/health && echo "OK" || echo "FAIL"' 2>&1)
if [[ "$result" == *"OK"* ]]; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED++))
fi
echo ""

# ────────────────────────────────────────────────────────
echo "🐰 RABBITMQ TOPOLOGY"
echo "────────────────────────────────────────────────────────"

echo -n "Exchange 'salon.events' ... "
exchange=$(curl -s -u trac_rabbit:trac_rabbit_secret http://localhost:15672/api/exchanges/\%2F/salon.events 2>/dev/null | grep -c "topic")
if [ $exchange -eq 1 ]; then
    echo -e "${GREEN}✓ OK${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Not found (will be created on first message)${NC}"
fi

echo -n "Queue 'reservation.pending.queue' ... "
queue=$(curl -s -u trac_rabbit:trac_rabbit_secret http://localhost:15672/api/queues/\%2F 2>/dev/null | grep -c "reservation.pending")
if [ $queue -eq 1 ]; then
    echo -e "${GREEN}✓ OK${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Not found (will be created on first message)${NC}"
fi
echo ""

# ────────────────────────────────────────────────────────
echo "📋 ENVIRONMENT VARIABLES"
echo "────────────────────────────────────────────────────────"

echo -n "POSTGRES_A1_PASSWORD ... "
if grep -q "POSTGRES_A1_PASSWORD=" .env 2>/dev/null; then
    echo -e "${GREEN}✓ Set${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Missing${NC}"
    ((FAILED++))
fi

echo -n "EXCHANGE_RATE_KEY ... "
if grep -q "EXCHANGE_RATE_KEY=.*_" .env 2>/dev/null; then
    echo -e "${GREEN}✓ Set${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Missing or invalid${NC}"
    ((FAILED++))
fi

echo ""

# ────────────────────────────────────────────────────────
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  RESULTS                                                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Total Checks: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  ✅ ALL SYSTEMS OPERATIONAL                                 ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    exit 0
else
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  ⚠️  SOME SYSTEMS REQUIRE ATTENTION                         ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Run: docker-compose logs <service-name>"
    echo "For more details."
    exit 1
fi
