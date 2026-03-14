"""
Dahua Adapter - Dahua qurilmalari uchun adapter
"""
import requests
import logging
from typing import List, Dict, Any
from requests.auth import HTTPDigestAuth
from .base import BaseDeviceAdapter

logger = logging.getLogger(__name__)


class DahuaAdapter(BaseDeviceAdapter):
    """Dahua qurilmalari uchun HTTP API adapter"""

    def __init__(self, device):
        super().__init__(device)
        self.base_url = f"http://{self.ip}:{self.port}"
        self.auth = HTTPDigestAuth(self.username, self.password)
        self.session = requests.Session()
        self.session.auth = self.auth
        self.session.timeout = 10

    def connect(self) -> bool:
        try:
            resp = self.session.get(f"{self.base_url}/cgi-bin/magicBox.cgi?action=getSystemInfo", timeout=5)
            return resp.status_code == 200
        except Exception as e:
            logger.error(f"Dahua connect error {self.ip}: {e}")
            return False

    def disconnect(self):
        self.session.close()

    def get_device_info(self) -> Dict[str, Any]:
        try:
            resp = self.session.get(f"{self.base_url}/cgi-bin/magicBox.cgi?action=getSystemInfo")
            if resp.status_code == 200:
                info = {}
                for line in resp.text.splitlines():
                    if '=' in line:
                        k, v = line.split('=', 1)
                        info[k.strip()] = v.strip()
                return info
        except Exception as e:
            logger.error(f"get_device_info: {e}")
        return {}

    def get_status(self) -> Dict[str, Any]:
        online = self.ping()
        return {'online': online, 'status': 'online' if online else 'offline'}

    def get_users(self) -> List[Dict[str, Any]]:
        try:
            resp = self.session.get(
                f"{self.base_url}/cgi-bin/AccessUser.cgi?action=list&object.Count=100"
            )
            if resp.status_code == 200:
                users = []
                for line in resp.text.splitlines():
                    if 'UserID' in line:
                        users.append({'employee_no': line.split('=')[1].strip()})
                return users
        except Exception as e:
            logger.error(f"get_users: {e}")
        return []

    def add_user(self, user_data: Dict[str, Any]) -> bool:
        try:
            params = {
                'action': 'insertRecord',
                'object.UserID': user_data['employee_no'],
                'object.UserName': user_data['name'],
                'object.Authority': 2,
            }
            resp = self.session.get(f"{self.base_url}/cgi-bin/AccessUser.cgi", params=params)
            return 'OK' in resp.text
        except Exception as e:
            logger.error(f"add_user: {e}")
            return False

    def update_user(self, employee_no: str, user_data: Dict[str, Any]) -> bool:
        self.delete_user(employee_no)
        return self.add_user({**user_data, 'employee_no': employee_no})

    def delete_user(self, employee_no: str) -> bool:
        try:
            params = {'action': 'removeRecord', 'object.UserID': employee_no}
            resp = self.session.get(f"{self.base_url}/cgi-bin/AccessUser.cgi", params=params)
            return 'OK' in resp.text
        except Exception as e:
            logger.error(f"delete_user: {e}")
            return False

    def upload_face(self, employee_no: str, image_data: bytes) -> bool:
        try:
            url = f"{self.base_url}/cgi-bin/FaceFind.cgi?action=add&UserID={employee_no}"
            files = {'data': ('face.jpg', image_data, 'image/jpeg')}
            resp = self.session.post(url, files=files)
            return 'OK' in resp.text
        except Exception as e:
            logger.error(f"upload_face: {e}")
            return False

    def delete_face(self, employee_no: str) -> bool:
        try:
            params = {'action': 'remove', 'UserID': employee_no}
            resp = self.session.get(f"{self.base_url}/cgi-bin/FaceFind.cgi", params=params)
            return 'OK' in resp.text
        except Exception as e:
            logger.error(f"delete_face: {e}")
            return False

    def get_raw_logs(self, start_time=None, end_time=None) -> List[Dict[str, Any]]:
        try:
            params = {
                'action': 'find',
                'object.Count': 1000,
                'object.Types[0]': 'AccessControl',
            }
            if start_time:
                params['object.StartTime'] = start_time.strftime("%Y-%m-%d %H:%M:%S")
            if end_time:
                params['object.EndTime'] = end_time.strftime("%Y-%m-%d %H:%M:%S")
            resp = self.session.get(f"{self.base_url}/cgi-bin/eventManager.cgi", params=params)
            if resp.status_code == 200:
                logs = []
                for line in resp.text.splitlines():
                    if 'UserID' in line or 'Time' in line:
                        pass  # Parse response
                return logs
        except Exception as e:
            logger.error(f"get_raw_logs: {e}")
        return []

    def clear_logs(self) -> bool:
        return True
