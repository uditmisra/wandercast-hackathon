# Complete Supabase Setup Checklist

## ✅ Step-by-Step Setup

### 1️⃣ Create Supabase Project (5 min)

- [ ] Go to https://supabase.com/dashboard
- [ ] Click "New Project"
- [ ] Name: `edinburgh-whispers` (or your choice)
- [ ] Set strong database password (save it!)
- [ ] Choose region closest to users
- [ ] Wait for project creation (~2 min)

---

### 2️⃣ Get Credentials (2 min)

Go to Project Settings → API:

- [ ] Copy **Project URL**: `https://xxxxx.supabase.co`
- [ ] Copy **anon public key**: `eyJ...` (long string)

**Save these! You'll need them in Step 5.**

---

### 3️⃣ Install Supabase CLI (5 min)

```bash
# Install CLI globally
npm install -g supabase

# Login to your Supabase account
supabase login
```

This will open a browser for authentication.

---

### 4️⃣ Link Your Project (2 min)

```bash
# Get your project ref from URL:
# https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/general

# Link to the project
supabase link --project-ref YOUR_PROJECT_REF
```

---

### 5️⃣ Set Environment Variables (3 min)

**A. Set in Supabase (for Edge Functions):**

```bash
# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=sk-your-openai-key-here

# Verify it's set
supabase secrets list
```

**B. Set in Lovable (for Frontend):**

1. Go to your Lovable project: https://lovable.dev/projects/d0cdb7ca-a47e-4148-b010-a13909fca1f3
2. Click **Settings** → **Environment Variables**
3. Add these variables:
   - `VITE_SUPABASE_URL` = Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = Your anon key
   - `VITE_OPENAI_API_KEY` = Your OpenAI API key (for frontend use)

---

### 6️⃣ Deploy Edge Functions (10 min)

From your project root directory:

```bash
# Deploy all functions at once
supabase functions deploy parse-tour-request && \
supabase functions deploy generate-audio && \
supabase functions deploy generate-tour-content && \
supabase functions deploy save-tour && \
supabase functions deploy get-tours && \
supabase functions deploy transcribe-audio && \
supabase functions deploy analyze-image
```

**Verify deployment:**
```bash
supabase functions list
```

You should see 7 functions listed.

---

### 7️⃣ Set Up Database (Optional - 5 min)

If you want to save tours to the database:

```bash
# Run migrations (if you have any)
supabase db push

# Or set up tables manually in Supabase Dashboard
# Go to: Table Editor → Create new table
```

**Required tables:**
- `tours` - Store user tours
- `places` - Store place data

*Note: The app works without database storage, but you won't have persistence.*

---

### 8️⃣ Test Your Setup (5 min)

**Test Edge Function:**
```bash
supabase functions invoke parse-tour-request \
  --body '{"message":"Show me Paris highlights"}'
```

Expected output:
```json
{
  "success": true,
  "data": {
    "places": [...],
    "interests": [...],
    ...
  }
}
```

**Test in Lovable:**
1. Redeploy your Lovable app (it will pick up new env variables)
2. Try: "Show me Paris highlights"
3. Check browser console for logs

---

## 🔑 API Keys You Need

### 1. OpenAI API Key
- Get from: https://platform.openai.com/api-keys
- Used for: Content generation
- Cost: ~$0.002 per tour

### 2. ElevenLabs API Key (Optional)
- Get from: https://elevenlabs.io/
- Used for: Audio generation
- Not required initially (app uses fallback)

---

## 🐛 Troubleshooting

### ❌ "Function not found"
- Run: `supabase functions list`
- Redeploy if missing

### ❌ "OpenAI API error"
- Check: `supabase secrets list`
- Verify key is valid at https://platform.openai.com/api-keys

### ❌ "CORS error"
- Edge Functions have CORS configured
- Check browser console for exact error
- May need to redeploy function

### ❌ "Unauthorized"
- Check Lovable env variables are set correctly
- Verify anon key matches your Supabase project

---

## 📊 Estimated Time

- Total setup: **~35 minutes**
- Just Edge Functions: **~20 minutes**
- Testing & verification: **~10 minutes**

---

## 🎯 Quick Start (Minimum Required)

If you just want to get it working quickly:

```bash
# 1. Create Supabase project (web UI)
# 2. Get credentials (web UI)
# 3. Install CLI
npm install -g supabase
supabase login

# 4. Link project
supabase link --project-ref YOUR_REF

# 5. Set secret
supabase secrets set OPENAI_API_KEY=sk-your-key

# 6. Deploy main function
supabase functions deploy parse-tour-request

# 7. Update Lovable env vars (web UI)
# 8. Test!
```

---

## 📚 Additional Resources

- **Supabase CLI Docs**: https://supabase.com/docs/guides/cli
- **Edge Functions Guide**: https://supabase.com/docs/guides/functions
- **Lovable Env Vars**: https://docs.lovable.dev/tips-tricks/environment-variables

---

## ✅ Success Checklist

- [ ] Supabase project created
- [ ] Credentials obtained
- [ ] CLI installed and logged in
- [ ] Project linked locally
- [ ] OpenAI secret set in Supabase
- [ ] All 7 Edge Functions deployed
- [ ] Environment variables set in Lovable
- [ ] Test function returns success
- [ ] Tour generation works in app

**Once all checked, your app is fully operational!** 🎉
