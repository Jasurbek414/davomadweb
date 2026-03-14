"""
Device Adapter Factory - qurilma brendiga qarab adapter yaratish
"""
import logging
from .base import BaseDeviceAdapter

logger = logging.getLogger(__name__)


def get_adapter(device) -> BaseDeviceAdapter:
    """
    Qurilma brendiga qarab to'g'ri adapter qaytaradi.
    Yangi brend qo'shish uchun faqat shu faylga mapping qo'shish kerak.
    """
    from .hikvision import HikvisionAdapter
    from .zkteco import ZKTecoAdapter
    from .dahua import DahuaAdapter

    adapters = {
        'hikvision': HikvisionAdapter,
        'zkteco': ZKTecoAdapter,
        'dahua': DahuaAdapter,
        'anviz': ZKTecoAdapter,  # Anviz uses similar API to ZKTeco
        'other': HikvisionAdapter,  # Default to Hikvision ISAPI
    }

    adapter_class = adapters.get(device.brand, HikvisionAdapter)
    logger.info(f"Using {adapter_class.__name__} for device {device.name} ({device.brand})")
    return adapter_class(device)
