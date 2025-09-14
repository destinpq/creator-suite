# Creator Suite - Port Documentation

## 📋 Port Allocation Registry

### Creator Suite Application Ports

| Service | Port | Protocol | Status | Description |
|---------|------|----------|--------|-------------|
| **Creator Suite Frontend** | `16532` | HTTP | ✅ Active | React/Next.js frontend application |
| **Creator Suite API** | `17354` | HTTP | ✅ Active | FastAPI backend with uvicorn (4 workers) |

### External Access

| Domain | Port | SSL | Proxy Target | Purpose |
|--------|------|-----|--------------|---------|
| `https://video.destinpq.com` | 443 | ✅ | `127.0.0.1:16532` | Frontend UI Access |
| `https://video-api.destinpq.com` | 443 | ✅ | `127.0.0.1:17354` | API Access |

### Port Configuration Details

#### Frontend Port: 16532
- **Process**: Node.js application
- **Framework**: React/Next.js with UMI
- **Workers**: Single main process with esbuild workers
- **Bind**: `*:16532` (all interfaces)
- **Health Check**: Available at `/health`

#### API Port: 17354
- **Process**: Python uvicorn server
- **Framework**: FastAPI
- **Workers**: 4 worker processes
- **Bind**: `0.0.0.0:17354` (all interfaces)
- **Health Check**: Available at `/health`

### Network Architecture

```
Internet (HTTPS)
       ↓
Master Nginx (ports 80/443)
       ↓
SSL Termination + Proxy
       ↓
┌─────────────────┬─────────────────┬─────────────────┐
│  Frontend       │  API Backend    │  Bot Interface  │
│  Port: 16532    │  Port: 17354    │  Port: 18938    │
│  React/Next.js  │  FastAPI        │  FastAPI        │
└─────────────────┴─────────────────┴─────────────────┘
```

### Security Notes

- ✅ Internal ports (5837, 6194) not directly exposed to internet
- ✅ SSL certificates handled by master nginx
- ✅ CORS configured for cross-origin requests
- ✅ All traffic routed through nginx proxy

### Reserved Port Range

Creator Suite reserves the following port range for future expansion:
- **Primary Range**: `16532-17354` (API and frontend services)
- **Bot Range**: `18938-18948` (Bot services)

### Configuration Files

- **Nginx Config**: `/home/azureuser/creator-suite/.nginx-config/sites-available/creator-suite`
- **API Service**: `/etc/systemd/system/creator-suite-api.service`
- **Frontend Service**: `/etc/systemd/system/creator-suite-frontend.service`

---

**Last Updated**: September 8, 2025  
**Status**: All ports active and operational ✅  
**Maintainer**: Creator Suite Team
