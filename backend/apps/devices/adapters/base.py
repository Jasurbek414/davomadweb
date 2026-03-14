"""
Base Device Adapter - Barcha qurilma adapterlari uchun asosiy sinf
"""
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class BaseDeviceAdapter(ABC):
    """
    Face ID qurilmalar uchun abstrakt adapter.
    Har bir qurilma brendi uchun alohida adapter yaratiladi.
    """

    def __init__(self, device):
        self.device = device
        self.ip = device.ip_address
        self.port = device.port
        self.username = device.username
        self.password = device.password
        self._session = None

    @abstractmethod
    def connect(self) -> bool:
        """Qurilmaga ulanish. True = muvaffaqiyatli"""
        pass

    @abstractmethod
    def disconnect(self):
        """Ulanishni uzish"""
        pass

    @abstractmethod
    def get_device_info(self) -> Dict[str, Any]:
        """Qurilma haqida ma'lumot olish"""
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Qurilma holati (online/offline, memory, etc)"""
        pass

    @abstractmethod
    def get_users(self) -> List[Dict[str, Any]]:
        """Qurilmadagi barcha foydalanuvchilar ro'yxati"""
        pass

    @abstractmethod
    def add_user(self, user_data: Dict[str, Any]) -> bool:
        """Qurilmaga yangi foydalanuvchi qo'shish"""
        pass

    @abstractmethod
    def update_user(self, employee_no: str, user_data: Dict[str, Any]) -> bool:
        """Qurilmadagi foydalanuvchi ma'lumotlarini yangilash"""
        pass

    @abstractmethod
    def delete_user(self, employee_no: str) -> bool:
        """Qurilmadan foydalanuvchi o'chirish"""
        pass

    @abstractmethod
    def upload_face(self, employee_no: str, image_data: bytes) -> bool:
        """Foydalanuvchi yuz rasmini qurilmaga yuklash"""
        pass

    @abstractmethod
    def delete_face(self, employee_no: str) -> bool:
        """Foydalanuvchi yuz rasmini qurilmadan o'chirish"""
        pass

    @abstractmethod
    def get_raw_logs(self, start_time=None, end_time=None) -> List[Dict[str, Any]]:
        """Qurilmadan xom loglarni olish"""
        pass

    @abstractmethod
    def clear_logs(self) -> bool:
        """Qurilma loglarini tozalash"""
        pass

    def ping(self) -> bool:
        """Qurilma pingga javob beradimi tekshirish"""
        import socket
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(3)
            result = sock.connect_ex((self.ip, self.port))
            sock.close()
            return result == 0
        except Exception:
            return False

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()
