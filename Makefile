SERVER ?= r01
REMOTE_DIR ?= /var/www/adapools
APP_USER ?= mog

.PHONY: bootstrap deploy status logs restart down

bootstrap:
	ssh -t $(SERVER) 'sudo mkdir -p $(REMOTE_DIR) && sudo chown -R $(APP_USER):$(APP_USER) $(REMOTE_DIR)'

deploy:
	npm run deploy

status:
	ssh $(SERVER) 'cd $(REMOTE_DIR) && docker compose ps'

logs:
	ssh $(SERVER) 'cd $(REMOTE_DIR) && docker compose logs --tail=100 -f'

restart:
	ssh $(SERVER) 'cd $(REMOTE_DIR) && docker compose restart frontend'

down:
	ssh $(SERVER) 'cd $(REMOTE_DIR) && docker compose down'
