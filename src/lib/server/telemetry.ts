// Application Insights telemetry integration
import { env } from '$env/dynamic/private';

interface TelemetryEvent {
	name: string;
	properties?: Record<string, string>;
	measurements?: Record<string, number>;
}

interface TelemetryException {
	error: Error;
	properties?: Record<string, string>;
	measurements?: Record<string, number>;
}

interface TelemetryPageView {
	name: string;
	url: string;
	duration?: number;
	properties?: Record<string, string>;
}

class TelemetryClient {
	private instrumentationKey: string | undefined;
	private endpoint = 'https://dc.services.visualstudio.com/v2/track';
	private appName = 'alexhopmann-blog';
	
	constructor() {
		this.instrumentationKey = env.APPINSIGHTS_INSTRUMENTATIONKEY;
	}
	
	private async send(data: any, itemType: string) {
		if (!this.instrumentationKey) {
			// No instrumentation key, skip telemetry
			return;
		}
		
		try {
			const envelope = {
				name: `Microsoft.ApplicationInsights.${this.instrumentationKey}.${itemType}`,
				time: new Date().toISOString(),
				iKey: this.instrumentationKey,
				tags: {
					'ai.application.ver': '1.0.0',
					'ai.cloud.role': this.appName,
					'ai.cloud.roleInstance': 'container-instance'
				},
				data: {
					baseType: itemType,
					baseData: data
				}
			};
			
			// Fire and forget - don't await
			fetch(this.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(envelope)
			}).catch(() => {
				// Ignore telemetry errors
			});
		} catch (error) {
			// Never let telemetry errors affect the application
		}
	}
	
	trackEvent(event: TelemetryEvent) {
		this.send({
			name: event.name,
			properties: event.properties || {},
			measurements: event.measurements || {}
		}, 'Event');
	}
	
	trackException(exception: TelemetryException) {
		this.send({
			exceptions: [{
				typeName: exception.error.name,
				message: exception.error.message,
				stack: exception.error.stack,
				hasFullStack: true
			}],
			properties: exception.properties || {},
			measurements: exception.measurements || {}
		}, 'Exception');
	}
	
	trackPageView(pageView: TelemetryPageView) {
		this.send({
			name: pageView.name,
			url: pageView.url,
			duration: pageView.duration || 0,
			properties: pageView.properties || {}
		}, 'PageView');
	}
	
	trackMetric(name: string, value: number, properties?: Record<string, string>) {
		this.send({
			metrics: [{
				name,
				value,
				count: 1
			}],
			properties: properties || {}
		}, 'Metric');
	}
}

// Singleton instance
export const telemetry = new TelemetryClient();