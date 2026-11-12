// src/dsh-skillhub.ts
import { homedir } from "node:os";
import { join as join6 } from "node:path";
import z from "@deepseek-ai/schemastery";

// src/mcp.ts
import { createHash, randomUUID as randomUUID2 } from "node:crypto";

// src/propagation.ts
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
function readPropagationMetadata(raw, path) {
  const object = raw;
  const valid = (n) => Number.isSafeInteger(n) && n >= 0;
  if (object.defaultRevision !== void 0 && !valid(object.defaultRevision)) {
    throw new Error(`Invalid SkillHub visibility document revision: ${path}`);
  }
  const revisions = /* @__PURE__ */ Object.create(null);
  if (object.gateRevisions !== void 0) {
    if (typeof object.gateRevisions !== "object" || object.gateRevisions === null || Array.isArray(object.gateRevisions)) {
      throw new Error(`Invalid SkillHub visibility document revisions: ${path}`);
    }
    for (const [id, revision] of Object.entries(object.gateRevisions)) {
      if (!valid(revision)) throw new Error(`Invalid SkillHub visibility document revision: ${path}`);
      revisions[id] = revision;
    }
  }
  return {
    ...object.defaultRevision !== void 0 ? { defaultRevision: object.defaultRevision } : {},
    ...object.gateRevisions !== void 0 ? { gateRevisions: revisions } : {}
  };
}
function nextPropagationRevision(storeDir) {
  mkdirSync(storeDir, { recursive: true });
  const path = join(storeDir, "propagation-clock.json");
  const previous = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : 0;
  if (!Number.isSafeInteger(previous) || previous < 0) {
    throw new Error("Invalid SkillHub visibility document propagation clock");
  }
  const revision = Math.max(Date.now(), previous + 1);
  if (!Number.isSafeInteger(revision)) throw new Error("SkillHub propagation clock exhausted");
  const temp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temp, `${revision}
`, { mode: 384 });
  renameSync(temp, path);
  return revision;
}
function propagatedGate(id, layers) {
  let gate = "on";
  let source = "global";
  let latest = -1;
  for (const [layer, doc] of layers) {
    if (doc === void 0) continue;
    const explicit = id !== void 0 && Object.hasOwn(doc.gates, id);
    const value = explicit ? doc.gates[id] : doc.default;
    if (value === void 0 || value === "inherit") continue;
    const revision = explicit ? doc.gateRevisions?.[id] ?? 0 : doc.defaultRevision ?? 0;
    if (revision >= latest) {
      gate = value;
      source = layer;
      latest = revision;
    }
  }
  return { gate, source };
}

// src/mcp.ts
import { existsSync as existsSync2, mkdirSync as mkdirSync2, readFileSync as readFileSync2, writeFileSync as writeFileSync2, renameSync as renameSync2 } from "node:fs";
import { join as join2, resolve } from "node:path";
function attributeMcpTool(name2, servers) {
  if (!name2.startsWith("mcp__")) return void 0;
  let match;
  let ambiguous = false;
  for (const server of servers) {
    if (server === "" || name2.length <= 6 + server.length) continue;
    if (!name2.startsWith(`mcp__${server}__`)) continue;
    if (match !== void 0) {
      ambiguous = true;
      break;
    }
    match = server;
  }
  if (ambiguous || match === void 0) return void 0;
  return match;
}
function serversFromToolNames(names, servers) {
  const counts = /* @__PURE__ */ new Map();
  for (const server of servers) counts.set(server, 0);
  for (const name2 of names) {
    const owner = attributeMcpTool(name2, servers);
    if (owner === void 0) continue;
    counts.set(owner, (counts.get(owner) ?? 0) + 1);
  }
  return counts;
}
function computeDenyList(toolNames, hidden, servers) {
  if (hidden.size === 0) return [];
  const deny = [];
  for (const name2 of toolNames) {
    const owner = attributeMcpTool(name2, servers);
    if (owner !== void 0 && hidden.has(owner)) deny.push(name2);
  }
  return deny;
}
function emptyDocument(layer) {
  return {
    version: 2,
    default: layer === "global" ? "on" : "inherit",
    gates: {}
  };
}
function parsedGates(value, layer, path) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Invalid SkillHub MCP visibility document: ${path}`);
  }
  const gates = /* @__PURE__ */ Object.create(null);
  for (const [server, gate] of Object.entries(value)) {
    if (gate !== "on" && gate !== "off" && !(layer !== "global" && gate === "inherit")) {
      throw new Error(`Invalid SkillHub MCP visibility document: ${path}`);
    }
    gates[server] = gate;
  }
  return gates;
}
function readDoc(path, layer) {
  if (!existsSync2(path)) return emptyDocument(layer);
  let raw;
  try {
    raw = JSON.parse(readFileSync2(path, "utf8"));
  } catch {
    throw new Error(`Invalid SkillHub MCP visibility document: ${path}`);
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`Invalid SkillHub MCP visibility document: ${path}`);
  }
  const object = raw;
  const gates = parsedGates(object.gates, layer, path);
  if (object.version !== 2) {
    throw new Error(`Unsupported SkillHub MCP visibility document version: ${path}`);
  }
  const defaultGate = object.default;
  if (defaultGate !== "on" && defaultGate !== "off" && !(layer !== "global" && defaultGate === "inherit")) {
    throw new Error(`Invalid SkillHub MCP visibility document: ${path}`);
  }
  return { version: 2, default: defaultGate, gates, ...readPropagationMetadata(object, path) };
}
function writeDoc(path, doc) {
  mkdirSync2(join2(path, ".."), { recursive: true });
  const temp = `${path}.${randomUUID2()}.tmp`;
  writeFileSync2(temp, `${JSON.stringify({ version: 2, default: doc.default, gates: doc.gates, ...readPropagationMetadata(doc, path) }, null, 2)}
`, { mode: 384 });
  renameSync2(temp, path);
}
function folderKey(folder) {
  return createHash("sha256").update(folder).digest("hex").slice(0, 24);
}
function normalizeFolder(folder) {
  return resolve(folder);
}
function optionalFolder(folder) {
  if (folder === void 0 || folder.trim() === "") return void 0;
  return normalizeFolder(folder);
}
function assertSessionId(sessionId) {
  if (sessionId.trim() === "" || sessionId === "." || sessionId === ".." || sessionId.includes("/") || sessionId.includes("\\") || sessionId.includes("\0")) {
    throw new Error("invalid sessionId for Session visibility");
  }
}
function assertServer(server) {
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(server)) {
    throw new Error("invalid MCP server name");
  }
}
function resolvedLayer(query2) {
  if (query2.layer !== void 0) return query2.layer;
  if (query2.sessionId !== void 0) return "session";
  if (query2.folder !== void 0) return "project";
  return "global";
}
var McpHub = class {
  constructor(paths) {
    this.paths = paths;
    mkdirSync2(this.paths.storeDir, { recursive: true });
  }
  paths;
  globalPath() {
    return join2(this.paths.storeDir, "mcp-global.json");
  }
  projectPath(folder) {
    return join2(this.paths.storeDir, "mcp-projects", `${folderKey(normalizeFolder(folder))}.json`);
  }
  sessionPath(sessionId) {
    assertSessionId(sessionId);
    return join2(this.paths.storeDir, "mcp-sessions", `${sessionId}.json`);
  }
  documentPath(layer, sessionId, folder) {
    if (!["global", "project", "session"].includes(layer)) throw new Error("invalid MCP layer");
    if (layer === "global") return this.globalPath();
    if (layer === "project") {
      if (folder === void 0 || folder === "") throw new Error("folder required for Project visibility");
      return this.projectPath(folder);
    }
    if (sessionId === void 0 || sessionId === "") throw new Error("sessionId required for Session visibility");
    return this.sessionPath(sessionId);
  }
  effectiveGate(server, sessionId, folder) {
    const normalizedFolder = optionalFolder(folder);
    const global = readDoc(this.globalPath(), "global");
    const project = normalizedFolder === void 0 ? void 0 : readDoc(this.projectPath(normalizedFolder), "project");
    const session = sessionId === void 0 || sessionId === "" ? void 0 : readDoc(this.sessionPath(sessionId), "session");
    return propagatedGate(server, [["global", global], ["project", project], ["session", session]]);
  }
  hiddenServers(sessionId, folder, servers) {
    const hidden = /* @__PURE__ */ new Set();
    if (servers === void 0) return hidden;
    for (const server of servers) {
      if (this.effectiveGate(server, sessionId, folder).gate === "off") hidden.add(server);
    }
    return hidden;
  }
  /**
   * Resolve one server through the complete inheritance chain, whichever layer
   * is being edited. The panel's display and the runtime's enforce/guard path
   * must read the same value: a Project or Chat override has to change what the
   * panel shows, because it already changes what the model may call. A layer
   * that is not part of the query simply restricts nothing: reading `global`
   * reports the global default alone (no folder was chosen, so no Project row
   * can apply), `project` composes Global→Project, and `session` composes
   * Global→Project→Chat.
   * @param name - MCP server name.
   * @param layer - the layer being edited or observed.
   * @param sessionId - chat whose Chat document participates (session layer only).
   * @param folder - normalized workspace folder whose Project document participates.
   * @returns the effective gate plus the layer that decided it.
   */
  gateState(name2, layer, sessionId, folder) {
    const global = readDoc(this.globalPath(), "global");
    const project = layer === "global" || folder === void 0 ? void 0 : readDoc(this.projectPath(folder), "project");
    const session = layer !== "session" || sessionId === void 0 ? void 0 : readDoc(this.sessionPath(sessionId), "session");
    return propagatedGate(name2, [["global", global], ["project", project], ["session", session]]);
  }
  catalog(query2 = {}, toolNames = [], servers = []) {
    const layer = resolvedLayer(query2);
    const folder = optionalFolder(query2.folder);
    if (layer === "project" && folder === void 0) throw new Error("folder required for Project visibility");
    if (layer === "session" && query2.sessionId === void 0) {
      throw new Error("sessionId required for Session visibility");
    }
    const counts = serversFromToolNames(toolNames, servers);
    const views = [...counts.entries()].map(([name2, tools]) => {
      const state = this.gateState(name2, layer, query2.sessionId, folder);
      return { name: name2, tools, gate: state.gate, source: state.source };
    }).sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
    return { servers: views, layer };
  }
  toggle(request) {
    assertServer(request.server);
    const folder = optionalFolder(request.folder);
    const path = this.documentPath(request.layer, request.sessionId, folder);
    const current = readDoc(path, request.layer);
    const revision = nextPropagationRevision(this.paths.storeDir);
    writeDoc(path, {
      ...current,
      gates: { ...current.gates, [request.server]: request.on ? "on" : "off" },
      gateRevisions: { ...current.gateRevisions, [request.server]: revision }
    });
  }
  inherit(request) {
    assertServer(request.server);
    const folder = optionalFolder(request.folder);
    const path = this.documentPath(request.layer, request.sessionId, folder);
    const current = readDoc(path, request.layer);
    const gates = { ...current.gates };
    if (request.layer === "global" || current.default === "inherit") delete gates[request.server];
    else gates[request.server] = "inherit";
    writeDoc(path, { ...current, gates });
  }
};

// src/mcp-runtime.ts
function liveMcpServers(ctx) {
  const names = /* @__PURE__ */ new Set();
  for (const runtime of ctx.registry.values()) {
    if (runtime.name !== "mcp-client") continue;
    for (const fiber of runtime.fibers) {
      if (fiber.uid === null) continue;
      const name2 = fiber.config?.serverName;
      if (typeof name2 === "string" && /^[A-Za-z0-9_-]{1,32}$/.test(name2)) names.add(name2);
    }
  }
  return [...names].sort();
}
function installMcpVisibility(ctx, hub, discover = () => liveMcpServers(ctx)) {
  const tools = ctx.get("tools");
  if (!tools) throw new Error("SkillHub MCP requires tools service");
  const agents = /* @__PURE__ */ new Map();
  let refreshing = false;
  let disposed = false;
  const names = () => tools.schemas().map((t) => t.name);
  const identity = (agent) => ({ sessionId: agent.session?.id ?? agent.session?.header?.id ?? agent.id, folder: agent.session?.header?.cwd });
  const problematic = (server, servers) => {
    if (servers.some((other) => other !== server && (server.startsWith(`${other}__`) || other.startsWith(`${server}__`)))) return true;
    for (const agent of agents.keys()) {
      try {
        for (const tool of agent.ctx.get("tools").schemas(agent)) {
          if (tool.name.startsWith(`mcp__${server}__`) && tools.get(tool.name) !== tools.get(tool.name, agent)) return true;
        }
      } catch {
        return true;
      }
    }
    return false;
  };
  const refresh = () => {
    if (refreshing || disposed) return;
    refreshing = true;
    try {
      const servers = discover();
      const all = names();
      for (const [agent, state] of agents) {
        const id = identity(agent);
        const denied = computeDenyList(all, hub.hiddenServers(id.sessionId, id.folder, servers), servers).sort();
        const signature = JSON.stringify(denied);
        if (signature === state.signature) continue;
        const scoped = agent.ctx.get("tools");
        const next = denied.length ? scoped.restrict({ deny: denied }) : () => {
        };
        const previous = state.lift;
        state.lift = next;
        state.signature = signature;
        previous();
      }
    } finally {
      refreshing = false;
    }
  };
  const attach = (agent) => {
    if (disposed || !agent?.ctx || agents.has(agent)) return;
    const scoped = agent.ctx.get("tools");
    if (!scoped) return;
    const state = { lift: () => {
    }, guard: () => {
    }, signature: "[]", dispose: () => {
    } };
    agents.set(agent, state);
    state.guard = scoped.guard((exec) => {
      const owner = attributeMcpTool(exec.name, discover());
      const id = identity(agent);
      return owner && hub.effectiveGate(owner, id.sessionId, id.folder).gate === "off" ? "This MCP service is hidden by SkillHub for this session." : void 0;
    });
    state.dispose = agent.ctx.effect(() => () => {
      agents.delete(agent);
      state.lift();
      state.guard();
    }, "skillhub MCP agent cleanup");
    refresh();
  };
  const on = ctx.on.bind(ctx);
  const offChange = on("tools/change", refresh);
  const offCreated = on("agent/created", ({ agent }) => attach(agent));
  const registry = ctx.get("agents");
  for (const agent of registry?.list() ?? []) attach(agent);
  ctx.effect(() => () => {
    disposed = true;
    offChange();
    offCreated();
    for (const state of agents.values()) {
      state.dispose();
      state.lift();
      state.guard();
    }
    agents.clear();
  }, "skillhub MCP visibility");
  return {
    attach,
    refresh,
    catalog(query2 = {}) {
      const servers = discover();
      const result = hub.catalog(query2, names(), servers);
      return { ...result, servers: result.servers.map((server) => ({ ...server, supported: !problematic(server.name, servers) })) };
    },
    mutate(query2, server, onValue) {
      const servers = discover();
      if (!servers.includes(server)) throw new Error("MCP service is no longer registered; refresh the list");
      if (onValue === false && problematic(server, servers)) throw new Error("Cannot fully hide this service: ambiguous namespace or scope-local tools");
      const request = { ...query2, layer: query2.layer ?? "global", server };
      if (onValue === void 0) hub.inherit(request);
      else hub.toggle({ ...request, on: onValue });
      refresh();
      return this.catalog(query2);
    }
  };
}

// src/bundles.ts
import { randomUUID as randomUUID3 } from "node:crypto";
import { existsSync as existsSync3, mkdirSync as mkdirSync3, readFileSync as readFileSync3, readdirSync, renameSync as renameSync3, writeFileSync as writeFileSync3 } from "node:fs";
import { dirname, join as join3, relative, sep } from "node:path";
function barePackageName(specifier) {
  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    return parts.length === 2 && (parts[1] ?? "") !== "" ? specifier : void 0;
  }
  return specifier !== "" && !specifier.includes("/") && !specifier.includes(":") ? specifier : void 0;
}
function filterActive(plugins, active) {
  if (active === void 0) return [...plugins];
  return plugins.filter((plugin) => active.has(plugin.name));
}
var SKILLHUB_PROVIDERS = /* @__PURE__ */ new Set(["skillhub", "skillhub-propagation", "skillhub-bundles"]);
function bundlesPath(storeDir) {
  return join3(storeDir, "bundles.json");
}
function isBundleSkill(value) {
  if (typeof value !== "object" || value === null) return false;
  const row = value;
  return typeof row["name"] === "string" && typeof row["description"] === "string" && typeof row["path"] === "string" && typeof row["directory"] === "string" && typeof row["rel"] === "string";
}
function isBundlePlugin(value) {
  if (typeof value !== "object" || value === null) return false;
  const row = value;
  return typeof row["name"] === "string" && typeof row["root"] === "string" && Array.isArray(row["skills"]) && row["skills"].every(isBundleSkill);
}
function loadBundles(storeDir) {
  const path = bundlesPath(storeDir);
  if (!existsSync3(path)) return [];
  try {
    const raw = JSON.parse(readFileSync3(path, "utf8"));
    if (!Array.isArray(raw.plugins)) return [];
    return raw.plugins.filter(isBundlePlugin).map((plugin) => ({ ...plugin, skills: [...plugin.skills] }));
  } catch {
    return [];
  }
}
function saveBundles(storeDir, plugins) {
  try {
    mkdirSync3(storeDir, { recursive: true });
    const path = bundlesPath(storeDir);
    const temp = `${path}.${randomUUID3()}.tmp`;
    const document = { version: 1, plugins };
    writeFileSync3(temp, `${JSON.stringify(document, null, 2)}
`, { mode: 384 });
    renameSync3(temp, path);
  } catch (error) {
    console.error("[dsh-skillhub] bundle cache write failed", error);
  }
}
function packageOf(path) {
  const marker = `${sep}node_modules${sep}`;
  const at = path.lastIndexOf(marker);
  if (at < 0) return void 0;
  const rest = path.slice(at + marker.length).split(sep).filter((part) => part !== "");
  const first = rest[0];
  if (first === void 0) return void 0;
  const segments = first.startsWith("@") && rest[1] !== void 0 ? [first, rest[1]] : [first];
  if (segments.length === 0) return void 0;
  return {
    name: segments.join("/"),
    root: `${path.slice(0, at)}${marker}${segments.join(sep)}`
  };
}
var SKILL_ROOTS = ["skills", "own-skills"];
function frontmatter(text) {
  const match = /^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (match === null || match[1] === void 0) return {};
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z0-9_-]+)[ \t]*:[ \t]*(.*)$/.exec(line);
    if (pair === null || pair[1] === void 0 || pair[2] === void 0) continue;
    fields[pair[1]] = pair[2].trim().replace(/^['"]|['"]$/g, "");
  }
  return fields;
}
function scanPackage(root) {
  const found = [];
  for (const home of SKILL_ROOTS) {
    const base = join3(root, home);
    if (!existsSync3(base)) continue;
    let entries;
    try {
      entries = readdirSync(base, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
      const directory = join3(base, entry.name);
      const path = join3(directory, "SKILL.md");
      if (!existsSync3(path)) continue;
      let text;
      try {
        text = readFileSync3(path, "utf8");
      } catch {
        continue;
      }
      const fields = frontmatter(text);
      const name2 = fields["name"] ?? entry.name;
      const description = fields["description"] ?? "";
      found.push({
        name: name2,
        description,
        ...fields["whenToUse"] !== void 0 ? { whenToUse: fields["whenToUse"] } : {},
        path,
        directory,
        rel: relative(root, path).split(sep).join("/")
      });
    }
  }
  return found;
}
function mergeSkills(known, scanned) {
  const byPath = /* @__PURE__ */ new Map();
  for (const skill of known) byPath.set(skill.path, skill);
  for (const skill of scanned) byPath.set(skill.path, skill);
  return [...byPath.values()].sort((left, right) => left.name.localeCompare(right.name));
}
function fromListing(summaries) {
  const byPlugin = /* @__PURE__ */ new Map();
  for (const summary of summaries) {
    if (SKILLHUB_PROVIDERS.has(summary.provider)) continue;
    const path = summary.path;
    if (path === void 0 || !path.endsWith("SKILL.md")) continue;
    const owner = packageOf(path);
    if (owner === void 0) continue;
    const list = byPlugin.get(owner.root) ?? [];
    list.push({
      name: summary.name,
      description: summary.description,
      ...summary.whenToUse !== void 0 ? { whenToUse: summary.whenToUse } : {},
      path,
      directory: dirname(path),
      rel: relative(owner.root, path).split(sep).join("/")
    });
    byPlugin.set(owner.root, list);
  }
  return byPlugin;
}
async function discoverBundles(skills, storeDir) {
  const known = loadBundles(storeDir);
  const byRoot = /* @__PURE__ */ new Map();
  for (const plugin of known) {
    byRoot.set(plugin.root, { name: plugin.name, root: plugin.root, skills: [...plugin.skills] });
  }
  let summaries = [];
  try {
    summaries = await skills.list({});
  } catch (error) {
    console.error("[dsh-skillhub] bundle discovery failed", error);
  }
  for (const [root, found] of fromListing(summaries)) {
    const owner = packageOf(found[0]?.path ?? "");
    if (owner === void 0) continue;
    const existing = byRoot.get(root);
    byRoot.set(root, {
      name: existing?.name ?? owner.name,
      root,
      skills: mergeSkills(existing?.skills ?? [], found)
    });
  }
  const plugins = [];
  for (const plugin of byRoot.values()) {
    const scanned = scanPackage(plugin.root);
    const skills2 = mergeSkills(plugin.skills, scanned);
    if (skills2.length === 0) continue;
    plugins.push({ name: plugin.name, root: plugin.root, skills: skills2 });
  }
  plugins.sort((left, right) => left.name.localeCompare(right.name));
  saveBundles(storeDir, plugins);
  return plugins;
}
function readBundleSkill(path) {
  try {
    const content = readFileSync3(path, "utf8");
    const split = content.startsWith("---") ? content.indexOf("\n---", 3) : -1;
    return split >= 0 ? content.slice(split + 4).replace(/^\r?\n/, "") : content;
  } catch {
    return void 0;
  }
}

// src/hub.ts
import { createHash as createHash2, randomUUID as randomUUID4 } from "node:crypto";
import { existsSync as existsSync5, lstatSync as lstatSync2, mkdirSync as mkdirSync4, readFileSync as readFileSync5, realpathSync as realpathSync2, renameSync as renameSync4, symlinkSync, writeFileSync as writeFileSync4 } from "node:fs";
import { basename as basename2, dirname as dirname3, join as join5, resolve as resolve2 } from "node:path";

// src/catalog.ts
import { existsSync as existsSync4, lstatSync, readdirSync as readdirSync2, readFileSync as readFileSync4, readlinkSync, realpathSync } from "node:fs";
import { basename, dirname as dirname2, join as join4, posix, relative as relative2, sep as sep2 } from "node:path";
var IGNORE = /* @__PURE__ */ new Set([".git", "node_modules", ".system"]);
var HOST_SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function isHostSkillName(name2) {
  return HOST_SKILL_NAME.test(name2);
}
function skillId(home, relPath) {
  return `${home}:${relPath.split(sep2).join("/")}`;
}
function packId(home, name2) {
  return `${home}:${name2}`;
}
function posixRel(from, to) {
  return relative2(from, to).split(sep2).join("/");
}
function parseFrontmatter(text) {
  const match = /^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (match === null || match[1] === void 0) return void 0;
  const raw = match[1];
  const body = text.slice(match[0].length);
  const fields = {};
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const keyMatch = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(line);
    if (keyMatch === null || keyMatch[1] === void 0 || keyMatch[2] === void 0) continue;
    const key = keyMatch[1];
    let value = keyMatch[2].trim();
    const block = /^[|>][-+]?\d*(?:\s+#.*)?$/.exec(value);
    if (block !== null) {
      const collected = [];
      while (i + 1 < lines.length) {
        const next = lines[i + 1] ?? "";
        if (next.trim() !== "" && !/^\s/.test(next)) break;
        collected.push(next.trim());
        i++;
      }
      while (collected.length > 0 && collected[collected.length - 1] === "") collected.pop();
      while (collected.length > 0 && collected[0] === "") collected.shift();
      fields[key] = collected.join(" ");
      continue;
    }
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"') || value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
  }
  return { fields, body };
}
function parseSkillFile(path) {
  let text;
  try {
    text = readFileSync4(path, "utf8");
  } catch (error) {
    return { error: { kind: "unreadable-skill", message: String(error) } };
  }
  const parsed = parseFrontmatter(text);
  if (parsed === void 0) {
    return { error: { kind: "invalid-frontmatter", message: "missing yaml frontmatter" } };
  }
  const name2 = parsed.fields["name"] ?? "";
  const description = parsed.fields["description"] ?? "";
  if (name2 === "" || description === "") {
    return { error: { kind: "invalid-frontmatter", message: "name and description are required" } };
  }
  if (!isHostSkillName(name2)) {
    return { error: { kind: "invalid-name", raw: name2 } };
  }
  const disableModel = parsed.fields["disable-model-invocation"];
  const userInvocableField = parsed.fields["user-invocable"];
  return {
    name: name2,
    description,
    ...parsed.fields["whenToUse"] !== void 0 ? { whenToUse: parsed.fields["whenToUse"] } : {},
    modelInvocable: disableModel !== "true",
    userInvocable: userInvocableField !== "false",
    content: parsed.body
  };
}
function listEntries(dir) {
  try {
    return readdirSync2(dir);
  } catch {
    return [];
  }
}
var MAX_WALK_DEPTH = 12;
function dirRealpath(path) {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
}
function cycleTarget(path) {
  try {
    return realpathSync(path);
  } catch {
  }
  try {
    return readlinkSync(path);
  } catch {
  }
  return path;
}
function propagatedSkill(id, input) {
  return propagatedGate(id, [
    ["global", input.global],
    ["project", input.project],
    ["session", input.session]
  ]);
}
function gateStateOf(id, input, composed) {
  if (composed !== void 0) {
    return {
      gate: (input.global?.gates[id] ?? input.global?.default ?? "on") === "on" ? "on" : "off",
      source: composed.decided.get(id) ?? composed.defaultSource
    };
  }
  return propagatedSkill(id, input);
}
function combineGates(gates) {
  if (gates.length === 0) return "off";
  const hasOn = gates.some((gate) => gate === "on");
  const hasOff = gates.some((gate) => gate === "off");
  if (hasOn && hasOff) return "mixed";
  return hasOn ? "on" : "off";
}
function collectGates(node) {
  const own = node.kind === "broken" ? [] : node.skill === null ? [] : [node.skill.gate];
  const nested = node.kind === "broken" ? [] : node.children.flatMap(collectGates);
  return [...own, ...nested];
}
function walkGroup(home, homeRoot, dir, leaves, broken, ancestors, depth) {
  const rel = posixRel(homeRoot, dir);
  const chain = [...ancestors, dirRealpath(dir)];
  const skillPath = join4(dir, "SKILL.md");
  let skill = null;
  if (existsSync4(skillPath) && lstatSync(skillPath).isFile()) {
    const parsed = parseSkillFile(skillPath);
    if ("error" in parsed) {
      broken.push({ home, path: skillPath, reason: parsed.error });
    } else {
      const id = skillId(home, posix.join(rel, "SKILL.md"));
      leaves.push({
        id,
        home,
        relPath: posix.join(rel, "SKILL.md"),
        path: skillPath,
        directory: dir,
        parsed
      });
      skill = {
        kind: "skill",
        id,
        name: parsed.name,
        description: parsed.description,
        home,
        path: skillPath,
        gate: "on",
        source: "global",
        collision: false
      };
    }
  }
  const children = [];
  for (const name2 of listEntries(dir).sort()) {
    if (IGNORE.has(name2) || name2 === "SKILL.md") continue;
    const child = join4(dir, name2);
    let stat;
    try {
      stat = lstatSync(child);
    } catch (error) {
      broken.push({ home, path: child, reason: { kind: "unreadable-skill", message: String(error) } });
      children.push({
        kind: "broken",
        home,
        name: name2,
        path: child,
        reason: { kind: "unreadable-skill", message: String(error) }
      });
      continue;
    }
    if (stat.isDirectory() || stat.isSymbolicLink()) {
      if (stat.isSymbolicLink() && !existsSync4(child)) {
        let target = "";
        try {
          target = readlinkSync(child);
        } catch {
          target = child;
        }
        const reason = { kind: "missing-symlink-target", target };
        broken.push({ home, path: child, reason });
        children.push({ kind: "broken", home, name: name2, path: child, reason });
        continue;
      }
      if (!lstatSync(child).isDirectory() && !existsSync4(join4(child, "SKILL.md"))) continue;
      if (chain.includes(dirRealpath(child)) || depth >= MAX_WALK_DEPTH) {
        const reason = { kind: "symlink-cycle", target: cycleTarget(child) };
        broken.push({ home, path: child, reason });
        children.push({ kind: "broken", home, name: name2, path: child, reason });
        continue;
      }
      children.push(walkGroup(home, homeRoot, child, leaves, broken, chain, depth + 1));
    }
  }
  const node = {
    kind: "group",
    home,
    name: basename(dir),
    rel,
    path: dir,
    gate: "off",
    skill,
    children
  };
  return { ...node, gate: combineGates(collectGates(node)) };
}
function walkHome(home, homeRoot, leaves, broken) {
  if (!existsSync4(homeRoot)) {
    return [];
  }
  const ancestors = [dirRealpath(homeRoot)];
  const children = [];
  for (const name2 of listEntries(homeRoot).sort()) {
    if (IGNORE.has(name2)) continue;
    const path = join4(homeRoot, name2);
    let stat;
    try {
      stat = lstatSync(path);
    } catch (error) {
      const reason = { kind: "unreadable-skill", message: String(error) };
      broken.push({ home, path, reason });
      children.push({ kind: "broken", home, name: name2, path, reason });
      continue;
    }
    if (stat.isFile() && name2.endsWith(".md")) {
      const parsed = parseSkillFile(path);
      if ("error" in parsed) {
        broken.push({ home, path, reason: parsed.error });
        children.push({ kind: "broken", home, name: name2, path, reason: parsed.error });
        continue;
      }
      const id = skillId(home, name2);
      leaves.push({
        id,
        home,
        relPath: name2,
        path,
        directory: homeRoot,
        parsed
      });
      children.push({
        kind: "root-skill",
        id,
        name: parsed.name,
        description: parsed.description,
        home,
        path,
        gate: "on",
        source: "global",
        collision: false
      });
      continue;
    }
    if (stat.isDirectory() || stat.isSymbolicLink()) {
      if (stat.isSymbolicLink() && !existsSync4(path)) {
        let target = "";
        try {
          target = readlinkSync(path);
        } catch {
          target = path;
        }
        const reason = { kind: "missing-symlink-target", target };
        broken.push({ home, path, reason });
        children.push({
          kind: "broken",
          home,
          name: name2,
          path,
          reason
        });
        continue;
      }
      let link = { kind: "directory" };
      if (stat.isSymbolicLink()) {
        let target = path;
        try {
          target = readlinkSync(path);
        } catch {
        }
        link = { kind: "symlink", target };
      }
      const walked = walkGroup(home, homeRoot, path, leaves, broken, ancestors, 1);
      if (walked.kind === "broken") {
        children.push(walked);
        continue;
      }
      const pruned = pruneGroup(walked);
      if (pruned === null) {
        const skillPath = join4(path, "SKILL.md");
        const parseFail = broken.find((entry) => entry.path === skillPath);
        const reason = parseFail?.reason ?? { kind: "empty-pack" };
        if (parseFail === void 0) broken.push({ home, path, reason });
        children.push({ kind: "broken", home, name: name2, path, reason });
        continue;
      }
      const pack = {
        kind: "pack",
        id: packId(home, name2),
        home,
        name: name2,
        path,
        link,
        gate: pruned.gate,
        skill: pruned.skill,
        children: pruned.children
      };
      children.push(pack);
    }
  }
  return regroupByOrigin(children, homeRoot);
}
function applyGatesToTree(nodes, collisions, input, composed) {
  return nodes.map((node) => applyGatesToNode(node, collisions, input, composed));
}
function applyGatesToNode(node, collisions, input, composed) {
  if (node.kind === "broken") return node;
  if (node.kind === "root-skill") {
    const state = gateStateOf(node.id, input, composed);
    return {
      ...node,
      ...state,
      collision: collisions.has(node.id)
    };
  }
  const skill = node.skill === null ? null : {
    ...node.skill,
    ...gateStateOf(node.skill.id, input, composed),
    collision: collisions.has(node.skill.id)
  };
  const children = node.children.map((child) => {
    if (child.kind === "broken") return child;
    const next = applyGatesToNode(
      { ...child, kind: "pack", id: packId(child.home, child.name), link: { kind: "directory" } },
      collisions,
      input,
      composed
    );
    if (next.kind !== "pack") return child;
    const group = {
      kind: "group",
      home: next.home,
      name: next.name,
      rel: child.kind === "group" ? child.rel : posixRel(dirname2(node.path), next.path),
      path: next.path,
      gate: next.gate,
      skill: next.skill,
      children: next.children
    };
    return group;
  });
  const pack = {
    ...node,
    skill,
    children,
    gate: "off"
  };
  return { ...pack, gate: combineGates(collectGates(pack)) };
}
function composeChain(input) {
  const fallback = propagatedSkill(void 0, input);
  const ids = new Set([input.global, input.project, input.session].flatMap((doc) => Object.keys(doc?.gates ?? {})));
  const gates = /* @__PURE__ */ Object.create(null);
  const decided = /* @__PURE__ */ new Map();
  for (const id of ids) {
    const state = propagatedSkill(id, input);
    gates[id] = state.gate;
    decided.set(id, state.source);
  }
  return { document: { version: 2, default: fallback.gate, gates }, decided, defaultSource: fallback.source };
}
function resolveIdGate(id, input) {
  return propagatedSkill(id, input);
}
function resolveCatalog(input) {
  const composed = input.composeChain === true ? composeChain(input) : void 0;
  const source = composed === void 0 ? input : { ...input, global: composed.document };
  const leaves = [];
  const broken = [];
  const agentChildren = walkHome("agent", source.agentHome, leaves, broken);
  const dshChildren = walkHome("dsh", source.dshHome, leaves, broken);
  const byName = /* @__PURE__ */ new Map();
  for (const leaf of leaves) {
    const list = byName.get(leaf.parsed.name) ?? [];
    list.push(leaf.id);
    byName.set(leaf.parsed.name, list);
  }
  const collisions = [];
  const collisionIds = /* @__PURE__ */ new Set();
  for (const [name2, skills] of byName) {
    if (skills.length < 2) continue;
    collisions.push({ name: name2, skills });
    for (const id of skills) collisionIds.add(id);
  }
  const tree = [
    {
      kind: "home",
      home: "agent",
      path: source.agentHome,
      children: applyGatesToTree(agentChildren, collisionIds, source, composed)
    },
    {
      kind: "home",
      home: "dsh",
      path: source.dshHome,
      children: applyGatesToTree(dshChildren, collisionIds, source, composed)
    }
  ];
  const inventory = [];
  for (const leaf of leaves) {
    if (!isHostSkillName(leaf.parsed.name)) continue;
    const state = gateStateOf(leaf.id, source, composed);
    const gate = state.gate;
    const invocable = gate === "on";
    inventory.push({
      id: leaf.id,
      name: leaf.parsed.name,
      description: leaf.parsed.description,
      ...leaf.parsed.whenToUse !== void 0 ? { whenToUse: leaf.parsed.whenToUse } : {},
      home: leaf.home,
      path: leaf.path,
      directory: leaf.directory,
      invocation: {
        modelInvocable: invocable && leaf.parsed.modelInvocable,
        userInvocable: invocable && leaf.parsed.userInvocable
      },
      content: leaf.parsed.content,
      gate,
      source: state.source
    });
  }
  return {
    offered: inventory.filter((skill) => skill.gate === "on"),
    inventory,
    tree,
    collisions,
    broken
  };
}
function resolvedPath(path) {
  try {
    if (!existsSync4(path)) return void 0;
    return realpathSync(path);
  } catch {
    return void 0;
  }
}
function originLayout(packPath, homeRoot) {
  const real = resolvedPath(packPath);
  if (real === void 0) return void 0;
  const parts = real.split(sep2).filter((part) => part !== "");
  const skillsAt = parts.lastIndexOf("skills");
  if (skillsAt <= 0 || skillsAt >= parts.length - 1) return void 0;
  const skillsPath = `${sep2}${parts.slice(0, skillsAt + 1).join(sep2)}`;
  const homeReal = resolvedPath(homeRoot);
  if (homeReal !== void 0 && skillsPath === homeReal) return void 0;
  const originName = parts[skillsAt - 1];
  if (originName === void 0 || originName.startsWith(".")) return void 0;
  const originPath = `${sep2}${parts.slice(0, skillsAt).join(sep2)}`;
  const segments = parts.slice(skillsAt + 1);
  if (segments.length === 0) return void 0;
  return { originName, originPath, segments };
}
function packAsGroup(pack, rel, name2) {
  return {
    kind: "group",
    home: pack.home,
    name: name2,
    rel,
    path: pack.path,
    gate: pack.gate,
    skill: pack.skill,
    children: pack.children
  };
}
function insertOriginSkill(origin, segments, pack) {
  let parent = origin;
  let prefix = "";
  for (let i = 0; i < segments.length; i += 1) {
    const name2 = segments[i];
    if (name2 === void 0) return;
    const rel = prefix === "" ? name2 : `${prefix}/${name2}`;
    if (i === segments.length - 1) {
      parent.children.push(packAsGroup(pack, rel, name2));
      return;
    }
    let group = parent.children.find((child) => child.kind === "group" && child.rel === rel);
    if (group === void 0) {
      group = {
        kind: "group",
        home: pack.home,
        name: name2,
        rel,
        path: join4(parent.path, name2),
        gate: "off",
        skill: null,
        children: []
      };
      parent.children.push(group);
    }
    parent = { children: group.children, path: group.path };
    prefix = rel;
  }
}
function compareByName(a, b) {
  return a.name.localeCompare(b.name);
}
function finalizeFolderChild(node) {
  if (node.kind === "broken") return node;
  const children = node.children.map(finalizeFolderChild).sort(compareByName);
  const next = { ...node, children, gate: "off" };
  return { ...next, gate: combineGates(collectGates(next)) };
}
function regroupByOrigin(nodes, homeRoot) {
  const leftover = [];
  const origins = /* @__PURE__ */ new Map();
  for (const node of nodes) {
    if (node.kind !== "pack") {
      leftover.push(node);
      continue;
    }
    const layout = originLayout(node.path, homeRoot);
    if (layout === void 0) {
      leftover.push(node);
      continue;
    }
    const key = `${node.home}:${layout.originPath}`;
    let origin = origins.get(key);
    if (origin === void 0) {
      origin = {
        originName: layout.originName,
        originPath: layout.originPath,
        home: node.home,
        children: []
      };
      origins.set(key, origin);
    }
    insertOriginSkill({ children: origin.children, path: origin.originPath }, layout.segments, node);
  }
  const originPacks = [];
  for (const origin of origins.values()) {
    const children = origin.children.map(finalizeFolderChild).sort(compareByName);
    const pack = {
      kind: "pack",
      id: packId(origin.home, origin.originName),
      home: origin.home,
      name: origin.originName,
      path: origin.originPath,
      link: { kind: "directory" },
      gate: "off",
      skill: null,
      children
    };
    originPacks.push({ ...pack, gate: combineGates(collectGates(pack)) });
  }
  return [...originPacks, ...leftover].sort(compareByName);
}
function pruneGroup(node) {
  const children = [];
  for (const child of node.children) {
    if (child.kind === "broken") {
      children.push(child);
      continue;
    }
    const next = pruneGroup(child);
    if (next !== null) children.push(next);
  }
  if (node.skill === null && children.length === 0) return null;
  const pruned = { ...node, children, gate: "off" };
  return { ...pruned, gate: combineGates(collectGates(pruned)) };
}
function findGroupByRel(node, rel) {
  if (node.kind === "pack" && rel === node.name) return node;
  if (node.kind === "group" && node.rel === rel) return node;
  for (const child of node.children) {
    if (child.kind !== "group") continue;
    const found = findGroupByRel(child, rel);
    if (found !== void 0) return found;
  }
  return void 0;
}
function descendantSkillIds(node) {
  const ids = [];
  if (node.skill !== null) ids.push(node.skill.id);
  for (const child of node.children) {
    if (child.kind === "group") ids.push(...descendantSkillIds(child));
  }
  return ids;
}
function collectSkillGates(tree) {
  const rows = [];
  const walk = (nodes) => {
    for (const node of nodes) {
      if (node.kind === "root-skill") {
        rows.push({ id: node.id, gate: node.gate });
        continue;
      }
      if (node.kind === "broken") continue;
      if (node.skill !== null) rows.push({ id: node.skill.id, gate: node.skill.gate });
      walk(node.children);
    }
  };
  for (const home of tree) walk(home.children);
  return rows;
}

// src/hub.ts
function pluginGateId(name2) {
  return `plugin:${name2}`;
}
function bundleSkillGateId(plugin, skill) {
  return `bundle:${plugin}:${skill}`;
}
function emptyDocument2(layer) {
  return { version: 2, default: layer === "global" ? "on" : "inherit", gates: {} };
}
function readDoc2(path, layer) {
  if (!existsSync5(path)) return emptyDocument2(layer);
  let raw;
  try {
    raw = JSON.parse(readFileSync5(path, "utf8"));
  } catch {
    throw new Error(`Invalid SkillHub visibility document: ${path}`);
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`Invalid SkillHub visibility document: ${path}`);
  }
  const object = raw;
  if (typeof object.gates !== "object" || object.gates === null || Array.isArray(object.gates)) {
    throw new Error(`Invalid SkillHub visibility document: ${path}`);
  }
  const gates = /* @__PURE__ */ Object.create(null);
  for (const [id, gate] of Object.entries(object.gates)) {
    if (gate !== "on" && gate !== "off" && !(layer !== "global" && gate === "inherit")) {
      throw new Error(`Invalid SkillHub visibility document: ${path}`);
    }
    gates[id] = gate;
  }
  if (object.version === void 0) {
    return {
      version: 2,
      default: layer === "project" ? "inherit" : "on",
      gates,
      ...layer === "session" ? { legacySnapshot: true } : {}
    };
  }
  if (object.version !== 2) throw new Error(`Unsupported SkillHub visibility document version: ${path}`);
  const defaultGate = object.default;
  if (defaultGate !== "on" && defaultGate !== "off" && !(layer !== "global" && defaultGate === "inherit")) {
    throw new Error(`Invalid SkillHub visibility document: ${path}`);
  }
  if (object.legacySnapshot !== void 0 && typeof object.legacySnapshot !== "boolean") {
    throw new Error(`Invalid SkillHub visibility document: ${path}`);
  }
  return {
    version: 2,
    default: defaultGate,
    gates,
    ...readPropagationMetadata(object, path),
    ...object.legacySnapshot === true ? { legacySnapshot: true } : {}
  };
}
function writeDoc2(path, doc) {
  mkdirSync4(dirname3(path), { recursive: true });
  const temp = `${path}.${randomUUID4()}.tmp`;
  writeFileSync4(temp, `${JSON.stringify(doc, null, 2)}
`, { mode: 384 });
  renameSync4(temp, path);
}
function folderKey2(folder) {
  return createHash2("sha256").update(resolve2(folder)).digest("hex").slice(0, 24);
}
function optionalFolder2(folder) {
  return folder === void 0 || folder.trim() === "" ? void 0 : resolve2(folder);
}
function assertSessionId2(id) {
  if (id.trim() === "" || id === "." || id === ".." || id.includes("/") || id.includes("\\") || id.includes("\0")) {
    throw new Error("invalid sessionId for Session visibility");
  }
}
function resolvedLayer2(query2) {
  return query2.layer ?? (query2.sessionId !== void 0 ? "session" : query2.folder !== void 0 ? "project" : "global");
}
function targetIds(catalog, target) {
  if (target.kind === "skill") return [target.id];
  if (target.kind === "ids") return [...target.ids];
  if (target.kind === "all") return collectSkillGates(catalog.tree).map((row) => row.id);
  if (target.kind === "home") return collectSkillGates(catalog.tree.filter((node) => node.home === target.home)).map((row) => row.id);
  const root = catalog.tree.find((node) => node.home === target.packHome);
  const pack = root?.children.find((node) => node.kind === "pack" && node.name === target.packName);
  if (pack === void 0) return [];
  const group = findGroupByRel(pack, target.rel);
  return group === void 0 ? [] : descendantSkillIds(group);
}
var SkillHub = class {
  constructor(paths) {
    this.paths = paths;
    for (const path of [paths.agentHome, paths.dshHome, paths.storeDir]) mkdirSync4(path, { recursive: true });
  }
  paths;
  globalPath() {
    return join5(this.paths.storeDir, "global.json");
  }
  projectPath(folder) {
    return join5(this.paths.storeDir, "projects", `${folderKey2(folder)}.json`);
  }
  sessionPath(id) {
    assertSessionId2(id);
    return join5(this.paths.storeDir, "sessions", `${id}.json`);
  }
  documentPath(layer, sessionId, folder) {
    if (layer === "global") return this.globalPath();
    if (layer === "project") {
      if (folder === void 0 || folder === "") throw new Error("folder required for Project visibility");
      return this.projectPath(folder);
    }
    if (layer !== "session") throw new Error("invalid layer");
    if (sessionId === void 0 || sessionId === "") throw new Error("sessionId required for Session visibility");
    return this.sessionPath(sessionId);
  }
  /** The three layer documents a read composes, validated against the query. */
  layerInput(layer, sessionId, folder) {
    const global = readDoc2(this.globalPath(), "global");
    const project = layer === "global" || folder === void 0 ? void 0 : readDoc2(this.projectPath(folder), "project");
    const session = layer !== "session" || sessionId === void 0 ? void 0 : readDoc2(this.sessionPath(sessionId), "session");
    return {
      agentHome: this.paths.agentHome,
      dshHome: this.paths.dshHome,
      global,
      ...project !== void 0 ? { project } : {},
      ...session !== void 0 ? { session } : {}
    };
  }
  /** UI and provider use the same scoped, latest-operation resolution. */
  catalog(query2 = {}) {
    const layer = resolvedLayer2(query2);
    const folder = optionalFolder2(query2.folder);
    this.documentPath(layer, query2.sessionId, folder);
    const session = layer !== "session" || query2.sessionId === void 0 ? void 0 : readDoc2(this.sessionPath(query2.sessionId), "session");
    return {
      ...resolveCatalog(this.layerInput(layer, query2.sessionId, folder)),
      layer,
      ...query2.resolved ? { resolved: true } : {},
      ...session?.legacySnapshot ? { legacySessionSnapshot: true } : {}
    };
  }
  layerCatalog(layer, folder, sessionId) {
    return this.catalog({
      layer,
      ...layer === "session" && sessionId !== void 0 ? { sessionId } : {},
      ...layer === "project" && folder !== void 0 ? { folder } : {}
    });
  }
  displayedCatalog(layer, folder, sessionId) {
    return this.catalog({
      layer,
      resolved: true,
      ...folder !== void 0 ? { folder } : {},
      ...sessionId !== void 0 ? { sessionId } : {}
    });
  }
  toggle(query2) {
    const folder = optionalFolder2(query2.folder);
    const path = this.documentPath(query2.layer, query2.sessionId, folder);
    const catalog = this.catalog({
      layer: query2.layer,
      ...query2.sessionId !== void 0 ? { sessionId: query2.sessionId } : {},
      ...folder !== void 0 ? { folder } : {}
    });
    const current = readDoc2(path, query2.layer);
    const revision = nextPropagationRevision(this.paths.storeDir);
    if (query2.target.kind === "all") {
      writeDoc2(path, { version: 2, default: query2.target.on ? "on" : "off", defaultRevision: revision, gates: {}, gateRevisions: {} });
    } else {
      const gates = { ...current.gates };
      const gateRevisions = { ...current.gateRevisions };
      for (const id of targetIds(catalog, query2.target)) {
        gates[id] = query2.target.on ? "on" : "off";
        gateRevisions[id] = revision;
      }
      writeDoc2(path, { ...current, gates, gateRevisions });
    }
    return this.displayedCatalog(query2.layer, folder, query2.sessionId);
  }
  /** Compatibility for older clients only; no restore controls in the current UI. */
  inherit(query2) {
    const folder = optionalFolder2(query2.folder);
    const path = this.documentPath(query2.layer, query2.sessionId, folder);
    const catalog = this.catalog({
      layer: query2.layer,
      ...query2.sessionId !== void 0 ? { sessionId: query2.sessionId } : {},
      ...folder !== void 0 ? { folder } : {}
    });
    const current = readDoc2(path, query2.layer);
    if (query2.target.kind === "all") {
      writeDoc2(path, query2.layer === "global" ? { ...current, gates: {}, gateRevisions: {} } : emptyDocument2(query2.layer));
    } else {
      const gates = { ...current.gates };
      const gateRevisions = { ...current.gateRevisions };
      for (const id of targetIds(catalog, query2.target)) {
        if (query2.layer === "global" || current.default === "inherit") delete gates[id];
        else gates[id] = "inherit";
        delete gateRevisions[id];
      }
      writeDoc2(path, { ...current, gates, gateRevisions });
    }
    return this.layerCatalog(query2.layer, folder, query2.sessionId);
  }
  resetSession(sessionId, folder) {
    return this.inherit({ layer: "session", sessionId, ...folder !== void 0 ? { folder } : {}, target: { kind: "all" } });
  }
  resetProject(folder) {
    return this.inherit({ layer: "project", folder, target: { kind: "all" } });
  }
  /**
   * Gates of the package contributions at this scope. A skill is effective only
   * when both its own row and the parent package row are on; an off parent locks
   * the child switch without rewriting the child's stored value.
   */
  bundleCatalog(bundles, query2 = {}) {
    const layer = resolvedLayer2(query2);
    const folder = optionalFolder2(query2.folder);
    this.documentPath(layer, query2.sessionId, folder);
    const input = this.layerInput(layer, query2.sessionId, folder);
    const plugins = bundles.map((plugin) => {
      const parent = resolveIdGate(pluginGateId(plugin.name), input);
      const skills = plugin.skills.map((skill) => {
        const id = bundleSkillGateId(plugin.name, skill.name);
        const own = resolveIdGate(id, input);
        return {
          id,
          name: skill.name,
          gate: own.gate,
          source: own.source,
          effective: parent.gate === "on" && own.gate === "on" ? "on" : "off",
          locked: parent.gate === "off"
        };
      });
      return { name: plugin.name, root: plugin.root, gate: parent.gate, source: parent.source, skills };
    });
    return { layer, plugins };
  }
  /** Effective gate and deciding layer of one arbitrary key (`group:` rows) at this scope. */
  gateOf(query2, id) {
    const layer = resolvedLayer2(query2);
    const folder = optionalFolder2(query2.folder);
    this.documentPath(layer, query2.sessionId, folder);
    return resolveIdGate(id, this.layerInput(layer, query2.sessionId, folder));
  }
  /** Write one package or package-skill gate into the requested layer document. */
  toggleBundle(query2) {
    const folder = optionalFolder2(query2.folder);
    const path = this.documentPath(query2.layer, query2.sessionId, folder);
    const current = readDoc2(path, query2.layer);
    writeDoc2(path, {
      ...current,
      gates: { ...current.gates, [query2.id]: query2.on ? "on" : "off" },
      gateRevisions: { ...current.gateRevisions, [query2.id]: nextPropagationRevision(this.paths.storeDir) }
    });
  }
  install(sourceDir, home) {
    let real;
    try {
      real = realpathSync2(sourceDir);
    } catch {
      throw new Error(`Pack source directory does not exist: ${sourceDir}`);
    }
    if (!lstatSync2(real).isDirectory()) throw new Error(`Pack source is not a directory: ${sourceDir}`);
    const destHome = home === "agent" ? this.paths.agentHome : this.paths.dshHome;
    mkdirSync4(destHome, { recursive: true });
    const name2 = basename2(sourceDir);
    const dest = join5(destHome, name2);
    if (existsSync5(dest)) throw new Error(`Pack "${name2}" already exists in ${home} home`);
    symlinkSync(real, dest, "junction");
    return this.catalog({});
  }
};

// src/groups.ts
function groupGateId(name2) {
  return `group:${name2}`;
}
function computeGroups(input, resolveGroup) {
  const skillByName = /* @__PURE__ */ new Map();
  for (const skill of input.skills) if (!skillByName.has(skill.name)) skillByName.set(skill.name, skill);
  const serverByName = /* @__PURE__ */ new Map();
  for (const server of input.servers) serverByName.set(server.name, server);
  const members = /* @__PURE__ */ new Map();
  const add = (name2, skill, kind) => {
    const current = members.get(name2);
    if (current === void 0) {
      members.set(name2, { skills: /* @__PURE__ */ new Set([skill]), kind });
      return;
    }
    current.skills.add(skill);
    if (kind === "capability") current.kind = "capability";
  };
  for (const skill of input.skills) {
    const dash = skill.name.indexOf("-");
    if (dash <= 0) continue;
    const base = skill.name.slice(0, dash);
    if (skillByName.get(base) === void 0) continue;
    const kind = serverByName.has(base) ? "capability" : "family";
    add(base, base, kind);
    add(base, skill.name, kind);
  }
  for (const [base, family] of members) {
    if (family.skills.size < 2) members.delete(base);
  }
  for (const server of input.servers) {
    if (skillByName.get(server.name) === void 0) continue;
    add(server.name, server.name, "capability");
  }
  const groups = [];
  for (const [name2, entry] of members) {
    const parent = resolveGroup(name2);
    const locked = parent.gate === "off";
    const skills = [];
    for (const skillName of [...entry.skills].sort((left, right) => left.localeCompare(right))) {
      const skill = skillByName.get(skillName);
      if (skill === void 0) continue;
      skills.push({
        id: skill.id,
        name: skill.name,
        gate: skill.gate,
        source: skill.source,
        effective: parent.gate === "on" && skill.gate === "on" ? "on" : "off",
        locked
      });
    }
    const server = serverByName.get(name2);
    const membersOn = skills.every((skill) => skill.effective === "on") && (server === void 0 || parent.gate === "on" && server.gate === "on");
    const gate = parent.gate === "off" ? "off" : membersOn ? "on" : "mixed";
    groups.push({
      name: name2,
      kind: entry.kind,
      gate,
      source: parent.source,
      skills,
      servers: server === void 0 ? [] : [{
        name: server.name,
        tools: server.tools,
        gate: server.gate,
        source: server.source,
        effective: parent.gate === "on" && server.gate === "on" ? "on" : "off",
        locked
      }]
    });
  }
  groups.sort((left, right) => left.name.localeCompare(right.name));
  return groups;
}

// src/http.ts
var PREFIX = "/skillhub";
function clientCatalog(catalog) {
  return {
    offered: catalog.offered.map((skill) => ({
      id: skill.id,
      name: skill.name,
      home: skill.home
    })),
    tree: catalog.tree,
    collisions: catalog.collisions,
    broken: catalog.broken,
    layer: catalog.layer,
    resolved: catalog.resolved === true,
    legacySessionSnapshot: catalog.legacySessionSnapshot === true
  };
}
function send(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(text);
}
var MAX_BODY_BYTES = 1024 * 1024;
async function readJson(req) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) throw new Error("invalid JSON: request body exceeds 1 MiB");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  let parsed;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("invalid JSON body");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
  return parsed;
}
function isLayerName(value) {
  return value === "global" || value === "project" || value === "session";
}
function query(url) {
  const sessionId = url.searchParams.get("sessionId") ?? void 0;
  const folder = url.searchParams.get("folder") ?? void 0;
  const layer = url.searchParams.get("layer");
  return {
    ...sessionId !== void 0 && sessionId !== "" ? { sessionId } : {},
    ...folder !== void 0 && folder !== "" ? { folder } : {},
    ...isLayerName(layer) ? { layer } : {},
    resolved: url.searchParams.get("raw") !== "1"
  };
}
function isSkillIdList(value) {
  return Array.isArray(value) && value.every((id) => typeof id === "string" && id !== "");
}
function visibilityTarget(body) {
  const kind = body["kind"];
  if (kind === "all") return { kind: "all" };
  if (kind === "skill" && typeof body["id"] === "string") {
    return { kind: "skill", id: body["id"] };
  }
  if (kind === "ids" && isSkillIdList(body["ids"])) {
    return { kind: "ids", ids: body["ids"] };
  }
  if (kind === "home" && (body["home"] === "agent" || body["home"] === "dsh")) {
    return { kind: "home", home: body["home"] };
  }
  if (kind === "group" && (body["packHome"] === "agent" || body["packHome"] === "dsh") && typeof body["packName"] === "string" && typeof body["rel"] === "string") {
    return {
      kind: "group",
      packHome: body["packHome"],
      packName: body["packName"],
      rel: body["rel"]
    };
  }
  throw new Error("invalid visibility target");
}
function toggleTarget(body) {
  if (typeof body["on"] !== "boolean") throw new Error("on must be boolean");
  return { ...visibilityTarget(body), on: body["on"] };
}
function groupsPayload(hub, mcp, query2) {
  const catalog = hub.catalog(query2);
  const servers = mcp === void 0 ? [] : mcp.catalog(query2).servers;
  const groups = computeGroups({
    skills: catalog.inventory.map((skill) => ({ id: skill.id, name: skill.name, gate: skill.gate, source: skill.source })),
    servers
  }, (name2) => hub.gateOf(query2, groupGateId(name2)));
  return { layer: catalog.layer ?? "global", groups };
}
function handleSkillHubHttp(hub, invalidate, requestRejection, mcp, bundles) {
  return async (req, res) => {
    try {
      const host = req.headers.host ?? "127.0.0.1";
      const url = new URL(req.url ?? "/", `http://${host}`);
      const path = url.pathname.slice(PREFIX.length) || "/";
      if (requestRejection === void 0) {
        send(res, 503, { error: "Host authentication unavailable" });
        return;
      }
      const rejection = requestRejection(req);
      if (rejection !== void 0) {
        send(res, rejection, { error: rejection === 401 ? "unauthorized" : "forbidden" });
        return;
      }
      if (req.method === "GET" && path === "/mcp/catalog") {
        if (!mcp) {
          send(res, 503, { error: "MCP visibility unavailable" });
          return;
        }
        send(res, 200, mcp.catalog(query(url)));
        return;
      }
      if (req.method === "GET" && path === "/groups") {
        send(res, 200, groupsPayload(hub, mcp, query(url)));
        return;
      }
      if (req.method === "GET" && path === "/bundles") {
        send(res, 200, hub.bundleCatalog(bundles?.() ?? [], query(url)));
        return;
      }
      if (req.method === "GET" && (path === "/catalog" || path === "/")) {
        send(res, 200, clientCatalog(hub.catalog(query(url))));
        return;
      }
      if (req.method !== "POST") {
        send(res, 405, { error: "method not allowed" });
        return;
      }
      const body = await readJson(req);
      if (path === "/mcp/toggle" || path === "/mcp/inherit") {
        if (!mcp) throw new Error("MCP visibility unavailable");
        const layer = body["layer"];
        if (layer !== "global" && layer !== "project" && layer !== "session") throw new Error("invalid MCP layer");
        if (typeof body["server"] !== "string") throw new Error("server required");
        if (path === "/mcp/toggle" && typeof body["on"] !== "boolean") throw new Error("on must be boolean");
        for (const key of ["folder", "sessionId"]) if (body[key] !== void 0 && typeof body[key] !== "string") throw new Error(`invalid ${key}`);
        const q = { layer, ...typeof body["folder"] === "string" ? { folder: body["folder"] } : {}, ...typeof body["sessionId"] === "string" ? { sessionId: body["sessionId"] } : {} };
        send(res, 200, mcp.mutate(q, body["server"], path === "/mcp/toggle" ? body["on"] : void 0));
        return;
      }
      if (path === "/groups/toggle") {
        const layer = body["layer"];
        if (layer !== "global" && layer !== "project" && layer !== "session") {
          send(res, 400, { error: "invalid layer" });
          return;
        }
        if (typeof body["name"] !== "string" || body["name"] === "") throw new Error("name required");
        if (typeof body["on"] !== "boolean") throw new Error("on must be boolean");
        const scope = { layer };
        if (typeof body["sessionId"] === "string") scope.sessionId = body["sessionId"];
        if (typeof body["folder"] === "string") scope.folder = body["folder"];
        const before = groupsPayload(hub, mcp, query(url)).groups.find((group) => group.name === body["name"]);
        if (before === void 0) throw new Error("no such group");
        hub.toggleBundle({ ...scope, id: groupGateId(before.name), on: body["on"] });
        for (const member of before.skills) hub.toggleBundle({ ...scope, id: member.id, on: body["on"] });
        if (mcp !== void 0) {
          for (const member of before.servers) mcp.mutate(scope, member.name, body["on"]);
        }
        invalidate();
        send(res, 200, groupsPayload(hub, mcp, query(url)));
        return;
      }
      if (path === "/bundles/toggle") {
        const layer = body["layer"];
        if (layer !== "global" && layer !== "project" && layer !== "session") {
          send(res, 400, { error: "invalid layer" });
          return;
        }
        if (typeof body["id"] !== "string" || body["id"] === "") throw new Error("id required");
        if (!/^(?:plugin|bundle):[^:]+(?::[^:]+)?$/u.test(body["id"])) throw new Error("invalid bundle id");
        if (typeof body["on"] !== "boolean") throw new Error("on must be boolean");
        const toggle = {
          layer,
          id: body["id"],
          on: body["on"]
        };
        if (typeof body["sessionId"] === "string") toggle.sessionId = body["sessionId"];
        if (typeof body["folder"] === "string") toggle.folder = body["folder"];
        hub.toggleBundle(toggle);
        invalidate();
        send(res, 200, hub.bundleCatalog(bundles?.() ?? [], {
          layer,
          ...toggle.sessionId !== void 0 ? { sessionId: toggle.sessionId } : {},
          ...toggle.folder !== void 0 ? { folder: toggle.folder } : {}
        }));
        return;
      }
      if (path === "/toggle") {
        const layer = body["layer"];
        if (layer !== "global" && layer !== "project" && layer !== "session") {
          send(res, 400, { error: "invalid layer" });
          return;
        }
        const toggle = { layer, target: toggleTarget(body) };
        if (typeof body["sessionId"] === "string") toggle.sessionId = body["sessionId"];
        if (typeof body["folder"] === "string") toggle.folder = body["folder"];
        hub.toggle(toggle);
        invalidate();
        send(res, 200, clientCatalog(hub.displayedCatalog(layer, toggle.folder, toggle.sessionId)));
        return;
      }
      if (path === "/inherit") {
        const layer = body["layer"];
        if (layer !== "global" && layer !== "project" && layer !== "session") {
          send(res, 400, { error: "invalid layer" });
          return;
        }
        const request = { layer, target: visibilityTarget(body) };
        if (typeof body["sessionId"] === "string") request.sessionId = body["sessionId"];
        if (typeof body["folder"] === "string") request.folder = body["folder"];
        hub.inherit(request);
        invalidate();
        send(res, 200, clientCatalog(hub.displayedCatalog(layer, request.folder, request.sessionId)));
        return;
      }
      if (path === "/reset") {
        if (typeof body["sessionId"] !== "string") {
          send(res, 400, { error: "sessionId required" });
          return;
        }
        const folder = typeof body["folder"] === "string" ? body["folder"] : void 0;
        hub.resetSession(body["sessionId"], folder);
        invalidate();
        send(res, 200, clientCatalog(hub.displayedCatalog("session", folder, body["sessionId"])));
        return;
      }
      if (path === "/install") {
        if (typeof body["sourceDir"] !== "string" || body["home"] !== "agent" && body["home"] !== "dsh") {
          send(res, 400, { error: "sourceDir and home required" });
          return;
        }
        const catalog = hub.install(body["sourceDir"], body["home"]);
        invalidate();
        send(res, 200, clientCatalog(catalog));
        return;
      }
      send(res, 404, { error: "not found" });
    } catch (error) {
      const message = String(error);
      const client = !/visibility document/i.test(message) && /required|invalid|must be|no longer registered|Cannot fully hide/i.test(message);
      send(res, client ? 400 : 500, { error: message });
    }
  };
}

// src/provider.ts
import { readFileSync as readFileSync6 } from "node:fs";
import { dirname as dirname4, resolve as resolve3 } from "node:path";
import { scopeOf } from "@deepseek-ai/dsh-scope";
var PROVIDER = "skillhub";
var USER_DSH_RANK = 350;
var USER_AGENTS_RANK = 351;
var BUNDLE_PROVIDER = "skillhub-bundles";
var BUNDLE_RANK = 340;
function sessionIdOfKey(holder) {
  if (typeof holder !== "object" || holder === null) return void 0;
  const agent = holder;
  try {
    if (typeof agent.session?.id === "string") return agent.session.id;
    if (typeof agent.session?.header?.id === "string") return agent.session.header.id;
    const raw = agent.session;
    if (typeof raw === "string") return raw;
  } catch {
    return void 0;
  }
  return void 0;
}
function sessionIdFromScope(scope) {
  if (typeof scope === "string") return scope === "" ? void 0 : scope;
  if (typeof scope !== "object" || scope === null) return void 0;
  try {
    const tagged = scopeOf(scope);
    const fromTag = sessionIdOfKey(tagged);
    if (fromTag !== void 0) return fromTag;
  } catch {
  }
  return sessionIdOfKey(scope);
}
function toCandidate(skill) {
  const source = skill.home === "dsh" ? "user-dsh" : "user-agents";
  const rank = skill.home === "dsh" ? USER_DSH_RANK : USER_AGENTS_RANK;
  return {
    name: skill.name,
    description: skill.description,
    ...skill.whenToUse !== void 0 ? { whenToUse: skill.whenToUse } : {},
    invocation: skill.invocation,
    source,
    provider: PROVIDER,
    rank,
    locator: { path: skill.path, directory: skill.directory },
    path: skill.path,
    resourceBase: { kind: "directory", path: skill.directory }
  };
}
function providerSkillsFromCatalog(catalog) {
  const byName = /* @__PURE__ */ new Map();
  for (const skill of catalog.inventory) {
    const list = byName.get(skill.name) ?? [];
    list.push(skill);
    byName.set(skill.name, list);
  }
  const selected = [];
  for (const group of byName.values()) {
    const on = group.filter((skill) => skill.gate === "on");
    const pool = on.length > 0 ? on : group;
    pool.sort((left, right) => Number(left.home !== "dsh") - Number(right.home !== "dsh"));
    const pick = pool[0];
    if (pick === void 0) continue;
    selected.push(pick);
  }
  return selected;
}
function createSkillHubProvider(hub, boundSessionId) {
  return {
    name: PROVIDER,
    async list(options) {
      try {
        const view = options;
        const sessionId = sessionIdFromScope(view.scope) ?? boundSessionId;
        const query2 = {};
        if (sessionId !== void 0) query2.sessionId = sessionId;
        if (options.cwd !== void 0) query2.folder = resolve3(options.cwd);
        return providerSkillsFromCatalog(hub.catalog(query2)).map(toCandidate);
      } catch (error) {
        console.error("[dsh-skillhub] list failed", error);
        return [];
      }
    },
    async get(candidate) {
      const locator = candidate.locator;
      if (typeof locator.path !== "string") return void 0;
      let content;
      try {
        content = readFileSync6(locator.path, "utf8");
      } catch {
        return void 0;
      }
      const split = content.startsWith("---") ? content.indexOf("\n---", 3) : -1;
      const body = split >= 0 ? content.slice(split + 4).replace(/^\r?\n/, "") : content;
      return {
        name: candidate.name,
        description: candidate.description,
        ...candidate.whenToUse !== void 0 ? { whenToUse: candidate.whenToUse } : {},
        invocation: candidate.invocation,
        source: candidate.source,
        provider: PROVIDER,
        resourceBase: { kind: "directory", path: locator.directory ?? dirname4(locator.path) },
        path: locator.path,
        content: body
      };
    }
  };
}
function createBundleProvider(hub, bundles) {
  return {
    name: BUNDLE_PROVIDER,
    async list(options) {
      try {
        const view = options;
        const sessionId = sessionIdFromScope(view.scope);
        const query2 = {};
        if (sessionId !== void 0) query2.sessionId = sessionId;
        if (options.cwd !== void 0) query2.folder = resolve3(options.cwd);
        const catalog = hub.bundleCatalog(bundles(), query2);
        const candidates = [];
        for (const plugin of catalog.plugins) {
          const source = bundles().find((entry) => entry.name === plugin.name);
          if (source === void 0) continue;
          for (const row of plugin.skills) {
            const skill = source.skills.find((entry) => entry.name === row.name);
            if (skill === void 0) continue;
            candidates.push({
              name: skill.name,
              description: skill.description,
              ...skill.whenToUse !== void 0 ? { whenToUse: skill.whenToUse } : {},
              invocation: { modelInvocable: row.effective === "on", userInvocable: row.effective === "on" },
              source: "bundled",
              provider: BUNDLE_PROVIDER,
              rank: BUNDLE_RANK,
              locator: { path: skill.path, directory: skill.directory, effective: row.effective }
            });
          }
        }
        return candidates;
      } catch (error) {
        console.error("[dsh-skillhub] bundle provider list failed", error);
        return [];
      }
    },
    async get(candidate) {
      const locator = candidate.locator;
      if (typeof locator?.path !== "string") return void 0;
      const content = readBundleSkill(locator.path);
      if (content === void 0) return void 0;
      return {
        name: candidate.name,
        description: candidate.description,
        ...candidate.whenToUse !== void 0 ? { whenToUse: candidate.whenToUse } : {},
        invocation: candidate.invocation,
        source: candidate.source,
        provider: BUNDLE_PROVIDER,
        resourceBase: { kind: "directory", path: locator.directory ?? dirname4(locator.path) },
        path: locator.path,
        content
      };
    }
  };
}

// src/dsh-skillhub.ts
var name = "dsh-skillhub";
var inject = ["skills", "webServer", "connection", "tools", "agents"];
var Config = z.object({
  enabled: z.boolean().default(true).volatile()
});
function env(name2) {
  const value = globalThis.process?.env?.[name2];
  return value;
}
function defaultAgentHome() {
  return join6(env("DSH_AGENTS_HOME") ?? join6(homedir(), ".agents"), "skills");
}
function defaultDshHome() {
  return join6(env("DSH_HOME") ?? join6(homedir(), ".dsh"), "skills");
}
function defaultStoreDir() {
  return join6(env("DSH_HOME") ?? join6(homedir(), ".dsh"), "skillhub");
}
function apply(ctx, config) {
  console.log("[my-plugins/dsh-skillhub] loaded");
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.effect(() => settingsCtx.settings.configure({ auto: true }, ctx.fiber));
  });
  if (config.enabled.get() === false) {
    console.log("[my-plugins/dsh-skillhub] disabled; provider, http, and hooks skipped");
    return;
  }
  const hub = new SkillHub({
    agentHome: defaultAgentHome(),
    dshHome: defaultDshHome(),
    storeDir: defaultStoreDir()
  });
  let control;
  ctx.skills.registerProvider((next) => {
    control = next;
    return createSkillHubProvider(hub);
  });
  let plugins = loadBundles(defaultStoreDir());
  const readPlugins = () => filterActive(plugins, enabledPackages(ctx));
  ctx.skills.registerProvider(() => createBundleProvider(hub, readPlugins));
  void discoverBundles(ctx.skills, defaultStoreDir()).then((next) => {
    plugins = next;
    control?.invalidate();
  }).catch((error) => {
    console.error("[dsh-skillhub] bundle discovery failed", error);
  });
  const mcp = installMcpVisibility(ctx, new McpHub({ storeDir: defaultStoreDir() }));
  const invalidate = () => {
    control?.invalidate();
  };
  const connection = ctx.get("connection");
  const handler = handleSkillHubHttp(
    hub,
    invalidate,
    (request) => connection === void 0 ? 401 : connection.requestRejection(request),
    mcp,
    readPlugins
  );
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: "/skillhub",
    handler: (req, res) => {
      void handler(req, res);
    }
  }), "dsh-skillhub http");
  const attached = /* @__PURE__ */ new WeakSet();
  const attach = (payload) => {
    const agent = payload?.agent;
    if (agent === void 0 || attached.has(agent)) return;
    attached.add(agent);
    attachAgentProvider(ctx, hub, payload);
  };
  ctx.effect(() => {
    const onCreated = ctx.on.bind(ctx);
    return onCreated("agent/created", attach);
  }, "dsh-skillhub agent provider");
  const agents = ctx.get("agents");
  for (const agent of agents?.list() ?? []) attach({ agent });
  console.log("[my-plugins/dsh-skillhub] http /skillhub");
}
function enabledPackages(ctx) {
  const loader = ctx.get("loader");
  if (typeof loader?.entries !== "function") return void 0;
  const names = /* @__PURE__ */ new Set();
  try {
    for (const entry of loader.entries()) {
      if (entry === null || typeof entry !== "object" || entry.disabled === true) continue;
      const name2 = entry.options?.name;
      if (typeof name2 !== "string") continue;
      const bare = barePackageName(name2);
      if (bare !== void 0) names.add(bare);
    }
  } catch {
    return void 0;
  }
  return names;
}
function sessionIdOfAgent(agent) {
  if (typeof agent.session?.id === "string") return agent.session.id;
  if (typeof agent.session?.header?.id === "string") return agent.session.header.id;
  return typeof agent.id === "string" && agent.id !== "" ? agent.id : void 0;
}
function attachAgentProvider(owner, hub, payload) {
  if (typeof payload !== "object" || payload === null) return;
  const agent = payload.agent;
  if (agent === void 0) return;
  const agentCtx = agent.ctx;
  if (agentCtx === void 0) return;
  try {
    const skills = agentCtx.get("skills");
    if (skills === void 0 || typeof skills.registerProvider !== "function") return;
    const sessionId = sessionIdOfAgent(agent);
    owner.effect(() => agentCtx.effect(() => skills.registerProvider(() => {
      const current = createSkillHubProvider(hub, sessionId);
      const name2 = "skillhub-propagation";
      return {
        ...current,
        name: name2,
        async list(options) {
          const result = await current.list(options);
          if (!Array.isArray(result)) return result;
          return result.map((candidate) => ({ ...candidate, provider: name2, rank: (candidate.rank ?? 350) - 2 }));
        }
      };
    }), "dsh-skillhub scoped propagation"), "dsh-skillhub agent provider");
  } catch (error) {
    console.error("[dsh-skillhub] agent provider failed", error);
  }
}
export {
  Config,
  apply,
  attachAgentProvider,
  inject,
  name
};
