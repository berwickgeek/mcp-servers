#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance, AxiosError } from 'axios';

// API configuration
const API_KEY = process.env.MEMORY_API_KEY;
const API_BASE_URL = process.env.MEMORY_API_URL || 'http://localhost:3000';

if (!API_KEY) {
  throw new Error('MEMORY_API_KEY environment variable is required');
}

// Interfaces for our knowledge graph data structures
interface Entity {
  name: string;
  entityType: string;
  observations: string[];
}

interface Relation {
  from: string;
  to: string;
  relationType: string;
}

interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
}

// API Response interfaces
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiError {
  success: false;
  error: string;
  details?: Record<string, unknown>;
}

// The KnowledgeGraphManager class contains all operations to interact with the knowledge graph via the API
class KnowledgeGraphManager {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const apiError = (error.response?.data || {}) as Partial<ApiError>;
      throw new Error(apiError?.error || error.message);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred');
  }

  async createEntities(entities: Entity[]): Promise<Entity[]> {
    try {
      const response = await this.api.post<ApiResponse<{ created: Entity[] }>>('/api/entities', { entities });
      return response.data.data.created;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createRelations(relations: Relation[]): Promise<Relation[]> {
    try {
      const response = await this.api.post<ApiResponse<{ created: Relation[] }>>('/api/relations', { relations });
      return response.data.data.created;
    } catch (error) {
      this.handleError(error);
    }
  }

  async addObservations(observations: { entityName: string; contents: string[] }[]): Promise<{ entityName: string; addedObservations: string[] }[]> {
    try {
      const response = await this.api.post<ApiResponse<{ updates: { entityName: string; addedObservations: string[] }[] }>>('/api/observations', { observations });
      return response.data.data.updates;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteEntities(entityNames: string[]): Promise<void> {
    try {
      await this.api.delete<ApiResponse<{ message: string }>>('/api/entities', { data: { entityNames } });
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteObservations(deletions: { entityName: string; observations: string[] }[]): Promise<void> {
    try {
      await this.api.delete<ApiResponse<{ message: string }>>('/api/observations', { data: { deletions } });
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteRelations(relations: Relation[]): Promise<void> {
    try {
      await this.api.delete<ApiResponse<{ message: string }>>('/api/relations', { data: { relations } });
    } catch (error) {
      this.handleError(error);
    }
  }

  async readGraph(): Promise<KnowledgeGraph> {
    try {
      const response = await this.api.get<ApiResponse<KnowledgeGraph>>('/api/graph');
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async searchNodes(query: string): Promise<KnowledgeGraph> {
    try {
      const response = await this.api.get<ApiResponse<{ graph: KnowledgeGraph }>>(`/api/search?query=${encodeURIComponent(query)}`);
      return response.data.data.graph;
    } catch (error) {
      this.handleError(error);
    }
  }

  async openNodes(names: string[]): Promise<KnowledgeGraph> {
    try {
      const response = await this.api.post<ApiResponse<{ graph: KnowledgeGraph }>>('/api/nodes', { names });
      return response.data.data.graph;
    } catch (error) {
      this.handleError(error);
    }
  }
}

const knowledgeGraphManager = new KnowledgeGraphManager();

// The server instance and tools exposed to Claude
const server = new Server({
  name: "memory-mongo-server",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
  },
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_entities",
        description: "Create multiple new entities in the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            entities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "The name of the entity" },
                  entityType: { type: "string", description: "The type of the entity" },
                  observations: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "An array of observation contents associated with the entity"
                  },
                },
                required: ["name", "entityType", "observations"],
              },
            },
          },
          required: ["entities"],
        },
      },
      {
        name: "create_relations",
        description: "Create multiple new relations between entities in the knowledge graph. Relations should be in active voice",
        inputSchema: {
          type: "object",
          properties: {
            relations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from: { type: "string", description: "The name of the entity where the relation starts" },
                  to: { type: "string", description: "The name of the entity where the relation ends" },
                  relationType: { type: "string", description: "The type of the relation" },
                },
                required: ["from", "to", "relationType"],
              },
            },
          },
          required: ["relations"],
        },
      },
      {
        name: "add_observations",
        description: "Add new observations to existing entities in the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            observations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  entityName: { type: "string", description: "The name of the entity to add the observations to" },
                  contents: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "An array of observation contents to add"
                  },
                },
                required: ["entityName", "contents"],
              },
            },
          },
          required: ["observations"],
        },
      },
      {
        name: "delete_entities",
        description: "Delete multiple entities and their associated relations from the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            entityNames: { 
              type: "array", 
              items: { type: "string" },
              description: "An array of entity names to delete" 
            },
          },
          required: ["entityNames"],
        },
      },
      {
        name: "delete_observations",
        description: "Delete specific observations from entities in the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            deletions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  entityName: { type: "string", description: "The name of the entity containing the observations" },
                  observations: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "An array of observations to delete"
                  },
                },
                required: ["entityName", "observations"],
              },
            },
          },
          required: ["deletions"],
        },
      },
      {
        name: "delete_relations",
        description: "Delete multiple relations from the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            relations: { 
              type: "array", 
              items: {
                type: "object",
                properties: {
                  from: { type: "string", description: "The name of the entity where the relation starts" },
                  to: { type: "string", description: "The name of the entity where the relation ends" },
                  relationType: { type: "string", description: "The type of the relation" },
                },
                required: ["from", "to", "relationType"],
              },
              description: "An array of relations to delete" 
            },
          },
          required: ["relations"],
        },
      },
      {
        name: "read_graph",
        description: "Read the entire knowledge graph",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "search_nodes",
        description: "Search for nodes in the knowledge graph based on a query",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search query to match against entity names, types, and observation content" },
          },
          required: ["query"],
        },
      },
      {
        name: "open_nodes",
        description: "Open specific nodes in the knowledge graph by their names",
        inputSchema: {
          type: "object",
          properties: {
            names: {
              type: "array",
              items: { type: "string" },
              description: "An array of entity names to retrieve",
            },
          },
          required: ["names"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error(`No arguments provided for tool: ${name}`);
  }

  try {
    switch (name) {
      case "create_entities":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.createEntities(args.entities as Entity[]), null, 2) }] };
      case "create_relations":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.createRelations(args.relations as Relation[]), null, 2) }] };
      case "add_observations":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.addObservations(args.observations as { entityName: string; contents: string[] }[]), null, 2) }] };
      case "delete_entities":
        await knowledgeGraphManager.deleteEntities(args.entityNames as string[]);
        return { content: [{ type: "text", text: "Entities deleted successfully" }] };
      case "delete_observations":
        await knowledgeGraphManager.deleteObservations(args.deletions as { entityName: string; observations: string[] }[]);
        return { content: [{ type: "text", text: "Observations deleted successfully" }] };
      case "delete_relations":
        await knowledgeGraphManager.deleteRelations(args.relations as Relation[]);
        return { content: [{ type: "text", text: "Relations deleted successfully" }] };
      case "read_graph":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.readGraph(), null, 2) }] };
      case "search_nodes":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.searchNodes(args.query as string), null, 2) }] };
      case "open_nodes":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.openNodes(args.names as string[]), null, 2) }] };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      return { 
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
    return {
      content: [{ type: "text", text: "An unknown error occurred" }],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Knowledge Graph MCP Server (MongoDB) running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error instanceof Error ? error.message : "An unknown error occurred");
  process.exit(1);
});
