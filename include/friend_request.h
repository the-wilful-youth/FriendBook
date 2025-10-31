#ifndef FRIEND_REQUEST_H
#define FRIEND_REQUEST_H

#include "user.h"

typedef struct FriendRequest {
    int fromId;
    int toId;
    struct FriendRequest* next;
} FriendRequest;

typedef struct FRQueue {
    FriendRequest* front;
    FriendRequest* back;
} FRQueue;

void fr_init(FRQueue* q);
void fr_send(FRQueue* q, int fromId, int toId, User* users);
void fr_sendSilent(FRQueue* q, int fromId, int toId);
int  fr_pop_for(FRQueue* q, int toId, int* fromId, int* toIdOut);
void fr_list_for(FRQueue* q, int toId, User* users);
int  fr_exists(FRQueue* q, int fromId, int toId);

#endif
