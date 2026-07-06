import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

const FLAWSEEKING_TOOLS = {
  getAgentHealth: {
    name: 'getAgentHealth',
    description:
      'Get the health status of an AI agent registered with FlawSeeking. Returns compliance rate, violation count, active policy, and risk level.',
    inputSchema: {
      type: 'object',
      properties: {
        agentAddress: {
          type: 'string',
          description: 'Casper account address of the agent (01-prefix hex)',
        },
      },
      required: ['agentAddress'],
    },
  },
  getPendingViolations: {
    name: 'getPendingViolations',
    description:
      'Get all unresolved policy violations awaiting validator review.',
    inputSchema: { type: 'object', properties: {} },
  },
  getValidatorReputation: {
    name: 'getValidatorReputation',
    description:
      'Get the reputation score and review history of a validator in the FlawSeeking network.',
    inputSchema: {
      type: 'object',
      properties: {
        validatorAddress: {
          type: 'string',
          description: 'Validator address',
        },
      },
      required: ['validatorAddress'],
    },
  },
  getPolicyFor: {
    name: 'getPolicyFor',
    description:
      'Get the active policy rules for a specific AI agent. Returns rate limits, allowlists, cooldowns, and caps.',
    inputSchema: {
      type: 'object',
      properties: {
        agentAddress: {
          type: 'string',
          description: 'Agent address',
        },
      },
      required: ['agentAddress'],
    },
  },
  getEcosystemStats: {
    name: 'getEcosystemStats',
    description:
      'Get aggregate statistics for the entire FlawSeeking ecosystem — total agents, validators, transactions, and violations.',
    inputSchema: { type: 'object', properties: {} },
  },
}

const server = new Server(
  {
    name: 'flawseeking-mcp',
    version: '0.1.0',
  },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.values(FLAWSEEKING_TOOLS),
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  switch (name) {
    case 'getAgentHealth': {
      const agentAddress = (args as { agentAddress: string }).agentAddress
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              agent: agentAddress,
              healthScore: 94.2,
              totalTransactions: 847,
              violations: 3,
              activePolicy: {
                maxCsprPerTx: '50',
                maxCsprPerHour: '200',
                maxCsprPerDay: '1000',
                cooldownSeconds: 60,
              },
              lastViolation: null,
              riskLevel: 'LOW',
            }),
          },
        ],
      }
    }

    case 'getPendingViolations': {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              {
                id: 7,
                agent: '01a3b5c7d9...',
                attemptedAmount: '500',
                blockReason:
                  'TX_VALUE_EXCEEDS_MAX: 500 CSPR exceeds per-tx limit of 50 CSPR',
                timestamp: Date.now(),
                resolved: false,
              },
              {
                id: 12,
                agent: '01f4a2b8c3...',
                attemptedAmount: '75',
                blockReason:
                  'COOLDOWN_ACTIVE: 23s remaining of 60s cooldown',
                timestamp: Date.now() - 30000,
                resolved: false,
              },
            ]),
          },
        ],
      }
    }

    case 'getValidatorReputation': {
      const validatorAddress = (args as { validatorAddress: string }).validatorAddress
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              validator: validatorAddress,
              active: true,
              stakedAmount: '1000',
              totalReviews: 42,
              correctVerdicts: 38,
              reputationScore: 90,
              joinedAt: 1719781200,
              tier: 'GOLD',
            }),
          },
        ],
      }
    }

    case 'getPolicyFor': {
      const agentAddress = (args as { agentAddress: string }).agentAddress
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              agent: agentAddress,
              policy: {
                maxCsprPerTx: '50',
                maxCsprPerHour: '200',
                maxCsprPerDay: '1000',
                cooldownSeconds: 60,
                allowlist: [],
                blocklist: ['01dead0000...'],
              },
              deployedAt: 1719781200,
              lastUpdated: 1719853200,
            }),
          },
        ],
      }
    }

    case 'getEcosystemStats': {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              totalAgents: 47,
              totalValidators: 12,
              totalTransactions: 2841,
              totalViolations: 156,
              activeViolations: 8,
              averageHealthScore: 87.3,
              totalStakedValidators: '12400',
              networkUptime: '99.97%',
            }),
          },
        ],
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[FlawSeeking MCP] Server running on stdio')
}

main().catch(console.error)
