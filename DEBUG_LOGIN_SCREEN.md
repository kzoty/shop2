# Debugging Login Screen Not Showing

## Steps to Debug

1. **Open your browser and go to your app URL**
   - On Android Chrome: `http://your-ip:8000/index.html` or just `http://your-ip:8000/`

2. **Open Developer Console**
   - Android Chrome: Tap Menu (3 dots) → More tools → Developer tools (or press F12)
   - Desktop Chrome: Press F12 or Ctrl+Shift+I

3. **Click the "Console" tab**

4. **Reload the page** (F5 or Ctrl+R)

5. **Look for logs starting with:**
   - `[auth.js] Loading auth.js file` - Confirms auth.js loaded
   - `[script.js] document.readyState: ...` - Shows DOM state when script loaded
   - `[performInitialization]` - Shows initialization starting
   - `[initAuth]` - Shows authentication check details
   - `[showAuthScreen]` - Shows login screen being displayed

## Expected Console Output (if working correctly)

```
[auth.js] Loading auth.js file
[script.js] document.readyState: interactive
[script.js] DOM already loaded, calling initialization immediately...
[performInitialization] ====== START ======
[performInitialization] Calling initAuth()...
[initAuth] Starting...
[initAuth] dataStore.initialized: false
[initAuth] DataStore not initialized, initializing...
[initAuth] Checking stored user...
[initAuth] sessionEmail from localStorage: null
[initAuth] No active session, user not authenticated
[performInitialization] User NOT authenticated
[performInitialization] Showing auth screen...
[auth.js] showAuthScreen() called
[auth.js] authScreen element: <div id="authScreen" class="auth-screen">...</div>
[auth.js] authScreen.style.display set to flex
[auth.js] appContainer element: <div id="appContainer" class="container">...</div>
[auth.js] appContainer hidden
[createAuthScreen] Creating auth screen element
[createAuthScreen] Inserting authScreen into body
[createAuthScreen] body: <body>...</body>
[createAuthScreen] body.firstChild: <div id="appContainer">...</div>
[createAuthScreen] authScreen inserted
[createAuthScreen] Focusing email input: true
[performInitialization] ====== Auth screen shown ======
```

## If You See Errors

If you see any error messages like:
- `Cannot read property 'initialize' of undefined` - dataStore not loaded
- `showAuthScreen is not a function` - auth.js not loaded
- `Cannot find element 'appContainer'` - HTML structure issue

**Please copy the FULL console output and check what error appears!**

## Common Issues

### Issue 1: dataStore is undefined
- Check if `data-store.js` is loading (look for network requests in Network tab)
- Make sure `/data.json` exists

### Issue 2: initAuth is not a function
- Check if `auth.js` is loading (look for network requests in Network tab)
- Check for JavaScript syntax errors in auth.js

### Issue 3: Login screen appears but is blank or styled wrong
- Check Network tab to see if `styles.css` loaded
- Check if FontAwesome CSS loaded (search for `font-awesome`)

### Issue 4: appContainer not found
- Check if HTML has `id="appContainer"` in the container div
- Make sure index.html wasn't accidentally modified

## Network Tab Check

1. Open Developer Tools → Network tab
2. Reload page
3. You should see these files load:
   - index.html (200 or 304)
   - data-store.js (200 or 304)
   - auth.js (200 or 304)
   - script.js (200 or 304)
   - styles.css (200 or 304)
   - manifest.json (200 or 304)

If any show 404, that file doesn't exist on the server.
