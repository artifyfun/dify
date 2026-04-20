# Instance-Global Branding And Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `feature/shsnc_v1.11.4` capabilities as an instance-global branding, access, embedded-chat, and rich-response system on `refs/heads/1.14.0-rc1`.

**Architecture:** Extend the existing `system_features` contract instead of introducing a parallel API. The backend becomes the single place that merges environment defaults, admin-managed instance settings, and compatibility fallbacks; the frontend consumes the resolved contract through global feature state and a small set of entry-point hooks.

**Tech Stack:** Flask, SQLAlchemy, Pydantic, Alembic, Next.js 15, React 19, TypeScript, Zustand, React Query, Vitest, `uv`, `pnpm`.

---

## File Map

### Backend

- Create: `api/models/system_feature_config.py`
- Create: `api/services/system_experience_config_service.py`
- Create: `api/tests/test_containers_integration_tests/controllers/console/test_system_feature_api.py`
- Modify: `api/models/__init__.py`
- Modify: `api/configs/feature/__init__.py`
- Modify: `api/services/feature_service.py`
- Modify: `api/controllers/console/feature.py`
- Modify: `api/tests/test_containers_integration_tests/services/test_feature_service.py`
- Create: `api/migrations/versions/20260420_01_add_system_feature_config_table.py`

### Frontend

- Create: `web/hooks/use-system-experience.ts`
- Create: `web/utils/access-experience.ts`
- Create: `web/utils/access-experience.spec.ts`
- Create: `web/app/components/custom/instance-experience-settings/index.tsx`
- Create: `web/app/components/custom/instance-experience-settings/index.spec.tsx`
- Create: `web/app/components/base/markdown-blocks/button.spec.tsx`
- Modify: `web/types/feature.ts`
- Modify: `web/context/global-public-context.tsx`
- Modify: `web/service/common.ts`
- Modify: `web/service/base.ts`
- Modify: `web/app/components/custom/custom-page/index.tsx`
- Modify: `web/app/components/header/account-setting/constants.ts`
- Modify: `web/app/components/header/account-setting/index.tsx`
- Modify: `web/app/components/header/index.tsx`
- Modify: `web/app/signin/layout.tsx`
- Modify: `web/app/signin/page.tsx`
- Modify: `web/app/signin/_header.tsx`
- Modify: `web/app/account/(commonLayout)/header.tsx`
- Modify: `web/app/(shareLayout)/webapp-signin/page.tsx`
- Modify: `web/app/(shareLayout)/components/splash.tsx`
- Modify: `web/app/(shareLayout)/components/authenticated-layout.tsx`
- Modify: `web/app/components/base/chat/embedded-chatbot/context.tsx`
- Modify: `web/app/components/base/chat/embedded-chatbot/hooks.tsx`
- Modify: `web/app/components/base/chat/embedded-chatbot/header/index.tsx`
- Modify: `web/app/components/base/chat/embedded-chatbot/index.tsx`
- Modify: `web/app/components/base/chat/chat/index.tsx`
- Modify: `web/app/components/base/chat/chat/question.tsx`
- Modify: `web/app/components/base/markdown/index.tsx`
- Modify: `web/app/components/base/markdown-blocks/button.tsx`
- Modify: `web/i18n/en-US/custom.json`
- Modify: `web/i18n/en-US/login.json`
- Modify: `web/i18n/en-US/common.json`
- Modify: `web/i18n/en-US/share.json`

## Task 1: Set Up The Rebuild Branch And Lock The Baseline

**Files:**
- Observe: `.git/`
- Observe: `docs/superpowers/specs/2026-04-20-instance-global-branding-and-access-design.md`

- [ ] **Step 1: Create a dedicated worktree from the branch ref**

Run:

```bash
git worktree add ../dify-instance-experience refs/heads/1.14.0-rc1 -b codex/instance-global-branding-access
```

Expected:
- A clean worktree at `../dify-instance-experience`
- A new working branch named `codex/instance-global-branding-access`

- [ ] **Step 2: Record the baseline files that already participate in branding and auth**

Run:

```bash
rg -n "branding|webapp_auth|remove_webapp_brand|replace_webapp_logo|system-features" api web -g '!**/node_modules/**'
```

Expected:
- Confirmation that the current baseline is centered on `api/services/feature_service.py`, `api/controllers/console/feature.py`, `web/types/feature.ts`, `web/context/global-public-context.tsx`, and the current custom/workspace UI

- [ ] **Step 3: Verify the approved design document before implementation work starts**

Run:

```bash
sed -n '1,260p' docs/superpowers/specs/2026-04-20-instance-global-branding-and-access-design.md
```

Expected:
- The implementation branch uses the approved scope: instance-global, Console included, auth-disabled auto-enter only, mixed precedence

## Task 2: Build The Backend Instance Experience Contract

**Files:**
- Create: `api/models/system_feature_config.py`
- Create: `api/services/system_experience_config_service.py`
- Modify: `api/models/__init__.py`
- Modify: `api/configs/feature/__init__.py`
- Modify: `api/services/feature_service.py`
- Modify: `api/tests/test_containers_integration_tests/services/test_feature_service.py`
- Create: `api/migrations/versions/20260420_01_add_system_feature_config_table.py`

- [ ] **Step 1: Write failing backend tests for grouped system experience fields and precedence**

Add tests like:

```python
def test_get_system_features_merges_instance_experience_config(
    self,
    db_session_with_containers,
    mock_external_service_dependencies,
):
    with patch("services.feature_service.dify_config") as mock_config, patch(
        "services.feature_service.SystemExperienceConfigService"
    ) as mock_config_service:
        mock_config.ENABLE_EMAIL_CODE_LOGIN = True
        mock_config.ENABLE_EMAIL_PASSWORD_LOGIN = True
        mock_config.ENABLE_SOCIAL_OAUTH_LOGIN = False
        mock_config.ALLOW_REGISTER = False
        mock_config.ALLOW_CREATE_WORKSPACE = False
        mock_config.INSTANCE_ACCESS_ALLOW_CONSOLE_AUTO_ENTER = False
        mock_config.INSTANCE_ACCESS_ALLOW_WEBAPP_AUTO_ENTER = True
        mock_config.INSTANCE_EMBEDDED_ALLOW_EXTERNAL_CONTROL = True
        mock_config.INSTANCE_RICH_RESPONSE_ENABLE_MARKDOWN_BUTTONS = True
        mock_config.MAIL_TYPE = "smtp"
        mock_config.ENTERPRISE_ENABLED = False
        mock_config.MARKETPLACE_ENABLED = False
        mock_config.CREATORS_PLATFORM_FEATURES_ENABLED = False

        mock_config_service.get_config.return_value = {
            "branding": {
                "enabled": True,
                "application_title": "ACME Console",
                "workspace_logo": "https://example.com/workspace.svg",
                "login_page_logo": "https://example.com/login.svg",
                "favicon": "https://example.com/favicon.ico",
                "hide_vendor_branding": True,
            },
            "access_experience": {
                "auto_enter_console_when_auth_disabled": True,
                "auto_enter_webapp_when_auth_disabled": True,
            },
            "embedded_experience": {
                "show_header_by_default": False,
                "allow_reset_chat": True,
                "allow_external_control": True,
                "allow_external_input_sync": True,
                "show_suggested_questions_above_input": True,
                "normalize_greeting_rendering": True,
            },
            "rich_response_experience": {
                "enable_markdown_buttons": True,
                "markdown_button_style_variant": "theme",
                "allow_markdown_button_link_action": True,
                "allow_markdown_button_fill_input_action": True,
                "allow_markdown_button_client_action": False,
            },
        }

        result = FeatureService.get_system_features(is_authenticated=False)

        assert result.branding.hide_vendor_branding is True
        assert result.access_experience.allow_console_auto_enter is False
        assert result.access_experience.auto_enter_webapp_when_auth_disabled is True
        assert result.embedded_experience.show_header_by_default is False
        assert result.rich_response_experience.enable_markdown_buttons is True
```

- [ ] **Step 2: Run the focused backend tests to prove the contract is missing**

Run:

```bash
uv run --project api -m pytest api/tests/test_containers_integration_tests/services/test_feature_service.py -k "system_features"
```

Expected:
- FAIL because the new grouped models and service do not exist yet

- [ ] **Step 3: Add the persistence model, service, and config defaults**

Create model and service around a single JSON-backed instance config:

```python
# api/models/system_feature_config.py
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from .engine import db
from .types import StringUUID


class SystemFeatureConfig(db.Model):
    __tablename__ = "system_feature_config"

    id: Mapped[str] = mapped_column(StringUUID, primary_key=True)
    value: Mapped[dict] = mapped_column(sa.JSON, nullable=False, default=dict)
    created_by: Mapped[str | None] = mapped_column(StringUUID, nullable=True)
    updated_by: Mapped[str | None] = mapped_column(StringUUID, nullable=True)
    created_at = mapped_column(sa.DateTime, nullable=False, server_default=sa.func.now())
    updated_at = mapped_column(
        sa.DateTime,
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )
```

```python
# api/services/system_experience_config_service.py
from extensions.ext_database import db
from models.system_feature_config import SystemFeatureConfig


class SystemExperienceConfigService:
    @classmethod
    def get_config(cls) -> dict:
        row = db.session.query(SystemFeatureConfig).first()
        return row.value if row else {}

    @classmethod
    def upsert_config(cls, value: dict, updated_by: str | None) -> dict:
        row = db.session.query(SystemFeatureConfig).first()
        if row is None:
            row = SystemFeatureConfig(id=str(uuid.uuid4()), value=value, created_by=updated_by, updated_by=updated_by)
            db.session.add(row)
        else:
            row.value = value
            row.updated_by = updated_by
        db.session.commit()
        return row.value
```

Add environment-backed allowlists in `api/configs/feature/__init__.py`:

```python
INSTANCE_ACCESS_ALLOW_CONSOLE_AUTO_ENTER: bool = Field(default=False, description="Allow Console auto-enter when auth is disabled.")
INSTANCE_ACCESS_ALLOW_WEBAPP_AUTO_ENTER: bool = Field(default=True, description="Allow WebApp auto-enter when auth is disabled.")
INSTANCE_EMBEDDED_ALLOW_EXTERNAL_CONTROL: bool = Field(default=False, description="Allow host pages to control embedded chatbot actions.")
INSTANCE_RICH_RESPONSE_ENABLE_MARKDOWN_BUTTONS: bool = Field(default=False, description="Allow interactive markdown buttons in chat answers.")
```

- [ ] **Step 4: Expand `SystemFeatureModel` and move merge logic into grouped builders**

Add grouped models and merge logic in `api/services/feature_service.py`:

```python
class BrandingModel(BaseModel):
    enabled: bool = False
    application_title: str = ""
    login_page_logo: str = ""
    workspace_logo: str = ""
    favicon: str = ""
    hide_vendor_branding: bool = False


class AccessExperienceModel(BaseModel):
    allow_console_auto_enter: bool = False
    allow_webapp_auto_enter: bool = False
    auto_enter_console_when_auth_disabled: bool = False
    auto_enter_webapp_when_auth_disabled: bool = False
    show_signin_when_auth_required: bool = True


class EmbeddedExperienceModel(BaseModel):
    show_header_by_default: bool = True
    allow_reset_chat: bool = True
    allow_external_control: bool = False
    allow_external_input_sync: bool = False
    show_suggested_questions_above_input: bool = False
    normalize_greeting_rendering: bool = True


class RichResponseExperienceModel(BaseModel):
    enable_markdown_buttons: bool = False
    markdown_button_style_variant: str = "theme"
    allow_markdown_button_link_action: bool = True
    allow_markdown_button_fill_input_action: bool = True
    allow_markdown_button_client_action: bool = False
```

```python
class SystemFeatureModel(BaseModel):
    enable_email_code_login: bool = False
    enable_email_password_login: bool = True
    enable_social_oauth_login: bool = False
    is_allow_register: bool = False
    is_allow_create_workspace: bool = False
    is_email_setup: bool = False
    branding: BrandingModel = BrandingModel()
    access_experience: AccessExperienceModel = AccessExperienceModel()
    embedded_experience: EmbeddedExperienceModel = EmbeddedExperienceModel()
    rich_response_experience: RichResponseExperienceModel = RichResponseExperienceModel()
```

```python
@classmethod
def _fulfill_system_instance_experience(
    cls,
    system_features: SystemFeatureModel,
    instance_config: dict,
) -> None:
    branding = instance_config.get("branding", {})
    access = instance_config.get("access_experience", {})
    embedded = instance_config.get("embedded_experience", {})
    rich = instance_config.get("rich_response_experience", {})

    system_features.branding.hide_vendor_branding = branding.get("hide_vendor_branding", False)
    system_features.access_experience.allow_console_auto_enter = dify_config.INSTANCE_ACCESS_ALLOW_CONSOLE_AUTO_ENTER
    system_features.access_experience.allow_webapp_auto_enter = dify_config.INSTANCE_ACCESS_ALLOW_WEBAPP_AUTO_ENTER
    system_features.access_experience.auto_enter_console_when_auth_disabled = (
        system_features.access_experience.allow_console_auto_enter
        and access.get("auto_enter_console_when_auth_disabled", False)
    )
    system_features.access_experience.auto_enter_webapp_when_auth_disabled = (
        system_features.access_experience.allow_webapp_auto_enter
        and access.get("auto_enter_webapp_when_auth_disabled", False)
    )
    system_features.embedded_experience.allow_external_control = (
        dify_config.INSTANCE_EMBEDDED_ALLOW_EXTERNAL_CONTROL
        and embedded.get("allow_external_control", False)
    )
    system_features.rich_response_experience.enable_markdown_buttons = (
        dify_config.INSTANCE_RICH_RESPONSE_ENABLE_MARKDOWN_BUTTONS
        and rich.get("enable_markdown_buttons", False)
    )
```

- [ ] **Step 5: Add the migration and verify the backend contract**

Run:

```bash
uv run --project api alembic revision -m "add system_feature_config table"
uv run --project api -m pytest api/tests/test_containers_integration_tests/services/test_feature_service.py -k "system_features"
make lint
make type-check
```

Expected:
- New table migration generated
- Focused backend contract tests pass
- Lint and type-check pass

- [ ] **Step 6: Commit the backend contract layer**

Run:

```bash
git add api/models/system_feature_config.py api/services/system_experience_config_service.py api/models/__init__.py api/configs/feature/__init__.py api/services/feature_service.py api/tests/test_containers_integration_tests/services/test_feature_service.py api/migrations/versions
git commit -m "feat(api): add instance-global system experience contract"
```

## Task 3: Expose Authenticated Admin APIs For Instance Experience Settings

**Files:**
- Modify: `api/controllers/console/feature.py`
- Create: `api/tests/test_containers_integration_tests/controllers/console/test_system_feature_api.py`

- [ ] **Step 1: Write failing controller tests for authenticated read and update**

Add tests like:

```python
def test_admin_can_update_system_feature_config(client, admin_headers):
    payload = {
        "branding": {
            "enabled": True,
            "application_title": "ACME Console",
            "hide_vendor_branding": True,
        },
        "access_experience": {
            "auto_enter_console_when_auth_disabled": True,
            "auto_enter_webapp_when_auth_disabled": True,
        },
    }

    response = client.put("/console/api/system-features/admin-config", headers=admin_headers, json=payload)

    assert response.status_code == 200
    assert response.json["branding"]["application_title"] == "ACME Console"
    assert response.json["access_experience"]["auto_enter_console_when_auth_disabled"] is True
```

- [ ] **Step 2: Run the new controller tests and confirm the route is missing**

Run:

```bash
uv run --project api -m pytest api/tests/test_containers_integration_tests/controllers/console/test_system_feature_api.py
```

Expected:
- FAIL because the authenticated config route does not exist yet

- [ ] **Step 3: Add authenticated GET and PUT endpoints beside the public system-features route**

Implement authenticated admin access in `api/controllers/console/feature.py`:

```python
class SystemFeatureAdminConfigPayload(BaseModel):
    branding: dict = Field(default_factory=dict)
    access_experience: dict = Field(default_factory=dict)
    embedded_experience: dict = Field(default_factory=dict)
    rich_response_experience: dict = Field(default_factory=dict)


@console_ns.route("/system-features/admin-config")
class SystemFeatureAdminConfigApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @admin_required
    def get(self):
        return SystemExperienceConfigService.get_config(), 200

    @setup_required
    @login_required
    @account_initialization_required
    @admin_required
    def put(self):
        payload = SystemFeatureAdminConfigPayload.model_validate(console_ns.payload or {})
        account, _ = current_account_with_tenant()
        value = SystemExperienceConfigService.upsert_config(payload.model_dump(), updated_by=account.id)
        return value, 200
```

- [ ] **Step 4: Re-run the controller and service tests**

Run:

```bash
uv run --project api -m pytest api/tests/test_containers_integration_tests/controllers/console/test_system_feature_api.py
uv run --project api -m pytest api/tests/test_containers_integration_tests/services/test_feature_service.py -k "system_features"
```

Expected:
- Admin route tests pass
- Public system-features route still returns the merged config

- [ ] **Step 5: Commit the admin API layer**

Run:

```bash
git add api/controllers/console/feature.py api/tests/test_containers_integration_tests/controllers/console/test_system_feature_api.py
git commit -m "feat(api): add admin system experience config endpoints"
```

## Task 4: Add Frontend Types, Service Calls, And The Instance Settings UI

**Files:**
- Create: `web/hooks/use-system-experience.ts`
- Create: `web/app/components/custom/instance-experience-settings/index.tsx`
- Create: `web/app/components/custom/instance-experience-settings/index.spec.tsx`
- Modify: `web/types/feature.ts`
- Modify: `web/context/global-public-context.tsx`
- Modify: `web/service/common.ts`
- Modify: `web/app/components/custom/custom-page/index.tsx`
- Modify: `web/app/components/header/account-setting/constants.ts`
- Modify: `web/app/components/header/account-setting/index.tsx`
- Modify: `web/i18n/en-US/custom.json`

- [ ] **Step 1: Write failing frontend tests for the new settings form**

Add a test like:

```tsx
it('loads admin config and submits grouped instance experience payload', async () => {
  server.use(
    http.get('/console/api/system-features/admin-config', () => HttpResponse.json({
      branding: { enabled: true, application_title: 'ACME', hide_vendor_branding: true },
      access_experience: { auto_enter_console_when_auth_disabled: false, auto_enter_webapp_when_auth_disabled: true },
      embedded_experience: { show_header_by_default: false, allow_external_control: true },
      rich_response_experience: { enable_markdown_buttons: true, markdown_button_style_variant: 'theme' },
    })),
    http.put('/console/api/system-features/admin-config', async ({ request }) => {
      const body = await request.json()
      expect(body.branding.application_title).toBe('ACME Cloud')
      expect(body.access_experience.auto_enter_webapp_when_auth_disabled).toBe(true)
      return HttpResponse.json(body)
    }),
  )

  render(<InstanceExperienceSettings />)
  fireEvent.change(await screen.findByLabelText('custom.instanceBranding.applicationTitle'), { target: { value: 'ACME Cloud' } })
  fireEvent.click(screen.getByRole('button', { name: 'common.operation.save' }))

  await waitFor(() => expect(screen.getByText('common.api.success')).toBeInTheDocument())
})
```

- [ ] **Step 2: Run the focused settings UI test and confirm the component is missing**

Run:

```bash
cd web && pnpm test -- --run app/components/custom/instance-experience-settings/index.spec.tsx
```

Expected:
- FAIL because the component, types, and service functions do not exist yet

- [ ] **Step 3: Add grouped frontend types and service calls**

Extend `web/types/feature.ts` and `web/service/common.ts`:

```ts
export type SystemFeatures = {
  trial_models: ModelProviderQuotaGetPaid[]
  enable_email_code_login: boolean
  enable_email_password_login: boolean
  enable_social_oauth_login: boolean
  is_allow_register: boolean
  is_allow_create_workspace: boolean
  is_email_setup: boolean
  branding: {
    enabled: boolean
    login_page_logo: string
    workspace_logo: string
    favicon: string
    application_title: string
    hide_vendor_branding: boolean
  }
  access_experience: {
    allow_console_auto_enter: boolean
    allow_webapp_auto_enter: boolean
    auto_enter_console_when_auth_disabled: boolean
    auto_enter_webapp_when_auth_disabled: boolean
    show_signin_when_auth_required: boolean
  }
  embedded_experience: {
    show_header_by_default: boolean
    allow_reset_chat: boolean
    allow_external_control: boolean
    allow_external_input_sync: boolean
    show_suggested_questions_above_input: boolean
    normalize_greeting_rendering: boolean
  }
  rich_response_experience: {
    enable_markdown_buttons: boolean
    markdown_button_style_variant: 'theme' | 'secondary'
    allow_markdown_button_link_action: boolean
    allow_markdown_button_fill_input_action: boolean
    allow_markdown_button_client_action: boolean
  }
}
```

```ts
export const getSystemExperienceConfig = () => {
  return get<{ branding: object; access_experience: object; embedded_experience: object; rich_response_experience: object }>('/system-features/admin-config')
}

export const updateSystemExperienceConfig = (body: Record<string, unknown>) => {
  return put('/system-features/admin-config', { body })
}
```

- [ ] **Step 4: Add the `InstanceExperienceSettings` screen and mount it in the existing Custom tab**

Implement a single grouped settings page:

```tsx
export default function InstanceExperienceSettings() {
  const { data, isLoading } = useQuery({ queryKey: ['system-experience-admin-config'], queryFn: getSystemExperienceConfig })
  const mutation = useMutation({ mutationFn: updateSystemExperienceConfig })
  const [form, setForm] = useState(() => data ?? defaultForm)

  if (isLoading)
    return <Loading />

  return (
    <div className="space-y-6">
      <Section title={t('custom.instanceBranding.title')}>
        <Input value={form.branding.application_title} onChange={e => updateField('branding.application_title', e.target.value)} />
        <Switch defaultValue={form.branding.hide_vendor_branding} onChange={value => updateField('branding.hide_vendor_branding', value)} />
      </Section>
      <Section title={t('custom.instanceAccess.title')}>
        <Switch defaultValue={form.access_experience.auto_enter_console_when_auth_disabled} onChange={value => updateField('access_experience.auto_enter_console_when_auth_disabled', value)} />
        <Switch defaultValue={form.access_experience.auto_enter_webapp_when_auth_disabled} onChange={value => updateField('access_experience.auto_enter_webapp_when_auth_disabled', value)} />
      </Section>
      <Button variant="primary" onClick={() => mutation.mutate(form)}>{t('common.operation.save', { ns: 'common' })}</Button>
    </div>
  )
}
```

Mount it inside the existing custom page:

```tsx
const CustomPage = () => {
  return (
    <div className="flex flex-col">
      <InstanceExperienceSettings />
    </div>
  )
}
```

- [ ] **Step 5: Re-run the settings UI test and type-check**

Run:

```bash
cd web
pnpm test -- --run app/components/custom/instance-experience-settings/index.spec.tsx
pnpm type-check:tsgo
```

Expected:
- The new settings page test passes
- TypeScript understands the grouped `SystemFeatures` contract

- [ ] **Step 6: Commit the frontend settings foundation**

Run:

```bash
git add web/types/feature.ts web/context/global-public-context.tsx web/service/common.ts web/hooks/use-system-experience.ts web/app/components/custom/instance-experience-settings/index.tsx web/app/components/custom/instance-experience-settings/index.spec.tsx web/app/components/custom/custom-page/index.tsx web/app/components/header/account-setting/constants.ts web/app/components/header/account-setting/index.tsx web/i18n/en-US/custom.json
git commit -m "feat(web): add instance-global experience settings UI"
```

## Task 5: Roll Out Instance-Global Branding Across Console, Signin, WebApp, And Embedded Chat

**Files:**
- Modify: `web/app/components/header/index.tsx`
- Modify: `web/app/signin/layout.tsx`
- Modify: `web/app/signin/_header.tsx`
- Modify: `web/app/account/(commonLayout)/header.tsx`
- Modify: `web/app/components/base/chat/embedded-chatbot/header/index.tsx`
- Modify: `web/app/components/base/chat/embedded-chatbot/index.tsx`
- Modify: `web/i18n/en-US/common.json`
- Modify: `web/i18n/en-US/login.json`
- Modify: `web/i18n/en-US/share.json`

- [ ] **Step 1: Write failing branding tests for vendor-brand hiding and global title/logo usage**

Add tests like:

```tsx
it('uses instance-global workspace logo and hides vendor brand when configured', () => {
  mockSystemFeatures.branding = {
    enabled: true,
    application_title: 'ACME Console',
    workspace_logo: 'https://example.com/workspace.svg',
    login_page_logo: 'https://example.com/login.svg',
    favicon: 'https://example.com/favicon.ico',
    hide_vendor_branding: true,
  }

  render(<Header />)

  expect(screen.getByAltText('logo')).toHaveAttribute('src', 'https://example.com/workspace.svg')
  expect(screen.queryByText(/Dify/i)).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the relevant frontend tests and confirm the new field is ignored**

Run:

```bash
cd web && pnpm test -- --run app/components/custom/custom-web-app-brand/__tests__/index.spec.tsx
```

Expected:
- Existing branding assumptions fail or remain unexercised because `hide_vendor_branding` is not wired yet

- [ ] **Step 3: Centralize branding decisions through a hook and remove page-local brand fallbacks**

Add `web/hooks/use-system-experience.ts` selectors:

```ts
export const useSystemBranding = () => useGlobalPublicStore(s => s.systemFeatures.branding)
export const useVendorBrandVisible = () => useGlobalPublicStore(s => !s.systemFeatures.branding.hide_vendor_branding)
```

Use the hook in brand-bearing surfaces:

```tsx
const branding = useSystemBranding()
const showVendorBrand = useVendorBrandVisible()

{branding.enabled && branding.workspace_logo
  ? <img src={branding.workspace_logo} alt="logo" className="block h-[22px] w-auto object-contain" />
  : <DifyLogo />}

{showVendorBrand && (
  <div className="text-text-tertiary system-2xs-medium-uppercase">
    {t('chat.poweredBy', { ns: 'share' })}
  </div>
)}
```

- [ ] **Step 4: Re-run branding tests and a targeted lint pass**

Run:

```bash
cd web
pnpm test -- --run app/components/custom/custom-web-app-brand/__tests__/index.spec.tsx
pnpm lint:fix
```

Expected:
- Brand rendering is consistently instance-global
- Vendor branding visibility is driven by one field

- [ ] **Step 5: Commit the branding rollout**

Run:

```bash
git add web/app/components/header/index.tsx web/app/signin/layout.tsx web/app/signin/_header.tsx web/app/account/'(commonLayout)'/header.tsx web/app/components/base/chat/embedded-chatbot/header/index.tsx web/app/components/base/chat/embedded-chatbot/index.tsx web/hooks/use-system-experience.ts web/i18n/en-US/common.json web/i18n/en-US/login.json web/i18n/en-US/share.json
git commit -m "feat(web): apply instance-global branding across surfaces"
```

## Task 6: Implement Console And WebApp Auto-Enter Behavior

**Files:**
- Create: `web/utils/access-experience.ts`
- Create: `web/utils/access-experience.spec.ts`
- Modify: `web/service/base.ts`
- Modify: `web/app/signin/page.tsx`
- Modify: `web/app/signin/layout.tsx`
- Modify: `web/app/(shareLayout)/webapp-signin/page.tsx`
- Modify: `web/app/(shareLayout)/components/splash.tsx`
- Modify: `web/app/(shareLayout)/components/authenticated-layout.tsx`

- [ ] **Step 1: Write failing tests for auth-disabled auto-enter decisions**

Add utility tests like:

```ts
describe('resolveAccessEntryBehavior', () => {
  it('bypasses console signin when auth is disabled and console auto-enter is enabled', () => {
    expect(resolveAccessEntryBehavior({
      isAuthenticated: false,
      authDisabled: true,
      autoEnterEnabled: true,
      target: 'console',
    })).toEqual({ action: 'auto-enter' })
  })

  it('keeps signin visible when auth is enabled', () => {
    expect(resolveAccessEntryBehavior({
      isAuthenticated: false,
      authDisabled: false,
      autoEnterEnabled: true,
      target: 'webapp',
    })).toEqual({ action: 'show-signin' })
  })
})
```

- [ ] **Step 2: Run the access utility tests and confirm the helper does not exist**

Run:

```bash
cd web && pnpm test -- --run utils/access-experience.spec.ts
```

Expected:
- FAIL because the helper and wiring are not present

- [ ] **Step 3: Extract access-decision logic into one shared helper**

Create `web/utils/access-experience.ts`:

```ts
export type AccessTarget = 'console' | 'webapp'

export const resolveAccessEntryBehavior = ({
  isAuthenticated,
  authDisabled,
  autoEnterEnabled,
}: {
  isAuthenticated: boolean
  authDisabled: boolean
  autoEnterEnabled: boolean
}) => {
  if (isAuthenticated)
    return { action: 'continue' as const }
  if (authDisabled && autoEnterEnabled)
    return { action: 'auto-enter' as const }
  return { action: 'show-signin' as const }
}
```

Use it in signin and splash entry points:

```tsx
const accessExperience = useGlobalPublicStore(s => s.systemFeatures.access_experience)
const behavior = resolveAccessEntryBehavior({
  isAuthenticated: false,
  authDisabled: !systemFeatures.enable_email_code_login && !systemFeatures.enable_email_password_login && !systemFeatures.enable_social_oauth_login,
  autoEnterEnabled: accessExperience.auto_enter_webapp_when_auth_disabled,
})

useEffect(() => {
  if (behavior.action === 'auto-enter')
    router.replace('/')
}, [behavior.action, router])
```

- [ ] **Step 4: Align `requiredWebSSOLogin` and WebApp splash behavior with the new access flags**

Update `web/service/base.ts` and `web/app/(shareLayout)/components/splash.tsx` so auto-enter takes precedence when auth is disabled:

```ts
function requiredWebSSOLogin(message?: string, code?: number) {
  const systemFeatures = useGlobalPublicStore.getState().systemFeatures
  if (systemFeatures.access_experience.auto_enter_webapp_when_auth_disabled)
    return
  const params = new URLSearchParams()
  if (globalThis.location.pathname === WBB_APP_LOGIN_PATH)
    return
  params.append('redirect_url', encodeURIComponent(`${globalThis.location.pathname}${globalThis.location.search}`))
  if (message)
    params.append('message', message)
  if (code)
    params.append('code', String(code))
  globalThis.location.href = `${globalThis.location.origin}${basePath}${WBB_APP_LOGIN_PATH}?${params.toString()}`
}
```

```tsx
if (!userLoggedIn && !appLoggedIn && systemFeatures.access_experience.auto_enter_webapp_when_auth_disabled) {
  try {
    const { access_token } = await fetchAccessToken({ appCode: shareCode!, userId: embeddedUserId || undefined })
    setWebAppPassport(shareCode!, access_token)
    redirectOrFinish()
    return
  }
  catch {
    setIsLoading(false)
    return
  }
}
```

- [ ] **Step 5: Re-run access tests and targeted WebApp tests**

Run:

```bash
cd web
pnpm test -- --run utils/access-experience.spec.ts
pnpm test -- --run service/base.signin-redirect.spec.ts
pnpm type-check:tsgo
```

Expected:
- Access behavior is now derived from one utility
- WebApp redirect logic no longer hardcodes signin-first behavior

- [ ] **Step 6: Commit the access experience rollout**

Run:

```bash
git add web/utils/access-experience.ts web/utils/access-experience.spec.ts web/service/base.ts web/app/signin/page.tsx web/app/signin/layout.tsx web/app/'(shareLayout)'/webapp-signin/page.tsx web/app/'(shareLayout)'/components/splash.tsx web/app/'(shareLayout)'/components/authenticated-layout.tsx
git commit -m "feat(web): add instance-global console and webapp auto-enter"
```

## Task 7: Rebuild Embedded Chat Behavior Around A Stable Experience Contract

**Files:**
- Modify: `web/app/components/base/chat/embedded-chatbot/context.tsx`
- Modify: `web/app/components/base/chat/embedded-chatbot/hooks.tsx`
- Modify: `web/app/components/base/chat/embedded-chatbot/header/index.tsx`
- Modify: `web/app/components/base/chat/embedded-chatbot/index.tsx`
- Modify: `web/app/components/base/chat/chat/index.tsx`
- Modify: `web/app/components/base/chat/chat/question.tsx`
- Modify: `web/app/components/base/chat/embedded-chatbot/hooks.spec.tsx`

- [ ] **Step 1: Write failing embedded-chat tests for global defaults and external control**

Add tests like:

```tsx
it('hides the embedded header when the instance-global embedded default disables it', () => {
  mockSystemFeatures.embedded_experience = {
    show_header_by_default: false,
    allow_reset_chat: true,
    allow_external_control: true,
    allow_external_input_sync: true,
    show_suggested_questions_above_input: true,
    normalize_greeting_rendering: true,
  }

  render(<EmbeddedChatbot />)

  expect(screen.queryByText('chat.resetChat')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the embedded hook tests and confirm the new contract is absent**

Run:

```bash
cd web && pnpm test -- --run app/components/base/chat/embedded-chatbot/hooks.spec.tsx
```

Expected:
- FAIL because the embedded context does not expose grouped experience fields

- [ ] **Step 3: Add explicit embedded experience values to the context and stop reading page-local brand flags**

Extend the context:

```ts
export type EmbeddedChatbotContextValue = {
  appMeta: AppMeta | null
  appData: AppData | null
  appParams: ChatConfig | null
  currentConversationId: string
  showHeader: boolean
  allowResetChat: boolean
  allowExternalControl: boolean
  allowExternalInputSync: boolean
  showSuggestedQuestionsAboveInput: boolean
}
```

Populate it in `hooks.tsx`:

```ts
const embeddedExperience = useGlobalPublicStore.getState().systemFeatures.embedded_experience

return {
  appData: (appData as AppData) || null,
  appMeta,
  appParams,
  currentConversationId,
  showHeader: embeddedExperience.show_header_by_default,
  allowResetChat: embeddedExperience.allow_reset_chat && !conversationId,
  allowExternalControl: embeddedExperience.allow_external_control,
  allowExternalInputSync: embeddedExperience.allow_external_input_sync,
  showSuggestedQuestionsAboveInput: embeddedExperience.show_suggested_questions_above_input,
}
```

- [ ] **Step 4: Wire the UI to the new embedded contract and normalize message events**

Use the new fields in `index.tsx`, `header/index.tsx`, and `chat/index.tsx`:

```tsx
const { showHeader, allowResetChat, showSuggestedQuestionsAboveInput } = useEmbeddedChatbotContext()

return (
  <div className="relative">
    {showHeader && (
      <Header
        isMobile={isMobile}
        allowResetChat={allowResetChat}
        title={site?.title || ''}
        customerIcon={isDify() ? difyIcon : ''}
        theme={themeBuilder?.theme}
        onCreateNewChat={handleNewConversation}
      />
    )}
    <ChatWrapper key={chatShouldReloadKey} showSuggestedQuestionsAboveInput={showSuggestedQuestionsAboveInput} />
  </div>
)
```

Handle supported host messages only:

```ts
if (event.data.type === 'dify-chatbot-action' && allowExternalControl) {
  if (event.data.payload.action === 'reset')
    handleNewConversation()
  if (event.data.payload.action === 'set-inputs' && allowExternalInputSync)
    handleNewConversationInputsChange(event.data.payload.inputs)
}
```

- [ ] **Step 5: Re-run the embedded tests and type-check**

Run:

```bash
cd web
pnpm test -- --run app/components/base/chat/embedded-chatbot/hooks.spec.tsx
pnpm type-check:tsgo
```

Expected:
- Embedded behavior is controlled by one contract instead of ad hoc checks

- [ ] **Step 6: Commit the embedded-chat rebuild**

Run:

```bash
git add web/app/components/base/chat/embedded-chatbot/context.tsx web/app/components/base/chat/embedded-chatbot/hooks.tsx web/app/components/base/chat/embedded-chatbot/header/index.tsx web/app/components/base/chat/embedded-chatbot/index.tsx web/app/components/base/chat/chat/index.tsx web/app/components/base/chat/chat/question.tsx web/app/components/base/chat/embedded-chatbot/hooks.spec.tsx
git commit -m "feat(web): rebuild embedded chat with instance experience controls"
```

## Task 8: Rebuild Rich Response Markdown Buttons As A Controlled Experience Feature

**Files:**
- Modify: `web/app/components/base/markdown/index.tsx`
- Modify: `web/app/components/base/markdown-blocks/button.tsx`
- Create: `web/app/components/base/markdown-blocks/button.spec.tsx`

- [ ] **Step 1: Write failing markdown-button tests for allowed actions and safe degradation**

Add tests like:

```tsx
it('opens links only when the feature allows link actions', async () => {
  mockSystemFeatures.rich_response_experience = {
    enable_markdown_buttons: true,
    markdown_button_style_variant: 'theme',
    allow_markdown_button_link_action: true,
    allow_markdown_button_fill_input_action: false,
    allow_markdown_button_client_action: false,
  }

  const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
  render(<MarkdownButton node={{ properties: { dataLink: 'https://example.com', dataAction: 'link' }, children: [{ value: 'Open' }] }} />)

  fireEvent.click(screen.getByRole('button', { name: 'Open' }))
  expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank')
})
```

- [ ] **Step 2: Run the markdown-button tests and confirm the button ignores feature gating**

Run:

```bash
cd web && pnpm test -- --run app/components/base/markdown-blocks/button.spec.tsx
```

Expected:
- FAIL because the current button component performs actions without checking the grouped feature settings

- [ ] **Step 3: Gate the renderer through `rich_response_experience` and normalize action parsing**

Update the button renderer:

```tsx
const richResponse = useGlobalPublicStore(s => s.systemFeatures.rich_response_experience)

if (!richResponse.enable_markdown_buttons)
  return <span>{node.children[0]?.value || ''}</span>

const action = node.properties.dataAction || (link ? 'link' : 'fill-input')
const canOpenLink = action === 'link' && richResponse.allow_markdown_button_link_action
const canFillInput = action === 'fill-input' && richResponse.allow_markdown_button_fill_input_action

onClick={() => {
  if (canOpenLink && link && isValidUrl(link)) {
    window.open(link, '_blank')
    return
  }
  if (canFillInput && message) {
    onSend?.(message)
  }
}}
```

Pass style variants from `Markdown` into the custom block pipeline:

```tsx
<ReactMarkdown
  pluginInfo={pluginInfo}
  latexContent={latexContent}
  customComponents={customComponents}
  customDisallowedElements={props.customDisallowedElements}
  rehypePlugins={props.rehypePlugins}
/>
```

Apply the feature-driven variant class in the button:

```tsx
className={cn(
  '!h-auto min-h-8 select-none whitespace-normal !px-3',
  richResponse.markdown_button_style_variant === 'theme' ? 'bg-components-button-primary-bg' : 'bg-components-button-secondary-bg',
)}
```

- [ ] **Step 4: Re-run the markdown-button tests and a focused frontend test pass**

Run:

```bash
cd web
pnpm test -- --run app/components/base/markdown-blocks/button.spec.tsx
pnpm lint:fix
```

Expected:
- Markdown buttons now respect allowlists and safe degradation

- [ ] **Step 5: Commit the rich-response rebuild**

Run:

```bash
git add web/app/components/base/markdown/index.tsx web/app/components/base/markdown-blocks/button.tsx web/app/components/base/markdown-blocks/button.spec.tsx
git commit -m "feat(web): rebuild markdown buttons with controlled actions"
```

## Task 9: Run Full Verification And Produce The Implementation Handoff

**Files:**
- Observe only

- [ ] **Step 1: Run the backend verification suite required by the repo**

Run:

```bash
make lint
make type-check
uv run --project api --dev dev/pytest/pytest_unit_tests.sh
```

Expected:
- Backend lint, type-check, and unit tests all pass

- [ ] **Step 2: Run the frontend verification suite required by the repo**

Run:

```bash
cd web
pnpm lint:fix
pnpm type-check:tsgo
pnpm test
```

Expected:
- Frontend lint, type-check, and tests all pass

- [ ] **Step 3: Run a manual smoke checklist for the four capability domains**

Verify:
- Console header, signin header, account header, and embedded footer use instance-global branding
- Console auto-enters when auth is disabled and the env allowlist permits it
- WebApp auto-enters when auth is disabled and the env allowlist permits it
- Embedded chat honors `show_header_by_default`, reset behavior, and supported host actions
- Suggested questions appear above input when configured
- Greeting rendering remains correct
- Markdown buttons open links or fill input only when the feature allows those actions

Expected:
- One pass/fail note per domain: Branding, Access Experience, Embedded Experience, Rich Response Experience

- [ ] **Step 4: Capture the final migration notes**

Record:
- which old workspace-local behaviors are still temporarily bridged
- which env flags are required for production
- which fields are safe for admins to edit online
- which follow-up cleanup items belong to phase 2

- [ ] **Step 5: Commit the verified final state**

Run:

```bash
git status --short
git add api web
git commit -m "feat: rebuild instance-global branding and access experience"
```

## Self-Review

Spec coverage:
- Branding is implemented in Tasks 2, 4, and 5.
- Access Experience is implemented in Tasks 2, 3, and 6.
- Embedded Experience is implemented in Tasks 2 and 7.
- Rich Response Experience is implemented in Tasks 2 and 8.
- Repo-required verification is captured in Task 9.

Placeholder scan:
- No `TODO`, `TBD`, or “implement later” markers remain.
- Every task names exact files and includes concrete commands or code snippets.

Type consistency:
- Backend uses `branding`, `access_experience`, `embedded_experience`, and `rich_response_experience` consistently.
- Frontend `SystemFeatures` mirrors the same grouped names.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-instance-global-branding-and-access-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
