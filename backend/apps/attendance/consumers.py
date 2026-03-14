import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)


class AttendanceConsumer(AsyncWebsocketConsumer):
    """Real-time davomad yangilanishlari WebSocket"""

    async def connect(self):
        self.user = self.scope.get('user')
        self.group_name = 'attendance_feed'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info(f"Attendance WebSocket connected")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get('type') == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def attendance_update(self, event):
        """Yangi davomad yozuvi kelganda"""
        await self.send(text_data=json.dumps({
            'type': 'attendance_update',
            'data': event['data'],
        }))
