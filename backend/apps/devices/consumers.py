import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)


class DeviceStatusConsumer(AsyncWebsocketConsumer):
    """Real-time qurilma holati yangilanishlari"""

    async def connect(self):
        self.school_id = self.scope['url_route']['kwargs'].get('school_id', 'all')
        self.group_name = f"school_{self.school_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info(f"Device WebSocket connected: {self.group_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get('type') == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def device_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'device_event',
            'event': event['event'],
            'data': event['data'],
        }))
