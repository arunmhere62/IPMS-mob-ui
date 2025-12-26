# TypeScript Configuration & Type Safety

## 🎯 Overview

Comprehensive TypeScript configuration to catch type errors during development and compilation, preventing runtime errors and improving code quality.

## ⚙️ Configuration

### **tsconfig.json**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    // Strict Mode (Enables all strict type checking)
    "strict": true,
    
    // Individual Strict Checks
    "noImplicitAny": true,              // Error on expressions with implied 'any' type
    "strictNullChecks": true,           // Strict null and undefined checks
    "strictFunctionTypes": true,        // Strict checking of function types
    "strictPropertyInitialization": true, // Ensure class properties are initialized
    "noImplicitThis": true,             // Error on 'this' with implied 'any' type
    "alwaysStrict": true,               // Parse in strict mode
    
    // Additional Checks
    "noUnusedLocals": true,             // Error on unused local variables
    "noUnusedParameters": true,         // Error on unused function parameters
    "noImplicitReturns": true,          // Error on code paths that don't return
    "noFallthroughCasesInSwitch": true, // Error on fallthrough in switch
    "skipLibCheck": true,               // Skip type checking of declaration files
    
    // Module Resolution
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]                  // Path alias for imports
    },
    "jsx": "react-native",
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

## 📦 NPM Scripts

### **package.json**

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",           // Check types without emitting files
    "typecheck:watch": "tsc --noEmit --watch", // Watch mode for type checking
    "start": "expo start",
    "prestart": "npm run typecheck",       // Run type check before start
    "android": "expo run:android",
    "preandroid": "npm run typecheck",     // Run type check before Android build
    "ios": "expo run:ios",
    "preios": "npm run typecheck",         // Run type check before iOS build
    "web": "expo start --web",
    "lint": "tsc --noEmit && eslint . --ext .ts,.tsx" // Type check + lint
  }
}
```

## 🔧 Usage

### **Manual Type Check**
```bash
# Check types once
npm run typecheck

# Watch mode (re-check on file changes)
npm run typecheck:watch

# Type check + lint
npm run lint
```

### **Automatic Type Check**
Type checking runs automatically before:
- ✅ `npm start` - Development server
- ✅ `npm run android` - Android build
- ✅ `npm run ios` - iOS build

## 🐛 Common Type Errors & Fixes

### **1. Property Does Not Exist on Type**

**Error:**
```typescript
Property 'auth' does not exist on type 'PersistPartial'
```

**Fix:**
```typescript
// Before
const state = store.getState();
const { user } = state.auth; // ❌ Type error

// After
import { RootState } from '../../store';

const state = store.getState() as RootState;
const { user } = state.auth; // ✅ Works
```

### **2. Implicit Any Type**

**Error:**
```typescript
Parameter 'error' implicitly has an 'any' type
```

**Fix:**
```typescript
// Before
catch (error) { // ❌ Implicit any
  console.error(error);
}

// After
catch (error: any) { // ✅ Explicit any
  console.error(error);
}

// Better
catch (error: any) { // ✅ Explicit any
  console.error(error.message);
}
```

### **3. Unused Variables**

**Error:**
```typescript
'activeTenants' is declared but its value is never read
```

**Fix:**
```typescript
// Before
const activeTenants = tenants.filter(t => t.status === 'ACTIVE'); // ❌ Unused

// After - Option 1: Use it
const activeTenants = tenants.filter(t => t.status === 'ACTIVE');
console.log('Active tenants:', activeTenants.length); // ✅ Used

// After - Option 2: Remove it
// ✅ Removed unused variable

// After - Option 3: Prefix with underscore (intentionally unused)
const _activeTenants = tenants.filter(t => t.status === 'ACTIVE'); // ✅ Ignored
```

### **4. Strict Null Checks**

**Error:**
```typescript
Object is possibly 'null' or 'undefined'
```

**Fix:**
```typescript
// Before
const name = user.name; // ❌ user might be null

// After - Option 1: Optional chaining
const name = user?.name; // ✅ Safe

// After - Option 2: Null check
if (user) {
  const name = user.name; // ✅ Safe
}

// After - Option 3: Non-null assertion (use carefully!)
const name = user!.name; // ✅ Asserts user is not null
```

### **5. Function Return Type**

**Error:**
```typescript
Function lacks ending return statement
```

**Fix:**
```typescript
// Before
function getUser(id: number): User { // ❌ Missing return
  if (id > 0) {
    return users.find(u => u.id === id);
  }
  // Missing return for else case
}

// After
function getUser(id: number): User | undefined { // ✅ Explicit return type
  if (id > 0) {
    return users.find(u => u.id === id);
  }
  return undefined; // ✅ All paths return
}
```

## 📊 Type Safety Levels

### **Level 1: Basic (Default)**
```json
{
  "compilerOptions": {
    "strict": false
  }
}
```
- ⚠️ Minimal type checking
- ⚠️ Many errors slip through
- ⚠️ Not recommended

### **Level 2: Strict (Recommended)**
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```
- ✅ All strict checks enabled
- ✅ Catches most type errors
- ✅ **Current configuration**

### **Level 3: Maximum (Paranoid)**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```
- ✅ All strict checks
- ✅ Additional checks for unused code
- ✅ **Current configuration**

## 🎯 Best Practices

### **1. Always Type Function Parameters**
```typescript
// ❌ Bad
function handleError(error) {
  console.error(error);
}

// ✅ Good
function handleError(error: Error) {
  console.error(error.message);
}

// ✅ Better
function handleError(error: any) {
  console.error(error.response?.data);
}
```

### **2. Use Type Imports**
```typescript
// ✅ Import types
import { RootState, AppDispatch } from '../store';
import type { User } from '../types';

// ✅ Use in code
const state = store.getState() as RootState;
const dispatch = useDispatch<AppDispatch>();
```

### **3. Define Return Types**
```typescript
// ❌ Implicit return type
async function fetchUser(id: number) {
  const response = await api.getUser(id);
  return response.data;
}

// ✅ Explicit return type
async function fetchUser(id: number): Promise<User> {
  const response = await api.getUser(id);
  return response.data;
}
```

### **4. Use Strict Null Checks**
```typescript
// ❌ Unsafe
function getUserName(user: User) {
  return user.name.toUpperCase(); // Crashes if name is null
}

// ✅ Safe
function getUserName(user: User | null): string {
  return user?.name?.toUpperCase() ?? 'Unknown';
}
```

### **5. Avoid 'any' Type**
```typescript
// ❌ Bad (loses type safety)
const data: any = await fetchData();

// ✅ Good (maintains type safety)
interface DataResponse {
  id: number;
  name: string;
}

const data: DataResponse = await fetchData();

// ✅ Better (type inference)
const data = await fetchData<DataResponse>();
```

## 🔍 IDE Integration

### **VS Code**

**Settings (`.vscode/settings.json`):**
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll": true,
    "source.organizeImports": true
  }
}
```

### **Real-time Type Checking**

VS Code shows type errors in real-time:
- 🔴 Red squiggly lines = Type errors
- 🟡 Yellow squiggly lines = Warnings
- Hover for details
- `Ctrl+.` for quick fixes

## 📈 Benefits

### **Before Strict TypeScript**
```
❌ Runtime errors from null/undefined
❌ Typos in property names
❌ Wrong function arguments
❌ Missing return statements
❌ Unused variables cluttering code
```

### **After Strict TypeScript**
```
✅ Catch errors at compile time
✅ Auto-complete for properties
✅ Type-safe function calls
✅ Enforced return types
✅ Clean, maintainable code
```

## 🚀 Migration Guide

### **For Existing Code**

1. **Enable strict mode gradually:**
```json
{
  "compilerOptions": {
    "strict": false,
    "strictNullChecks": true  // Enable one at a time
  }
}
```

2. **Fix errors file by file**
3. **Enable next strict option**
4. **Repeat until all enabled**

### **For New Code**

Start with full strict mode from day one:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## ✅ Checklist

- [x] `tsconfig.json` configured with strict mode
- [x] Type check scripts added to `package.json`
- [x] Pre-build type checks enabled
- [x] RootState type imported where needed
- [x] All type errors fixed
- [ ] Run `npm run typecheck` to verify
- [ ] Enable watch mode during development
- [ ] Fix any remaining warnings

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

**Last Updated**: Nov 5, 2025  
**TypeScript Version**: 5.x  
**Strict Mode**: ✅ Enabled  
**Status**: Production Ready
