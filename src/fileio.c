#include <stdio.h>
#include <stdlib.h>
#include <sqlite3.h>
#include <string.h>
#include <time.h>
#include "fileio.h"
static sqlite3* db = NULL;
static const char* DB_PATH = "/Users/Anurag/Downloads/FriendBook(main)/web/friendbook.db";
static sqlite3_stmt* stmt_insert_user = NULL;
static sqlite3_stmt* stmt_insert_friendship = NULL;
static sqlite3_stmt* stmt_insert_request = NULL;
static sqlite3_stmt* stmt_clear_users = NULL;
static sqlite3_stmt* stmt_clear_friendships = NULL;
static sqlite3_stmt* stmt_clear_requests = NULL;
static int batch_mode = 0;
static int sync_pending = 0;
int initDatabase() {
    int rc = sqlite3_open(DB_PATH, &db);
    if (rc) {
        fprintf(stderr, "Can't open database: %s\n", sqlite3_errmsg(db));
        return 0;
    }
    sqlite3_exec(db, "PRAGMA journal_mode = WAL", NULL, NULL, NULL);
    sqlite3_exec(db, "PRAGMA synchronous = NORMAL", NULL, NULL, NULL);
    sqlite3_exec(db, "PRAGMA cache_size = 10000", NULL, NULL, NULL);
    sqlite3_exec(db, "PRAGMA temp_store = MEMORY", NULL, NULL, NULL);
    sqlite3_exec(db, "PRAGMA mmap_size = 268435456", NULL, NULL, NULL); 
    const char* sql_user = "INSERT OR REPLACE INTO users (id, username, firstName, lastName, password, isAdmin) VALUES (?, ?, ?, ?, ?, ?)";
    const char* sql_friendship = "INSERT OR IGNORE INTO friendships (user1_id, user2_id) VALUES (?, ?)";
    const char* sql_request = "INSERT OR IGNORE INTO friend_requests (from_user_id, to_user_id, status) VALUES (?, ?, 'pending')";
    sqlite3_prepare_v2(db, sql_user, -1, &stmt_insert_user, NULL);
    sqlite3_prepare_v2(db, sql_friendship, -1, &stmt_insert_friendship, NULL);
    sqlite3_prepare_v2(db, sql_request, -1, &stmt_insert_request, NULL);
    sqlite3_prepare_v2(db, "DELETE FROM users", -1, &stmt_clear_users, NULL);
    sqlite3_prepare_v2(db, "DELETE FROM friendships", -1, &stmt_clear_friendships, NULL);
    sqlite3_prepare_v2(db, "DELETE FROM friend_requests", -1, &stmt_clear_requests, NULL);
    return 1;
}
void closeDatabase() {
    if (stmt_insert_user) sqlite3_finalize(stmt_insert_user);
    if (stmt_insert_friendship) sqlite3_finalize(stmt_insert_friendship);
    if (stmt_insert_request) sqlite3_finalize(stmt_insert_request);
    if (stmt_clear_users) sqlite3_finalize(stmt_clear_users);
    if (stmt_clear_friendships) sqlite3_finalize(stmt_clear_friendships);
    if (stmt_clear_requests) sqlite3_finalize(stmt_clear_requests);
    if (db) {
        sqlite3_close(db);
        db = NULL;
    }
}
void beginBatchMode() {
    if (!db) return;
    batch_mode = 1;
    sqlite3_exec(db, "BEGIN IMMEDIATE TRANSACTION", NULL, NULL, NULL);
}
void commitBatch() {
    if (!db || !batch_mode) return;
    sqlite3_exec(db, "COMMIT", NULL, NULL, NULL);
    batch_mode = 0;
    sync_pending = 0;
}
void rollbackBatch() {
    if (!db || !batch_mode) return;
    sqlite3_exec(db, "ROLLBACK", NULL, NULL, NULL);
    batch_mode = 0;
    sync_pending = 0;
}
void syncToDatabase(User* users, Graph* g, FriendRequest* requests) {
    if (!db && !initDatabase()) return;
    clock_t start = clock();
    printf("Starting database sync...\n");
    beginBatchMode();
    sqlite3_step(stmt_clear_requests);
    sqlite3_reset(stmt_clear_requests);
    sqlite3_step(stmt_clear_friendships);
    sqlite3_reset(stmt_clear_friendships);
    sqlite3_step(stmt_clear_users);
    sqlite3_reset(stmt_clear_users);
    int user_count = 0;
    User* u = users;
    while (u) {
        sqlite3_bind_int(stmt_insert_user, 1, u->id);
        sqlite3_bind_text(stmt_insert_user, 2, u->username, -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt_insert_user, 3, u->firstName, -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt_insert_user, 4, u->lastName, -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt_insert_user, 5, u->password, -1, SQLITE_STATIC);
        sqlite3_bind_int(stmt_insert_user, 6, u->isAdmin);
        sqlite3_step(stmt_insert_user);
        sqlite3_reset(stmt_insert_user);
        u = u->next;
        user_count++;
    }
    int friendship_count = 0;
    if (g) {
        for (int i = 0; i < g->capacity; i++) {
            Node* node = g->adjList[i];
            while (node) {
                if (i < node->userId) { 
                    sqlite3_bind_int(stmt_insert_friendship, 1, i);
                    sqlite3_bind_int(stmt_insert_friendship, 2, node->userId);
                    sqlite3_step(stmt_insert_friendship);
                    sqlite3_reset(stmt_insert_friendship);
                    friendship_count++;
                }
                node = node->next;
            }
        }
    }
    int request_count = 0;
    FriendRequest* req = requests;
    while (req) {
        sqlite3_bind_int(stmt_insert_request, 1, req->fromId);
        sqlite3_bind_int(stmt_insert_request, 2, req->toId);
        sqlite3_step(stmt_insert_request);
        sqlite3_reset(stmt_insert_request);
        req = req->next;
        request_count++;
    }
    commitBatch();
    clock_t end = clock();
    double time_taken = ((double)(end - start)) / CLOCKS_PER_SEC;
    printf("✅ Database sync completed in %.3f seconds\n", time_taken);
    printf("   Users: %d, Friendships: %d, Requests: %d\n", 
           user_count, friendship_count, request_count);
}
void asyncSyncToDatabase(User* users, Graph* g, FriendRequest* requests) {
    sync_pending = 1;
    syncToDatabase(users, g, requests);
}
int saveUsers(const char* path, User* head) {
    FILE* file = fopen(path, "w");
    if (!file) return 0;
    char buffer[8192];
    setvbuf(file, buffer, _IOFBF, sizeof(buffer));
    fprintf(file, "id,username,firstName,lastName,password,isAdmin\n");
    User* current = head;
    while (current) {
        fprintf(file, "%d,%s,%s,%s,%s,%d\n",
                current->id, current->username, current->firstName,
                current->lastName, current->password, current->isAdmin);
        current = current->next;
    }
    fclose(file);
    return 1;
}
int loadUsers(const char* path, User** head, int* userCount) {
    FILE* file = fopen(path, "r");
    if (!file) return 0;
    char buffer[8192];
    setvbuf(file, buffer, _IOFBF, sizeof(buffer));
    char line[512];
    fgets(line, sizeof(line), file); 
    *userCount = 0;
    while (fgets(line, sizeof(line), file)) {
        int id, isAdmin;
        char username[MAX_NAME], firstName[MAX_NAME], lastName[MAX_NAME], password[MAX_PASS];
        if (sscanf(line, "%d,%49[^,],%49[^,],%49[^,],%31[^,],%d",
                   &id, username, firstName, lastName, password, &isAdmin) == 6) {
            addUser(head, id, username, firstName, lastName, password, isAdmin);
            (*userCount)++;
        }
    }
    fclose(file);
    return 1;
}
int saveFriendships(const char* path, Graph* g) {
    if (!g) return 0;
    FILE* file = fopen(path, "w");
    if (!file) return 0;
    char buffer[8192];
    setvbuf(file, buffer, _IOFBF, sizeof(buffer));
    fprintf(file, "user1,user2\n");
    for (int i = 0; i < g->capacity; i++) {
        Node* node = g->adjList[i];
        while (node) {
            if (i < node->userId) { 
                fprintf(file, "%d,%d\n", i, node->userId);
            }
            node = node->next;
        }
    }
    fclose(file);
    return 1;
}
int loadFriendships(const char* path, Graph* g, int userCount) {
    (void)userCount; 
    FILE* file = fopen(path, "r");
    if (!file) return 0;
    char buffer[8192];
    setvbuf(file, buffer, _IOFBF, sizeof(buffer));
    char line[256];
    fgets(line, sizeof(line), file); 
    while (fgets(line, sizeof(line), file)) {
        int user1, user2;
        if (sscanf(line, "%d,%d", &user1, &user2) == 2) {
            if (user1 < g->capacity && user2 < g->capacity) {
                addFriendshipSilent(g, user1, user2);
            }
        }
    }
    fclose(file);
    return 1;
}
int saveRequests(const char* path, FriendRequest* head) {
    FILE* file = fopen(path, "w");
    if (!file) return 0;
    char buffer[8192];
    setvbuf(file, buffer, _IOFBF, sizeof(buffer));
    fprintf(file, "fromId,toId\n");
    FriendRequest* current = head;
    while (current) {
        fprintf(file, "%d,%d\n", current->fromId, current->toId);
        current = current->next;
    }
    fclose(file);
    return 1;
}
int loadRequests(const char* path, FriendRequest** head) {
    FILE* file = fopen(path, "r");
    if (!file) return 0;
    char buffer[8192];
    setvbuf(file, buffer, _IOFBF, sizeof(buffer));
    char line[256];
    fgets(line, sizeof(line), file); 
    while (fgets(line, sizeof(line), file)) {
        int fromId, toId;
        if (sscanf(line, "%d,%d", &fromId, &toId) == 2) {
            FriendRequest* req = malloc(sizeof(FriendRequest));
            if (req) {
                req->fromId = fromId;
                req->toId = toId;
                req->next = *head;
                *head = req;
            }
        }
    }
    fclose(file);
    return 1;
}
void printSyncStats() {
    if (!db) return;
    sqlite3_stmt* stmt;
    const char* sql = "SELECT name, COUNT(*) FROM (SELECT 'users' as name FROM users UNION ALL SELECT 'friendships' FROM friendships UNION ALL SELECT 'requests' FROM friend_requests) GROUP BY name";
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) == SQLITE_OK) {
        printf("\n📊 Database Statistics:\n");
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            printf("   %s: %d\n", sqlite3_column_text(stmt, 0), sqlite3_column_int(stmt, 1));
        }
        sqlite3_finalize(stmt);
    }
}
