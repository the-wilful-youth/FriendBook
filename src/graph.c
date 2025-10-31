#include <stdio.h>
#include <stdlib.h>
#include "graph.h"
static Node* makeNode(int id) {
    Node* n = (Node*)malloc(sizeof(Node));
    if (!n) { 
        fprintf(stderr, "malloc failed\n"); 
        exit(1); 
    }
    n->userId = id; n->next = NULL;
    return n;
}
Graph* createGraph(int capacity) {
    if (capacity > MAX_USERS) capacity = MAX_USERS;
    Graph* g = (Graph*)malloc(sizeof(Graph));
    if (!g) { fprintf(stderr, "malloc failed\n"); exit(1); }
    g->capacity = capacity;
    for (int i=0;i<MAX_USERS;i++) g->adjList[i] = NULL;
    return g;
}
void freeGraph(Graph* g) {
    if (!g) return;
    for (int i=0;i<g->capacity;i++) {
        Node* cur = g->adjList[i];
        while (cur) {
            Node* nxt = cur->next; 
            free(cur); 
            cur = nxt; 
        }
        g->adjList[i] = NULL;
    }
    free(g);
}
static int _contains(Node* head, int id) {
    Node* t = head; 
    while (t) { 
        if (t->userId==id) 
        return 1; 
        t=t->next; 
    } return 0;
}
void addFriendshipSilent(Graph* graph, int user1, int user2) {
    if (!graph) return;
    if (user1<0 || user2<0 || user1>=graph->capacity || user2>=graph->capacity) return;
    if (user1==user2) return;
    if (_contains(graph->adjList[user1], user2)) return;
    Node* n1 = makeNode(user2);
    n1->next = graph->adjList[user1];
    graph->adjList[user1] = n1;
    Node* n2 = makeNode(user1);
    n2->next = graph->adjList[user2];
    graph->adjList[user2] = n2;
}
void addFriendship(Graph* graph, int user1, int user2, User* users) {
    if (!graph) return;
    if (user1<0 || user2<0 || user1>=graph->capacity || user2>=graph->capacity) {
        printf("Invalid user IDs.\n"); 
        return;
    }
    if (user1==user2) { printf("Cannot friend yourself.\n"); 
        return; 
    }
    if (_contains(graph->adjList[user1], user2)) { 
        printf("Already friends.\n"); 
        return; 
    }
    Node* n1 = makeNode(user2);
    n1->next = graph->adjList[user1];
    graph->adjList[user1] = n1;
    Node* n2 = makeNode(user1);
    n2->next = graph->adjList[user2];
    graph->adjList[user2] = n2;
    const char* name1 = getUserDisplayName(users, user1);
    const char* name2 = getUserDisplayName(users, user2);
    printf("Friendship added between %s and %s\n", 
           name1 ? name1 : "Unknown", name2 ? name2 : "Unknown");
}
int areFriends(Graph* graph, int user1, int user2) {
    if (!graph) return 0;
    Node* t = graph->adjList[user1];
    while (t) { 
        if (t->userId==user2) 
        return 1; 
        t=t->next; 
    }
    return 0;
}
static void _removeOne(Node** head, int id) {
    Node* cur = *head; Node* prev = NULL;
    while (cur) {
        if (cur->userId==id) {
            if (prev) prev->next = cur->next;
            else *head = cur->next;
            free(cur); 
            return;
        }
        prev = cur; cur = cur->next;
    }
}
void removeFriendship(Graph* graph, int user1, int user2, User* users) {
    if (!graph) 
    return;
    if (!areFriends(graph, user1, user2)) { 
        printf("Not friends.\n"); 
        return; }
    _removeOne(&graph->adjList[user1], user2);
    _removeOne(&graph->adjList[user2], user1);
    const char* name1 = getUserDisplayName(users, user1);
    const char* name2 = getUserDisplayName(users, user2);
    printf("Friendship removed between %s and %s\n", 
           name1 ? name1 : "Unknown", name2 ? name2 : "Unknown");
}
void displayFriends(Graph* graph, int userId, User* users) {
    if (!graph || userId<0 || userId>=graph->capacity) { 
        printf("\033[1;31mInvalid user.\033[0m\n"); 
        return; 
    }
    const char* userName = getUserDisplayName(users, userId);
    printf("Friends of \033[1;32m%s\033[0m:\n", userName ? userName : "Unknown");
    printf("─────────────────────────\n");
    Node* t = graph->adjList[userId];
    int count = 0;
    while (t) { 
        const char* friendName = getUserDisplayName(users, t->userId);
        printf("  \033[1;36m%d.\033[0m %s\n", ++count, friendName ? friendName : "Unknown");
        t=t->next; 
    }
    if (count == 0) {
        printf("  \033[1;33mNo friends yet. Start connecting!\033[0m\n");
    } else {
        printf("\n\033[1;32mTotal friends: %d\033[0m\n", count);
    }
}
int degree(Graph* graph, int userId) {
    int cnt=0; Node* t = graph->adjList[userId]; 
    while (t){
        cnt++; 
        t=t->next;
    } 
    return cnt;
}
