# Memory MongoDB MCP Server

This MCP server provides Claude with memory capabilities through a knowledge graph stored in MongoDB. It uses a REST API for persistence, allowing the memory to be shared and persisted across sessions.

## Features

- Create and manage entities with observations
- Create relationships between entities
- Search through entities and their observations
- Persistent storage through MongoDB
- Full CRUD operations for entities, relations, and observations

## Configuration

The server requires the following environment variables:

- `MEMORY_API_KEY`: API key for authentication with the MongoDB API
- `MEMORY_API_URL`: URL of the MongoDB API server (defaults to http://localhost:3000 if not set)

You can set these environment variables in your system or use them when configuring the MCP server in your settings file.

## Installation

```bash
npm install @modelcontextprotocol/server-memory-mongo
```

## Usage in MCP Settings

Add the following to your MCP settings file (e.g., `cline_mcp_settings.json` or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "memory": {
      "command": "node",
      "args": ["/path/to/memory-mongo/dist/index.js"],
      "env": {
        "MEMORY_API_KEY": "your_api_key_here",
        "MEMORY_API_URL": "https://memory-api-production.up.railway.app"
      }
    }
  }
}
```

## Available Tools

1. `create_entities`: Create new entities in the knowledge graph
2. `create_relations`: Create relationships between entities
3. `add_observations`: Add observations to existing entities
4. `delete_entities`: Remove entities and their relations
5. `delete_observations`: Remove specific observations from entities
6. `delete_relations`: Remove relationships between entities
7. `read_graph`: Retrieve the entire knowledge graph
8. `search_nodes`: Search for nodes based on a query
9. `open_nodes`: Retrieve specific nodes by their names

## Development

```bash
# Install dependencies
npm install

# Build the server
npm run build

# Watch for changes during development
npm run watch
```

## License

MIT
