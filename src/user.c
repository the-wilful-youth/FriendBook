#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "user.h"

static void _safe_copy(char* dst, const char* src, size_t n) {
    strncpy(dst, src, n-1);
    dst[n-1] = '\0';
}

User* createUser(int id, const char* username, const char* firstName, const char* lastName, const char* password) {
    User* u = (User*)malloc(sizeof(User));
    if (!u) { fprintf(stderr, "malloc failed\n"); exit(1); }
    u->id = id;
    _safe_copy(u->username, username, MAX_NAME);
    _safe_copy(u->firstName, firstName, MAX_NAME);
    _safe_copy(u->lastName, lastName, MAX_NAME);
    _safe_copy(u->password, password, MAX_PASS);
    u->next = NULL;
    return u;
}

void addUser(User** head, int id, const char* username, const char* firstName, const char* lastName, const char* password) {
    User* u = createUser(id, username, firstName, lastName, password);
    if (*head == NULL) { *head = u; return; }
    User* t = *head;
    while (t->next) t = t->next;
    t->next = u;
}

User* findUserById(User* head, int id) {
    User* t = head;
    while (t) { if (t->id == id) return t; t = t->next; }
    return NULL;
}

User* findUserByUsername(User* head, const char* username) {
    User* t = head;
    while (t) { if (strcmp(t->username, username)==0) return t; t = t->next; }
    return NULL;
}

int userExists(User* head, const char* username) {
    return findUserByUsername(head, username) != NULL;
}

void displayUsers(User* head) {
    if (!head) { 
        printf("\033[1;33mNo users found.\033[0m\n"); 
        return; 
    }
    printf("┌─────┬──────────────────────────────────────────────────┐\n");
    printf("│ \033[1;33mID\033[0m  │ \033[1;33mName\033[0m                                         │\n");
    printf("├─────┼──────────────────────────────────────────────────┤\n");
    User* t = head;
    while (t) {
        char fullName[100];
        snprintf(fullName, sizeof(fullName), "%s %s", t->firstName, t->lastName);
        printf("│ \033[1;32m%-3d\033[0m │ %-48s │\n", t->id, fullName);
        t = t->next;
    }
    printf("└─────┴──────────────────────────────────────────────────┘\n");
}

const char* getUserDisplayName(User* head, int id) {
    User* u = findUserById(head, id);
    if (!u) return NULL;
    static char displayName[100];
    snprintf(displayName, sizeof(displayName), "%s %s", u->firstName, u->lastName);
    return displayName;
}
