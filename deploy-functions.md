# Supabase Edge Functions Deployment Guide

## Prerequisites
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login
```

## Link Your Project
```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Get your project ref from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/general
```

## Set Environment Variables

Your Edge Functions need the OpenAI API key:

```bash
# Set OpenAI API key as a secret
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

## Deploy All Functions

Deploy each function individually:

```bash
# 1. Parse tour requests
supabase functions deploy parse-tour-request

# 2. Generate audio
supabase functions deploy generate-audio

# 3. Generate tour content
supabase functions deploy generate-tour-content

# 4. Save tour
supabase functions deploy save-tour

# 5. Get tours
supabase functions deploy get-tours

# 6. Transcribe audio
supabase functions deploy transcribe-audio

# 7. Analyze images
supabase functions deploy analyze-image
```

## Or Deploy All at Once

```bash
# Deploy all functions
supabase functions deploy parse-tour-request && \
supabase functions deploy generate-audio && \
supabase functions deploy generate-tour-content && \
supabase functions deploy save-tour && \
supabase functions deploy get-tours && \
supabase functions deploy transcribe-audio && \
supabase functions deploy analyze-image
```

## Verify Deployment

```bash
# List all deployed functions
supabase functions list

# Check function logs
supabase functions logs parse-tour-request
```

## Test a Function

```bash
# Test parse-tour-request
supabase functions invoke parse-tour-request \
  --body '{"message":"Show me Paris highlights"}'
```

---

## Required Environment Variables

Make sure to set these in Supabase:

```bash
supabase secrets set OPENAI_API_KEY=sk-...your-key
```

You can verify secrets with:
```bash
supabase secrets list
```

---

## Troubleshooting

### Function fails to deploy
- Check that you're in the project root directory
- Verify `supabase/functions/[function-name]/index.ts` exists
- Check for TypeScript errors in the function

### Function returns errors
- Check logs: `supabase functions logs [function-name]`
- Verify environment variables are set
- Test with sample data

### CORS errors
- Edge Functions already have CORS headers configured
- If issues persist, check the function's CORS configuration
