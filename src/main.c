#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "user.h"
#include "graph.h"
#include "auth.h"
#include "fileio.h"
#include "friend_request.h"
#include "hashtable.h"
#include "suggestions.h"

#define USERS_FILE "data/users.csv"
#define FRIENDS_FILE "data/friendships.csv"
#define REQS_FILE "data/requests.csv"

static void clearScreen() {
    printf("\033[2J\033[H");
}

static void printHeader() {
    printf("\033[1;36m");
    printf("╔══════════════════════════════════════════════════════════╗\n");
    printf("║                    \033[1;33mFRIENDBOOK\033[1;36m                         ║\n");
    printf("║                 Mini Social Network                      ║\n");
    printf("╚══════════════════════════════════════════════════════════╝\033[0m\n");
}

static void autoSave(User* users, Graph* g, FRQueue* q) {
    saveUsers(USERS_FILE, users);
    saveFriendships(FRIENDS_FILE, g);
    saveRequests(REQS_FILE, q);
}

static void menu(const char* currentUser) {
    clearScreen();
    printHeader();
    
    if (currentUser) {
        printf("\n\033[1;32mLogged in as: %s\033[0m\n", currentUser);
        printf("\n\033[1;34mMENU OPTIONS:\033[0m\n");
        printf("┌─────────────────────────────────────────────────────────┐\n");
        printf("│ \033[1;33m1.\033[0m  Display all users                          │\n");
        printf("│ \033[1;33m2.\033[0m  Send friend request                        │\n");
        printf("│ \033[1;33m3.\033[0m  View & accept friend requests              │\n");
        printf("│ \033[1;33m4.\033[0m  Show my friends                            │\n");
        printf("│ \033[1;33m5.\033[0m  Get friend suggestions                     │\n");
        printf("│ \033[1;33m6.\033[0m  Remove friendship                          │\n");
        printf("│ \033[1;33m7.\033[0m  Logout                                     │\n");
        printf("│ \033[1;31m0.\033[0m  Exit application                           │\n");
        printf("└─────────────────────────────────────────────────────────┘\n");
    } else {
        printf("\n\033[1;31mNot logged in\033[0m\n");
        printf("\n\033[1;34mWELCOME TO FRIENDBOOK:\033[0m\n");
        printf("┌─────────────────────────────────────────────────────────┐\n");
        printf("│ \033[1;33m1.\033[0m  Register new account                        │\n");
        printf("│ \033[1;33m2.\033[0m  Login to your account                      │\n");
        printf("│ \033[1;31m0.\033[0m  Exit application                           │\n");
        printf("└─────────────────────────────────────────────────────────┘\n");
    }
    
    printf("\n\033[1;36mEnter your choice: \033[0m");
}

int main() {
    User* users = NULL;
    int userCount = 0;
    Graph* g = createGraph(MAX_USERS);
    FRQueue q; fr_init(&q);
    HashTable* ht = createHashTable();

    loadUsers(USERS_FILE, &users, &userCount);
    buildHashTable(ht, users);
    loadFriendships(FRIENDS_FILE, g, users);
    loadRequests(REQS_FILE, &q, users);

    int loggedId = -1;
    char username[MAX_NAME], firstName[MAX_NAME], lastName[MAX_NAME], pass[MAX_PASS];
    const char* currentUser = NULL;

    for(;;) {
        menu(currentUser);
        int choice; 
        if (scanf("%d", &choice)!=1) break;
        
        if (choice==0) {
            autoSave(users, g, &q);
            printf("\n\033[1;32mData saved successfully!\033[0m\n");
            printf("\033[1;33mThank you for using FriendBook! Goodbye!\033[0m\n");
            break;
        }
        
        switch(choice) {
            case 1:
                if (!currentUser) {
                    // Register
                    printf("\n\033[1;34mUSER REGISTRATION\033[0m\n");
                    printf("─────────────────────\n");
                    printf("Username: "); scanf("%49s", username);
                    printf("First Name: "); scanf("%49s", firstName);
                    printf("Last Name: "); scanf("%49s", lastName);
                    printf("Password: "); scanf("%31s", pass);
                    if (registerUser(&users, &userCount, username, firstName, lastName, pass)) {
                        buildHashTable(ht, users);
                        autoSave(users, g, &q);
                        printf("\n\033[1;32mRegistration successful! You can now log in.\033[0m\n");
                    } else {
                        printf("\n\033[1;31mRegistration failed!\033[0m\n");
                    }
                    printf("\nPress Enter to continue...");
                    getchar(); getchar();
                } else {
                    // Display users
                    printf("\n\033[1;34mALL USERS\033[0m\n");
                    printf("────────────\n");
                    displayUsers(users);
                    printf("\nPress Enter to continue...");
                    getchar(); getchar();
                }
                break;
                
            case 2: 
                if (!currentUser) {
                    // Login
                    printf("\n\033[1;34mUSER LOGIN\033[0m\n");
                    printf("─────────────\n");
                    printf("Username: "); scanf("%49s", username);
                    printf("Password: "); scanf("%31s", pass);
                    User* u = hashFind(ht, username);
                    if (u && strcmp(u->password, pass) == 0) {
                        loggedId = u->id;
                        currentUser = getUserDisplayName(users, u->id);
                        printf("\n\033[1;32mWelcome back, %s!\033[0m\n", currentUser);
                    } else {
                        loggedId = -1;
                        currentUser = NULL;
                        printf("\n\033[1;31mInvalid credentials!\033[0m\n");
                    }
                    printf("\nPress Enter to continue...");
                    getchar(); getchar();
                } else {
                    // Send friend request
                    printf("\n\033[1;34mSEND FRIEND REQUEST\033[0m\n");
                    printf("──────────────────────\n");
                    printf("Send request to username: "); scanf("%49s", username);
                    User* to = hashFind(ht, username);
                    if (!to) { 
                        printf("\n\033[1;31mUser not found!\033[0m\n"); 
                    } else if (to->id == loggedId) { 
                        printf("\n\033[1;31mCannot send request to yourself!\033[0m\n"); 
                    } else if (areFriends(g, loggedId, to->id)) { 
                        printf("\n\033[1;33mAlready friends with %s!\033[0m\n", getUserDisplayName(users, to->id)); 
                    } else if (!fr_exists(&q, loggedId, to->id)) {
                        fr_send(&q, loggedId, to->id, users);
                        autoSave(users, g, &q);
                        printf("\n\033[1;32mFriend request sent!\033[0m\n");
                    } else {
                        printf("\n\033[1;33mRequest already pending!\033[0m\n");
                    }
                    printf("\nPress Enter to continue...");
                    getchar(); getchar();
                }
                break;
            
            case 3:
                if (currentUser) {
                    printf("\n\033[1;34mFRIEND REQUESTS\033[0m\n");
                    printf("──────────────────\n");
                    fr_list_for(&q, loggedId, users);
                    printf("\nAccept first pending request? (y/n): ");
                    char ans[8]; scanf("%7s", ans);
                    if (ans[0]=='y' || ans[0]=='Y') {
                        int from,to;
                        if (fr_pop_for(&q, loggedId, &from, &to)) {
                            addFriendship(g, from, to, users);
                            autoSave(users, g, &q);
                            const char* fromName = getUserDisplayName(users, from);
                            printf("\n\033[1;32mAccepted request from %s!\033[0m\n", fromName ? fromName : "Unknown");
                        } else {
                            printf("\n\033[1;33mNo pending requests!\033[0m\n");
                        }
                    } else {
                        printf("\n\033[1;33mRequest not accepted.\033[0m\n");
                    }
                    printf("\nPress Enter to continue...");
                    getchar(); getchar();
                }
                break;
            
            case 4:
                if (currentUser) {
                    printf("\n\033[1;34mMY FRIENDS\033[0m\n");
                    printf("─────────────\n");
                    displayFriends(g, loggedId, users);
                    printf("\nPress Enter to continue...");
                    getchar(); getchar();
                }
                break;
                
            case 5:
                if (currentUser) {
                    printf("\n\033[1;34mFRIEND SUGGESTIONS\033[0m\n");
                    printf("────────────────────\n");
                    generateSuggestions(g, loggedId, users);
                    printf("\nPress Enter to continue...");
                    getchar(); getchar();
                }
                break;
                
            case 6:
                if (currentUser) {
                    printf("\n\033[1;34mREMOVE FRIENDSHIP\033[0m\n");
                    printf("───────────────────\n");
                    int a,b; 
                    printf("Enter two user IDs: "); 
                    scanf("%d %d", &a, &b);
                    removeFriendship(g, a, b, users);
                    autoSave(users, g, &q);
                    printf("\nPress Enter to continue...");
                    getchar(); getchar();
                }
                break;
                
            case 7:
                if (currentUser) {
                    loggedId = -1;
                    currentUser = NULL;
                    printf("\n\033[1;33mLogged out successfully!\033[0m\n");
                    printf("\nPress Enter to continue...");
                    getchar(); getchar();
                }
                break;
                
            default:
                printf("\n\033[1;31mInvalid choice! Please try again.\033[0m\n");
                printf("\nPress Enter to continue...");
                getchar(); getchar();
        }
    }
    
    freeHashTable(ht);
    freeGraph(g);
    return 0;
}
