# Memory MongoDB API Documentation

## Authentication

All endpoints require API key authentication using Bearer token in the Authorization header:

```http
Authorization: Bearer your_api_key_here
```

Example:

```bash
curl -H "Authorization: Bearer test-api-key-123" http://localhost:3000/api/graph
```

## Base Endpoints

### Health Check

Check API server status and available features.

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "features": {
    "base": true,
    "temporal": true,
    "patterns": true,
    "pathfinding": true
  }
}
```

### Create Entities

Create one or more entities.

```http
POST /api/entities
```

Request Body:

```json
{
  "entities": [
    {
      "name": "Person1",
      "entityType": "person",
      "observations": ["likes coffee", "works in tech"],
      "metadata": {
        "source": "interview",
        "confidence": 0.9,
        "llmContext": "Generated from conversation about work habits"
      },
      "properties": {
        "age": 30,
        "location": "San Francisco",
        "skills": ["JavaScript", "Python"]
      },
      "status": "active",
      "tags": ["tech", "coffee-lover"]
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "created": [
      {
        "name": "Person1",
        "entityType": "person",
        "observations": ["likes coffee", "works in tech"],
        "metadata": {
          "source": "interview",
          "confidence": 0.9,
          "llmContext": "Generated from conversation about work habits"
        },
        "properties": {
          "age": 30,
          "location": "San Francisco",
          "skills": ["JavaScript", "Python"]
        },
        "status": "active",
        "tags": ["tech", "coffee-lover"]
      }
    ]
  }
}
```

### Create Relations

Create relationships between entities.

```http
POST /api/relations
```

Request Body:

```json
{
  "relations": [
    {
      "from": "Person1",
      "to": "Coffee",
      "relationType": "likes",
      "metadata": {
        "source": "observation",
        "confidence": 0.8,
        "llmContext": "Inferred from daily habits"
      },
      "temporal": {
        "startDate": "2023-01-01T00:00:00Z",
        "isActive": true
      },
      "properties": {
        "frequency": "daily",
        "preference": "strong"
      },
      "context": "Morning routine",
      "strength": 0.9,
      "bidirectional": false
    }
  ]
}
```

[Previous API documentation for other base endpoints remains unchanged...]

## Enhanced Features

### Pattern Analysis

Get commonly used entity or relation types and their properties.

```http
GET /api/patterns?category=entity
```

Parameters:

- `category` (optional): Filter by 'entity' or 'relation'

Response:

```json
{
  "success": true,
  "data": {
    "patterns": [
      {
        "category": "entity",
        "value": "person",
        "frequency": 150,
        "lastUsed": "2023-12-01T10:30:00Z",
        "commonProperties": ["name", "age", "location"]
      }
    ]
  }
}
```

### Temporal Graph

Get graph state within a time period.

```http
GET /api/graph/temporal?startDate=2023-01-01T00:00:00Z&endDate=2023-12-31T23:59:59Z
```

Parameters:

- `startDate`: ISO date string
- `endDate`: ISO date string

Response:

```json
{
  "success": true,
  "data": {
    "graph": {
      "entities": [...],
      "relations": [...]
    }
  }
}
```

### Path Finding

Find path between two entities.

```http
GET /api/graph/path?from=Person1&to=Company1&maxDepth=3
```

Parameters:

- `from`: Source entity name
- `to`: Target entity name
- `maxDepth` (optional): Maximum path length (default: 3)

Response:

```json
{
  "success": true,
  "data": {
    "path": {
      "entities": [
        {
          "name": "Person1",
          "entityType": "person",
          "observations": [...]
        },
        {
          "name": "Company1",
          "entityType": "organization",
          "observations": [...]
        }
      ],
      "relations": [
        {
          "from": "Person1",
          "to": "Company1",
          "relationType": "works_at",
          "temporal": {
            "startDate": "2023-01-01T00:00:00Z",
            "isActive": true
          }
        }
      ]
    }
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {} // Optional additional error details
}
```

Common HTTP Status Codes:

- 400: Bad Request (invalid input)
- 401: Unauthorized (invalid API key)
- 404: Not Found
- 409: Conflict (e.g., duplicate entity)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error

## Rate Limiting

The API implements rate limiting per IP address:

- Window: 15 minutes
- Maximum requests per window: 100

When rate limit is exceeded, the API returns:

```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

## Data Quality

The API supports various data quality features:

1. **Confidence Scores**

   - Both entities and relations can have confidence scores (0-1)
   - Scores can be based on source reliability and verification status

2. **Metadata Tracking**

   - Source attribution
   - Last verification date
   - LLM context preservation
   - Creation and update timestamps

3. **Temporal Tracking**

   - Relationship start and end dates
   - Active status tracking
   - Historical state queries

4. **Property Flexibility**
   - Dynamic property support for both entities and relations
   - Multiple value types (string, number, boolean, date, arrays)
   - Property usage pattern tracking

## Best Practices

1. **Entity Creation**

   - Provide meaningful entity types
   - Include relevant metadata
   - Add descriptive observations
   - Use properties for structured data

2. **Relation Creation**

   - Set temporal information when known
   - Include confidence scores
   - Provide context when available
   - Use bidirectional flag appropriately

3. **Querying**
   - Use temporal queries for time-sensitive data
   - Leverage pattern analysis for consistency
   - Consider path depth in pathfinding queries
   - Include relevant context in searches
