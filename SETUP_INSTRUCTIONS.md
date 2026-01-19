# GitHub Authentication Setup

## SSH Key Generated Successfully! ✅

Your SSH key has been generated and added to your SSH agent.

### Next Steps:

1. **Add the SSH key to your GitHub account:**
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Title: "Mobile Design System Access" (or any name you prefer)
   - Paste this public key:
     ```
     ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJkKp8xwLGJe3kK/74ttrBpjmqO/OuXazFeAe2X4MSXE github-mobile-ds
     ```
   - Click "Add SSH key"

2. **Test the connection:**
   ```bash
   ssh -T git@github.com
   ```
   You should see: "Hi [username]! You've successfully authenticated..."

3. **Install the mobile design system package:**
   Once authenticated, run:
   ```bash
   npm install git+ssh://git@github.com/eventbrite/mobile-design-system-atoms.git
   ```

## Alternative: Personal Access Token Method

If you prefer using a Personal Access Token instead:

1. Go to: https://github.com/settings/tokens
2. Generate a new token with `repo` scope
3. Install using:
   ```bash
   npm install git+https://YOUR_TOKEN@github.com/eventbrite/mobile-design-system-atoms.git
   ```


