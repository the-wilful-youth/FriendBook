CC = gcc
CFLAGS = -Iinclude -Wall -Wextra -O3 -march=native -flto -DNDEBUG
LDFLAGS = -lsqlite3 -flto
SRC = src/main.c src/user.c src/graph.c src/auth.c src/fileio.c src/friend_request.c src/hashtable.c src/suggestions.c
OBJ_DIR = obj
OBJ = $(SRC:src/%.c=$(OBJ_DIR)/%.o)
OUT = build/friendbook
WEBDIR = web

.PHONY: all cli web clean run-cli run-web

all: cli web

cli: $(OUT)

$(OUT): $(OBJ) | build
	$(CC) $(OBJ) -o $(OUT) $(LDFLAGS)

$(OBJ_DIR)/%.o: src/%.c | $(OBJ_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(OBJ_DIR):
	@mkdir -p $(OBJ_DIR)

build:
	@mkdir -p build

web:
	@cd $(WEBDIR) && [ ! -d node_modules ] && npm install --silent || true
	@cd $(WEBDIR) && [ ! -f friendbook.db ] && node scripts/init-db.js || true

run-cli: cli
	@./$(OUT)

run-web: web
	@cd $(WEBDIR) && node server.js

clean:
	@rm -rf $(OBJ_DIR) build
