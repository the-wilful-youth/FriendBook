#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "suggestions.h"

static Suggestion* createSuggestion(int userId, int mutualCount, float score, int distance) {
    Suggestion* s = malloc(sizeof(Suggestion));
    if (!s) { fprintf(stderr, "malloc failed\n"); exit(1); }
    s->userId = userId;
    s->mutualCount = mutualCount;
    s->score = score;
    s->distance = distance;
    s->next = NULL;
    return s;
}

static float calculateScore(int mutualCount, int distance, int candidateFriendCount, int userFriendCount) {
    float score = 0.0;
    
    // Factor 1: Mutual friends (most important) - 50% weight
    score += mutualCount * 5.0;
    
    // Factor 2: Network distance bonus (closer is better) - 20% weight
    if (distance == 2) {
        score += 3.0;  // Direct friend of friend
    } else if (distance == 3) {
        score += 1.0;  // Friend of friend of friend
    }
    
    // Factor 3: Balanced popularity (avoid only suggesting most popular) - 15% weight
    // Users with similar friend counts are better matches
    if (userFriendCount > 0) {
        float popularityRatio = (float)candidateFriendCount / (float)userFriendCount;
        if (popularityRatio > 1.0) popularityRatio = 1.0 / popularityRatio;
        score += popularityRatio * 2.0;
    }
    
    // Factor 4: Active users bonus (have some friends but not too many) - 15% weight
    if (candidateFriendCount >= 2 && candidateFriendCount <= 20) {
        score += 2.0;
    } else if (candidateFriendCount > 20) {
        score += 0.5;  // Popular users get lower bonus
    }
    
    return score;
}
static void insertSorted(Suggestion** head, int userId, int mutualCount, float score, int distance) {
    Suggestion* newSugg = createSuggestion(userId, mutualCount, score, distance);
    if (!*head || (*head)->score < score) {
        newSugg->next = *head;
        *head = newSugg;
        return;
    }
    Suggestion* cur = *head;
    while (cur->next && cur->next->score >= score) cur = cur->next;
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
    int distance[MAX_USERS] = {0};
    
    visited[userId] = 1;
    
    // Mark direct friends as visited
    Node* friends = graph->adjList[userId];
    int userFriendCount = 0;
    while (friends) {
        visited[friends->userId] = 1;
        userFriendCount++;
        friends = friends->next;
    }
    
    // Level 1: Friends of friends (distance = 2)
    friends = graph->adjList[userId];
    while (friends) {
        Node* friendsOfFriend = graph->adjList[friends->userId];
        while (friendsOfFriend) {
            int candidateId = friendsOfFriend->userId;
            if (!visited[candidateId]) {
                visited[candidateId] = 1;
                distance[candidateId] = 2;
            }
            friendsOfFriend = friendsOfFriend->next;
        }
        friends = friends->next;
    }
    
    // Level 2: Friends of friends of friends (distance = 3) - for better reach
    friends = graph->adjList[userId];
    while (friends) {
        Node* fof = graph->adjList[friends->userId];
        while (fof) {
            Node* fofofo = graph->adjList[fof->userId];
            while (fofofo) {
                int candidateId = fofofo->userId;
                if (!visited[candidateId] && candidateId != userId) {
                    visited[candidateId] = 1;
                    distance[candidateId] = 3;
                }
                fofofo = fofofo->next;
            }
            fof = fof->next;
        }
        friends = friends->next;
    }
    
    // Calculate scores for all candidates
    for (int candidateId = 0; candidateId < graph->capacity; candidateId++) {
        if (distance[candidateId] > 0) {
            // Count mutual friends
            int mutualCount = 0;
            Node* userFriends = graph->adjList[userId];
            while (userFriends) {
                if (areFriends(graph, candidateId, userFriends->userId)) {
                    mutualCount++;
                }
                userFriends = userFriends->next;
            }
            
            // Count candidate's total friends
            int candidateFriendCount = degree(graph, candidateId);
            
            // Calculate smart score
            float score = calculateScore(mutualCount, distance[candidateId], 
                                        candidateFriendCount, userFriendCount);
            
            // Only suggest if there's a meaningful connection
            if (mutualCount > 0 || distance[candidateId] == 2) {
                insertSorted(&suggestions, candidateId, mutualCount, score, distance[candidateId]);
            }
        }
    }
    
    const char* userName = getUserDisplayName(users, userId);
    printf("🎯 Smart friend suggestions for \033[1;32m%s\033[0m:\n", userName ? userName : "Unknown");
    printf("─────────────────────────────────────────────────────────\n");
    
    if (!suggestions) {
        printf("  \033[1;33mNo suggestions available at the moment.\033[0m\n");
        printf("  \033[1;36mTip: Add more friends to get personalized suggestions!\033[0m\n");
        return;
    }
    
    int count = 0;
    int maxSuggestions = 8;  // Increased from 5 for better variety
    Suggestion* cur = suggestions;
    
    while (cur && count < maxSuggestions) {
        const char* suggName = getUserDisplayName(users, cur->userId);
        int candidateFriends = degree(graph, cur->userId);
        
        printf("  \033[1;36m%d.\033[0m \033[1;33m%-20s\033[0m", count + 1, suggName ? suggName : "Unknown");
        
        if (cur->mutualCount > 0) {
            printf(" \033[1;32m● %d mutual friend%s\033[0m", 
                   cur->mutualCount, cur->mutualCount == 1 ? "" : "s");
        }
        
        if (cur->distance == 2) {
            printf(" \033[1;34m● Direct connection\033[0m");
        } else if (cur->distance == 3) {
            printf(" \033[1;35m● Extended network\033[0m");
        }
        
        printf(" \033[1;90m(%d friends)\033[0m", candidateFriends);
        printf("\n");
        
        cur = cur->next;
        count++;
    }
    
    printf("\n\033[1;32m✨ Found %d personalized suggestion%s!\033[0m\n", 
           count, count == 1 ? "" : "s");
    printf("\033[1;36m💡 Suggestions ranked by: mutual friends, network distance & activity\033[0m\n");
    
    freeSuggestions(suggestions);
}
void freeSuggestions(Suggestion* head) {
    while (head) {
        Suggestion* next = head->next;
        free(head);
        head = next;
    }
}
