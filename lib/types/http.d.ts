import type { installMcpVisibility } from './mcp-runtime.ts';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { BundlePlugin } from './bundles.ts';
import type { SkillHub } from './hub.ts';
export declare function handleSkillHubHttp(hub: SkillHub, invalidate: () => void, requestRejection?: (req: IncomingMessage) => 401 | 403 | undefined, mcp?: ReturnType<typeof installMcpVisibility>, bundles?: () => readonly BundlePlugin[]): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
//# sourceMappingURL=http.d.ts.map