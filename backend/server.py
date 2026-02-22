# Simple server module that proxies all requests to Next.js on port 3000
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NEXTJS_URL = "http://localhost:3000"

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_to_nextjs(request: Request, path: str):
    """Proxy all requests to the Next.js server"""
    async with httpx.AsyncClient() as client:
        # Build the target URL
        url = f"{NEXTJS_URL}/api/{path}"
        
        # Get request body if present
        body = await request.body()
        
        # Forward headers, excluding some that should not be forwarded
        headers = dict(request.headers)
        headers.pop("host", None)
        headers.pop("content-length", None)
        
        # Forward cookies
        cookies = dict(request.cookies)
        
        try:
            response = await client.request(
                method=request.method,
                url=url,
                content=body,
                headers=headers,
                cookies=cookies,
                timeout=30.0
            )
            
            # Create response with forwarded headers
            resp_headers = dict(response.headers)
            resp_headers.pop("content-encoding", None)
            resp_headers.pop("content-length", None)
            resp_headers.pop("transfer-encoding", None)
            
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=resp_headers,
                media_type=response.headers.get("content-type")
            )
        except Exception as e:
            return Response(
                content=f"Proxy error: {str(e)}",
                status_code=502
            )
