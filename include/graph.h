#ifndef GRAPH_H
#define GRAPH_H
#include <stddef.h>
#include "user.h"
#define MAX_USERS 1000
typedef struct Node {
    int userId;
    struct Node* next;
} Node;
typedef struct Graph {
    int capacity;
    Node* adjList[MAX_USERS];
} Graph;
Graph* createGraph(int capacity);
void freeGraph(Graph* g);
void addFriendship(Graph* graph, int user1, int user2, User* users);
void addFriendshipSilent(Graph* graph, int user1, int user2);
int  areFriends(Graph* graph, int user1, int user2);
void removeFriendship(Graph* graph, int user1, int user2, User* users);
void displayFriends(Graph* graph, int userId, User* users);
int  degree(Graph* graph, int userId);
#endif
