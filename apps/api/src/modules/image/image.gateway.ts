import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface ImageGatewayClientLike {
  handshake?: {
    auth?: Record<string, unknown>;
    headers?: Record<string, string | undefined>;
  };
  disconnect?: () => void;
  join?: (room: string) => void;
  data?: Record<string, unknown>;
}

export interface ImageJobProgressPayload {
  jobId: string;
  progress: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  stage?: string;
  finalPrompt?: string;
  imageUrl?: string;
  error?: string;
}

@Injectable()
export class ImageWebSocketGateway {
  private readonly logger = new Logger(ImageWebSocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: ImageGatewayClientLike) {
    try {
      const handshake = client.handshake;
      const token =
        handshake?.auth?.['token'] ||
        handshake?.headers?.['authorization']?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`[WS] Connection rejected — no token provided`);
        client.disconnect?.();
        return;
      }

      const secret = this.configService.get<string>('jwt.secret') || process.env['JWT_SECRET'];
      const payload = this.jwtService.verify(String(token), { secret }) as Record<string, unknown>;
      const businessId = payload['businessId'] || payload['bid'];

      if (!businessId) {
        this.logger.warn(`[WS] Connection rejected — no businessId in token`);
        client.disconnect?.();
        return;
      }

      client.join?.(`business:${businessId}`);
      client.data = { userId: payload['sub'], businessId: String(businessId) };
      this.logger.log(`[WS] Client connected: user=${payload['sub']} business=${businessId}`);
    } catch (err) {
      this.logger.warn(`[WS] Connection rejected — invalid token: ${err}`);
      client.disconnect?.();
    }
  }

  handleDisconnect(client: ImageGatewayClientLike) {
    const userId = client.data?.['userId'];
    this.logger.debug(`[WS] Client disconnected: user=${userId}`);
  }

  /**
   * Emit job progress update to all clients in the business room.
   */
  emitJobProgress(businessId: string, payload: ImageJobProgressPayload) {
    this.logger.debug(`image:job-progress -> business=${businessId} job=${payload.jobId} progress=${payload.progress}`);
  }

  /**
   * Emit job completed event with image data.
   */
  emitJobCompleted(businessId: string, payload: ImageJobProgressPayload) {
    this.logger.debug(`image:job-completed -> business=${businessId} job=${payload.jobId}`);
  }

  /**
   * Emit job failure event.
   */
  emitJobFailed(businessId: string, payload: ImageJobProgressPayload) {
    this.logger.warn(`image:job-failed -> business=${businessId} job=${payload.jobId} error=${payload.error ?? 'unknown'}`);
  }
}
