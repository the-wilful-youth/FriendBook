#ifndef HASHTABLE_H
#define HASHTABLE_H
#include "user.h"
#define HASH_SIZE 101
typedef struct HashNode {
    User* user;
    struct HashNode* next;
} HashNode;
typedef struct HashTable {
    HashNode* buckets[HASH_SIZE];
} HashTable;
HashTable* createHashTable();
void freeHashTable(HashTable* ht);
void hashInsert(HashTable* ht, User* user);
User* hashFind(HashTable* ht, const char* name);
void buildHashTable(HashTable* ht, User* users);
#endif
