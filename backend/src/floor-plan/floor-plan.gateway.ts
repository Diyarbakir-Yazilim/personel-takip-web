import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export interface ZoneStatusUpdate {
  zoneId: string;
  status: 'vacant' | 'occupied' | 'maintenance' | 'alert';
  occupantCount?: number;
}

@WebSocketGateway({
  namespace: '/events',
  cors: {
    origin: '*',
  },
})
export class FloorPlanGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[FloorPlanGateway] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[FloorPlanGateway] Client disconnected: ${client.id}`);
  }

  // Bölge durumu güncellendiğinde tüm istemcilere broadcast eder
  @SubscribeMessage('updateZoneStatus')
  handleZoneUpdate(@MessageBody() data: ZoneStatusUpdate): void {
    this.server.emit('zoneStatusChanged', data);
  }

  // Sistem içinden çağrılabilecek yardımcı yayın metodu
  broadcastZoneChange(update: ZoneStatusUpdate) {
    this.server.emit('zoneStatusChanged', update);
  }
}