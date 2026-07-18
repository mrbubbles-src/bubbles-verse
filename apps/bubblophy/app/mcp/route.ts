import { verifyBubblophyMcpToken } from '@/lib/mcp/auth';
import {
  getBubblophyMcpMetadataUrl,
  getBubblophyMcpResourceUrl,
} from '@/lib/mcp/oauth-metadata';

import { createMcpHandler, withMcpAuth } from 'mcp-handler';

const transportHandler = createMcpHandler(
  () => undefined,
  {
    serverInfo: {
      name: 'bubblophy',
      version: '0.1.0',
    },
  },
  {
    disableSse: true,
    maxDuration: 60,
  }
);

/** Applies request-time OAuth configuration to the shared stateless transport. */
function handleMcpRequest(request: Request) {
  return withMcpAuth(transportHandler, verifyBubblophyMcpToken, {
    required: true,
    resourceMetadataPath: new URL(getBubblophyMcpMetadataUrl()).pathname,
    resourceUrl: new URL(getBubblophyMcpResourceUrl()).origin,
  })(request);
}

export {
  handleMcpRequest as DELETE,
  handleMcpRequest as GET,
  handleMcpRequest as POST,
};
