# Instance-Global Branding And Access Experience Design

## Goal

Rebuild the user-authored capabilities from `feature/shsnc_v1.11.4` on top of `refs/heads/1.14.0-rc1` as a cleaner instance-global configuration system, without porting the old implementation directly.

The new design must preserve the effective product value of the original work while removing branch-specific coupling and scattered conditionals.

## Scope

This design covers three product surfaces:

- Console
- Public WebApp
- Embedded chatbot

This design covers four capability domains:

- Branding
- Access Experience
- Embedded Experience
- Rich Response Experience

This design does not introduce workspace-level or app-level overrides in the first phase.

## Confirmed Product Decisions

The user confirmed these requirements:

- All original user-visible capabilities should be retained.
- The rebuild should target `refs/heads/1.14.0-rc1`, not merge the old branch wholesale.
- The scope includes Console, not just public pages.
- Configuration applies at instance-global level.
- Console access behavior is included, but only for automatic entry when auth is disabled.
- Configuration uses both environment variables and admin-managed settings.
- Conflict resolution is mixed:
  - security-sensitive settings are controlled by environment variables
  - branding and display settings are controlled by admin-managed settings

## Problem Statement

The existing codebase already exposes some relevant capabilities through:

- `api/services/feature_service.py`
- `web/types/feature.ts`
- enterprise-derived branding fields
- webapp auth fields
- workspace-level custom branding fields such as `remove_webapp_brand` and `replace_webapp_logo`

However, the current behavior is fragmented:

- instance-global concerns are mixed with enterprise-only behavior
- some branding is global while some is workspace-local
- login and automatic-entry decisions are distributed across pages
- embedded-chat behavior is implemented at component level instead of through a stable interface
- rich response interaction is not modeled as a first-class experience capability

The redesign should consolidate those behaviors into a single, explicit instance-global contract.

## Design Overview

The recommended design is to extend the existing `system_features` contract rather than creating a parallel top-level API.

The backend remains the only place that resolves:

- default values
- admin-managed values
- environment locks
- compatibility mapping

The frontend consumes the resolved configuration and does not reimplement precedence logic.

## Capability Model

The design introduces four grouped configuration domains inside `SystemFeatureModel`.

### 1. Branding

Purpose:
- define consistent instance-global brand presentation across Console, signin pages, public WebApp, and embedded chatbot

Fields:
- `enabled`
- `application_title`
- `favicon`
- `login_page_logo`
- `workspace_logo`
- `hide_vendor_branding`

Behavior:
- all surfaces read the same resolved branding configuration
- page title and favicon come from one source of truth
- vendor branding is hidden consistently when enabled, except for explicitly documented product exceptions

Phase-1 compatibility:
- existing workspace-level `remove_webapp_brand`
- existing workspace-level `replace_webapp_logo`

Those legacy fields remain readable during transition, but new behavior is modeled as instance-global configuration.

### 2. Access Experience

Purpose:
- define instance-global entry behavior for Console and public WebApp

Fields:
- `auto_enter_console_when_auth_disabled`
- `auto_enter_webapp_when_auth_disabled`
- `show_signin_when_auth_required`
- `allow_console_auto_enter`
- `allow_webapp_auto_enter`

Behavior:
- when auth is enabled, current protected behavior remains
- when auth is disabled and auto-enter is allowed, Console and WebApp bypass unnecessary signin steps
- signin pages remain valid entry points only when auth is actually required

Constraints:
- no anonymous partial Console access
- no full anonymous Console mode
- no account-system redesign in this phase

### 3. Embedded Experience

Purpose:
- define stable instance-global defaults and allowed controls for embedded chatbot behavior

Fields:
- `show_header_by_default`
- `allow_reset_chat`
- `allow_external_control`
- `allow_external_input_sync`
- `show_suggested_questions_above_input`
- `normalize_greeting_rendering`

Behavior:
- embedded chatbot behavior is controlled through a supported configuration and event interface
- external control is limited to supported actions such as reset, start new conversation, and input updates
- layout stability fixes belong in shared component behavior, not page-specific patches

Constraints:
- no broad client SDK in phase 1
- no per-app embedded overrides in phase 1
- no unsupported arbitrary browser event surface

### 4. Rich Response Experience

Purpose:
- support controlled interactive markdown response elements

Fields:
- `enable_markdown_buttons`
- `markdown_button_style_variant`
- `allow_markdown_button_link_action`
- `allow_markdown_button_fill_input_action`
- `allow_markdown_button_client_action`

Behavior:
- markdown buttons are implemented through a supported rendering extension, not arbitrary script execution
- button appearance comes from a shared theme contract
- behavior must work in both standard chat and embedded chat
- unsupported or invalid actions degrade safely

Constraints:
- no arbitrary JavaScript execution
- no unrestricted action types
- no script-like markdown runtime

## Configuration Sources And Precedence

The resolved configuration is produced from two sources:

### Environment variables

Used for:
- auth-sensitive settings
- security locks
- explicit deployment-level capability allowlists

Examples:
- whether Console auto-enter is allowed at all
- whether WebApp auto-enter is allowed at all
- whether embedded external control can be enabled
- whether rich-response interactive actions are permitted

### Admin-managed instance settings

Used for:
- title
- logos
- favicon
- vendor-brand visibility
- embedded defaults
- markdown button display defaults

### Precedence rules

- security-sensitive fields: environment variables win
- branding and display fields: admin-managed settings win
- when admin-managed values are absent, environment defaults are used

The frontend never resolves this precedence. The backend returns the final contract.

## Backend Architecture

Primary aggregation remains centered on:

- `api/services/feature_service.py`

Recommended implementation structure:

- keep `FeatureService.get_system_features(...)` as the public entry point
- add grouped builder functions or a dedicated internal service to resolve:
  - branding
  - access experience
  - embedded experience
  - rich response experience

Responsibilities:

- read environment variables
- read persisted admin-managed instance settings
- apply security locks
- apply admin overrides for display settings
- map legacy fields where needed
- expose a stable final `SystemFeatureModel`

This keeps configuration policy centralized and testable.

## Frontend Architecture

Frontend should move from scattered local behavior checks to entry-point-driven consumption.

### Global consumption

Use existing global feature-loading mechanisms to read resolved configuration once and distribute it through:

- `web/context/global-public-context`

### Console surfaces

Console should use the resolved instance-global fields for:

- header branding
- about/account branding
- signin behavior when auth is disabled

### Public WebApp surfaces

Public WebApp should use the resolved configuration for:

- signin gating
- automatic entry
- vendor branding visibility
- logo/title/favicon behavior

### Embedded chatbot surfaces

Embedded chatbot should consume:

- branding defaults
- header visibility defaults
- supported external-control flags
- recommended-question layout policy
- reset and conversation-control policy

### Rich response rendering

Markdown and answer rendering layers should consume:

- feature enablement
- action allowlists
- style variants

The rendering path should not infer capability from ad hoc props alone.

## Admin Management Surface

The redesign requires an instance-global admin settings surface.

This surface should allow online editing of:

- application title
- favicon
- login page logo
- workspace logo
- vendor-brand visibility
- embedded default behavior
- markdown button display defaults

This surface must not allow unsafe overrides for settings locked by environment variables.

Locked settings should be visible as read-only with a deployment-controlled explanation.

## Compatibility Strategy

The migration should be phased.

### Phase 1: compatibility takeover

- add the new grouped model
- continue to output required legacy fields
- update key entry points to prefer the new grouped configuration
- keep legacy workspace custom config as fallback only where necessary

### Phase 2: cleanup and convergence

- remove direct page-level dependence on workspace-local branding behavior
- reduce compatibility bridges
- consolidate old logic into backend aggregation only

This reduces migration risk while allowing a structurally clean end state.

## Implementation Order

Recommended order:

1. backend configuration model and aggregation
2. branding rollout across all surfaces
3. access-experience entry logic for Console and WebApp
4. embedded-experience rebuild
5. rich-response markdown button rebuild

This order minimizes risk because branding is lowest risk and access logic is highest risk.

## Testing Strategy

### Backend

Add tests for:

- system feature aggregation
- environment-variable precedence
- admin-setting precedence
- compatibility mapping
- auth-disabled auto-enter decisions

### Frontend

Add tests for:

- Console branding and auto-enter behavior
- WebApp branding and auto-enter behavior
- embedded chatbot header/reset/external-control behavior
- recommended question placement and greeting rendering
- markdown button parsing, rendering, and action degradation

### Verification principles

- backend rules are proven by unit tests
- frontend behavior is proven by component or integration tests
- manual smoke checks are supplemental, not the only evidence

## Risks

Highest-risk areas:

- Console auto-enter logic
- WebApp signin entry consolidation
- backward compatibility in `system_features`
- embedded external-control interface design

Medium-risk areas:

- chat layout behavior changes
- greeting and suggested-question placement
- markdown button integration

Lower-risk areas:

- title, favicon, and logo rollout
- vendor branding visibility

## Recommendation

This work should be implemented as a clean rebuild on `refs/heads/1.14.0-rc1`, not as a branch merge or bulk cherry-pick from `feature/shsnc_v1.11.4`.

The correct abstraction is an instance-global experience configuration model built on top of the existing `system_features` pathway.
