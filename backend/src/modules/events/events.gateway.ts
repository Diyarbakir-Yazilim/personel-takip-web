import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Kat planı bölge durumu güncellendiğinde frontend'e yayın yapma
  @SubscribeMessage('updateZoneStatus')
  handleZoneUpdate(
    @MessageBody() data: { zoneId: string; status: 'FREE' | 'BUSY' | 'ALERT' },
  ) {
    this.server.emit('zoneStatusUpdate', data);
    return data;
  }
}