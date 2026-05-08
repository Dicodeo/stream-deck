import OBSWebSocket from 'obs-websocket-js';

class ObsService {
  private obs: OBSWebSocket | null = null;
  private isConnecting = false;
  private lastError: string | null = null;

  async connect(address: string, password?: string) {
    if (this.isConnecting) return;
    this.isConnecting = true;
    this.lastError = null;

    try {
      if (this.obs) {
        try {
          await this.obs.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }
      
      this.obs = new OBSWebSocket();
      const response = await this.obs.connect(address, password);
      console.log('OBS Connected:', response);
      return true;
    } catch (error: any) {
      // Improved error extraction for browser/security errors
      let errorMessage = 'Erro desconhecido';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
      } else if (error?.statusText) {
        errorMessage = error.statusText;
      } else if (error?.code === 1006) {
        errorMessage = "Erro 1006: Conexão recusada. 1) Certifique-se que o OBS está aberto. 2) Habilite o WebSocket (Porta 4455). 3) Se o app está em HTTPS, o navegador bloqueia conexões locais (ws://). Tente usar 'localhost' ou configure um túnel WSS (Secure WebSocket) como Ngrok.";
      } else if (error?.code) {
        errorMessage = `Código de erro: ${error.code}`;
      } else {
        try {
          errorMessage = JSON.stringify(error);
          if (errorMessage === '{}') {
            errorMessage = 'Erro de conexão (Provável bloqueio de Conteúdo Misto/SSL ou OBS fechado)';
          }
        } catch (e) {
          errorMessage = 'Não foi possível serializar o erro de conexão.';
        }
      }
      
      console.error('OBS Connection Error Detail:', errorMessage, error);
      this.lastError = errorMessage;
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect() {
    if (this.obs) {
      await this.obs.disconnect();
      this.obs = null;
    }
  }

  isConnected(): boolean {
    return !!this.obs && this.obs.identified;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  async call(requestType: any, requestData?: any) {
    if (!this.obs) return;
    try {
      return await this.obs.call(requestType, requestData);
    } catch (error) {
      console.error(`OBS Call Error (${requestType}):`, error);
    }
  }
}

export const obsService = new ObsService();
