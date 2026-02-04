from pydantic import Field
from pydantic_settings import BaseSettings


class EnterpriseFeatureConfig(BaseSettings):
    """
    Configuration for enterprise-level features.
    **Before using, please contact business@dify.ai by email to inquire about licensing matters.**
    """

    ENTERPRISE_ENABLED: bool = Field(
        description="Enable or disable enterprise-level features."
        "Before using, please contact business@dify.ai by email to inquire about licensing matters.",
        default=False,
    )

    CAN_REPLACE_LOGO: bool = Field(
        description="Allow customization of the enterprise logo.",
        default=False,
    )

    ENTERPRISE_API_URL: str = Field(
        description="URL for the enterprise API service.",
        default="",
    )

    ENTERPRISE_API_SECRET_KEY: str = Field(
        description="Secret key for accessing the enterprise API service.",
        default="",
    )

    ENTERPRISE_BRANDING_APPLICATION_TITLE: str = Field(
        description="Manual override for the enterprise branding application title.",
        default="",
    )

    ENTERPRISE_BRANDING_LOGIN_PAGE_LOGO: str = Field(
        description="Manual override for the enterprise branding login page logo.",
        default="",
    )

    ENTERPRISE_BRANDING_WORKSPACE_LOGO: str = Field(
        description="Manual override for the enterprise branding workspace logo.",
        default="",
    )

    ENTERPRISE_BRANDING_FAVICON: str = Field(
        description="Manual override for the enterprise branding favicon.",
        default="",
    )

    ENTERPRISE_PLUGIN_MANAGER_ENABLED: bool = Field(
        description="Enable or disable the enterprise plugin manager.",
        default=True,
    )

    ENTERPRISE_WEBAPP_AUTH_ENABLED: bool = Field(
        description="Enable or disable the enterprise webapp auth.",
        default=True,
    )
