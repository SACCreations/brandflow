import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface ImageJobProgressPayload {
  jobId: string;
  progress: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  stage?: string;
  finalPrompt?: string;
  imageUrl?: string;
  error?: string;
}

@WebSocketGateway({
  namespace: '/ws/image',
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class ImageWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ImageWebSocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`[WS] Connection rejected — no token provided`);
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('jwt.secret') || process.env['JWT_SECRET'];
      const payload = this.jwtService.verify(token, { secret });
      const businessId = payload.businessId || payload.bid;

      if (!businessId) {
        this.logger.warn(`[WS] Connection rejected — no businessId in token`);
        client.disconnect();
        return;
      }

      // Join business-specific room
      client.join(`business:${businessId}`);
      client.data = { userId: payload.sub, businessId };
      this.logger.log(`[WS] Client connected: user=${payload.sub} business=${businessId}`);
    } catch (err) {
      this.logger.warn(`[WS] Connection rejected — invalid token: ${err}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    this.logger.debug(`[WS] Client disconnected: user=${userId}`);
  }

  /**
   * Emit job progress update to all clients in the business room.
   */
  emitJobProgress(businessId: string, payload: ImageJobProgressPayload) {
    this.server.to(`business:${businessId}`).emit('image:job-progress', payload);
  }

  /**
   * Emit job completed event with image data.
   */
  emitJobCompleted(businessId: string, payload: ImageJobProgressPayload) {
    this.server.to(`business:${businessId}`).emit('image:job-completed', payload);
  }

  /**
   * Emit job failure event.
   */
  emitJobFailed(businessId: string, payload: ImageJobProgressPayload) {
    this.server.to(`business:${businessId}`).emit('image:job-failed', payload);
  }
}
