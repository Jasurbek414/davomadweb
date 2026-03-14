.PHONY: help build up down restart logs shell db migrate superadmin dev-backend dev-frontend

help:
	@echo "Maktab Davomad Face ID Tizimi - Buyruqlar"
	@echo ""
	@echo "  make build        - Docker imagelarni qurish"
	@echo "  make up           - Barcha xizmatlarni ishga tushirish"
	@echo "  make down         - Barcha xizmatlarni to'xtatish"
	@echo "  make restart      - Qayta ishga tushirish"
	@echo "  make logs         - Loglarni ko'rish"
	@echo "  make shell        - Backend bash shell"
	@echo "  make db           - PostgreSQL shell"
	@echo "  make migrate      - Django migratsiyalar"
	@echo "  make superadmin   - Superadmin yaratish"
	@echo "  make dev-backend  - Backend development serveri"
	@echo "  make dev-frontend - Frontend development serveri"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f --tail=100

shell:
	docker-compose exec backend bash

db:
	docker-compose exec db psql -U davomad -d davomad_db

migrate:
	docker-compose exec backend python manage.py migrate

superadmin:
	docker-compose exec backend python manage.py create_superadmin

dev-backend:
	cd backend && python manage.py runserver 0.0.0.0:8000

dev-frontend:
	cd frontend && npm run dev

dev-celery:
	cd backend && celery -A config worker -l info

dev-bot-parent:
	cd bot && BOT_TOKEN=$(PARENT_BOT_TOKEN) python parent_bot.py

dev-bot-management:
	cd bot && BOT_TOKEN=$(MANAGEMENT_BOT_TOKEN) python management_bot.py

setup-dev:
	@echo "Development muhitini sozlash..."
	cp .env.example .env
	cd backend && pip install -r requirements.txt
	cd backend && python manage.py migrate
	cd backend && python manage.py create_superadmin
	cd frontend && npm install
	@echo "Tayyor! 'make dev-backend' va 'make dev-frontend' ni ishga tushiring."
