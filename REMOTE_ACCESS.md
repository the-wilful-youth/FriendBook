# Remote Access Guide (macOS)

## Quick Start (Recommended)

```bash
./share.sh
```

This will automatically:
1. Install ngrok via Homebrew (if needed)
2. Start your FriendBook server
3. Create a public tunnel
4. Show you the URL to share

## Manual Setup

### Option 1: ngrok (Internet Access)

1. **Install Homebrew** (if not installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install ngrok:**
   ```bash
   brew install ngrok/ngrok/ngrok
   ```

3. **Get auth token** from https://ngrok.com (free account)

4. **Set auth token:**
   ```bash
   ngrok authtoken YOUR_TOKEN
   ```

5. **Start server and tunnel:**
   ```bash
   make run-web &
   ngrok http 3000
   ```

### Option 2: Local Network (Same WiFi)

1. **Find your Mac's IP:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Start server:**
   ```bash
   make run-web
   ```

3. **Share with friends:** `http://YOUR_IP:3000`

## Troubleshooting

- **Port already in use:** The script will find an available port automatically
- **Firewall issues:** Go to System Preferences > Security & Privacy > Firewall and allow Node.js
- **Network issues:** Make sure you're connected to WiFi

## What Your Friend Sees

Your friend will access the same FriendBook interface and can:
- Register a new account
- Send you friend requests
- Chat and interact in real-time

Just run `./share.sh` and share the ngrok URL!
