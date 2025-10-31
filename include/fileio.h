#ifndef FILEIO_H
#define FILEIO_H

#include "user.h"
#include "graph.h"
#include "friend_request.h"

int saveUsers(const char* path, User* head);
int loadUsers(const char* path, User** head, int* userCount);
int saveFriendships(const char* path, Graph* g);
int loadFriendships(const char* path, Graph* g, User* users);
int saveRequests(const char* path, FRQueue* q);
int loadRequests(const char* path, FRQueue* q, User* users);

#endif
