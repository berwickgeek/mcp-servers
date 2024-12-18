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

## Endpoints

### Health Check

Check API server status.

```http
GET /health
```

Response:

```json
{
  "status": "ok"
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
      "observations": ["likes coffee", "works in tech"]
    },
    {
      "name": "Coffee",
      "entityType": "beverage",
      "observations": ["hot drink"]
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
        "observations": ["likes coffee", "works in tech"]
      },
      {
        "name": "Coffee",
        "entityType": "beverage",
        "observations": ["hot drink"]
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
      "relationType": "likes"
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
        "from": "Person1",
        "to": "Coffee",
        "relationType": "likes"
      }
    ]
  }
}
```

### Add Observations

Add observations to existing entities.

```http
POST /api/observations
```

Request Body:

```json
{
  "observations": [
    {
      "entityName": "Coffee",
      "contents": ["contains caffeine", "popular morning drink"]
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "updates": [
      {
        "entityName": "Coffee",
        "addedObservations": ["contains caffeine", "popular morning drink"]
      }
    ]
  }
}
```

### Delete Entities

Delete one or more entities and their associated relations.

```http
DELETE /api/entities
```

Request Body:

```json
{
  "entityNames": ["Person1", "Coffee"]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "message": "Entities deleted successfully"
  }
}
```

### Delete Relations

Delete specific relations between entities.

```http
DELETE /api/relations
```

Request Body:

```json
{
  "relations": [
    {
      "from": "Person1",
      "to": "Coffee",
      "relationType": "likes"
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "message": "Relations deleted successfully"
  }
}
```

### Delete Observations

Delete specific observations from entities.

```http
DELETE /api/observations
```

Request Body:

```json
{
  "deletions": [
    {
      "entityName": "Coffee",
      "observations": ["hot drink"]
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "message": "Observations deleted successfully"
  }
}
```

### Get Full Graph

Retrieve the entire graph with all entities and relations.

```http
GET /api/graph
```

Response:

```json
{
  "success": true,
  "data": {
    "entities": [
      {
        "name": "Person1",
        "entityType": "person",
        "observations": ["likes coffee", "works in tech"]
      },
      {
        "name": "Coffee",
        "entityType": "beverage",
        "observations": ["hot drink", "contains caffeine"]
      }
    ],
    "relations": [
      {
        "from": "Person1",
        "to": "Coffee",
        "relationType": "likes"
      }
    ]
  }
}
```

### Search Nodes

Search for nodes in the graph using text search.

```http
GET /api/search?query=coffee
```

Response:

```json
{
  "success": true,
  "data": {
    "graph": {
      "entities": [
        {
          "name": "Coffee",
          "entityType": "beverage",
          "observations": ["hot drink", "contains caffeine"]
        }
      ],
      "relations": []
    }
  }
}
```

### Get Specific Nodes

Retrieve specific nodes by their names.

```http
POST /api/nodes
```

Request Body:

```json
{
  "names": ["Person1", "Coffee"]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "graph": {
      "entities": [
        {
          "name": "Person1",
          "entityType": "person",
          "observations": ["likes coffee", "works in tech"]
        },
        {
          "name": "Coffee",
          "entityType": "beverage",
          "observations": ["hot drink", "contains caffeine"]
        }
      ],
      "relations": [
        {
          "from": "Person1",
          "to": "Coffee",
          "relationType": "likes"
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
