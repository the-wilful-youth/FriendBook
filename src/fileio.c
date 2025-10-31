#include <stdio.h>
#include <stdlib.h>
#include "fileio.h"

int saveUsers(const char* path, User* head) {
    FILE* f = fopen(path, "w");
    if (!f) { perror("open users"); return 0; }
    
    // Write CSV header
    fprintf(f, "id,username,firstName,lastName,password\n");
    
    User* t = head;
    while (t) { 
        fprintf(f, "%d,%s,%s,%s,%s\n", t->id, t->username, t->firstName, t->lastName, t->password); 
        t=t->next; 
    }
    fclose(f); return 1;
}

int loadUsers(const char* path, User** head, int* userCount) {
    FILE* f = fopen(path, "r");
    if (!f) return 1;
    
    char line[256];
    int maxId = -1;
    
    // Skip header line
    if (fgets(line, sizeof(line), f) == NULL) {
        fclose(f);
        return 1;
    }
    
    while (fgets(line, sizeof(line), f)) {
        int id;
        char username[MAX_NAME], firstName[MAX_NAME], lastName[MAX_NAME], pass[MAX_PASS];
        
        if (sscanf(line, "%d,%49[^,],%49[^,],%49[^,],%31s", &id, username, firstName, lastName, pass) == 5) {
            addUser(head, id, username, firstName, lastName, pass);
            if (id > maxId) maxId = id;
        }
    }
    fclose(f);
    *userCount = maxId + 1;
    if (*userCount < 0) *userCount = 0;
    return 1;
}

int saveFriendships(const char* path, Graph* g) {
    FILE* f = fopen(path, "w");
    if (!f) { perror("open friendships"); return 0; }
    
    // Write CSV header
    fprintf(f, "user1,user2\n");
    
    for (int u=0; u<g->capacity; u++) {
        for (Node* v=g->adjList[u]; v; v=v->next) {
            if (u < v->userId) fprintf(f, "%d,%d\n", u, v->userId);
        }
    }
    fclose(f); return 1;
}

int loadFriendships(const char* path, Graph* g, User* users) {
    (void)users; // Suppress unused parameter warning
    FILE* f = fopen(path, "r");
    if (!f) return 1;
    
    char line[64];
    
    // Skip header line
    if (fgets(line, sizeof(line), f) == NULL) {
        fclose(f);
        return 1;
    }
    
    while (fgets(line, sizeof(line), f)) {
        int u, v;
        if (sscanf(line, "%d,%d", &u, &v) == 2) {
            addFriendshipSilent(g, u, v);
        }
    }
    fclose(f); return 1;
}

int saveRequests(const char* path, FRQueue* q) {
    FILE* f = fopen(path, "w");
    if (!f) { perror("open requests"); return 0; }
    
    // Write CSV header
    fprintf(f, "fromId,toId\n");
    
    for (FriendRequest* t=q->front; t; t=t->next) {
        fprintf(f, "%d,%d\n", t->fromId, t->toId);
    }
    fclose(f); return 1;
}

int loadRequests(const char* path, FRQueue* q, User* users) {
    (void)users; // Suppress unused parameter warning
    FILE* f = fopen(path, "r");
    if (!f) return 1;
    
    char line[64];
    
    // Skip header line
    if (fgets(line, sizeof(line), f) == NULL) {
        fclose(f);
        return 1;
    }
    
    while (fgets(line, sizeof(line), f)) {
        int a, b;
        if (sscanf(line, "%d,%d", &a, &b) == 2) {
            fr_sendSilent(q, a, b);
        }
    }
    fclose(f); return 1;
}
