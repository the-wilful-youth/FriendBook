#ifndef SUGGESTIONS_H
#define SUGGESTIONS_H
#include "user.h"
#include "graph.h"
typedef struct Suggestion {
    int userId;
    int mutualCount;
    struct Suggestion* next;
} Suggestion;
void generateSuggestions(Graph* graph, int userId, User* users);
void freeSuggestions(Suggestion* head);
#endif
