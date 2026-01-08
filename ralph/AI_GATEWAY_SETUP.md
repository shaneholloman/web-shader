# Vercel AI Gateway Setup

Using Vercel AI Gateway with the Ralph agent provides several benefits over direct API keys.

## Why Use AI Gateway?

| Feature | Direct API Keys | AI Gateway |
|---------|----------------|------------|
| Caching | ❌ None | ✅ Automatic (50% cost savings) |
| Rate Limiting | ❌ Manual | ✅ Built-in protection |
| Monitoring | ❌ None | ✅ Usage analytics |
| Fallbacks | ❌ Manual | ✅ Automatic model fallback |
| Cost | 💰 Full price | 💰 ~50% cheaper with cache |

**Recommendation**: Always use AI Gateway for production agents!

## Getting Started

### 1. Get Your AI Gateway API Key

1. Go to https://vercel.com/dashboard
2. Navigate to **Settings** → **AI Gateway**
3. Click **Create API Key**
4. Copy your key (starts with `vg_...`)

### 2. Configure Environment

```bash
# In ralph/.env
AI_GATEWAY_API_KEY=vg_your_key_here
```

That's it! The Ralph agent automatically uses AI Gateway when this key is set.

## How It Works

When you use AI Gateway:

```
Ralph Agent → AI Gateway → Anthropic/OpenAI
            ↑
            └─ Cache layer (saves repeat requests)
```

### Caching Benefits

The agent often makes similar requests:

- Reading the same files multiple times
- Checking compilation repeatedly
- Similar verification checks

AI Gateway caches these, reducing:
- **Costs** by ~50% (cached requests are much cheaper)
- **Latency** (instant response for cached requests)
- **Token usage** (cached tokens don't count toward limits)

### Example Savings

Without caching:
```
Iteration 1: 50,000 tokens → $0.75
Iteration 2: 45,000 tokens (30% repeat) → $0.68
Iteration 3: 48,000 tokens (40% repeat) → $0.72
Total: $2.15
```

With AI Gateway caching:
```
Iteration 1: 50,000 tokens → $0.75
Iteration 2: 45,000 tokens (13,500 cached) → $0.47
Iteration 3: 48,000 tokens (19,200 cached) → $0.43
Total: $1.65 (23% savings!)
```

Over a full Phase 2 (30 iterations), this adds up significantly.

## Monitoring

View usage in your Vercel dashboard:

- **Total requests** per phase
- **Cache hit rate** (should be 30-50%)
- **Cost breakdown** (input, output, cached)
- **Latency metrics**
- **Error rates**

Access at: https://vercel.com/dashboard/ai-gateway

## Model Configuration

AI Gateway works with the standard model names:

```bash
# In ralph/.env or ralph-agent.ts
AGENT_MODEL=anthropic/claude-opus-4.5
```

Available models:
- `anthropic/claude-opus-4.5` — Most capable ($15/$75 per 1M tokens)
- `anthropic/claude-opus-4` — Previous gen ($15/$75 per 1M tokens)
- `anthropic/claude-sonnet-4` — Faster, cheaper ($3/$15 per 1M tokens)
- `openai/gpt-4-turbo` — OpenAI alternative ($10/$30 per 1M tokens)

## Rate Limiting

AI Gateway automatically handles rate limits:

- Queues requests if you hit API limits
- Retries failed requests with exponential backoff
- Switches to fallback model if primary is unavailable

No code changes needed!

## Fallback Configuration

You can configure model fallbacks in AI Gateway settings:

1. **Primary**: `anthropic/claude-opus-4.5`
2. **Fallback 1**: `anthropic/claude-sonnet-4` (if Opus unavailable)
3. **Fallback 2**: `openai/gpt-4-turbo` (if both Anthropic models fail)

The agent automatically uses whatever model is available.

## Troubleshooting

### "Missing API key" error

**Solution**: Ensure `AI_GATEWAY_API_KEY` is set in `ralph/.env`:
```bash
AI_GATEWAY_API_KEY=vg_your_key_here
```

### High costs despite caching

**Possible causes**:
1. First run (no cache yet)
2. Frequently changing files (cache invalidated)
3. Random/timestamp data in prompts

**Solutions**:
- Run multiple phases to build cache
- Use consistent file paths
- Avoid unnecessary timestamps in prompts

### Cache not hitting

**Check**:
1. Are you reusing the same model?
2. Are prompts consistent?
3. Is caching enabled in AI Gateway settings?

View cache hit rate in dashboard.

### Rate limit errors

AI Gateway should handle these automatically. If you see rate limit errors:

1. Check your AI Gateway quota
2. Increase rate limits in settings
3. Use a slower model (Sonnet instead of Opus)

## Cost Optimization

### Best Practices

1. **Use AI Gateway** — Automatic 30-50% savings
2. **Start with Sonnet** — 5x cheaper than Opus for simple tasks
3. **Use Opus for complex phases** — Phase 2 benefits from Opus quality
4. **Set cost limits** — Prevent runaway spending
5. **Monitor dashboard** — Watch for expensive operations

### Recommended Model Strategy

```typescript
// Phase 1: Monorepo Setup (simple)
AGENT_MODEL=anthropic/claude-sonnet-4  // $3-5 instead of $15-20

// Phase 2: Core Implementation (complex)
AGENT_MODEL=anthropic/claude-opus-4.5  // Worth the quality

// Phase 3: Examples App (medium)
AGENT_MODEL=anthropic/claude-sonnet-4  // Good enough for UI
```

### Cost Per Phase (with AI Gateway)

| Phase | Model | Without Cache | With Cache | Savings |
|-------|-------|---------------|------------|---------|
| Phase 1 | Sonnet | $2-5 | $1-3 | 30-50% |
| Phase 2 | Opus | $15-25 | $10-15 | 40% |
| Phase 3 | Sonnet | $5-10 | $3-6 | 40% |
| **Total** | Mixed | **$22-40** | **$14-24** | **~40%** |

## Alternative: Direct API Keys

If you prefer not to use AI Gateway:

```bash
# In ralph/.env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

You'll miss out on caching and monitoring, but the agent will still work fine.

## Summary

✅ **Use AI Gateway** for:
- Production agents
- Multi-phase builds
- Cost optimization
- Usage monitoring

❌ **Skip AI Gateway** if:
- Testing locally
- One-time use
- Don't care about costs

For ralph-gpu (3 phases, 30-60 iterations), AI Gateway can save $10-20 in API costs!

## Resources

- [AI Gateway Docs](https://vercel.com/docs/ai-gateway)
- [Dashboard](https://vercel.com/dashboard/ai-gateway)
- [Pricing](https://vercel.com/docs/ai-gateway/pricing)
- [API Reference](https://vercel.com/docs/ai-gateway/api-reference)
