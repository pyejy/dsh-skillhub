import type { BundlePlugin } from './bundles.ts';
import { type Catalog, type Gate, type HomeKind, type SkillId, type VisibilityLayer } from './catalog.ts';
export type LayerName = VisibilityLayer;
export type CatalogQuery = {
    readonly sessionId?: string;
    readonly folder?: string;
    readonly layer?: LayerName;
    readonly resolved?: boolean;
};
export interface HubPaths {
    readonly agentHome: string;
    readonly dshHome: string;
    readonly storeDir: string;
}
export type VisibilityTarget = {
    readonly kind: 'skill';
    readonly id: SkillId;
} | {
    readonly kind: 'group';
    readonly packHome: HomeKind;
    readonly packName: string;
    readonly rel: string;
} | {
    readonly kind: 'home';
    readonly home: HomeKind;
} | {
    readonly kind: 'ids';
    readonly ids: readonly SkillId[];
} | {
    readonly kind: 'all';
};
/** Effective gate of one package-shipped skill; `locked` marks a parent plugin that is off. */
export interface BundleSkillView {
    readonly id: string;
    readonly name: string;
    readonly gate: Gate;
    readonly source: LayerName;
    readonly effective: Gate;
    readonly locked: boolean;
}
/** One installed package that contributes skills, with its effective gates. */
export interface BundlePluginView {
    readonly name: string;
    readonly root: string;
    readonly gate: Gate;
    readonly source: LayerName;
    readonly skills: readonly BundleSkillView[];
}
export interface BundleCatalog {
    readonly layer: LayerName;
    readonly plugins: readonly BundlePluginView[];
}
export type ToggleTarget = VisibilityTarget & {
    readonly on: boolean;
};
/** Gate key of a package-level switch. */
export declare function pluginGateId(name: string): string;
/** Gate key of one skill a package ships. */
export declare function bundleSkillGateId(plugin: string, skill: string): string;
export declare class SkillHub {
    readonly paths: HubPaths;
    constructor(paths: HubPaths);
    private globalPath;
    private projectPath;
    private sessionPath;
    private documentPath;
    /** The three layer documents a read composes, validated against the query. */
    private layerInput;
    /** UI and provider use the same scoped, latest-operation resolution. */
    catalog(query?: CatalogQuery): Catalog;
    layerCatalog(layer: LayerName, folder?: string, sessionId?: string): Catalog;
    displayedCatalog(layer: LayerName, folder?: string, sessionId?: string): Catalog;
    toggle(query: {
        layer: LayerName;
        sessionId?: string;
        folder?: string;
        target: ToggleTarget;
    }): Catalog;
    /** Compatibility for older clients only; no restore controls in the current UI. */
    inherit(query: {
        layer: LayerName;
        sessionId?: string;
        folder?: string;
        target: VisibilityTarget;
    }): Catalog;
    resetSession(sessionId: string, folder?: string): Catalog;
    resetProject(folder: string): Catalog;
    /**
     * Gates of the package contributions at this scope. A skill is effective only
     * when both its own row and the parent package row are on; an off parent locks
     * the child switch without rewriting the child's stored value.
     */
    bundleCatalog(bundles: readonly BundlePlugin[], query?: CatalogQuery): BundleCatalog;
    /** Effective gate and deciding layer of one arbitrary key (`group:` rows) at this scope. */
    gateOf(query: CatalogQuery, id: string): {
        gate: Gate;
        source: LayerName;
    };
    /** Write one package or package-skill gate into the requested layer document. */
    toggleBundle(query: {
        layer: LayerName;
        sessionId?: string;
        folder?: string;
        id: string;
        on: boolean;
    }): void;
    install(sourceDir: string, home: HomeKind): Catalog;
}
//# sourceMappingURL=hub.d.ts.map