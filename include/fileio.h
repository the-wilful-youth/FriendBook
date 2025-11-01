#ifndef FILEIO_H
#define FILEIO_H
#include "user.h"
#include "graph.h"
#include "friend_request.h"
#include <sqlite3.h>

extern sqlite3 *db;

int initDatabase();
void closeDatabase();
void loadUsersFromDB(User** head, int* userCount);
void loadFriendshipsFromDB(Graph* g, int userCount);
void loadRequestsFromDB(FriendRequest** head);
void saveUserToDB(User* user);
void saveFriendshipToDB(int user1, int user2);
void saveRequestToDB(FriendRequest* req);
#endif
