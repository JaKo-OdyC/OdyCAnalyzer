/**
 * API Monitoring Service
 * Provides continuous monitoring and health checks for all API integrations
 */

import { aiService } from './ai-service';
import { IStorage } from '../storage';
import axios from 'axios';

export interface ApiHealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'not_configured';
  lastChecked: Date;
  responseTime?: number;
  error?: string;
  details?: any;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ApiHealthStatus[];
  lastUpdate: Date;
}

export class ApiMonitor {
  private storage: IStorage;
  private healthCache: SystemHealth;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.healthCache = {
      overall: 'healthy',
      services: [],
      lastUpdate: new Date()
    };
  }

  /**
   * Start continuous API monitoring
   */
  startMonitoring(intervalMs: number = 300000): void { // Default: 5 minutes
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.checkAllServices();
    }, intervalMs);

    // Initial check
    this.checkAllServices().catch(console.error);
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Check health of all services
   */
  async checkAllServices(): Promise<SystemHealth> {
    const startTime = Date.now();
    
    const checks = [
      this.checkDatabaseHealth(),
      this.checkOpenAIHealth(),
      this.checkAnthropicHealth(),
      this.checkUrlProcessingHealth(),
    ];

    const results = await Promise.allSettled(checks);
    
    const services: ApiHealthStatus[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const serviceNames = ['database', 'openai', 'anthropic', 'url_processing'];
        return {
          service: serviceNames[index],
          status: 'unhealthy',
          lastChecked: new Date(),
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    // Determine overall health
    const hasUnhealthy = services.some(s => s.status === 'unhealthy');
    const hasDegraded = services.some(s => s.status === 'degraded');
    const overall: SystemHealth['overall'] = hasUnhealthy ? 'unhealthy' : 
                                            hasDegraded ? 'degraded' : 'healthy';

    this.healthCache = {
      overall,
      services,
      lastUpdate: new Date()
    };

    // Log health status changes
    const totalTime = Date.now() - startTime;
    console.log(`API Health Check completed in ${totalTime}ms - Overall: ${overall}`);

    return this.healthCache;
  }

  /**
   * Get cached health status
   */
  getHealthStatus(): SystemHealth {
    return this.healthCache;
  }

  /**
   * Check database connectivity
   */
  private async checkDatabaseHealth(): Promise<ApiHealthStatus> {
    const startTime = Date.now();
    
    try {
      if (!process.env.DATABASE_URL) {
        return {
          service: 'database',
          status: 'not_configured',
          lastChecked: new Date(),
          details: 'DATABASE_URL not configured'
        };
      }

      // Test database connection through a simple query
      await this.storage.getAllFiles();
      
      return {
        service: 'database',
        status: 'healthy',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  /**
   * Check OpenAI API connectivity
   */
  private async checkOpenAIHealth(): Promise<ApiHealthStatus> {
    const startTime = Date.now();
    
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          service: 'openai',
          status: 'not_configured',
          lastChecked: new Date(),
          details: 'OPENAI_API_KEY not configured'
        };
      }

      const response = await axios({
        method: 'GET',
        url: 'https://api.openai.com/v1/models',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.status === 200) {
        return {
          service: 'openai',
          status: 'healthy',
          lastChecked: new Date(),
          responseTime: Date.now() - startTime,
          details: { modelCount: response.data.data?.length || 0 }
        };
      } else {
        return {
          service: 'openai',
          status: 'degraded',
          lastChecked: new Date(),
          responseTime: Date.now() - startTime,
          error: `HTTP ${response.status}: ${response.data?.error?.message || 'Unknown error'}`
        };
      }
    } catch (error: any) {
      let errorMessage = 'Unknown OpenAI error';
      let status: ApiHealthStatus['status'] = 'unhealthy';
      
      if (error?.response?.status === 401) {
        errorMessage = 'Authentication failed. Please verify your OPENAI_API_KEY is valid and has sufficient credits.';
        status = 'not_configured';
      } else if (error?.response?.status >= 400 && error?.response?.status < 500) {
        errorMessage = `Client error (${error.response.status}): ${error.response.data?.error?.message || 'Invalid request'}`;
      } else if (error?.response?.status >= 500) {
        errorMessage = `Server error (${error.response.status}): OpenAI API may be temporarily unavailable`;
        status = 'degraded';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Network connectivity issue. Cannot reach OpenAI API.';
        status = 'degraded';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        service: 'openai',
        status,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        error: errorMessage
      };
    }
  }

  /**
   * Check Anthropic API connectivity
   */
  private async checkAnthropicHealth(): Promise<ApiHealthStatus> {
    const startTime = Date.now();
    
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        return {
          service: 'anthropic',
          status: 'not_configured',
          lastChecked: new Date(),
          details: 'ANTHROPIC_API_KEY not configured'
        };
      }

      // Use a minimal request to test connectivity
      const response = await axios({
        method: 'POST',
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        data: {
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }]
        },
        timeout: 10000
      });

      if (response.status === 200) {
        return {
          service: 'anthropic',
          status: 'healthy',
          lastChecked: new Date(),
          responseTime: Date.now() - startTime,
          details: { model: 'claude-3-haiku-20240307' }
        };
      } else {
        return {
          service: 'anthropic',
          status: 'degraded',
          lastChecked: new Date(),
          responseTime: Date.now() - startTime,
          error: `HTTP ${response.status}: ${response.data?.error?.message || 'Unknown error'}`
        };
      }
    } catch (error: any) {
      let errorMessage = 'Unknown Anthropic error';
      let status: ApiHealthStatus['status'] = 'unhealthy';
      
      if (error?.response?.status === 401) {
        errorMessage = 'Authentication failed. Please verify your ANTHROPIC_API_KEY is valid and has sufficient credits.';
        status = 'not_configured';
      } else if (error?.response?.status >= 400 && error?.response?.status < 500) {
        errorMessage = `Client error (${error.response.status}): ${error.response.data?.error?.message || 'Invalid request'}`;
      } else if (error?.response?.status >= 500) {
        errorMessage = `Server error (${error.response.status}): Anthropic API may be temporarily unavailable`;
        status = 'degraded';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Network connectivity issue. Cannot reach Anthropic API.';
        status = 'degraded';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        service: 'anthropic',
        status,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        error: errorMessage
      };
    }
  }

  /**
   * Check URL processing capabilities
   */
  private async checkUrlProcessingHealth(): Promise<ApiHealthStatus> {
    const startTime = Date.now();
    
    // Test URLs in order of preference (fallback endpoints if httpbin is unavailable)
    const testUrls = [
      'https://httpbin.org/status/200',
      'https://jsonplaceholder.typicode.com/posts/1',
      'https://api.github.com',
      'https://example.com'
    ];
    
    let lastError: Error | null = null;
    
    for (const testUrl of testUrls) {
      try {
        const response = await axios({
          method: 'GET',
          url: testUrl,
          timeout: 8000, // Shorter timeout for health checks
          headers: {
            'User-Agent': 'OdyCAnalyzer/1.0'
          }
        });

        if (response.status === 200) {
          return {
            service: 'url_processing',
            status: 'healthy',
            lastChecked: new Date(),
            responseTime: Date.now() - startTime,
            details: {
              endpoint: testUrl,
              message: 'HTTP connectivity working'
            }
          };
        }
      } catch (error: any) {
        lastError = error;
        console.log(`URL processing health check failed for ${testUrl}: ${error?.message}`);
        
        // Continue to next URL unless it's the last one
        if (testUrl !== testUrls[testUrls.length - 1]) {
          continue;
        }
      }
    }
    
    // All endpoints failed
    let errorMessage = 'Network connectivity limited';
    let status: ApiHealthStatus['status'] = 'degraded';
    
    if (lastError) {
      if (lastError.code === 'ENOTFOUND' || lastError.code === 'EAI_AGAIN') {
        errorMessage = 'DNS resolution failed. Network connectivity may be limited.';
        status = 'degraded'; // In sandboxed environments, this is expected
      } else if (lastError.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused. External services may be blocked.';
        status = 'degraded';
      } else if (lastError.code === 'ETIMEDOUT') {
        errorMessage = 'Request timeout. Network may be slow or restricted.';
        status = 'degraded';
      } else {
        errorMessage = `Network error: ${lastError.message}`;
        status = 'unhealthy';
      }
    }
    
    return {
      service: 'url_processing',
      status,
      lastChecked: new Date(),
      responseTime: Date.now() - startTime,
      error: errorMessage,
      details: {
        testedEndpoints: testUrls,
        message: 'External connectivity issues may be expected in sandboxed environments'
      }
    };
  }

  /**
   * Generate health report
   */
  generateHealthReport(): string {
    const health = this.getHealthStatus();
    
    let report = '🏥 API Health Report\n';
    report += '='.repeat(50) + '\n\n';
    
    report += `Overall Status: ${this.getStatusEmoji(health.overall)} ${health.overall.toUpperCase()}\n`;
    report += `Last Updated: ${health.lastUpdate.toISOString()}\n\n`;
    
    report += 'Service Status:\n';
    health.services.forEach(service => {
      const emoji = this.getStatusEmoji(service.status);
      report += `${emoji} ${service.service}: ${service.status}`;
      
      if (service.responseTime) {
        report += ` (${service.responseTime}ms)`;
      }
      
      if (service.error) {
        report += `\n   Error: ${service.error}`;
      }
      
      if (service.details && typeof service.details === 'object') {
        report += `\n   Details: ${JSON.stringify(service.details)}`;
      } else if (service.details) {
        report += `\n   Details: ${service.details}`;
      }
      
      report += '\n';
    });
    
    return report;
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'unhealthy': return '❌';
      case 'not_configured': return '⚙️';
      default: return '❓';
    }
  }
}