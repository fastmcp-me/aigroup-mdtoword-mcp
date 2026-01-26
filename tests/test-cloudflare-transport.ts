
import { CloudflareWorkerTransport } from '../src/utils/cloudflare-transport.js';
import { createMcpServer } from '../src/mcp-server.js';
import { DocxMarkdownConverterWorker } from '../src/converter/markdown-worker.js';

// Mock request
const request = {
    jsonrpc: '2.0',
    id: 'test-1',
    method: 'tools/call',
    params: {
        name: 'markdown_to_docx',
        arguments: {
            markdown: '# Hello World\n\nThis is a test document.',
            filename: 'test.docx'
        }
    }
};

async function run() {
    console.log('Testing CloudflareWorkerTransport...');

    const transport = new CloudflareWorkerTransport(request as any);

    const server = createMcpServer({
        name: 'test-server',
        version: '1.0.0',
        ConverterClass: DocxMarkdownConverterWorker,
        // No fileSystem
    });

    await server.connect(transport);

    console.log('Waiting for response...');
    const response = await transport.response;

    // Basic validation
    if ((response as any).result && !(response as any).error) {
        const content = (response as any).result.content;
        console.log('Response content type:', typeof content);
        console.log('Response text:', content[0]?.text);

        const structured = (response as any).result.structuredContent;
        if (structured && structured.success && structured.size > 0) {
            console.log('✅ Test Passed: Got valid success response with content');
            console.log(`Document size: ${structured.size} bytes`);
        } else {
            console.error('❌ Test Failed: Invalid structured content', structured);
            process.exit(1);
        }
    } else {
        console.error('❌ Test Failed: Error or no result', response);
        process.exit(1);
    }
}

run().catch(e => {
    console.error('Test script error:', e);
    process.exit(1);
});
