"""
ZKTeco Adapter - ZKTeco qurilmalari uchun adapter
"""
import requests
import logging
from typing import List, Dict, Any
from .base import BaseDeviceAdapter

logger = logging.getLogger(__name__)


class ZKTecoAdapter(BaseDeviceAdapter):
    """ZKTeco biometrik qurilmalar uchun HTTP API adapter"""

    def __init__(self, device):
        super().__init__(device)
        self.base_url = f"http://{self.ip}:{self.port}"
        self.session = requests.Session()
        self._cookie = None

    def connect(self) -> bool:
        try:
            resp = self.session.post(
                f"{self.base_url}/api/login",
                json={"username": self.username, "password": self.password},
                timeout=5
            )
            if resp.status_code == 200:
                data = resp.json()
                self._cookie = data.get('token')
                if self._cookie:
                    self.session.headers.update({'Cookie': f'session={self._cookie}'})
                return True
        except Exception as e:
            logger.error(f"ZKTeco connect error {self.ip}: {e}")
        return False

    def disconnect(self):
        try:
            self.session.post(f"{self.base_url}/api/logout")
        except Exception:
            pass
        self.session.close()

    def get_device_info(self) -> Dict[str, Any]:
        try:
            resp = self.session.get(f"{self.base_url}/api/deviceinfo")
            if resp.status_code == 200:
                return resp.json()
        except Exception as e:
            logger.error(f"get_device_info: {e}")
        return {}

    def get_status(self) -> Dict[str, Any]:
        try:
            connected = self.ping()
            return {'online': connected, 'status': 'online' if connected else 'offline'}
        except Exception:
            return {'online': False, 'status': 'offline'}

    def get_users(self) -> List[Dict[str, Any]]:
        try:
            resp = self.session.get(f"{self.base_url}/api/users")
            if resp.status_code == 200:
                return resp.json().get('data', [])
        except Exception as e:
            logger.error(f"get_users: {e}")
        return []

    def add_user(self, user_data: Dict[str, Any]) -> bool:
        try:
            payload = {
                'pin': user_data['employee_no'],
                'name': user_data['name'],
                'privilege': 0,
                'enabled': True,
            }
            resp = self.session.post(f"{self.base_url}/api/users", json=payload)
            return resp.status_code in [200, 201]
        except Exception as e:
            logger.error(f"add_user: {e}")
            return False

    def update_user(self, employee_no: str, user_data: Dict[str, Any]) -> bool:
        try:
            payload = {'name': user_data.get('name', '')}
            resp = self.session.put(f"{self.base_url}/api/users/{employee_no}", json=payload)
            return resp.status_code == 200
        except Exception as e:
            logger.error(f"update_user: {e}")
            return False

    def delete_user(self, employee_no: str) -> bool:
        try:
            resp = self.session.delete(f"{self.base_url}/api/users/{employee_no}")
            return resp.status_code in [200, 204]
        except Exception as e:
            logger.error(f"delete_user: {e}")
            return False

    def upload_face(self, employee_no: str, image_data: bytes) -> bool:
        try:
            files = {'file': ('face.jpg', image_data, 'image/jpeg')}
            resp = self.session.post(f"{self.base_url}/api/users/{employee_no}/face", files=files)
            return resp.status_code in [200, 201]
        except Exception as e:
            logger.error(f"upload_face: {e}")
            return False

    def delete_face(self, employee_no: str) -> bool:
        try:
            resp = self.session.delete(f"{self.base_url}/api/users/{employee_no}/face")
            return resp.status_code in [200, 204]
        except Exception as e:
            logger.error(f"delete_face: {e}")
            return False

    def get_raw_logs(self, start_time=None, end_time=None) -> List[Dict[str, Any]]:
        try:
            params = {}
            if start_time:
                params['start'] = start_time.strftime("%Y-%m-%d %H:%M:%S")
            if end_time:
                params['end'] = end_time.strftime("%Y-%m-%d %H:%M:%S")
            resp = self.session.get(f"{self.base_url}/api/attendances", params=params)
            if resp.status_code == 200:
                records = resp.json().get('data', [])
                return [{
                    'employee_no': r.get('pin', ''),
                    'event_time': r.get('time', ''),
                    'event_type': r.get('status', 0),
                    'raw_data': r,
                } for r in records]
        except Exception as e:
            logger.error(f"get_raw_logs: {e}")
        return []

    def clear_logs(self) -> bool:
        try:
            resp = self.session.delete(f"{self.base_url}/api/attendances")
            return resp.status_code in [200, 204]
        except Exception as e:
            logger.error(f"clear_logs: {e}")
            return False
