#include <stdio.h>
#include <stdlib.h>
#include "suggestions.h"

static Suggestion* createSuggestion(int userId, int mutualCount) {
    Suggestion* s = malloc(sizeof(Suggestion));
    if (!s) { fprintf(stderr, "malloc failed\n"); exit(1); }
    s->userId = userId;
    s->mutualCount = mutualCount;
    s->next = NULL;
    return s;
}

static void insertSorted(Suggestion** head, int userId, int mutualCount) {
    Suggestion* newSugg = createSuggestion(userId, mutualCount);
    if (!*head || (*head)->mutualCount < mutualCount) {
        newSugg->next = *head;
        *head = newSugg;
        return;
    }
    Suggestion* cur = *head;
    while (cur->next && cur->next->mutualCount >= mutualCount) cur = cur->next;
    newSugg->next = cur->next;
    cur->next = newSugg;
}

void generateSuggestions(Graph* graph, int userId, User* users) {
    if (!graph || userId < 0 || userId >= graph->capacity) {
        printf("\033[1;31mInvalid user.\033[0m\n");
        return;
    }
    
    Suggestion* suggestions = NULL;
    int visited[MAX_USERS] = {0};
    
    // Mark user and direct friends as visited
    visited[userId] = 1;
    Node* friends = graph->adjList[userId];
    while (friends) {
        visited[friends->userId] = 1;
        friends = friends->next;
    }
    
    // Check friends of friends
    friends = graph->adjList[userId];
    while (friends) {
        Node* friendsOfFriend = graph->adjList[friends->userId];
        while (friendsOfFriend) {
            int candidateId = friendsOfFriend->userId;
            if (!visited[candidateId]) {
                // Count mutual friends
                int mutualCount = 0;
                Node* userFriends = graph->adjList[userId];
                while (userFriends) {
                    if (areFriends(graph, candidateId, userFriends->userId)) mutualCount++;
                    userFriends = userFriends->next;
                }
                if (mutualCount > 0) {
                    insertSorted(&suggestions, candidateId, mutualCount);
                    visited[candidateId] = 1;
                }
            }
            friendsOfFriend = friendsOfFriend->next;
        }
        friends = friends->next;
    }
    
    // Display suggestions
    const char* userName = getUserDisplayName(users, userId);
    printf("Friend suggestions for \033[1;32m%s\033[0m:\n", userName ? userName : "Unknown");
    printf("─────────────────────────────────────\n");
    
    if (!suggestions) {
        printf("  \033[1;33mNo suggestions available at the moment.\033[0m\n");
        printf("  \033[1;36mTry adding more friends to get better suggestions!\033[0m\n");
        return;
    }
    
    int count = 0;
    Suggestion* cur = suggestions;
    while (cur && count < 5) {
        const char* suggName = getUserDisplayName(users, cur->userId);
        printf("  \033[1;36m%d.\033[0m \033[1;33m%s\033[0m", count + 1, suggName ? suggName : "Unknown");
        printf(" \033[1;32m(%d mutual friend%s)\033[0m\n", 
               cur->mutualCount, cur->mutualCount == 1 ? "" : "s");
        cur = cur->next;
        count++;
    }
    
    printf("\n\033[1;32mFound %d suggestion%s based on mutual connections!\033[0m\n", 
           count, count == 1 ? "" : "s");
    
    freeSuggestions(suggestions);
}

void freeSuggestions(Suggestion* head) {
    while (head) {
        Suggestion* next = head->next;
        free(head);
        head = next;
    }
}
