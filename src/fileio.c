#include <stdio.h>
#include <stdlib.h>
#include <sqlite3.h>
#include <string.h>
#include "fileio.h"
#include "graph.h"

void loadUsersFromDB(User** head, int* userCount) {
    sqlite3_stmt *stmt;
    const char *sql = "SELECT id, username, firstName, lastName, password, isAdmin FROM users";
    
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) return;
    
    *userCount = 0;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        User* newUser = malloc(sizeof(User));
        newUser->id = sqlite3_column_int(stmt, 0);
        
        const char* username = (char*)sqlite3_column_text(stmt, 1);
        const char* firstName = (char*)sqlite3_column_text(stmt, 2);
        const char* lastName = (char*)sqlite3_column_text(stmt, 3);
        const char* password = (char*)sqlite3_column_text(stmt, 4);
        
        if (username) strcpy(newUser->username, username);
        else strcpy(newUser->username, "");
        
        if (firstName) strcpy(newUser->firstName, firstName);
        else strcpy(newUser->firstName, "");
        
        if (lastName) strcpy(newUser->lastName, lastName);
        else strcpy(newUser->lastName, "");
        
        if (password) strcpy(newUser->password, password);
        else strcpy(newUser->password, "");
        
        newUser->isAdmin = sqlite3_column_int(stmt, 5);
        newUser->next = *head;
        *head = newUser;
        (*userCount)++;
    }
    sqlite3_finalize(stmt);
}

void loadFriendshipsFromDB(Graph* g, int userCount) {
    (void)userCount; // Suppress unused parameter warning
    sqlite3_stmt *stmt;
    const char *sql = "SELECT user1_id, user2_id FROM friendships";
    
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) return;
    
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        int user1 = sqlite3_column_int(stmt, 0);
        int user2 = sqlite3_column_int(stmt, 1);
        addFriendshipSilent(g, user1, user2);
    }
    sqlite3_finalize(stmt);
}

void loadRequestsFromDB(FriendRequest** head) {
    sqlite3_stmt *stmt;
    const char *sql = "SELECT sender_id, receiver_id FROM friend_requests WHERE status = 'pending'";
    
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) return;
    
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        FriendRequest* newReq = malloc(sizeof(FriendRequest));
        newReq->fromId = sqlite3_column_int(stmt, 0);
        newReq->toId = sqlite3_column_int(stmt, 1);
        newReq->next = *head;
        *head = newReq;
    }
    sqlite3_finalize(stmt);
}

void saveUserToDB(User* user) {
    const char *sql = "INSERT OR REPLACE INTO users (id, username, firstName, lastName, password, isAdmin) VALUES (?, ?, ?, ?, ?, ?)";
    sqlite3_stmt *stmt;
    
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int(stmt, 1, user->id);
        sqlite3_bind_text(stmt, 2, user->username, -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt, 3, user->firstName, -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt, 4, user->lastName, -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt, 5, user->password, -1, SQLITE_STATIC);
        sqlite3_bind_int(stmt, 6, user->isAdmin);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }
}

void saveFriendshipToDB(int user1, int user2) {
    const char *sql = "INSERT OR IGNORE INTO friendships (user1_id, user2_id) VALUES (?, ?)";
    sqlite3_stmt *stmt;
    
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int(stmt, 1, user1);
        sqlite3_bind_int(stmt, 2, user2);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }
}

void saveRequestToDB(FriendRequest* req) {
    const char *sql = "INSERT OR REPLACE INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, 'pending')";
    sqlite3_stmt *stmt;
    
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int(stmt, 1, req->fromId);
        sqlite3_bind_int(stmt, 2, req->toId);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }
}

void closeDatabase() {
    if (db) {
        sqlite3_close(db);
        db = NULL;
    }
}
