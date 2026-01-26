
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";

/**
 * A custom Transport for Cloudflare Workers (or any Request/Response stateless environment).
 * It processes a single incoming request and captures the corresponding response.
 */
export class CloudflareWorkerTransport implements Transport {
    private _onClose?: () => void;
    private _onError?: (error: Error) => void;
    private _onMessage?: (message: JSONRPCMessage) => void;

    private _responsePromise: Promise<JSONRPCMessage>;
    private _resolveResponse!: (response: JSONRPCMessage) => void;

    /**
     * @param requestBody The parsed JSON-RPC request body received by the Worker
     */
    constructor(private requestBody: JSONRPCMessage) {
        this._responsePromise = new Promise((resolve) => {
            this._resolveResponse = resolve;
        });
    }

    /**
     * Starts the transport. For this stateless adapter, it immediately dispatches
     * the incoming request to the server.
     */
    async start(): Promise<void> {
        if (this._onMessage) {
            // Dispatch the request to the McpServer
            this._onMessage(this.requestBody);
        }
    }

    /**
     * Called by McpServer to send a message (response or notification).
     */
    async send(message: JSONRPCMessage): Promise<void> {
        // In a stateless Request/Response model, we are primarily interested in the response
        // to the request we just sent.

        // We assume the first message sent back is the response.
        // If the server tries to send notifications, they might arrive here too.
        // For a strict implementation, we might want to filter, but usually simply resolving
        // the promise with the first message is sufficient for standard tool calls.

        this._resolveResponse(message);
    }

    async close(): Promise<void> {
        if (this._onClose) {
            this._onClose();
        }
    }

    /**
     * Returns a promise that resolves with the server's response.
     * The Worker should await this promise to get the data to return to the client.
     */
    get response(): Promise<JSONRPCMessage> {
        return this._responsePromise;
    }

    // Event handler setters required by the Transport interface
    set onclose(handler: () => void) { this._onClose = handler; }
    set onerror(handler: (error: Error) => void) { this._onError = handler; }
    set onmessage(handler: (message: JSONRPCMessage) => void) { this._onMessage = handler; }
}
