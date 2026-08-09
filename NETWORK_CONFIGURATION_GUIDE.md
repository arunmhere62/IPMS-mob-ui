# Network Configuration Guide - API Connection Issues

## 🔴 Current Issue

The mobile app is trying to connect to `http://172.20.10.2:5000/api/v1` but getting network errors.

---

## 🔍 Root Cause Analysis

### Backend Status
- ✅ Backend is configured to run on port **5000**
- ✅ API prefix is `/api/v1`
- ✅ CORS is enabled for all origins

### Frontend Configuration
- ❌ IP address `172.20.10.2` may not be correct
- ❌ No `.env` file to override the default IP
- ❌ App is using hardcoded IP from `app.config.js`

---

## 🛠️ Solution

### Step 1: Find Your Backend IP Address

**On Windows (Backend Machine):**
```powershell
ipconfig
```

Look for:
- IPv4 Address (usually starts with 192.168.x.x or 10.x.x.x)
- NOT localhost or 127.0.0.1 (these won't work from mobile/emulator)

**Example Output:**
```
Ethernet adapter Ethernet:
   IPv4 Address. . . . . . . . . . : 192.168.1.100
```

### Step 2: Verify Backend is Running

**Check if backend is listening on port 5000:**
```powershell
netstat -ano | findstr :5000
```

**Or test with curl:**
```powershell
curl http://YOUR_IP:5000/api/v1/health
```

### Step 3: Update Mobile App Configuration

#### Option A: Create .env file (Recommended)

Create file: `d:\pg-mobile-app\mob-ui\.env`

```env
API_BASE_URL=http://192.168.1.100:5000/api/v1
SUBSCRIPTION_MODE=true
SHOW_DEV_BANNER=true
```

**Replace `192.168.1.100` with your actual backend IP**

#### Option B: Edit app.config.js (Quick Fix)

Edit: `d:\pg-mobile-app\mob-ui\app.config.js` (Line 68)

```javascript
// Before
apiBaseUrl: process.env.API_BASE_URL || "http://172.20.10.2:5000/api/v1",

// After (replace with your IP)
apiBaseUrl: process.env.API_BASE_URL || "http://192.168.1.100:5000/api/v1",
```

---

## 📋 Common IP Scenarios

### Scenario 1: Backend on Same Machine (Emulator)
```
Backend IP: 10.0.2.2
URL: http://10.0.2.2:5000/api/v1
```

### Scenario 2: Backend on Local Network
```
Backend IP: 192.168.1.100 (example)
URL: http://192.168.1.100:5000/api/v1
```

### Scenario 3: Backend on Docker
```
Backend IP: 172.17.0.1 (Docker gateway)
URL: http://172.17.0.1:5000/api/v1
```

### Scenario 4: Physical Device on Same Network
```
Backend IP: 192.168.1.100 (example)
URL: http://192.168.1.100:5000/api/v1
```

---

## ✅ Verification Checklist

- [ ] Backend is running on port 5000
- [ ] Backend IP is correct (not localhost)
- [ ] Mobile app can reach backend IP (ping test)
- [ ] Port 5000 is not blocked by firewall
- [ ] API_BASE_URL is updated in app.config.js or .env
- [ ] Metro bundler is restarted after config change
- [ ] Mobile app is reloaded

---

## 🧪 Testing Steps

### Step 1: Test Backend Connectivity

**From your development machine:**
```powershell
# Test if backend is running
curl http://YOUR_IP:5000/api/v1/health

# Should return success response
```

### Step 2: Test from Mobile/Emulator

**After updating config:**
1. Restart Metro bundler
2. Reload mobile app
3. Check Network Logs for correct URL

### Step 3: Verify API Response

**Expected Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2024-01-15T10:30:45.123Z",
  "path": "/api/v1/endpoint"
}
```

---

## 🔧 Configuration Files

### File: `app.config.js`
**Location**: `d:\pg-mobile-app\mob-ui\app.config.js` (Line 68)

```javascript
extra: {
  apiBaseUrl: process.env.API_BASE_URL || "http://YOUR_IP:5000/api/v1",
}
```

### File: `.env` (Create if doesn't exist)
**Location**: `d:\pg-mobile-app\mob-ui\.env`

```env
API_BASE_URL=http://YOUR_IP:5000/api/v1
```

### File: `environment.ts`
**Location**: `d:\pg-mobile-app\mob-ui\src\config\environment.ts`

Reads from `app.config.js` extra config

---

## 🚀 Quick Fix Steps

1. **Find your backend IP:**
   ```powershell
   ipconfig
   ```

2. **Update app.config.js:**
   - Replace `172.20.10.2` with your IP
   - Example: `http://192.168.1.100:5000/api/v1`

3. **Restart Metro:**
   - Kill Metro bundler
   - Run `npm start -- --reset-cache`

4. **Reload app:**
   - Press `r` in terminal
   - Or wait for hot reload

5. **Verify:**
   - Check Network Logs
   - Should see successful API calls

---

## 🐛 Troubleshooting

### Issue: Still getting network errors

**Check 1: Firewall**
```powershell
# Windows Firewall - Allow port 5000
netsh advfirewall firewall add rule name="Allow Port 5000" dir=in action=allow protocol=tcp localport=5000
```

**Check 2: Backend Status**
```powershell
# Verify backend is running
netstat -ano | findstr :5000
```

**Check 3: Network Connectivity**
```powershell
# Ping backend IP
ping YOUR_IP
```

### Issue: Correct IP but still failing

1. Check backend logs for errors
2. Verify CORS is enabled (it is in main.ts)
3. Check if port 5000 is actually listening
4. Try accessing from browser: `http://YOUR_IP:5000/api/docs`

### Issue: App keeps using old IP

1. Clear Metro cache: `npm start -- --reset-cache`
2. Delete node_modules/.cache
3. Restart Metro bundler completely
4. Reload app

---

## 📝 Current Configuration

### Backend
- **Port**: 5000
- **Prefix**: /api/v1
- **CORS**: Enabled for all origins
- **Status**: ✅ Configured

### Frontend (Current)
- **IP**: 172.20.10.2 (❌ May be incorrect)
- **Port**: 5000
- **Prefix**: /api/v1
- **Status**: ⚠️ Needs verification

---

## 📞 Support

If still having issues:

1. **Verify backend is running:**
   ```
   npm start (from api folder)
   ```

2. **Check backend logs for errors**

3. **Verify network connectivity:**
   - Can you ping the backend IP?
   - Can you access http://IP:5000/api/docs in browser?

4. **Check mobile app logs:**
   - Network Logs in app
   - Console logs in Metro

---

## ✅ Expected Result

After configuration:
- ✅ Network calls show correct IP
- ✅ API responses are successful
- ✅ Dashboard loads without errors
- ✅ Data displays correctly

**Status**: Ready to configure - Follow steps above to fix network connectivity
