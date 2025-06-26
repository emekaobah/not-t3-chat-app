# 🛠️ API Method Mismatch Fix

## ❌ **Issues Found:**

### **1. HTTP Method Mismatch**

- **Problem**: React Query hooks trying to POST to `/api/user-models`
- **Reality**: API only supports GET and PATCH methods
- **Error**: `405 Method Not Allowed`

### **2. Request Body Format Mismatch**

- **Hook was sending**: `{ model_id: string, is_enabled: boolean }`
- **API expects**: `{ modelId: string, isEnabled: boolean }`
- **Error**: API couldn't parse the request

### **3. Bulk API Parameter Mismatch**

- **Hook was sending**: `{ model_ids: string[], is_enabled: boolean }`
- **API expects**: `{ action: string, modelIds: string[] }`
- **Error**: `400 Bad Request`

## ✅ **Fixes Applied:**

### **File: `hooks/queries/useModelPreferences.ts`**

#### **Single Model Update Fix:**

```typescript
// BEFORE ❌
method: 'POST',
body: JSON.stringify({ model_id: modelId, is_enabled: isEnabled })

// AFTER ✅
method: 'PATCH',
body: JSON.stringify({ modelId, isEnabled })
```

#### **Bulk Update Fix:**

```typescript
// BEFORE ❌
body: JSON.stringify({ model_ids: modelIds, is_enabled: isEnabled });

// AFTER ✅
const action = isEnabled ? "enable" : "disable";
body: JSON.stringify({ action, modelIds });
```

### **File: `app/settings/page.tsx`**

#### **Special Handling for Recommended Models:**

```typescript
// NEW ✅ - Use API's built-in recommended logic
if (action === "recommended") {
  const response = await fetch("/api/user-models/bulk", {
    method: "POST",
    body: JSON.stringify({ action: "recommended" }),
  });
  refetch(); // Manual refetch since this bypasses React Query
  return;
}
```

## 🎯 **Expected Results:**

- ✅ **Individual model toggles**: Now use PATCH with correct field names
- ✅ **Bulk operations**: Now use action-based API interface
- ✅ **Recommended models**: Uses server-side logic for smart recommendations
- ✅ **Error handling**: Proper HTTP status codes and error messages
- ✅ **Optimistic updates**: Work correctly with proper rollback on failure

## 🧪 **Ready to Test:**

1. **Settings Page**: `/settings` → Models tab
2. **Individual Toggles**: Click any model switch → Should work without 405 errors
3. **Bulk Actions**:
   - "Select Recommended" → Uses API's recommendation algorithm
   - "Disable All" → Disables all models via bulk API
   - Works without 400 errors

**API Method Mismatch: RESOLVED** ✅
