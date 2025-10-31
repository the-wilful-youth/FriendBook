#ifndef AUTH_H
#define AUTH_H
#include "user.h"
User* registerUser(User** head, int* userCount, const char* username, const char* firstName, const char* lastName, const char* password);
User* loginUser(User* head, const char* username, const char* password);
void createDefaultAdmin(User** head, int* userCount);
#endif
