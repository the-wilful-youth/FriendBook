#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "hashtable.h"
static unsigned int hash(const char* str) {
    unsigned int hash = 5381;
    while (*str) hash = ((hash << 5) + hash) + *str++;
    return hash % HASH_SIZE;
}
HashTable* createHashTable() {
    HashTable* ht = malloc(sizeof(HashTable));
    if (!ht) { fprintf(stderr, "malloc failed\n"); exit(1); }
    for (int i = 0; i < HASH_SIZE; i++) ht->buckets[i] = NULL;
    return ht;
}
void freeHashTable(HashTable* ht) {
    if (!ht) return;
    for (int i = 0; i < HASH_SIZE; i++) {
        HashNode* cur = ht->buckets[i];
        while (cur) {
            HashNode* next = cur->next;
            free(cur);
            cur = next;
        }
    }
    free(ht);
}
void hashInsert(HashTable* ht, User* user) {
    if (!ht || !user) return;
    unsigned int idx = hash(user->username);
    HashNode* node = malloc(sizeof(HashNode));
    if (!node) { fprintf(stderr, "malloc failed\n"); exit(1); }
    node->user = user;
    node->next = ht->buckets[idx];
    ht->buckets[idx] = node;
}
User* hashFind(HashTable* ht, const char* username) {
    if (!ht || !username) return NULL;
    unsigned int idx = hash(username);
    HashNode* cur = ht->buckets[idx];
    while (cur) {
        if (strcmp(cur->user->username, username) == 0) return cur->user;
        cur = cur->next;
    }
    return NULL;
}
void buildHashTable(HashTable* ht, User* users) {
    for (int i = 0; i < HASH_SIZE; i++) {
        HashNode* cur = ht->buckets[i];
        while (cur) {
            HashNode* next = cur->next;
            free(cur);
            cur = next;
        }
        ht->buckets[i] = NULL;
    }
    User* cur = users;
    while (cur) {
        hashInsert(ht, cur);
        cur = cur->next;
    }
}
