import type { Gate, SkillId, VisibilityLayer } from './catalog.ts';
import type { McpGate, McpServerView } from './mcp.ts';
/** One skill inside a group, with the gate the runtime would enforce. */
export interface GroupSkillView {
    readonly id: SkillId;
    readonly name: string;
    /** The skill's own gate, without the parent. */
    readonly gate: Gate;
    readonly source: VisibilityLayer;
    readonly effective: Gate;
    readonly locked: boolean;
}
/** One MCP server inside a group. */
export interface GroupServerView {
    readonly name: string;
    readonly tools: number;
    readonly gate: McpGate;
    readonly source: VisibilityLayer;
    readonly effective: Gate;
    readonly locked: boolean;
}
/**
 * A user-visible capability: the skills and the MCP server that belong to one
 * thing (`abaqus`), or a family of skills that share a base name (`ponytail`).
 */
export interface GroupView {
    readonly name: string;
    readonly kind: 'capability' | 'family';
    readonly gate: Gate;
    readonly source: VisibilityLayer;
    readonly skills: readonly GroupSkillView[];
    readonly servers: readonly GroupServerView[];
}
export interface GroupInput {
    readonly skills: readonly {
        readonly id: SkillId;
        readonly name: string;
        readonly gate: Gate;
        readonly source: VisibilityLayer;
    }[];
    readonly servers: readonly McpServerView[];
}
/** Gate key of a group switch. */
export declare function groupGateId(name: string): string;
/**
 * Build the groups a scope shows.
 *
 * Two shapes become a group:
 * - a skill and an MCP server with the same name are one capability (the manual
 *   and the tools that execute it);
 * - skills named `<base>-<something>` join the skill named `<base>`, so an
 *   installed family (`ponytail`, `office`) reads as one row instead of six.
 *
 * A group is only a view over existing rows: its own gate lives in the same
 * layer document as everything else, and a parent that is off locks every
 * member without rewriting the member's stored value.
 *
 * @param input - this scope's skills and MCP servers.
 * @param resolveGroup - resolves one group's gate through the layer chain.
 * @returns groups sorted by name.
 */
export declare function computeGroups(input: GroupInput, resolveGroup: (name: string) => {
    gate: Gate;
    source: VisibilityLayer;
}): GroupView[];
//# sourceMappingURL=groups.d.ts.map