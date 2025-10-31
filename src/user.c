#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "user.h"
static void _safe_copy(char* dst, const char* src, size_t n) {
    strncpy(dst, src, n-1);
    dst[n-1] = '\0';
}
User* createUser(int id, const char* username, const char* firstName, const char* lastName, const char* password, int isAdmin) {
    User* u = (User*)malloc(sizeof(User));
    if (!u) { fprintf(stderr, "malloc failed\n"); exit(1); }
    u->id = id;
    _safe_copy(u->username, username, MAX_NAME);
    _safe_copy(u->firstName, firstName, MAX_NAME);
    _safe_copy(u->lastName, lastName, MAX_NAME);
    _safe_copy(u->password, password, MAX_PASS);
    u->isAdmin = isAdmin;
    u->next = NULL;
    return u;
}
void addUser(User** head, int id, const char* username, const char* firstName, const char* lastName, const char* password, int isAdmin) {
    User* u = createUser(id, username, firstName, lastName, password, isAdmin);
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
void adminDeleteUser(User** head, const char* username) {
    if (!*head) return;
    if (strcmp((*head)->username, username) == 0) {
        User* temp = *head;
        *head = (*head)->next;
        free(temp);
        return;
    }
    User* current = *head;
    while (current->next && strcmp(current->next->username, username) != 0) {
        current = current->next;
    }
    if (current->next) {
        User* temp = current->next;
        current->next = temp->next;
        free(temp);
    }
}
void adminViewAllUsers(User* head) {
    printf("\n=== ALL USERS (ADMIN VIEW) ===\n");
    User* current = head;
    while (current) {
        printf("ID: %d | Username: %s | Name: %s %s | Admin: %s\n", 
               current->id, current->username, current->firstName, 
               current->lastName, current->isAdmin ? "Yes" : "No");
        current = current->next;
    }
}
void adminAddUser(User** head, int* userCount, const char* username, const char* firstName, const char* lastName, const char* password, int isAdmin) {
    if (userExists(*head, username)) {
        printf("Username already exists.\n");
        return;
    }
    int id = *userCount;
    addUser(head, id, username, firstName, lastName, password, isAdmin);
    (*userCount)++;
    printf("Added user '%s %s'%s\n", firstName, lastName, isAdmin ? " (Admin)" : "");
}
void adminClearAllUsers(User** head, int* userCount) {
    User* current = *head;
    while (current) {
        User* temp = current;
        current = current->next;
        free(temp);
    }
    *head = NULL;
    *userCount = 0;
    printf("All users cleared.\n");
}
void adminDashboard(User* head, int* userCount) {
    int choice;
    char username[MAX_NAME], firstName[MAX_NAME], lastName[MAX_NAME], pass[MAX_PASS];
    do {
        printf("\n\033[1;35m=== ADMIN DASHBOARD ===\033[0m\n");
        printf("┌─────────────────────────────────────────────────────────┐\n");
        printf("│ \033[1;33m1.\033[0m  View all users                             │\n");
        printf("│ \033[1;33m2.\033[0m  Add user                                   │\n");
        printf("│ \033[1;33m3.\033[0m  Delete user                                │\n");
        printf("│ \033[1;33m4.\033[0m  Clear all users                            │\n");
        printf("│ \033[1;31m0.\033[0m  Back to main menu                          │\n");
        printf("└─────────────────────────────────────────────────────────┘\n");
        printf("Choice: ");
        if (scanf("%d", &choice) != 1) break;
        switch(choice) {
            case 1:
                adminViewAllUsers(head);
                break;
            case 2:
                printf("\n\033[1;35mADD USER\033[0m\n");
                printf("Username: "); scanf("%49s", username);
                printf("First Name: "); scanf("%49s", firstName);
                printf("Last Name: "); scanf("%49s", lastName);
                printf("Password: "); scanf("%31s", pass);
                printf("Make admin? (1/0): ");
                int makeAdmin; scanf("%d", &makeAdmin);
                adminAddUser(&head, userCount, username, firstName, lastName, pass, makeAdmin);
                break;
            case 3:
                printf("\n\033[1;35mDELETE USER\033[0m\n");
                printf("Username to delete: "); scanf("%49s", username);
                adminDeleteUser(&head, username);
                break;
            case 4:
                printf("\n\033[1;35mCLEAR ALL USERS\033[0m\n");
                printf("Type 'YES' to confirm: ");
                char confirm[10]; scanf("%9s", confirm);
                if (strcmp(confirm, "YES") == 0) {
                    adminClearAllUsers(&head, userCount);
                    return; 
                }
                break;
        }
        if (choice != 0) {
            printf("\nPress Enter to continue...");
            getchar(); getchar();
        }
    } while (choice != 0);
}
