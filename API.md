# API Contract

## `POST /api/agent`

Send a prompt to the AI agent and receive a response.

### Request

```json
{
  "prompt": "string (required)"
}
```

### Success Response — `200`

```json
{
  "result": "string"
}
```

### Error Responses

**400 — Bad Request**
```json
{
  "error": "prompt is required and must be a string"
}
```

**500 — Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

**429 — Rate Limited**
```json
{
  "error": "Rate limited. Please wait a few seconds."
}
```

### Example

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, can you help me?"}'
```
