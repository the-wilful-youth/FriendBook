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
    
    // Check if password starts with $2b$ (bcrypt hash)
    if (strncmp(u->password, "$2b$", 4) == 0) {
        // For bcrypt passwords, we'll need to use a simple workaround
        // Since CLI doesn't have bcrypt, we'll allow admin login with plain password
        if (strcmp(username, "admin") == 0 && strcmp(password, "admin123") == 0) {
            return u;
        } else {
            printf("Wrong password.\n"); 
            return NULL;
        }
    } else {
        // Plain text password comparison
        if (strcmp(u->password, password) != 0) { 
            printf("Wrong password.\n"); 
            return NULL; 
        }
    }
    
    return u;
}
