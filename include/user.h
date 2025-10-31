#ifndef USER_H
#define USER_H

#define MAX_NAME 50
#define MAX_PASS 32

typedef struct User {
    int id;
    char username[MAX_NAME];
    char firstName[MAX_NAME];
    char lastName[MAX_NAME];
    char password[MAX_PASS];
    struct User* next;
} User;

// Linked list user store
User* createUser(int id, const char* username, const char* firstName, const char* lastName, const char* password);
void addUser(User** head, int id, const char* username, const char* firstName, const char* lastName, const char* password);
User* findUserById(User* head, int id);
User* findUserByUsername(User* head, const char* username);
void displayUsers(User* head);
int userExists(User* head, const char* username);
const char* getUserDisplayName(User* head, int id);

#endif
