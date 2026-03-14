"""
Hikvision ISAPI Adapter
Hikvision qurilmalari uchun REST API adapter
"""
import requests
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from requests.auth import HTTPDigestAuth
from .base import BaseDeviceAdapter

logger = logging.getLogger(__name__)


class HikvisionAdapter(BaseDeviceAdapter):
    """Hikvision ISAPI protokoli orqali qurilma boshqaruvi"""

    def __init__(self, device):
        super().__init__(device)
        self.base_url = f"http://{self.ip}:{self.port}"
        self.auth = HTTPDigestAuth(self.username, self.password)
        self.session = requests.Session()
        self.session.auth = self.auth
        self.session.timeout = 10

    def connect(self) -> bool:
        try:
            resp = self.session.get(f"{self.base_url}/ISAPI/System/deviceInfo", timeout=5)
            return resp.status_code == 200
        except Exception as e:
            logger.error(f"Hikvision connect error {self.ip}: {e}")
            return False

    def disconnect(self):
        self.session.close()

    def get_device_info(self) -> Dict[str, Any]:
        try:
            resp = self.session.get(f"{self.base_url}/ISAPI/System/deviceInfo")
            if resp.status_code == 200:
                import xml.etree.ElementTree as ET
                root = ET.fromstring(resp.text)
                ns = {'ns': 'http://www.hikvision.com/ver20/XMLSchema'}
                return {
                    'device_name': self._get_xml_text(root, 'deviceName', ns),
                    'model': self._get_xml_text(root, 'model', ns),
                    'serial_number': self._get_xml_text(root, 'serialNumber', ns),
                    'firmware_version': self._get_xml_text(root, 'firmwareVersion', ns),
                    'mac_address': self._get_xml_text(root, 'macAddress', ns),
                }
        except Exception as e:
            logger.error(f"get_device_info error: {e}")
        return {}

    def get_status(self) -> Dict[str, Any]:
        try:
            # Check if device is reachable
            resp = self.session.get(f"{self.base_url}/ISAPI/System/status", timeout=5)
            online = resp.status_code == 200
            return {
                'online': online,
                'status': 'online' if online else 'offline',
                'ip': self.ip,
                'port': self.port,
            }
        except Exception:
            return {'online': False, 'status': 'offline', 'ip': self.ip, 'port': self.port}

    def get_users(self) -> List[Dict[str, Any]]:
        users = []
        try:
            url = f"{self.base_url}/ISAPI/AccessControl/UserInfo/Search?format=json"
            payload = {
                "UserInfoSearchCond": {
                    "searchID": "1",
                    "searchResultPosition": 0,
                    "maxResults": 30
                }
            }
            resp = self.session.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                user_list = data.get('UserInfoSearch', {}).get('UserInfo', [])
                for u in user_list:
                    users.append({
                        'employee_no': u.get('employeeNo'),
                        'name': u.get('name'),
                        'user_type': u.get('userType'),
                    })
        except Exception as e:
            logger.error(f"get_users error: {e}")
        return users

    def add_user(self, user_data: Dict[str, Any]) -> bool:
        try:
            url = f"{self.base_url}/ISAPI/AccessControl/UserInfo/Record?format=json"
            payload = {
                "UserInfo": {
                    "employeeNo": user_data['employee_no'],
                    "name": user_data['name'],
                    "userType": "normal",
                    "Valid": {
                        "enable": True,
                        "beginTime": "2024-01-01T00:00:00",
                        "endTime": "2030-12-31T23:59:59",
                        "timeType": "local"
                    },
                    "doorRight": "1",
                    "RightPlan": [{"doorNo": 1, "planTemplateNo": "1"}]
                }
            }
            resp = self.session.post(url, json=payload)
            return resp.status_code in [200, 201]
        except Exception as e:
            logger.error(f"add_user error: {e}")
            return False

    def update_user(self, employee_no: str, user_data: Dict[str, Any]) -> bool:
        # Delete and re-add
        self.delete_user(employee_no)
        return self.add_user({**user_data, 'employee_no': employee_no})

    def delete_user(self, employee_no: str) -> bool:
        try:
            url = f"{self.base_url}/ISAPI/AccessControl/UserInfo/Delete?format=json"
            payload = {"UserDelCond": {"EmployeeNoList": [{"employeeNo": employee_no}]}}
            resp = self.session.put(url, json=payload)
            return resp.status_code == 200
        except Exception as e:
            logger.error(f"delete_user error: {e}")
            return False

    def upload_face(self, employee_no: str, image_data: bytes) -> bool:
        try:
            url = f"{self.base_url}/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json"
            import base64
            payload = {
                "faceLibType": "whiteFD",
                "FDID": "1",
                "FPID": employee_no,
                "faceURL": "",
                "faceData": base64.b64encode(image_data).decode()
            }
            resp = self.session.post(url, json=payload)
            return resp.status_code in [200, 201]
        except Exception as e:
            logger.error(f"upload_face error: {e}")
            return False

    def delete_face(self, employee_no: str) -> bool:
        try:
            url = f"{self.base_url}/ISAPI/Intelligent/FDLib/FaceDataRecord/{employee_no}"
            resp = self.session.delete(url)
            return resp.status_code == 200
        except Exception as e:
            logger.error(f"delete_face error: {e}")
            return False

    def get_raw_logs(self, start_time=None, end_time=None) -> List[Dict[str, Any]]:
        logs = []
        try:
            url = f"{self.base_url}/ISAPI/AccessControl/AcsEvent?format=json"
            if not start_time:
                from datetime import timedelta
                start_time = datetime.now() - timedelta(hours=24)
            if not end_time:
                end_time = datetime.now()

            payload = {
                "AcsEventCond": {
                    "searchID": "1",
                    "searchResultPosition": 0,
                    "maxResults": 1000,
                    "major": 0,
                    "minor": 0,
                    "startTime": start_time.strftime("%Y-%m-%dT%H:%M:%S+05:00"),
                    "endTime": end_time.strftime("%Y-%m-%dT%H:%M:%S+05:00"),
                }
            }
            resp = self.session.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                events = data.get('AcsEvent', {}).get('InfoList', [])
                for event in events:
                    logs.append({
                        'employee_no': event.get('employeeNoString', ''),
                        'event_time': event.get('time', ''),
                        'event_type': event.get('minor', 0),
                        'raw_data': event,
                    })
        except Exception as e:
            logger.error(f"get_raw_logs error: {e}")
        return logs

    def clear_logs(self) -> bool:
        return True  # Hikvision doesn't easily support remote log clearing

    def _get_xml_text(self, root, tag, ns):
        try:
            el = root.find(f"ns:{tag}", ns)
            return el.text if el is not None else ''
        except Exception:
            return ''
