#include <stdio.h>
#include <string.h>
#include "auth.h"

User* registerUser(User** head, int* userCount, const char* username, const char* firstName, const char* lastName, const char* password) {
    if (userExists(*head, username)) { printf("Username already exists.\n"); return NULL; }
    int id = *userCount;
    addUser(head, id, username, firstName, lastName, password);
    (*userCount)++;
    printf("Registered user '%s %s'\n", firstName, lastName);
    return findUserById(*head, id);
}

User* loginUser(User* head, const char* username, const char* password) {
    User* u = findUserByUsername(head, username);
    if (!u) { printf("User not found.\n"); return NULL; }
    if (strcmp(u->password, password)!=0) { printf("Wrong password.\n"); return NULL; }
    return u;
}
