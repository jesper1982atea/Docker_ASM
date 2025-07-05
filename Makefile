.PHONY: deploy build restart logs

deploy:
	git pull
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

build:
	docker-compose build --no-cache

restart:
	docker-compose restart

logs:
	docker-compose logs -f

watch:
	while true; do \
		git fetch; \
		if [ $$(git rev-parse HEAD) != $$(git rev-parse origin/main) ]; then \
			echo "Changes detected, deploying..."; \
			make deploy; \
		fi; \
		sleep 30; \
	done
