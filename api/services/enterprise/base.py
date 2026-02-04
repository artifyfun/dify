from collections.abc import Mapping
from typing import Any

import httpx

from configs import dify_config


class BaseRequest:
    proxies: Mapping[str, str] | None = {
        "http": "",
        "https": "",
    }
    base_url = ""
    secret_key = ""
    secret_key_header = ""

    @classmethod
    def _build_mounts(cls) -> dict[str, httpx.BaseTransport] | None:
        if not cls.proxies:
            return None

        mounts: dict[str, httpx.BaseTransport] = {}
        for scheme, value in cls.proxies.items():
            if not value:
                continue
            key = f"{scheme}://" if not scheme.endswith("://") else scheme
            mounts[key] = httpx.HTTPTransport(proxy=value)
        return mounts or None

    @classmethod
    def send_request(
        cls,
        method: str,
        endpoint: str,
        json: Any | None = None,
        params: Mapping[str, Any] | None = None,
    ) -> Any:
        base_url = cls.get_base_url()
        if not base_url or not (base_url.startswith("http://") or base_url.startswith("https://")):
            return {}

        headers = {"Content-Type": "application/json", cls.secret_key_header: cls.get_secret_key()}
        url = f"{base_url}{endpoint}"
        mounts = cls._build_mounts()
        with httpx.Client(mounts=mounts) as client:
            response = client.request(method, url, json=json, params=params, headers=headers)
        return response.json()

    @classmethod
    def get_base_url(cls):
        return cls.base_url

    @classmethod
    def get_secret_key(cls):
        return cls.secret_key


class EnterpriseRequest(BaseRequest):
    @classmethod
    def get_base_url(cls):
        return dify_config.ENTERPRISE_API_URL

    @classmethod
    def get_secret_key(cls):
        return dify_config.ENTERPRISE_API_SECRET_KEY

    secret_key_header = "Enterprise-Api-Secret-Key"


class EnterprisePluginManagerRequest(BaseRequest):
    @classmethod
    def get_base_url(cls):
        return dify_config.ENTERPRISE_PLUGIN_MANAGER_API_URL

    @classmethod
    def get_secret_key(cls):
        return dify_config.ENTERPRISE_PLUGIN_MANAGER_API_SECRET_KEY

    secret_key_header = "Plugin-Manager-Inner-Api-Secret-Key"
