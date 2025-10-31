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
    int isAdmin;
    struct User* next;
} User;
User* createUser(int id, const char* username, const char* firstName, const char* lastName, const char* password, int isAdmin);
void addUser(User** head, int id, const char* username, const char* firstName, const char* lastName, const char* password, int isAdmin);
User* findUserById(User* head, int id);
User* findUserByUsername(User* head, const char* username);
void displayUsers(User* head);
int userExists(User* head, const char* username);
const char* getUserDisplayName(User* head, int id);
void adminDeleteUser(User** head, const char* username);
void adminViewAllUsers(User* head);
void adminAddUser(User** head, int* userCount, const char* username, const char* firstName, const char* lastName, const char* password, int isAdmin);
void adminClearAllUsers(User** head, int* userCount);
void adminDashboard(User* head, int* userCount);
#endif
