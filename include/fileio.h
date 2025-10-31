#ifndef FILEIO_H
#define FILEIO_H
#include "user.h"
#include "graph.h"
#include "friend_request.h"
int initDatabase();
void closeDatabase();
void syncToDatabase(User* users, Graph* g, FriendRequest* requests);
int saveUsers(const char* path, User* head);
int loadUsers(const char* path, User** head, int* userCount);
int saveFriendships(const char* path, Graph* g);
int loadFriendships(const char* path, Graph* g, int userCount);
int saveRequests(const char* path, FriendRequest* head);
int loadRequests(const char* path, FriendRequest** head);
#endif
