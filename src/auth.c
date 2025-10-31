#include <stdio.h>
#include <string.h>
#include "auth.h"
User* registerUser(User** head, int* userCount, const char* username, const char* firstName, const char* lastName, const char* password) {
    if (userExists(*head, username)) { printf("Username already exists.\n"); return NULL; }
    int id = *userCount;
    int isAdmin = 0; 
    addUser(head, id, username, firstName, lastName, password, isAdmin);
    (*userCount)++;
    printf("Registered user '%s %s'\n", firstName, lastName);
    return findUserById(*head, id);
}
void createDefaultAdmin(User** head, int* userCount) {
    if (*userCount == 0) {
        addUser(head, 0, "admin", "System", "Administrator", "admin123", 1);
        (*userCount)++;
        printf("Default admin created: username='admin', password='admin123'\n");
    }
}
User* loginUser(User* head, const char* username, const char* password) {
    User* u = findUserByUsername(head, username);
    if (!u) { printf("User not found.\n"); return NULL; }
    if (strcmp(u->password, password)!=0) { printf("Wrong password.\n"); return NULL; }
    return u;
}
