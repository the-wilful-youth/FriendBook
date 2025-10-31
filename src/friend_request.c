#include <stdio.h>
#include <stdlib.h>
#include "friend_request.h"
void fr_init(FRQueue* q) {
    q->front = q->back = NULL;
}
static FriendRequest* makeReq(int fromId, int toId) {
    FriendRequest* r = (FriendRequest*)malloc(sizeof(FriendRequest));
    if (!r) { fprintf(stderr, "malloc failed\n"); 
        exit(1); 
    }
    r->id = 0;
    r->fromId = fromId; 
    r->toId = toId; 
    r->next = NULL;
    return r;
}
int fr_exists(FRQueue* q, int fromId, int toId) {
    FriendRequest* t = q->front;
    while (t) { 
        if (t->fromId==fromId && t->toId==toId) 
        return 1; 
        t=t->next; 
    }
    return 0;
}
void fr_sendSilent(FRQueue* q, int fromId, int toId) {
    if (fr_exists(q, fromId, toId)) return;
    FriendRequest* r = makeReq(fromId, toId);
    if (!q->back) { 
        q->front = q->back = r;
    }
    else { q->back->next = r; q->back = r; }
}
void fr_send(FRQueue* q, int fromId, int toId, User* users) {
    if (fr_exists(q, fromId, toId)) { printf("Request already pending.\n"); return; }
    FriendRequest* r = makeReq(fromId, toId);
    if (!q->back) { 
        q->front = q->back = r;
    }
    else { q->back->next = r; q->back = r; }
    const char* fromName = getUserDisplayName(users, fromId);
    const char* toName = getUserDisplayName(users, toId);
    printf("Friend request sent from %s to %s\n", 
           fromName ? fromName : "Unknown", toName ? toName : "Unknown");
}
void fr_list_for(FRQueue* q, int toId, User* users) {
    int any = 0;
    FriendRequest* t = q->front;
    const char* toName = getUserDisplayName(users, toId);
    printf("Pending requests for \033[1;32m%s\033[0m:\n", toName ? toName : "Unknown");
    printf("─────────────────────────────────\n");
    int count = 0;
    while (t) {
        if (t->toId==toId) { 
            any = 1; 
            const char* fromName = getUserDisplayName(users, t->fromId);
            printf("  \033[1;36m%d.\033[0m From: \033[1;33m%s\033[0m\n", ++count, fromName ? fromName : "Unknown");
        }
        t=t->next;
    }
    if (!any) {
        printf("  \033[1;33mNo pending requests.\033[0m\n");
    } else {
        printf("\n\033[1;32mTotal pending: %d\033[0m\n", count);
    }
}
int fr_pop_for(FRQueue* q, int toId, int* fromId, int* toIdOut) {
    FriendRequest* cur = q->front;
    FriendRequest* prev = NULL;
    while (cur) {
        if (cur->toId == toId) {
            if (fromId) *fromId = cur->fromId;
            if (toIdOut) *toIdOut = cur->toId;
            if (prev) 
                prev->next = cur->next; 
            else 
                q->front = cur->next;
            if (q->back == cur) q->back = prev;
            free(cur);
            return 1;
        }
        prev = cur; cur = cur->next;
    }
    return 0;
}
