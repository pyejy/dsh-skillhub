import type { SkillSummary } from '@deepseek-ai/dsh-skill';
/** One skill shipped inside an installed package (`skills/*`, `own-skills/*`). */
export interface BundleSkill {
    readonly name: string;
    readonly description: string;
    readonly whenToUse?: string;
    readonly path: string;
    readonly directory: string;
    /** Path inside the package, e.g. `skills/guizang-ppt-skill/SKILL.md`. */
    readonly rel: string;
}
/** One installed package that contributes skills to the registry. */
export interface BundlePlugin {
    readonly name: string;
    readonly root: string;
    readonly skills: readonly BundleSkill[];
}
/** Where the discovered package skills are cached between Host loads. */
export declare function bundlesPath(storeDir: string): string;
/** Read the cached package contributions; a corrupt cache is rebuilt, never fatal. */
export declare function loadBundles(storeDir: string): BundlePlugin[];
/** Persist the cache atomically; failures only cost a rediscovery next load. */
export declare function saveBundles(storeDir: string, plugins: readonly BundlePlugin[]): void;
/**
 * Owning package of a file inside a profile's `node_modules`.
 * Nested installs (`a/node_modules/b`) resolve to the innermost package.
 * @param path - absolute file path.
 * @returns package name and root, or undefined when the path is not package-owned.
 */
export declare function packageOf(path: string): {
    name: string;
    root: string;
} | undefined;
/**
 * Skills a package ships on disk. Used when the registry does not report a path
 * (for example a provider that loads its catalog only on demand).
 * @param root - package root.
 * @returns discovered skills, ignoring unreadable entries.
 */
export declare function scanPackage(root: string): BundleSkill[];
/**
 * Refresh the package-contribution cache from the live registry.
 *
 * The registry reports the *winning* provider for each name, and this plugin's
 * own provider outranks packaged ones, so the listing is only trusted for names
 * this plugin does not shadow yet; the cache keeps everything learned earlier.
 * Every known root is also rescanned so a package that adds a skill updates
 * without waiting for a registry round-trip.
 *
 * @param skills - the Host skill registry.
 * @param storeDir - SkillHub store directory holding the cache.
 * @returns the refreshed plugin list, also written to the cache.
 */
export declare function discoverBundles(skills: {
    list(options?: object): Promise<SkillSummary[]>;
}, storeDir: string): Promise<BundlePlugin[]>;
/** Read the instruction body of one package skill. */
export declare function readBundleSkill(path: string): string | undefined;
//# sourceMappingURL=bundles.d.ts.map