window.__ModuleLoader__.load({
	id: "@aa2246740/dsh-skillhub",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);
var import_react5 = require("react");
var import_react_dom = require("react-dom");
var import_dsh_client_ui_primitives5 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/GroupPanel.tsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/SkillHubPanel.module.css
var css = '.KggJoa_root {\n  box-sizing: border-box;\n  min-width: 0;\n  color: var(--dsw-alias-label-primary);\n  font-family: var(--dsw-font-family);\n  --skillhub-motion-fast: .12s;\n  --skillhub-motion-panel: .18s;\n  --skillhub-ease-out: cubic-bezier(.2, .8, .2, 1);\n  flex-direction: column;\n  gap: 10px;\n  font-size: 13px;\n  line-height: 20px;\n  display: flex;\n}\n\n.KggJoa_root[data-surface="page"] {\n  max-width: 720px;\n  min-height: 0;\n  max-height: 100%;\n  padding: 4px 0 24px;\n  overflow: auto;\n}\n\n.KggJoa_root[data-surface="popover"] {\n  gap: 8px;\n  width: 420px;\n  max-width: calc(100vw - 24px);\n  max-height: min(640px, 100vh - 24px);\n  padding: 12px 12px 10px;\n  overflow: hidden;\n}\n\n.KggJoa_menu > .KggJoa_root[data-surface="popover"] {\n  flex: auto;\n  height: 100%;\n  min-height: 0;\n  max-height: 100%;\n}\n\n.KggJoa_chipWrap {\n  position: relative;\n}\n\n.KggJoa_trigger {\n  anchor-name: var(--dsh-skillhub-anchor);\n  box-sizing: border-box;\n  border: 1px solid var(--dsw-alias-border-l2);\n  height: 32px;\n  color: var(--dsw-alias-label-primary);\n  font: inherit;\n  cursor: pointer;\n  transition: background-color var(--skillhub-motion-fast) ease,\n    border-color var(--skillhub-motion-fast) ease,\n    color var(--skillhub-motion-fast) ease,\n    transform .1s ease;\n  background: none;\n  border-radius: 18px;\n  justify-content: center;\n  align-items: center;\n  gap: 6px;\n  padding: 0 10px 0 8px;\n  font-size: 13px;\n  font-weight: 500;\n  line-height: 20px;\n  display: inline-flex;\n}\n\n.KggJoa_trigger:hover:not(:disabled), .KggJoa_trigger:focus-visible {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\n\n.KggJoa_trigger:active:not(:disabled) {\n  transform: scale(.96);\n}\n\n.KggJoa_trigger:focus-visible {\n  box-shadow: inset 0 0 0 2px var(--dsw-alias-brand-primary);\n  outline: none;\n}\n\n.KggJoa_trigger[data-open] {\n  border-color: var(--dsw-alias-button-ghost-active-border);\n  background: var(--dsw-alias-button-ghost-active-fill);\n  color: var(--dsw-alias-brand-primary);\n}\n\n.KggJoa_triggerLabel {\n  white-space: nowrap;\n}\n\n@container (width <= 460px) {\n  .KggJoa_triggerLabel {\n    display: none;\n  }\n\n  .KggJoa_trigger {\n    width: 32px;\n    padding: 0;\n  }\n}\n\n.KggJoa_menu {\n  position-anchor: var(--dsh-skillhub-anchor);\n  top: calc(anchor(bottom) + 8px);\n  left: anchor(left);\n  position-try-fallbacks: flip-block;\n  z-index: 900;\n  box-sizing: border-box;\n  border: 1px solid var(--dsw-alias-border-l2);\n  max-width: calc(100vw - 24px);\n  height: min(640px, 100vh - 24px, min(480px, 60vh) + 100px);\n  max-height: min(640px, 100vh - 24px);\n  box-shadow: var(--dsw-shadow-lv3);\n  color: var(--dsw-alias-label-primary);\n  font-family: var(--dsw-font-family);\n  transform-origin: 0 100%;\n  animation: KggJoa_skillhub-panel-enter var(--skillhub-motion-panel) var(--skillhub-ease-out);\n  isolation: isolate;\n  border-radius: 12px;\n  flex-direction: column;\n  font-size: 13px;\n  line-height: 20px;\n  display: flex;\n  position: fixed;\n  overflow: hidden;\n}\n\n.KggJoa_menu:before {\n  content: "";\n  z-index: -1;\n  pointer-events: none;\n  border-radius: inherit;\n  background: var(--dsw-specific-menu);\n  backdrop-filter: var(--dsw-menu-backdrop-filter, blur(40px) saturate(150%));\n  position: absolute;\n  inset: 0;\n}\n\n@keyframes KggJoa_skillhub-panel-enter {\n  from {\n    opacity: 0;\n    transform: translateY(5px) scale(.992);\n  }\n\n  to {\n    opacity: 1;\n    transform: translateY(0) scale(1);\n  }\n}\n\n.KggJoa_toolbar {\n  flex-wrap: wrap;\n  justify-content: space-between;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n  display: flex;\n}\n\n.KggJoa_tabs {\n  align-items: center;\n  gap: 4px;\n  min-width: 0;\n  display: inline-flex;\n}\n\n.KggJoa_pillCount {\n  color: var(--dsw-alias-label-tertiary);\n  font-variant-numeric: tabular-nums;\n  font-size: 11px;\n  line-height: 17px;\n}\n\n.KggJoa_toolbarEnd {\n  flex: none;\n  align-items: center;\n  gap: 6px;\n  margin-left: auto;\n  display: flex;\n}\n\n.KggJoa_segment {\n  background: var(--dsw-alias-bg-layer-2);\n  border-radius: 14px;\n  align-items: center;\n  min-width: 0;\n  padding: 2px;\n  display: flex;\n}\n\n.KggJoa_segment button {\n  min-width: 0;\n  height: 20px;\n  color: var(--dsw-alias-label-secondary);\n  font: inherit;\n  cursor: pointer;\n  transition: background-color var(--skillhub-motion-fast) ease,\n    color var(--skillhub-motion-fast) ease;\n  background: none;\n  border: 0;\n  border-radius: 10px;\n  padding: 0 8px;\n  font-size: 12px;\n  font-weight: 500;\n  line-height: 18px;\n}\n\n.KggJoa_segment button[data-active] {\n  background: var(--dsw-specific-menu);\n  box-shadow: inset 0 0 0 1px var(--dsw-alias-button-ghost-active-border);\n  color: var(--dsw-alias-label-primary);\n}\n\n.KggJoa_segment button:disabled {\n  cursor: not-allowed;\n  opacity: .45;\n}\n\n.KggJoa_segment button:focus-visible, .KggJoa_switch:focus-visible, .KggJoa_chevron:focus-visible, .KggJoa_nameBtn:focus-visible, .KggJoa_inherit:focus-visible, .KggJoa_layerTag:focus-visible, .KggJoa_slash:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 2px;\n}\n\n.KggJoa_search {\n  min-width: 0;\n  display: block;\n}\n\n.KggJoa_field {\n  width: 100%;\n  min-width: 0;\n}\n\n.KggJoa_body, .KggJoa_mcpBody, .KggJoa_pluginBody, .KggJoa_groupBody {\n  overscroll-behavior: contain;\n  --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);\n  --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);\n  flex-direction: column;\n  flex: auto;\n  gap: 8px;\n  min-height: 0;\n  display: flex;\n  overflow: auto;\n}\n\n.KggJoa_root[data-surface="popover"] .KggJoa_body, .KggJoa_root[data-surface="popover"] .KggJoa_mcpBody, .KggJoa_root[data-surface="popover"] .KggJoa_pluginBody, .KggJoa_root[data-surface="popover"] .KggJoa_groupBody {\n  flex: 1 1 0;\n  height: auto;\n  overflow-y: auto;\n}\n\n.KggJoa_root[data-surface="popover"] .KggJoa_emptyCard {\n  flex: auto;\n  margin-block: 0;\n}\n\n.KggJoa_error, .KggJoa_warn {\n  border-radius: 8px;\n  margin: 0;\n  padding: 6px 10px;\n  font-size: 12px;\n  line-height: 18px;\n}\n\n.KggJoa_error {\n  color: var(--dsw-alias-state-error-primary);\n  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);\n}\n\n.KggJoa_warn {\n  color: var(--dsw-alias-state-warn-primary);\n  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent);\n}\n\n.KggJoa_bannerRow {\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 6px;\n  display: flex;\n}\n\n.KggJoa_empty {\n  color: var(--dsw-alias-label-tertiary);\n  margin: 0;\n  padding: 8px 6px 12px;\n  font-size: 12px;\n  line-height: 18px;\n}\n\n.KggJoa_skeleton {\n  flex-direction: column;\n  gap: 6px;\n  padding: 4px 0;\n  display: flex;\n}\n\n.KggJoa_skel {\n  background: var(--dsw-alias-bg-layer-2);\n  border-radius: 8px;\n  height: 32px;\n}\n\n.KggJoa_root[aria-busy="true"] .KggJoa_body, .KggJoa_root[aria-busy="true"] .KggJoa_mcpBody, .KggJoa_root[aria-busy="true"] .KggJoa_pluginBody, .KggJoa_root[aria-busy="true"] .KggJoa_groupBody, .KggJoa_mcpBody[aria-busy="true"], .KggJoa_pluginBody[aria-busy="true"], .KggJoa_groupBody[aria-busy="true"] {\n  opacity: .72;\n}\n\n.KggJoa_emptyCard {\n  box-sizing: border-box;\n  border: 1px dashed var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-1);\n  text-align: center;\n  border-radius: 10px;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  margin: 8px 0;\n  padding: 28px 20px 22px;\n  display: flex;\n}\n\n.KggJoa_emptyIcon {\n  background: var(--dsw-alias-bg-layer-2);\n  width: 44px;\n  height: 44px;\n  color: var(--dsw-alias-label-tertiary);\n  border-radius: 50%;\n  justify-content: center;\n  align-items: center;\n  margin-bottom: 10px;\n  display: flex;\n}\n\n.KggJoa_emptyTitle {\n  margin: 0 0 4px;\n  font-size: 13px;\n  font-weight: 600;\n  line-height: 20px;\n}\n\n.KggJoa_emptyDesc {\n  max-width: 300px;\n  color: var(--dsw-alias-label-secondary);\n  margin: 0;\n  font-size: 12px;\n  line-height: 18px;\n}\n\n.KggJoa_home {\n  flex-direction: column;\n  gap: 2px;\n  min-width: 0;\n  display: flex;\n}\n\n.KggJoa_home + .KggJoa_home {\n  margin-top: 8px;\n}\n\n.KggJoa_row {\n  box-sizing: border-box;\n  min-height: 32px;\n  padding: 3px 6px 3px calc(6px + var(--depth, 0) * 16px);\n  border-radius: 8px;\n  grid-template-columns: 20px minmax(0, 1fr) auto;\n  align-items: center;\n  gap: 8px;\n  display: grid;\n}\n\n.KggJoa_row:hover {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\n\n.KggJoa_row[data-broken] {\n  grid-template-columns: 20px minmax(0, 1fr);\n}\n\n.KggJoa_chevron {\n  width: 20px;\n  height: 20px;\n  color: var(--dsw-alias-label-tertiary);\n  cursor: pointer;\n  background: none;\n  border: 0;\n  border-radius: 6px;\n  justify-content: center;\n  align-items: center;\n  padding: 0;\n  display: inline-flex;\n}\n\n.KggJoa_chevron[aria-expanded="true"] {\n  color: var(--dsw-alias-label-secondary);\n}\n\n.KggJoa_chevron svg {\n  transition: transform var(--skillhub-motion-fast) var(--skillhub-ease-out);\n}\n\n.KggJoa_chevron[aria-expanded="true"] svg {\n  transform: rotate(90deg);\n}\n\n.KggJoa_chevronGhost {\n  width: 20px;\n  height: 20px;\n}\n\n.KggJoa_cell {\n  min-width: 0;\n  display: flex;\n}\n\n.KggJoa_nameBtn {\n  min-width: 0;\n  color: inherit;\n  font: inherit;\n  text-align: left;\n  cursor: pointer;\n  background: none;\n  border: 0;\n  padding: 0;\n  display: flex;\n}\n\n.KggJoa_nameBtn:disabled {\n  cursor: default;\n}\n\n.KggJoa_name {\n  min-width: 0;\n  color: var(--dsw-alias-label-primary);\n  align-items: center;\n  gap: 6px;\n  display: flex;\n}\n\n.KggJoa_nameText {\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  overflow: hidden;\n}\n\n.KggJoa_layerTag {\n  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent);\n  color: var(--dsw-alias-state-business-primary);\n  font: inherit;\n  white-space: nowrap;\n  cursor: pointer;\n  transition: background-color var(--skillhub-motion-fast) ease;\n  border: 0;\n  border-radius: 999px;\n  flex: none;\n  padding: 1px 8px;\n  font-size: 11px;\n  font-weight: 500;\n  line-height: 17px;\n}\n\n.KggJoa_layerTag:hover:not(:disabled) {\n  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 18%, transparent);\n}\n\n.KggJoa_layerTag:disabled {\n  cursor: not-allowed;\n  opacity: .45;\n}\n\n.KggJoa_inherit {\n  min-width: 0;\n  color: var(--dsw-alias-state-business-primary);\n  font: inherit;\n  white-space: nowrap;\n  cursor: pointer;\n  background: none;\n  border: 0;\n  border-radius: 6px;\n  padding: 2px 6px;\n  font-size: 11px;\n  font-weight: 500;\n  line-height: 17px;\n}\n\n.KggJoa_inherit:hover:not(:disabled) {\n  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent);\n}\n\n.KggJoa_inherit:disabled {\n  cursor: not-allowed;\n  opacity: .45;\n}\n\n.KggJoa_actions {\n  flex: none;\n  align-items: center;\n  gap: 4px;\n  display: flex;\n}\n\n.KggJoa_slash {\n  min-width: 0;\n  max-width: 150px;\n  color: var(--dsw-alias-label-tertiary);\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  cursor: pointer;\n  opacity: 0;\n  transition: opacity var(--skillhub-motion-fast) ease, background-color var(--skillhub-motion-fast) ease;\n  background: none;\n  border: 0;\n  border-radius: 6px;\n  padding: 1px 6px;\n  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;\n  font-size: 11px;\n  line-height: 17px;\n  overflow: hidden;\n}\n\n.KggJoa_row:hover .KggJoa_slash, .KggJoa_slash:focus-visible, .KggJoa_slash[data-copied] {\n  opacity: 1;\n}\n\n.KggJoa_slash:hover {\n  background: var(--dsw-alias-interactive-bg-hover);\n  color: var(--dsw-alias-label-secondary);\n}\n\n.KggJoa_slash[data-copied] {\n  color: var(--dsw-alias-state-success-primary);\n}\n\n.KggJoa_switch {\n  box-sizing: border-box;\n  background: var(--dsw-alias-border-l3);\n  cursor: pointer;\n  border: 0;\n  border-radius: 10px;\n  flex: none;\n  width: 36px;\n  height: 20px;\n  padding: 2px;\n  position: relative;\n}\n\n.KggJoa_switch[data-state="on"] {\n  background: var(--dsw-alias-brand-primary);\n}\n\n.KggJoa_switch[data-state="mixed"] {\n  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, var(--dsw-alias-border-l3));\n}\n\n.KggJoa_switch:disabled {\n  cursor: not-allowed;\n  opacity: .5;\n}\n\n.KggJoa_thumb {\n  background: var(--dsw-alias-label-primary-foreground);\n  width: 16px;\n  height: 16px;\n  transition: transform var(--skillhub-motion-fast) var(--skillhub-ease-out);\n  border-radius: 50%;\n  display: block;\n  box-shadow: 0 1px 2px #0000002e;\n}\n\n.KggJoa_switch[data-state="on"] .KggJoa_thumb {\n  transform: translateX(16px);\n}\n\n.KggJoa_switch[data-state="mixed"] .KggJoa_thumb {\n  transform: translateX(8px);\n}\n\n.KggJoa_mcpList {\n  flex-direction: column;\n  gap: 2px;\n  display: flex;\n}\n\n.KggJoa_pluginList {\n  flex-direction: column;\n  gap: 4px;\n  display: flex;\n}\n\n.KggJoa_plugin {\n  flex-direction: column;\n  gap: 2px;\n  min-width: 0;\n  display: flex;\n}\n\n.KggJoa_row[data-locked] {\n  opacity: .5;\n}\n\n.KggJoa_row[data-locked]:hover {\n  background: none;\n}\n\n.KggJoa_row[data-locked] .KggJoa_switch:disabled {\n  opacity: 1;\n}\n\n.KggJoa_groupList {\n  flex-direction: column;\n  gap: 4px;\n  display: flex;\n}\n\n.KggJoa_group {\n  flex-direction: column;\n  gap: 2px;\n  min-width: 0;\n  display: flex;\n}\n\n.KggJoa_groupKind {\n  color: var(--dsw-alias-label-tertiary);\n  white-space: nowrap;\n  flex: none;\n  font-size: 11px;\n  line-height: 17px;\n}\n\n.KggJoa_lockedHint {\n  color: var(--dsw-alias-label-tertiary);\n  margin: 0;\n  padding: 0 6px 2px 50px;\n  font-size: 11px;\n  line-height: 17px;\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .KggJoa_menu {\n    animation: none;\n  }\n\n  .KggJoa_trigger, .KggJoa_thumb, .KggJoa_chevron svg, .KggJoa_slash, .KggJoa_layerTag, .KggJoa_segment button {\n    transition: none;\n  }\n\n  .KggJoa_trigger:active:not(:disabled) {\n    transform: none;\n  }\n}\n';
var tagId = "@aa2246740/dsh-skillhub/SkillHubPanel.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
  const tag = document.createElement("style");
  tag.dataset.plugin = "@aa2246740/dsh-skillhub";
  tag.dataset.pluginCss = tagId;
  tag.textContent = css;
  document.head.appendChild(tag);
}
var SkillHubPanel_default = { "slash": "KggJoa_slash", "emptyTitle": "KggJoa_emptyTitle", "toolbar": "KggJoa_toolbar", "nameBtn": "KggJoa_nameBtn", "chipWrap": "KggJoa_chipWrap", "groupBody": "KggJoa_groupBody", "root": "KggJoa_root", "nameText": "KggJoa_nameText", "emptyIcon": "KggJoa_emptyIcon", "pluginBody": "KggJoa_pluginBody", "tabs": "KggJoa_tabs", "warn": "KggJoa_warn", "empty": "KggJoa_empty", "trigger": "KggJoa_trigger", "thumb": "KggJoa_thumb", "home": "KggJoa_home", "actions": "KggJoa_actions", "menu": "KggJoa_menu", "segment": "KggJoa_segment", "skeleton": "KggJoa_skeleton", "name": "KggJoa_name", "toolbarEnd": "KggJoa_toolbarEnd", "field": "KggJoa_field", "body": "KggJoa_body", "error": "KggJoa_error", "chevron": "KggJoa_chevron", "row": "KggJoa_row", "plugin": "KggJoa_plugin", "skillhub-panel-enter": "KggJoa_skillhub-panel-enter", "pluginList": "KggJoa_pluginList", "skel": "KggJoa_skel", "mcpList": "KggJoa_mcpList", "groupKind": "KggJoa_groupKind", "group": "KggJoa_group", "emptyCard": "KggJoa_emptyCard", "groupList": "KggJoa_groupList", "cell": "KggJoa_cell", "lockedHint": "KggJoa_lockedHint", "inherit": "KggJoa_inherit", "emptyDesc": "KggJoa_emptyDesc", "layerTag": "KggJoa_layerTag", "triggerLabel": "KggJoa_triggerLabel", "pillCount": "KggJoa_pillCount", "switch": "KggJoa_switch", "chevronGhost": "KggJoa_chevronGhost", "bannerRow": "KggJoa_bannerRow", "mcpBody": "KggJoa_mcpBody", "search": "KggJoa_search" };

// src/client/GroupPanel.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function groupKindLabel(t, kind) {
  return t(kind === "capability" ? "groups.kind.capability" : "groups.kind.family");
}
function groupSummary(t, group) {
  const skills = skillCountLabel(t, group.skills.length);
  return group.servers.length === 0 ? skills : `${skills} · ${t("groups.mcpCount", { n: group.servers.length })}`;
}
function GroupPanel(props) {
  const { t, catalog } = props;
  const [expanded, setExpanded] = (0, import_react.useState)({});
  const shownError = props.error ?? props.catalogError;
  const disabled = !props.layerReady || props.busy;
  const toggleOpen = (name2) => setExpanded((current) => ({ ...current, [name2]: !(current[name2] ?? false) }));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: SkillHubPanel_default.groupBody, "data-ud-check": "skillhub-groups-body", "aria-busy": props.busy || props.refreshing, children: [
    shownError !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: SkillHubPanel_default.bannerRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: SkillHubPanel_default.error, role: "alert", children: t("error.load", { error: shownError }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "outline", size: "sm", onClick: props.onRetry, children: t("error.retry") })
    ] }) : null,
    catalog === void 0 && shownError === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: SkillHubPanel_default.skeleton, "aria-label": t("loading"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SkillHubPanel_default.skel }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SkillHubPanel_default.skel }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SkillHubPanel_default.skel })
    ] }) : null,
    catalog !== void 0 && catalog.groups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: SkillHubPanel_default.emptyCard, "data-ud-check": "skillhub-groups-empty", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SkillHubPanel_default.emptyIcon, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconWorkspaceTreeOutlineRegular, { size: 28 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: SkillHubPanel_default.emptyTitle, children: t("groups.empty.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: SkillHubPanel_default.emptyDesc, children: t("groups.empty.desc") })
    ] }) : null,
    catalog !== void 0 && catalog.groups.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SkillHubPanel_default.groupList, children: catalog.groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      GroupRow,
      {
        group,
        t,
        disabled,
        open: expanded[group.name] ?? false,
        onOpen: () => toggleOpen(group.name),
        onToggleGroup: props.onToggleGroup,
        onToggleSkill: props.onToggleSkill,
        onToggleServer: props.onToggleServer
      },
      group.name
    )) }) : null
  ] });
}
function GroupRow(props) {
  const { group, t, open, disabled } = props;
  const locked = group.gate === "off";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: SkillHubPanel_default.group, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: SkillHubPanel_default.row, style: { "--depth": "0" }, "data-folder": "", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          className: SkillHubPanel_default.chevron,
          "aria-expanded": open,
          "aria-label": t(open ? "collapse" : "expand", { name: group.name }),
          onClick: props.onOpen,
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconChevronRightOutlineRegular, { size: 14 })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SkillHubPanel_default.cell, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: SkillHubPanel_default.nameBtn, onClick: props.onOpen, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: SkillHubPanel_default.name, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: SkillHubPanel_default.nameText, children: group.name }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: SkillHubPanel_default.groupKind, children: groupKindLabel(t, group.kind) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tag, { tone: "quiet", children: groupSummary(t, group) })
      ] }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SkillHubPanel_default.actions, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        GateSwitch,
        {
          gate: group.gate,
          label: t("switch.group", { name: group.name, state: gateWord(t, group.gate) }),
          disabled,
          onChange: (on) => props.onToggleGroup(group.name, on)
        }
      ) })
    ] }),
    open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: SkillHubPanel_default.lockedHint, children: t("groups.locked") }) : null,
      group.skills.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        GroupSkillRow,
        {
          skill,
          group: group.name,
          t,
          disabled,
          onToggle: props.onToggleSkill
        },
        skill.id
      )),
      group.servers.map((server) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        GroupServerRow,
        {
          server,
          group: group.name,
          t,
          disabled,
          onToggle: props.onToggleServer
        },
        server.name
      ))
    ] }) : null
  ] });
}
function GroupSkillRow(props) {
  const { skill, t } = props;
  const inert = props.disabled || skill.locked;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      className: SkillHubPanel_default.row,
      "data-leaf": "",
      "data-locked": skill.locked ? "" : void 0,
      title: skill.locked ? t("groups.lockedBy", { name: props.group }) : void 0,
      style: { "--depth": "1" },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: SkillHubPanel_default.chevronGhost }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SkillHubPanel_default.cell, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SkillHubPanel_default.name, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: SkillHubPanel_default.nameText, children: skill.name }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SkillHubPanel_default.actions, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          GateSwitch,
          {
            gate: skill.effective,
            label: t("switch.skill", { name: skill.name, state: gateWord(t, skill.effective) }),
            disabled: inert,
            onChange: (on) => {
              if (!skill.locked) props.onToggle(skill.id, on);
            }
          }
        ) })
      ]
    }
  );
}
function GroupServerRow(props) {
  const { server, t } = props;
  const inert = props.disabled || server.locked;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      className: SkillHubPanel_default.row,
      "data-leaf": "",
      "data-locked": server.locked ? "" : void 0,
      title: server.locked ? t("groups.lockedBy", { name: props.group }) : void 0,
      style: { "--depth": "1" },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: SkillHubPanel_default.chevronGhost }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SkillHubPanel_default.cell, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: SkillHubPanel_default.name, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: SkillHubPanel_default.nameText, children: server.name }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tag, { tone: "quiet", children: t("mcp.tools", { n: server.tools }) })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SkillHubPanel_default.actions, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          GateSwitch,
          {
            gate: server.effective,
            label: t("switch.mcp", { name: server.name, state: gateWord(t, server.effective) }),
            disabled: inert,
            onChange: (on) => {
              if (!server.locked) props.onToggle(server.name, on);
            }
          }
        ) })
      ]
    }
  );
}

// src/client/McpPanel.tsx
var import_react2 = require("react");
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime2 = require("react/jsx-runtime");
function McpPanel(props) {
  const { t, layer, sessionId, folder, layerReady } = props;
  const [catalog, setCatalog] = (0, import_react2.useState)();
  const [error, setError] = (0, import_react2.useState)();
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [refreshing, setRefreshing] = (0, import_react2.useState)(false);
  const pending = (0, import_react2.useRef)(false);
  const generation = (0, import_react2.useRef)(0);
  const inFlight = (0, import_react2.useRef)(0);
  const tRef = (0, import_react2.useRef)(t);
  tRef.current = t;
  const onCountRef = (0, import_react2.useRef)(props.onServerCountChange);
  onCountRef.current = props.onServerCountChange;
  const query = { layer, ...sessionId ? { sessionId } : {}, ...folder ? { folder } : {} };
  const key = JSON.stringify(query);
  const activeKey = (0, import_react2.useRef)(key);
  activeKey.current = key;
  const request = (0, import_react2.useCallback)(async (path, body, signal) => {
    const response = await fetch(`/skillhub/mcp/${path}`, body === void 0 ? { ...signal ? { signal } : {} } : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!response.headers.get("content-type")?.includes("application/json")) throw new Error(tRef.current("mcp.unavailable"));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
    if (!Array.isArray(data.servers)) throw new Error(tRef.current("mcp.unavailable"));
    return data;
  }, []);
  const load = (0, import_react2.useCallback)(() => {
    const current = ++generation.current;
    const controller = new AbortController();
    inFlight.current += 1;
    setRefreshing(true);
    const done = () => {
      inFlight.current -= 1;
      if (inFlight.current === 0) setRefreshing(false);
    };
    void request(`catalog?${new URLSearchParams(JSON.parse(key))}`, void 0, controller.signal).then((data) => {
      if (key === activeKey.current && current === generation.current) {
        setCatalog(data);
        onCountRef.current?.(data.servers.length);
        setError(void 0);
      }
    }).catch((caught) => {
      if (!controller.signal.aborted && key === activeKey.current && current === generation.current) setError(caught.message);
    }).finally(done);
    return () => controller.abort();
  }, [key, request]);
  (0, import_react2.useEffect)(() => {
    setError(void 0);
    return load();
  }, [load]);
  useCatalogRefresh(load);
  const update = async (servers, on) => {
    if (pending.current || !layerReady) return;
    pending.current = true;
    ++generation.current;
    setBusy(true);
    setError(void 0);
    try {
      let latest;
      for (const server of servers) latest = await request("toggle", { ...query, server, on });
      if (latest && key === activeKey.current) {
        setCatalog(latest);
        onCountRef.current?.(latest.servers.length);
      }
    } catch (caught) {
      if (key === activeKey.current) setError(String(caught));
    } finally {
      pending.current = false;
      setBusy(false);
      notifyCatalogChanged(layer);
    }
  };
  const bulkActions = (0, import_react2.useMemo)(() => {
    if (!catalog?.servers.length) return void 0;
    const writable = catalog.servers.filter((server) => !(props.lockedServers?.has(server.name) ?? false));
    const names = writable.filter((server) => server.supported || server.gate === "off").map((server) => server.name);
    return {
      allOn: () => void update(writable.map((server) => server.name), true),
      allOff: () => void update(names, false),
      disabled: !layerReady || busy || writable.length === 0
    };
  }, [catalog, key, layerReady, busy, props.lockedServers]);
  (0, import_react2.useEffect)(() => {
    props.onBulkActions?.(bulkActions);
    return () => props.onBulkActions?.(void 0);
  }, [bulkActions]);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: SkillHubPanel_default.mcpBody, "data-ud-check": "skillhub-mcp-body", "aria-busy": busy || refreshing, children: [
    error !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: SkillHubPanel_default.bannerRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: SkillHubPanel_default.error, role: "alert", children: error }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "outline", size: "sm", onClick: () => load(), children: t("error.retry") })
    ] }) : null,
    catalog === void 0 && error === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: SkillHubPanel_default.skeleton, "aria-label": t("loading"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: SkillHubPanel_default.skel }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: SkillHubPanel_default.skel }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: SkillHubPanel_default.skel })
    ] }) : null,
    catalog !== void 0 && catalog.servers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: SkillHubPanel_default.emptyCard, "data-ud-check": "skillhub-mcp-empty", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: SkillHubPanel_default.emptyIcon, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconCordisPluginOutlineRegular, { size: 28 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: SkillHubPanel_default.emptyTitle, children: t("mcp.empty.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: SkillHubPanel_default.emptyDesc, children: t("mcp.empty.desc") })
    ] }) : null,
    catalog !== void 0 && catalog.servers.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: SkillHubPanel_default.mcpList, children: catalog.servers.map((server) => {
      const lockedBy = props.lockedServers?.get(server.name);
      const gate = lockedBy === void 0 ? server.gate : "off";
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
        "div",
        {
          className: SkillHubPanel_default.row,
          "data-leaf": "",
          "data-locked": lockedBy === void 0 ? void 0 : "",
          title: lockedBy === void 0 ? void 0 : t("groups.lockedBy", { name: lockedBy }),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: SkillHubPanel_default.chevronGhost }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: SkillHubPanel_default.cell, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: SkillHubPanel_default.name, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: SkillHubPanel_default.nameText, children: server.name }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Tag, { tone: "quiet", children: t("mcp.tools", { n: server.tools }) }),
              !server.supported ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Tag, { tone: "warning", children: t("mcp.unsupported") }) : null
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: SkillHubPanel_default.actions, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              GateSwitch,
              {
                gate,
                label: t("switch.mcp", { name: server.name, state: gateWord(t, gate) }),
                disabled: !layerReady || busy || lockedBy !== void 0 || !server.supported && server.gate === "on",
                onChange: (on) => {
                  if (lockedBy === void 0) void update([server.name], on);
                }
              }
            ) })
          ]
        },
        server.name
      );
    }) }) : null
  ] });
}

// src/client/SkillHubPanel.tsx
var import_react4 = require("react");
var import_dsh_client_ui_primitives4 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/PluginPanel.tsx
var import_react3 = require("react");
var import_dsh_client_ui_primitives3 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/catalog-api.ts
var BASE = "/skillhub";
async function readJson(response) {
  const text = await response.text();
  const trimmed = text.trimStart().toLowerCase();
  if (trimmed.startsWith("<!doctype") || trimmed.startsWith("<html")) {
    throw new Error("The SkillHub host API is not on this Web session yet. Retry after DSH reloads the SkillHub server plugin.");
  }
  if (!response.ok) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null && "error" in parsed) {
        const error = parsed.error;
        if (typeof error === "string" && error !== "") throw new Error(error);
      }
    } catch (caught) {
      if (caught instanceof Error && caught.message !== text) throw caught;
    }
    throw new Error(text === "" ? `HTTP ${String(response.status)}` : text);
  }
  return JSON.parse(text);
}
async function fetchCatalog(sessionId, folder, layer) {
  const query = new URLSearchParams();
  if (sessionId !== void 0 && sessionId !== "") query.set("sessionId", sessionId);
  if (folder !== void 0 && folder !== "") query.set("folder", folder);
  if (layer !== void 0) query.set("layer", layer);
  const response = await fetch(`${BASE}/catalog?${query.toString()}`);
  return await readJson(response);
}
async function postCatalog(path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await readJson(response);
  if (typeof payload === "object" && payload !== null && "offered" in payload) {
    return payload;
  }
  if (typeof payload === "object" && payload !== null && "catalog" in payload && typeof payload.catalog === "object" && payload.catalog !== null) {
    return payload.catalog;
  }
  throw new Error("SkillHub returned an unexpected response");
}
function bundleQuery(query) {
  const params = new URLSearchParams();
  params.set("layer", query.layer);
  if (query.sessionId !== void 0 && query.sessionId !== "") params.set("sessionId", query.sessionId);
  if (query.folder !== void 0 && query.folder !== "") params.set("folder", query.folder);
  return Object.fromEntries(params);
}
async function fetchMcpCatalog(query) {
  const params = new URLSearchParams(bundleQuery(query));
  const response = await fetch(`${BASE}/mcp/catalog?${params.toString()}`);
  const payload = await readJson(response);
  if (typeof payload !== "object" || payload === null || !Array.isArray(payload.servers)) {
    throw new Error("SkillHub returned an unexpected response");
  }
  return payload;
}
function asBundleCatalog(payload) {
  if (typeof payload === "object" && payload !== null && Array.isArray(payload.plugins)) {
    return payload;
  }
  throw new Error("SkillHub returned an unexpected response");
}
async function fetchBundles(query) {
  const params = new URLSearchParams(bundleQuery(query));
  const response = await fetch(`${BASE}/bundles?${params.toString()}`);
  return asBundleCatalog(await readJson(response));
}
async function postBundleToggle(query, id, on) {
  const response = await fetch(`${BASE}/bundles/toggle`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...bundleQuery(query), id, on })
  });
  return asBundleCatalog(await readJson(response));
}
function asGroupCatalog(payload) {
  if (typeof payload === "object" && payload !== null && Array.isArray(payload.groups)) {
    return payload;
  }
  throw new Error("SkillHub returned an unexpected response");
}
async function fetchGroups(query) {
  const params = new URLSearchParams(bundleQuery(query));
  const response = await fetch(`${BASE}/groups?${params.toString()}`);
  return asGroupCatalog(await readJson(response));
}
async function postGroupToggle(query, name2, on) {
  const response = await fetch(`${BASE}/groups/toggle`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...bundleQuery(query), name: name2, on })
  });
  return asGroupCatalog(await readJson(response));
}
function asMcpCatalog(payload) {
  if (typeof payload === "object" && payload !== null && Array.isArray(payload.servers)) {
    return payload;
  }
  throw new Error("SkillHub returned an unexpected response");
}
async function postMcpToggle(query, server, on) {
  const response = await fetch(`${BASE}/mcp/toggle`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...bundleQuery(query), server, on })
  });
  return asMcpCatalog(await readJson(response));
}

// src/client/slash-refresh.ts
var SKILL_CLIENT = "@deepseek-ai/dsh-client-ui-skill";
var REFRESH_EVENT = "dsh-skillhub:refresh-autocomplete";
function createSlashRefresh(loader) {
  let disposed = false;
  let dirty = false;
  let running;
  const refresh = () => {
    if (disposed) return Promise.reject(new Error("SkillHub autocomplete refresher is disposed"));
    dirty = true;
    if (running) return running;
    running = Promise.resolve().then(async () => {
      while (dirty && !disposed) {
        dirty = false;
        const targets = [...loader.entries()].filter((entry2) => entry2.options.name === SKILL_CLIENT);
        if (targets.length !== 1 || targets[0].disabled || !targets[0].fiber) {
          throw new Error("The official skill autocomplete plugin is not active");
        }
        const entry = targets[0];
        const fiber = entry.fiber;
        await fiber.await();
        if (disposed) return;
        if (![...loader.entries()].includes(entry) || entry.fiber !== fiber || entry.disabled) {
          dirty = true;
          continue;
        }
        if (fiber.state !== 2) throw new Error("The official skill autocomplete plugin is not active");
        await fiber.restart();
      }
    }).finally(() => {
      running = void 0;
    });
    return running;
  };
  return { refresh, dispose: () => {
    disposed = true;
    dirty = false;
  } };
}
async function refreshSkillAutocomplete() {
  const pending = [];
  window.dispatchEvent(new CustomEvent(REFRESH_EVENT, {
    detail: { waitUntil: (promise) => {
      pending.push(promise);
    } }
  }));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(REFRESH_EVENT);
    channel.postMessage("refresh");
    channel.close();
  }
  if (pending.length !== 1) throw new Error("SkillHub autocomplete refresher is unavailable");
  await Promise.all(pending);
}
function connectSlashRefresh(loader, report) {
  const refresher = createSlashRefresh(loader);
  const changed = (event) => {
    const request = event.detail;
    request.waitUntil(refresher.refresh());
  };
  const channel = typeof BroadcastChannel === "undefined" ? void 0 : new BroadcastChannel(REFRESH_EVENT);
  if (channel) channel.onmessage = () => {
    void refresher.refresh().catch(report);
  };
  window.addEventListener(REFRESH_EVENT, changed);
  void refresher.refresh().catch(report);
  return () => {
    window.removeEventListener(REFRESH_EVENT, changed);
    channel?.close();
    refresher.dispose();
  };
}

// src/client/PluginPanel.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function PluginPanel(props) {
  const { t, layer, sessionId, folder, layerReady } = props;
  const [catalog, setCatalog] = (0, import_react3.useState)();
  const [error, setError] = (0, import_react3.useState)();
  const [busy, setBusy] = (0, import_react3.useState)(false);
  const [refreshing, setRefreshing] = (0, import_react3.useState)(false);
  const [expanded, setExpanded] = (0, import_react3.useState)({});
  const pending = (0, import_react3.useRef)(false);
  const generation = (0, import_react3.useRef)(0);
  const inFlight = (0, import_react3.useRef)(0);
  const onCountRef = (0, import_react3.useRef)(props.onPluginCountChange);
  onCountRef.current = props.onPluginCountChange;
  const key = JSON.stringify([layer, sessionId, folder]);
  const activeKey = (0, import_react3.useRef)(key);
  activeKey.current = key;
  const load = (0, import_react3.useCallback)(async () => {
    const current = ++generation.current;
    inFlight.current += 1;
    setRefreshing(true);
    try {
      const next = await fetchBundles({ layer, ...sessionId ? { sessionId } : {}, ...folder ? { folder } : {} });
      if (key === activeKey.current && current === generation.current) {
        setCatalog(next);
        setError(void 0);
      }
    } catch (caught) {
      if (key === activeKey.current && current === generation.current) setError(String(caught));
    } finally {
      inFlight.current -= 1;
      if (inFlight.current === 0) setRefreshing(false);
    }
  }, [key, layer, sessionId, folder]);
  (0, import_react3.useEffect)(() => {
    setError(void 0);
    void load();
  }, [load]);
  useCatalogRefresh(load);
  (0, import_react3.useEffect)(() => {
    if (catalog !== void 0) onCountRef.current?.(catalog.plugins.length);
  }, [catalog]);
  const update = async (id, on) => {
    if (pending.current || !layerReady) return;
    pending.current = true;
    ++generation.current;
    setBusy(true);
    setError(void 0);
    try {
      const next = await postBundleToggle(
        { layer, ...sessionId ? { sessionId } : {}, ...folder ? { folder } : {} },
        id,
        on
      );
      if (key === activeKey.current) setCatalog(next);
      notifyCatalogChanged(layer);
      try {
        await refreshSkillAutocomplete();
      } catch (caught) {
        console.warn("[skillhub] Saved plugin gate but autocomplete refresh failed:", caught);
      }
    } catch (caught) {
      if (key === activeKey.current) setError(String(caught));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const toggleOpen = (name2) => setExpanded((current) => ({ ...current, [name2]: !(current[name2] ?? false) }));
  const disabled = !layerReady || busy;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SkillHubPanel_default.pluginBody, "data-ud-check": "skillhub-plugins-body", "aria-busy": busy || refreshing, children: [
    error !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SkillHubPanel_default.bannerRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: SkillHubPanel_default.error, role: "alert", children: t("error.load", { error }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.Button, { variant: "outline", size: "sm", onClick: () => void load(), children: t("error.retry") })
    ] }) : null,
    catalog === void 0 && error === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SkillHubPanel_default.skeleton, "aria-label": t("loading"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SkillHubPanel_default.skel }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SkillHubPanel_default.skel }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SkillHubPanel_default.skel })
    ] }) : null,
    catalog !== void 0 && catalog.plugins.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SkillHubPanel_default.emptyCard, "data-ud-check": "skillhub-plugins-empty", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SkillHubPanel_default.emptyIcon, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.IconPluginPinwheelOutlineRegular, { size: 28 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: SkillHubPanel_default.emptyTitle, children: t("plugins.empty.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: SkillHubPanel_default.emptyDesc, children: t("plugins.empty.desc") })
    ] }) : null,
    catalog !== void 0 && catalog.plugins.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SkillHubPanel_default.pluginList, children: catalog.plugins.map((plugin) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      PluginRow,
      {
        plugin,
        t,
        open: expanded[plugin.name] ?? false,
        disabled,
        onOpen: () => toggleOpen(plugin.name),
        onToggle: (id, on) => void update(id, on)
      },
      plugin.name
    )) }) : null
  ] });
}
function PluginRow(props) {
  const { plugin, t, open, disabled } = props;
  const locked = plugin.gate === "off";
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SkillHubPanel_default.plugin, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SkillHubPanel_default.row, style: { "--depth": "0" }, "data-folder": "", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          type: "button",
          className: SkillHubPanel_default.chevron,
          "aria-expanded": open,
          "aria-label": t(open ? "collapse" : "expand", { name: plugin.name }),
          onClick: props.onOpen,
          children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.IconChevronRightOutlineRegular, { size: 14 })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SkillHubPanel_default.cell, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: SkillHubPanel_default.nameBtn, title: plugin.root, onClick: props.onOpen, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: SkillHubPanel_default.name, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: SkillHubPanel_default.nameText, children: plugin.name }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.Tag, { tone: "quiet", children: skillCountLabel(t, plugin.skills.length) })
      ] }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SkillHubPanel_default.actions, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        GateSwitch,
        {
          gate: plugin.gate,
          label: t("switch.plugin", { name: plugin.name, state: gateWord(t, plugin.gate) }),
          disabled,
          onChange: (on) => props.onToggle(`plugin:${plugin.name}`, on)
        }
      ) })
    ] }),
    open ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      locked ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: SkillHubPanel_default.lockedHint, children: t("plugins.locked") }) : null,
      plugin.skills.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        PluginSkillRow,
        {
          skill,
          t,
          disabled,
          onToggle: (on) => props.onToggle(skill.id, on)
        },
        skill.id
      ))
    ] }) : null
  ] });
}
function PluginSkillRow(props) {
  const { skill, t } = props;
  const inert = props.disabled || skill.locked;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      className: SkillHubPanel_default.row,
      "data-leaf": "",
      "data-locked": skill.locked ? "" : void 0,
      style: { "--depth": "1" },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: SkillHubPanel_default.chevronGhost }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SkillHubPanel_default.cell, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SkillHubPanel_default.name, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: SkillHubPanel_default.nameText, children: skill.name }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SkillHubPanel_default.actions, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          GateSwitch,
          {
            gate: skill.effective,
            label: t("switch.skill", { name: skill.name, state: gateWord(t, skill.effective) }),
            disabled: inert,
            onChange: (on) => {
              if (!skill.locked) props.onToggle(on);
            }
          }
        ) })
      ]
    }
  );
}

// src/client/SkillHubPanel.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function layerLabel(t, layer) {
  return t(layer === "session" ? "layer.session" : layer === "project" ? "layer.project" : "layer.global");
}
function gateWord(t, gate) {
  return t(gate === "on" ? "gate.on" : gate === "off" ? "gate.off" : "gate.mixed");
}
var CHANGED_EVENT = "dsh-skillhub:changed";
function notifyCatalogChanged(layer) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT, { detail: layer }));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(CHANGED_EVENT);
    channel.postMessage(layer);
    channel.close();
  }
}
function useCatalogRefresh(reload) {
  const latest = (0, import_react4.useRef)(reload);
  latest.current = reload;
  (0, import_react4.useEffect)(() => {
    let cleanup;
    const changed = () => {
      cleanup?.();
      const next = latest.current();
      cleanup = typeof next === "function" ? next : void 0;
    };
    const visible = () => {
      if (document.visibilityState === "visible") changed();
    };
    const channel = typeof BroadcastChannel === "undefined" ? void 0 : new BroadcastChannel(CHANGED_EVENT);
    if (channel) channel.onmessage = changed;
    window.addEventListener(CHANGED_EVENT, changed);
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    return () => {
      channel?.close();
      window.removeEventListener(CHANGED_EVENT, changed);
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
      cleanup?.();
    };
  }, []);
}
function brokenCopy(t, reason) {
  if (reason.kind === "missing-symlink-target") return reason.target === void 0 ? t("broken.missing") : t("broken.missingNamed", { target: reason.target });
  if (reason.kind === "empty-pack") return t("broken.empty");
  if (reason.kind === "invalid-name") return t("broken.name");
  if (reason.kind === "unreadable-skill") return t("broken.unreadable");
  if (reason.kind === "invalid-frontmatter") return t("broken.frontmatter");
  if (reason.kind === "symlink-cycle") return t("broken.cycle");
  return reason.kind;
}
function homeLabel(t, home) {
  return t(home === "agent" ? "home.agent" : "home.dsh");
}
function collectSkills(nodes) {
  return nodes.flatMap((node) => {
    if (node.kind === "broken") return [];
    if (node.kind === "root-skill") return [node];
    return [...node.skill ? [node.skill] : [], ...collectSkills(node.children)];
  });
}
function collectSkillIds(nodes) {
  return collectSkills(nodes).map((skill) => skill.id);
}
function countSkills(nodes, locked) {
  const skills = collectSkills(nodes);
  const on = skills.filter((skill) => skill.gate === "on" && !(locked?.has(skill.id) ?? false)).length;
  return { on, off: skills.length - on };
}
function gateFromCounts(counts) {
  return counts.on > 0 && counts.off > 0 ? "mixed" : counts.on > 0 ? "on" : "off";
}
function skillCountLabel(t, total) {
  return t(total === 1 ? "count.skillsOne" : "count.skills", { n: total });
}
function folderChildren(node) {
  if (node.kind === "broken" || node.kind === "root-skill") return [];
  return node.children.filter((child) => child.kind === "broken" || collectSkillIds([child]).length > 0);
}
function soleSkill(node) {
  if (node.kind === "broken") return null;
  if (node.kind === "root-skill") return node;
  return node.skill !== null && folderChildren(node).length === 0 ? node.skill : null;
}
function packPrefix(name2) {
  const split = name2.indexOf("-");
  return split < 2 ? void 0 : name2.slice(0, split);
}
function clusterFlatPacks(nodes, locked) {
  const existing = new Set(nodes.map((node) => node.name));
  const counts = /* @__PURE__ */ new Map();
  for (const node of nodes) {
    if (node.kind !== "pack" && node.kind !== "broken") continue;
    const prefix = packPrefix(node.name);
    if (prefix !== void 0 && !existing.has(prefix)) counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
  }
  const buckets = /* @__PURE__ */ new Map();
  const out = [];
  for (const node of nodes) {
    const prefix = packPrefix(node.name);
    if (node.kind !== "pack" && node.kind !== "broken" || prefix === void 0 || (counts.get(prefix) ?? 0) < 3) {
      out.push(node);
      continue;
    }
    const list = buckets.get(prefix);
    if (list) list.push(node);
    else {
      buckets.set(prefix, [node]);
      out.push({ kind: "cluster", prefix });
    }
  }
  const result = [];
  for (const node of out) {
    if (node.kind !== "cluster") {
      result.push(node);
      continue;
    }
    const members = buckets.get(node.prefix);
    const first = members?.[0];
    if (!members || !first) continue;
    const children = members.map((member) => {
      const name2 = member.name.slice(node.prefix.length + 1);
      if (member.kind === "broken") return { ...member, name: name2 };
      return {
        kind: "group",
        name: name2,
        rel: member.name,
        home: member.home,
        path: member.path,
        gate: member.gate,
        skill: member.skill,
        children: member.children
      };
    });
    result.push({
      kind: "pack",
      id: `${first.home}:${node.prefix}`,
      name: node.prefix,
      home: first.home,
      path: first.path,
      link: { kind: "directory" },
      gate: gateFromCounts(countSkills(members, locked)),
      skill: null,
      children
    });
  }
  return result;
}
function nodeMatches(node, needle) {
  const text = node.kind === "broken" ? `${node.name} ${node.reason.kind}` : node.kind === "root-skill" ? `${node.name} ${node.description ?? ""}` : `${node.name} ${node.skill?.name ?? ""} ${node.skill?.description ?? ""}`;
  return text.toLowerCase().includes(needle) || node.kind !== "broken" && node.kind !== "root-skill" && node.children.some((child) => nodeMatches(child, needle));
}
function GateSwitch(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "button",
    {
      type: "button",
      className: SkillHubPanel_default.switch,
      role: "switch",
      "aria-checked": props.gate === "mixed" ? "mixed" : props.gate === "on",
      "aria-label": props.label,
      "data-state": props.gate,
      disabled: props.disabled,
      onClick: () => props.onChange(props.gate !== "on"),
      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: SkillHubPanel_default.thumb })
    }
  );
}
function SkillLeaf(props) {
  const { skill, t } = props;
  const locked = props.lockedBy !== void 0;
  const [copied, setCopied] = (0, import_react4.useState)(false);
  const copySlash = () => {
    void (0, import_dsh_client_ui_primitives4.writeClipboard)(`/${skill.name} `).then((ok) => {
      if (ok) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }
    });
  };
  const name2 = /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: SkillHubPanel_default.nameText, children: props.label });
  const lockedBy = props.lockedBy;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "div",
    {
      className: SkillHubPanel_default.row,
      "data-leaf": "",
      "data-locked": lockedBy === void 0 ? void 0 : "",
      title: lockedBy === void 0 ? void 0 : t("groups.lockedBy", { name: lockedBy }),
      style: { "--depth": String(props.depth) },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: SkillHubPanel_default.chevronGhost }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SkillHubPanel_default.cell, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SkillHubPanel_default.name, children: [
          skill.description ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.Tooltip, { label: skill.description, side: "top", maxWidth: 320, children: name2 }) : name2,
          skill.collision ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.Tag, { tone: "warning", children: t("badge.collision") }) : null
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SkillHubPanel_default.actions, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.Tooltip, { label: copied ? t("copy.done") : t("copy.slash", { name: skill.name }), side: "top", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
            "button",
            {
              type: "button",
              className: SkillHubPanel_default.slash,
              "aria-label": t("copy.slash", { name: skill.name }),
              "data-copied": copied ? "" : void 0,
              onClick: copySlash,
              children: [
                "/",
                skill.name
              ]
            }
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            GateSwitch,
            {
              gate: locked ? "off" : skill.gate,
              label: t("switch.skill", { name: props.label, state: gateWord(t, locked ? "off" : skill.gate) }),
              disabled: props.disabled || locked,
              onChange: (on) => {
                if (!locked) props.onToggle([skill.id], on);
              }
            }
          )
        ] })
      ]
    }
  );
}
function SkillHubPanel(props) {
  const { sessionId, t } = props;
  const folder = props.folder ?? "";
  const [layer, setLayer] = (0, import_react4.useState)(props.defaultLayer);
  const [catalog, setCatalog] = (0, import_react4.useState)();
  const [error, setError] = (0, import_react4.useState)();
  const [groups, setGroups] = (0, import_react4.useState)();
  const [groupsError, setGroupsError] = (0, import_react4.useState)();
  const [query, setQuery] = (0, import_react4.useState)("");
  const [busy, setBusy] = (0, import_react4.useState)(false);
  const [refreshing, setRefreshing] = (0, import_react4.useState)(false);
  const [expanded, setExpanded] = (0, import_react4.useState)({});
  const [notice, setNotice] = (0, import_react4.useState)();
  const [tab, setTab] = (0, import_react4.useState)("skills");
  const [mcpServerCount, setMcpServerCount] = (0, import_react4.useState)();
  const [pluginCount, setPluginCount] = (0, import_react4.useState)();
  const [mcpBulk, setMcpBulk] = (0, import_react4.useState)();
  const [moreOpen, setMoreOpen] = (0, import_react4.useState)(false);
  const pending = (0, import_react4.useRef)(false);
  const generation = (0, import_react4.useRef)(0);
  const groupGeneration = (0, import_react4.useRef)(0);
  const inFlight = (0, import_react4.useRef)(0);
  const noticeSeq = (0, import_react4.useRef)(0);
  const key = JSON.stringify([layer, folder, sessionId]);
  const activeKey = (0, import_react4.useRef)(key);
  activeKey.current = key;
  const canWriteSession = !!sessionId;
  const canWriteProject = folder !== "";
  const layerReady = layer === "global" || layer === "session" && canWriteSession || layer === "project" && canWriteProject;
  const load = (0, import_react4.useCallback)(async () => {
    const current = ++generation.current;
    inFlight.current += 1;
    setRefreshing(true);
    try {
      const query2 = { layer, ...sessionId ? { sessionId } : {}, ...folder ? { folder } : {} };
      const [catalogRead, groupsRead, mcpRead, bundlesRead] = await Promise.allSettled([
        fetchCatalog(sessionId, folder === "" ? void 0 : folder, layer),
        fetchGroups(query2),
        // Tab badges must be right before the tab is opened: the child panels
        // only report a count once they mount, which left 插件 and MCP blank.
        fetchMcpCatalog(query2),
        fetchBundles(query2)
      ]);
      if (key !== activeKey.current || current !== generation.current) return;
      if (catalogRead.status === "fulfilled") {
        setCatalog(catalogRead.value);
        setError(void 0);
      } else setError(String(catalogRead.reason));
      if (groupsRead.status === "fulfilled") {
        setGroups(groupsRead.value);
        setGroupsError(void 0);
      } else setGroupsError(String(groupsRead.reason));
      if (mcpRead.status === "fulfilled") setMcpServerCount(mcpRead.value.servers.length);
      if (bundlesRead.status === "fulfilled") setPluginCount(bundlesRead.value.plugins.length);
    } finally {
      inFlight.current -= 1;
      if (inFlight.current === 0) setRefreshing(false);
    }
  }, [key, sessionId, folder, layer]);
  const loadGroups = (0, import_react4.useCallback)(async () => {
    const current = ++groupGeneration.current;
    try {
      const next = await fetchGroups({ layer, ...sessionId ? { sessionId } : {}, ...folder ? { folder } : {} });
      if (key === activeKey.current && current === groupGeneration.current) {
        setGroups(next);
        setGroupsError(void 0);
      }
    } catch (caught) {
      if (key === activeKey.current && current === groupGeneration.current) setGroupsError(String(caught));
    }
  }, [key, sessionId, folder, layer]);
  (0, import_react4.useEffect)(() => {
    setError(void 0);
    setGroupsError(void 0);
    void load();
  }, [load]);
  (0, import_react4.useEffect)(() => {
    if (tab === "groups") void loadGroups();
  }, [tab, loadGroups]);
  useCatalogRefresh(load);
  const mutate = async (target, on) => {
    if (pending.current || !layerReady) return;
    pending.current = true;
    ++generation.current;
    setBusy(true);
    setError(void 0);
    try {
      const next = await postCatalog("/toggle", { layer, ...target, ...sessionId ? { sessionId } : {}, ...folder ? { folder } : {} });
      if (key === activeKey.current) {
        setCatalog(next);
      }
      notifyCatalogChanged(layer);
      let refreshed = true;
      try {
        await refreshSkillAutocomplete();
      } catch (caught) {
        refreshed = false;
        console.warn("[skillhub] Saved skills but autocomplete refresh failed:", caught);
      }
      if (key === activeKey.current) {
        noticeSeq.current += 1;
        setNotice({ key: refreshed ? on ? "refresh.hintOn" : "refresh.hintOff" : "refresh.partial", seq: noticeSeq.current });
      }
    } catch (caught) {
      if (key === activeKey.current) setError(String(caught));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const toggleIds = (ids, on) => {
    if (ids.length) void mutate({ kind: "ids", ids, on }, on);
  };
  const toggleGroup = async (name2, on) => {
    if (pending.current || !layerReady) return;
    pending.current = true;
    ++generation.current;
    setBusy(true);
    setError(void 0);
    setGroupsError(void 0);
    try {
      const next = await postGroupToggle({ layer, ...sessionId ? { sessionId } : {}, ...folder ? { folder } : {} }, name2, on);
      if (key === activeKey.current) setGroups(next);
      notifyCatalogChanged(layer);
      try {
        await refreshSkillAutocomplete();
      } catch (caught) {
        console.warn("[skillhub] Saved group gate but autocomplete refresh failed:", caught);
      }
    } catch (caught) {
      if (key === activeKey.current) setGroupsError(String(caught));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const toggleServer = async (server, on) => {
    if (pending.current || !layerReady) return;
    pending.current = true;
    ++generation.current;
    setBusy(true);
    setError(void 0);
    setGroupsError(void 0);
    try {
      await postMcpToggle({ layer, ...sessionId ? { sessionId } : {}, ...folder ? { folder } : {} }, server, on);
      notifyCatalogChanged(layer);
    } catch (caught) {
      if (key === activeKey.current) setGroupsError(String(caught));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const needle = query.trim().toLowerCase();
  const counts = (0, import_react4.useMemo)(() => catalog ? countSkills(catalog.tree.flatMap((home) => home.children)) : { on: 0, off: 0 }, [catalog]);
  const allSkillCount = counts.on + counts.off;
  const lockedSkills = (0, import_react4.useMemo)(() => {
    const map = /* @__PURE__ */ new Map();
    for (const group of groups?.groups ?? []) {
      for (const skill of group.skills) if (skill.locked) map.set(skill.id, group.name);
    }
    return map;
  }, [groups]);
  const lockedServers = (0, import_react4.useMemo)(() => {
    const map = /* @__PURE__ */ new Map();
    for (const group of groups?.groups ?? []) {
      for (const server of group.servers) if (server.locked) map.set(server.name, group.name);
    }
    return map;
  }, [groups]);
  const groupCount = groups?.groups.length ?? 0;
  const writableSkillIds = (0, import_react4.useMemo)(
    () => (catalog?.tree ?? []).flatMap((home) => collectSkillIds(home.children)).filter((id) => !lockedSkills.has(id)),
    [catalog, lockedSkills]
  );
  const canBulk = layerReady && !busy && writableSkillIds.length > 0;
  const moreDisabled = tab === "mcp" ? mcpBulk === void 0 || mcpBulk.disabled : tab === "plugins" ? true : tab === "groups" ? true : !canBulk;
  const moreItems = [
    { id: "allOn", label: t("allOn"), disabled: moreDisabled },
    { id: "allOff", label: t("allOff"), disabled: moreDisabled },
    ...tab !== "mcp" ? [{ id: "refreshSlash", label: t("refresh.slash"), disabled: busy }] : []
  ];
  const refreshSlash = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    let refreshed = true;
    try {
      await refreshSkillAutocomplete();
    } catch (caught) {
      refreshed = false;
      console.warn("[skillhub] Autocomplete refresh failed:", caught);
    } finally {
      pending.current = false;
      setBusy(false);
    }
    if (key === activeKey.current) {
      noticeSeq.current += 1;
      setNotice({ key: refreshed ? "refresh.done" : "refresh.failed", seq: noticeSeq.current });
    }
  };
  const onMoreSelect = (id) => {
    setMoreOpen(false);
    if (id === "refreshSlash") {
      void refreshSlash();
      return;
    }
    if (id !== "allOn" && id !== "allOff") return;
    if (tab === "mcp") {
      if (id === "allOn") mcpBulk?.allOn();
      else mcpBulk?.allOff();
      return;
    }
    if (writableSkillIds.length === 0) return;
    void mutate({ kind: "ids", ids: writableSkillIds, on: id === "allOn" }, id === "allOn");
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SkillHubPanel_default.root, "data-surface": props.surface, "data-skillhub-panel": "", "aria-busy": busy || refreshing, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SkillHubPanel_default.toolbar, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SkillHubPanel_default.tabs, role: "tablist", "aria-label": t("tab.aria"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_dsh_client_ui_primitives4.Pill, { role: "tab", "aria-selected": tab === "skills", active: tab === "skills", onClick: () => setTab("skills"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.IconSkillOutlineRegular, { size: 13 }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: t("tab.skills") }),
          allSkillCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: SkillHubPanel_default.pillCount, children: allSkillCount }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_dsh_client_ui_primitives4.Pill, { role: "tab", "aria-selected": tab === "mcp", active: tab === "mcp", onClick: () => setTab("mcp"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.IconCordisPluginOutlineRegular, { size: 13 }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: t("tab.mcp") }),
          mcpServerCount !== void 0 && mcpServerCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: SkillHubPanel_default.pillCount, children: mcpServerCount }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_dsh_client_ui_primitives4.Pill, { role: "tab", "aria-selected": tab === "plugins", active: tab === "plugins", onClick: () => setTab("plugins"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.IconPluginPinwheelOutlineRegular, { size: 13 }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: t("tab.plugins") }),
          pluginCount !== void 0 && pluginCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: SkillHubPanel_default.pillCount, children: pluginCount }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_dsh_client_ui_primitives4.Pill, { role: "tab", "aria-selected": tab === "groups", active: tab === "groups", onClick: () => setTab("groups"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.IconWorkspaceTreeOutlineRegular, { size: 13 }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: t("tab.groups") }),
          groupCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: SkillHubPanel_default.pillCount, children: groupCount }) : null
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SkillHubPanel_default.toolbarEnd, children: [
        props.layers.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SkillHubPanel_default.segment, role: "radiogroup", "aria-label": t("layer.aria"), children: props.layers.map((name2) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            type: "button",
            role: "radio",
            "aria-checked": layer === name2,
            "data-active": layer === name2 ? "" : void 0,
            disabled: busy || name2 === "session" && !canWriteSession || name2 === "project" && !canWriteProject,
            onClick: () => setLayer(name2),
            children: layerLabel(t, name2)
          },
          name2
        )) }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          import_dsh_client_ui_primitives4.Menu,
          {
            open: moreOpen,
            onClose: () => setMoreOpen(false),
            onSelect: onMoreSelect,
            items: moreItems,
            align: "end",
            compact: true,
            portal: true,
            anchor: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              import_dsh_client_ui_primitives4.Button,
              {
                variant: "ghost",
                size: "sm",
                icon: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.IconEllipsisOutlineRegular, { size: 16 }),
                "aria-label": t("more"),
                title: t("more"),
                onClick: () => setMoreOpen((value) => !value)
              }
            )
          }
        )
      ] })
    ] }),
    tab === "mcp" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      McpPanel,
      {
        surface: props.surface,
        layer,
        sessionId,
        folder,
        canWriteSession,
        canWriteProject,
        layerReady,
        lockedServers,
        onServerCountChange: setMcpServerCount,
        onBulkActions: setMcpBulk,
        t
      }
    ) : tab === "plugins" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      PluginPanel,
      {
        layer,
        sessionId,
        folder,
        layerReady,
        onPluginCountChange: setPluginCount,
        t
      }
    ) : tab === "groups" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      GroupPanel,
      {
        layerReady,
        catalog: groups,
        error: groupsError,
        catalogError: error,
        busy,
        refreshing,
        onRetry: () => void load(),
        onToggleGroup: (name2, on) => void toggleGroup(name2, on),
        onToggleSkill: (id, on) => toggleIds([id], on),
        onToggleServer: (name2, on) => void toggleServer(name2, on),
        t
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { className: SkillHubPanel_default.search, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        import_dsh_client_ui_primitives4.Input,
        {
          className: SkillHubPanel_default.field ?? "",
          icon: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.IconSearchOutlineRegular, { size: 16 }),
          value: query,
          placeholder: t("search.placeholder"),
          "aria-label": t("search.placeholder"),
          onChange: (event) => setQuery(event.currentTarget.value)
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SkillHubPanel_default.body, "data-ud-check": "skillhub-tree", "data-ud-role": "panel", children: [
        error !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SkillHubPanel_default.bannerRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: SkillHubPanel_default.error, role: "alert", children: t("error.load", { error }) }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.Button, { variant: "outline", size: "sm", onClick: () => void load(), children: t("error.retry") })
        ] }) : null,
        catalog && catalog.collisions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: SkillHubPanel_default.warn, role: "status", children: [
          t("collision.warn"),
          " ",
          catalog.collisions.map((row) => row.name).join(", ")
        ] }) : null,
        catalog === void 0 && error === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SkillHubPanel_default.skeleton, "aria-label": t("loading"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SkillHubPanel_default.skel }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SkillHubPanel_default.skel }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SkillHubPanel_default.skel })
        ] }) : null,
        catalog !== void 0 && allSkillCount === 0 && needle === "" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SkillHubPanel_default.emptyCard, "data-ud-check": "skillhub-skills-empty", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SkillHubPanel_default.emptyIcon, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.IconSkillOutlineRegular, { size: 28 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h4", { className: SkillHubPanel_default.emptyTitle, children: t("skills.empty.title") }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: SkillHubPanel_default.emptyDesc, children: t("skills.empty.desc") })
        ] }) : null,
        catalog !== void 0 && (allSkillCount > 0 || needle !== "") ? catalog.tree.map((home) => {
          const children = clusterFlatPacks(home.children, lockedSkills).filter((node) => needle === "" || nodeMatches(node, needle));
          const hideHomeChrome = props.surface === "popover" && catalog.tree.filter((row) => row.children.length > 0).length <= 1;
          const homeKey = `home:${home.home}`;
          const homeOpen = hideHomeChrome || needle !== "" || (expanded[homeKey] ?? true);
          const homeCounts = countSkills(home.children, lockedSkills);
          const homeIds = collectSkillIds(home.children);
          const writableHomeIds = homeIds.filter((id) => !lockedSkills.has(id));
          const homeLocked = homeIds.length > 0 && writableHomeIds.length === 0;
          const label = homeLabel(t, home.home);
          const toggleOpen = () => setExpanded((current) => ({ ...current, [homeKey]: !(current[homeKey] ?? true) }));
          const tree = children.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: SkillHubPanel_default.empty, children: t(needle === "" ? "empty.home" : "empty.search") }) : children.map((node) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            TreeNode,
            {
              node,
              depth: hideHomeChrome ? 0 : 1,
              needle,
              expanded,
              setExpanded,
              disabled: !layerReady || busy,
              lockedSkills,
              t,
              onToggle: toggleIds
            },
            node.kind === "root-skill" ? node.id : node.path
          ));
          return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: SkillHubPanel_default.home, "aria-label": label, children: [
            !hideHomeChrome ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
              "div",
              {
                className: SkillHubPanel_default.row,
                style: { "--depth": "0" },
                "data-folder": "",
                "data-locked": homeLocked ? "" : void 0,
                title: homeLocked ? t("groups.locked") : void 0,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                    "button",
                    {
                      type: "button",
                      className: SkillHubPanel_default.chevron,
                      "aria-expanded": homeOpen,
                      "aria-label": t(homeOpen ? "collapse" : "expand", { name: label }),
                      onClick: toggleOpen,
                      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.IconChevronRightOutlineRegular, { size: 14 })
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SkillHubPanel_default.cell, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: SkillHubPanel_default.nameBtn, title: home.path, onClick: toggleOpen, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: SkillHubPanel_default.name, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: SkillHubPanel_default.nameText, children: label }),
                    homeIds.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.Tag, { tone: "quiet", children: skillCountLabel(t, homeIds.length) }) : null
                  ] }) }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SkillHubPanel_default.actions, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                    GateSwitch,
                    {
                      gate: gateFromCounts(homeCounts),
                      label: t("switch.folder", { name: label, state: gateWord(t, gateFromCounts(homeCounts)) }),
                      disabled: !layerReady || busy || writableHomeIds.length === 0,
                      onChange: (on) => toggleIds(writableHomeIds, on)
                    }
                  ) })
                ]
              }
            ) : null,
            homeOpen ? tree : null
          ] }, home.home);
        }) : null
      ] }),
      notice ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.Toast, { text: t(notice.key), onDone: () => setNotice((current) => current?.seq === notice.seq ? void 0 : current) }, notice.seq) : null
    ] })
  ] });
}
function TreeNode(props) {
  const { node, t } = props;
  const style = { "--depth": String(props.depth) };
  if (node.kind === "broken") return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SkillHubPanel_default.row, "data-broken": "", style, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: SkillHubPanel_default.chevronGhost }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SkillHubPanel_default.cell, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SkillHubPanel_default.name, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.IconWarningOutlineRegular, { size: 14 }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: SkillHubPanel_default.nameText, children: node.name }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.Tag, { tone: "danger", children: brokenCopy(t, node.reason) })
    ] }) })
  ] });
  const leaf = soleSkill(node);
  if (leaf) return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    SkillLeaf,
    {
      depth: props.depth,
      skill: leaf,
      label: node.name,
      disabled: props.disabled,
      lockedBy: props.lockedSkills.get(leaf.id),
      t,
      onToggle: props.onToggle
    }
  );
  if (node.kind === "root-skill") return null;
  const children = folderChildren(node);
  const ids = collectSkillIds([node]);
  const writableIds = ids.filter((id) => !props.lockedSkills.has(id));
  const gate = gateFromCounts(countSkills([node], props.lockedSkills));
  const allLocked = ids.length > 0 && writableIds.length === 0;
  const key = node.path;
  const open = props.needle !== "" || (props.expanded[key] ?? false);
  const toggleOpen = () => props.setExpanded((current) => ({ ...current, [key]: !(current[key] ?? false) }));
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "div",
      {
        className: SkillHubPanel_default.row,
        style,
        "data-folder": children.length ? "" : void 0,
        "data-locked": allLocked ? "" : void 0,
        title: allLocked ? t("groups.locked") : void 0,
        children: [
          children.length ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "button",
            {
              type: "button",
              className: SkillHubPanel_default.chevron,
              "aria-expanded": open,
              "aria-label": t(open ? "collapse" : "expand", { name: node.name }),
              onClick: toggleOpen,
              children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.IconChevronRightOutlineRegular, { size: 14 })
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: SkillHubPanel_default.chevronGhost }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SkillHubPanel_default.cell, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: SkillHubPanel_default.nameBtn, onClick: toggleOpen, disabled: !children.length, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: SkillHubPanel_default.name, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: SkillHubPanel_default.nameText, children: node.name }),
            ids.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.Tag, { tone: "quiet", children: skillCountLabel(t, ids.length) }) : null
          ] }) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SkillHubPanel_default.actions, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            GateSwitch,
            {
              gate,
              label: t("switch.folder", { name: node.name, state: gateWord(t, gate) }),
              disabled: props.disabled || writableIds.length === 0,
              onChange: (on) => props.onToggle(writableIds, on)
            }
          ) })
        ]
      }
    ),
    open ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
      node.skill && children.length ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        SkillLeaf,
        {
          depth: props.depth + 1,
          skill: node.skill,
          label: node.skill.name,
          disabled: props.disabled,
          lockedBy: props.lockedSkills.get(node.skill.id),
          t,
          onToggle: props.onToggle
        }
      ) : null,
      children.filter((child) => props.needle === "" || nodeMatches(child, props.needle)).map((child) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TreeNode, { ...props, node: child, depth: props.depth + 1 }, child.path))
    ] }) : null
  ] });
}

// src/client/locales.ts
var zh = {
  "nav": "skill&mcp",
  "chip": "技能",
  "chip.aria": "技能",
  "tab.skills": "技能",
  "tab.mcp": "MCP",
  "tab.plugins": "插件",
  "tab.groups": "组合",
  "groups.kind.capability": "技能 + MCP",
  "groups.kind.family": "技能家族",
  "groups.mcpCount": "{n} 个 MCP",
  "groups.locked": "由组合关闭",
  "groups.lockedBy": "由组合 {name} 关闭",
  "groups.empty.title": "没有可组合的技能",
  "groups.empty.desc": "组合 = 同名技能与 MCP（如 abaqus 技能 + abaqus 工具），或以某技能为前缀的技能家族（如 ponytail、ponytail-audit）。",
  "switch.group": "组合 {name}，{state}",
  "tab.aria": "分类切换",
  "more": "更多操作",
  "allOff": "全部关闭",
  "allOn": "全部开启",
  "count.skills": "{n} 个技能",
  "count.skillsOne": "{n} 个技能",
  "mcp.tools": "{n} 个工具",
  "layer.aria": "作用范围",
  "layer.session": "本对话",
  "layer.project": "本项目",
  "layer.global": "全局",
  "session.needsChat": "请先打开一个对话",
  "project.needsWorkspace": "请先打开一个工作区",
  "copy.slash": "复制 /{name}",
  "copy.done": "已复制",
  "refresh.hint": "已保存，后续请求使用新设置",
  "refresh.hintOn": "已开启，/ 补全已重新加载；下一次模型请求使用新设置",
  "refresh.hintOff": "已关闭，/ 补全已重新加载；本对话已载入的技能内容仍保留",
  "refresh.slash": "刷新 / 补全",
  "refresh.done": "/ 补全已重新加载，无需刷新窗口",
  "refresh.partial": "技能设置已保存，但 / 补全未能刷新。请在更多操作中重试“刷新 / 补全”",
  "refresh.failed": "/ 补全刷新失败，请稍后重试",
  "skills.empty.title": "暂无已安装技能",
  "skills.empty.desc": "将技能放入 ~/.agents/skills 即可在此启用。",
  "mcp.empty.title": "暂无 MCP 服务",
  "mcp.empty.desc": "在环境中配置并启动外部 MCP 后，可在此随时开关工具。",
  "plugins.empty.title": "未发现提供技能的插件",
  "plugins.empty.desc": "附带 skills 目录的插件包安装后，会在这里按插件开关它提供的技能。",
  "plugins.locked": "由上级插件关闭",
  "search.placeholder": "搜索…",
  "error.load": "加载失败：{error}",
  "error.retry": "重试",
  "collision.warn": "存在同名技能：",
  "loading": "正在加载…",
  "home.agent": "Agent 目录",
  "home.dsh": "DSH 目录",
  "empty.home": "暂无技能",
  "empty.search": "无匹配结果",
  "expand": "展开 {name}",
  "collapse": "收起 {name}",
  "switch.folder": "文件夹 {name}，{state}",
  "switch.skill": "技能 {name}，{state}",
  "switch.mcp": "MCP 服务 {name}，{state}",
  "switch.plugin": "插件 {name}，{state}",
  "mcp.unsupported": "不支持动态隐藏",
  "mcp.unavailable": "服务暂未就绪，请稍后重试",
  "badge.collision": "重名",
  "broken.missing": "链接失效",
  "broken.missingNamed": "链接目标不存在：{target}",
  "broken.empty": "目录中未包含 SKILL.md",
  "broken.name": "技能名无效",
  "broken.unreadable": "无法读取文件",
  "broken.frontmatter": "配置格式错误",
  "broken.cycle": "链接回环",
  "gate.on": "开",
  "gate.off": "关",
  "gate.mixed": "部分"
};
var en = {
  "nav": "skill&mcp",
  "chip": "Skills",
  "chip.aria": "Skills",
  "tab.skills": "Skills",
  "tab.mcp": "MCP",
  "tab.plugins": "Plugins",
  "tab.groups": "Groups",
  "groups.kind.capability": "Skill + MCP",
  "groups.kind.family": "Skill family",
  "groups.mcpCount": "{n} MCP",
  "groups.locked": "Disabled by group",
  "groups.lockedBy": "Disabled by group {name}",
  "groups.empty.title": "No Groups to Combine",
  "groups.empty.desc": "A group pairs a skill with the MCP server of the same name (abaqus skill + abaqus tools), or collects the skills that share a base name (ponytail, ponytail-audit).",
  "switch.group": "Group {name}, {state}",
  "tab.aria": "Category switcher",
  "more": "More actions",
  "allOff": "All Off",
  "allOn": "All On",
  "count.skills": "{n} skills",
  "count.skillsOne": "{n} skill",
  "mcp.tools": "{n} tools",
  "layer.aria": "Scope",
  "layer.session": "This Chat",
  "layer.project": "This Project",
  "layer.global": "Global",
  "session.needsChat": "Open a chat first",
  "project.needsWorkspace": "Open a workspace first",
  "copy.slash": "Copy /{name}",
  "copy.done": "Copied",
  "refresh.hint": "Saved. Subsequent requests use the new settings",
  "refresh.hintOn": "Enabled. / autocomplete reloaded; the next model request uses the new settings",
  "refresh.hintOff": "Disabled. / autocomplete reloaded; skill content already loaded in this chat remains",
  "refresh.slash": "Refresh / autocomplete",
  "refresh.done": "/ autocomplete reloaded. No window refresh needed",
  "refresh.partial": "Skill settings saved, but / autocomplete could not refresh. Retry “Refresh / autocomplete” in More actions",
  "refresh.failed": "/ autocomplete could not refresh. Please retry",
  "skills.empty.title": "No Skills Installed",
  "skills.empty.desc": "Place skill directories in ~/.agents/skills to manage them here.",
  "mcp.empty.title": "No MCP Services",
  "mcp.empty.desc": "Connect MCP servers in your environment to manage tools here.",
  "plugins.empty.title": "No Skill Plugins Found",
  "plugins.empty.desc": "Packages that ship a skills directory appear here, with one switch per package.",
  "plugins.locked": "Disabled by parent plugin",
  "search.placeholder": "Search…",
  "error.load": "Load failed: {error}",
  "error.retry": "Retry",
  "collision.warn": "Conflicting skill names:",
  "loading": "Loading…",
  "home.agent": "Agent Directory",
  "home.dsh": "DSH Directory",
  "empty.home": "No skills",
  "empty.search": "No matches",
  "expand": "Expand {name}",
  "collapse": "Collapse {name}",
  "switch.folder": "Folder {name}, {state}",
  "switch.skill": "Skill {name}, {state}",
  "switch.mcp": "MCP service {name}, {state}",
  "switch.plugin": "Plugin {name}, {state}",
  "mcp.unsupported": "Dynamic hide unsupported",
  "mcp.unavailable": "Service unavailable, please retry",
  "badge.collision": "conflict",
  "broken.missing": "Broken link",
  "broken.missingNamed": "Missing target: {target}",
  "broken.empty": "Missing SKILL.md",
  "broken.name": "Invalid name",
  "broken.unreadable": "Unreadable file",
  "broken.frontmatter": "Invalid config",
  "broken.cycle": "Symlink cycle",
  "gate.on": "on",
  "gate.off": "off",
  "gate.mixed": "mixed"
};

// src/client/index.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var name = "dsh-skillhub-client";
var inject = ["slots", "locale", "loader"];
var NS = "skillhub";
var PANEL_GAP = 8;
var PANEL_MARGIN = 12;
var UNPLACED = { visibility: "hidden", left: 0, top: 0 };
var CSS_ANCHORS = typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("position-anchor: --dsh-skillhub-anchor");
function usePanelPlacement(open, triggerRef, panelRef) {
  const [fallback, setFallback] = (0, import_react5.useState)(CSS_ANCHORS ? void 0 : UNPLACED);
  const measuring = (0, import_react5.useRef)(!CSS_ANCHORS);
  (0, import_react5.useEffect)(() => {
    if (!open) return;
    let frame = 0;
    const measure = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (trigger === null || panel === null) return;
      const rect = trigger.getBoundingClientRect();
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const below = rect.bottom + PANEL_GAP;
      setFallback({
        left: Math.min(
          Math.max(PANEL_MARGIN, rect.left),
          Math.max(PANEL_MARGIN, window.innerWidth - width - PANEL_MARGIN)
        ),
        top: below + height <= window.innerHeight - PANEL_MARGIN ? below : Math.max(PANEL_MARGIN, rect.top - PANEL_GAP - height),
        visibility: "visible"
      });
    };
    const place = () => {
      if (measuring.current) {
        measure();
        return;
      }
      const panel = panelRef.current;
      if (panel === null) return;
      const rect = panel.getBoundingClientRect();
      const stranded = rect.width === 0 || rect.height === 0 || rect.bottom <= 0 || rect.right <= 0 || rect.top >= window.innerHeight || rect.left >= window.innerWidth;
      if (!stranded) return;
      measuring.current = true;
      measure();
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [open, panelRef, triggerRef]);
  return fallback;
}
function apply(ctx) {
  ctx.effect(() => connectSlashRefresh(
    ctx.get("loader"),
    (error) => {
      ctx.logger.warn(`SkillHub autocomplete refresh failed: ${String(error)}`);
    }
  ), "dsh-skillhub: autocomplete refresh");
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-skillhub: dictionaries");
  const t = ctx.locale.bind(NS);
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "dsh-skillhub",
    order: 80,
    label: () => t("nav"),
    locale: NS
  }, SkillHubSettings));
  ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
    name: "conversation.input.left",
    id: "dsh-skillhub",
    order: 40,
    label: () => t("chip"),
    locale: NS
  }, SkillHubChip));
}
function SkillHubSettings(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    SkillHubPanel,
    {
      defaultLayer: "global",
      layers: ["global"],
      surface: "page",
      t: props.t
    }
  );
}
function SkillHubChip(props) {
  const sessionId = props.sessionId;
  const folder = props.useSessions((list) => list.byId?.[sessionId]?.cwd ?? "");
  const [open, setOpen] = (0, import_react5.useState)(false);
  const rootRef = (0, import_react5.useRef)(null);
  const triggerRef = (0, import_react5.useRef)(null);
  const panelRef = (0, import_react5.useRef)(null);
  const anchorId = (0, import_react5.useId)();
  const anchorStyle = {
    "--dsh-skillhub-anchor": `--dsh-skillhub-${anchorId.replaceAll(":", "")}`
  };
  const placement = usePanelPlacement(open, triggerRef, panelRef);
  (0, import_react5.useEffect)(() => {
    if (!open) return;
    const closeOutside = (event) => {
      if (!(event.target instanceof Node)) return;
      if (rootRef.current?.contains(event.target) === true) return;
      if (panelRef.current?.contains(event.target) === true) return;
      if (event.target instanceof Element) {
        const floated = event.target.closest('[role="menu"], [role="dialog"], [role="listbox"]');
        if (floated !== null) return;
      }
      setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: SkillHubPanel_default.chipWrap, ref: rootRef, "data-skillhub-chip": "", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
      "button",
      {
        ref: triggerRef,
        type: "button",
        className: SkillHubPanel_default.trigger,
        style: anchorStyle,
        "data-open": open ? "" : void 0,
        "aria-expanded": open,
        "aria-label": props.t("chip.aria"),
        title: props.t("chip.aria"),
        onClick: () => setOpen((value) => !value),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_dsh_client_ui_primitives5.IconSkillOutlineRegular, { size: 16 }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: SkillHubPanel_default.triggerLabel, children: props.t("chip") })
        ]
      }
    ),
    open ? (0, import_react_dom.createPortal)(
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "div",
        {
          ref: panelRef,
          className: SkillHubPanel_default.menu,
          style: { ...anchorStyle, ...placement },
          role: "dialog",
          "aria-modal": "false",
          "aria-label": props.t("chip.aria"),
          "data-ud-check": "skillhub-chip-panel",
          children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            SkillHubPanel,
            {
              sessionId,
              defaultLayer: "session",
              layers: ["session", "project"],
              surface: "popover",
              t: props.t,
              ...folder !== "" ? { folder } : {}
            }
          )
        }
      ),
      document.body
    ) : null
  ] });
}

		return module.exports;
	}
});
