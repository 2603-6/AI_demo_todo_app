## Click-and-go demo

From the root directory:

1. `npm run demo:up`
2. Wait for services to start
3. Test endpoints:
   - Postgres: `http://localhost:3001/health` and `http://localhost:3001/api/users`
   - MongoDB: `http://localhost:3002/health` and `http://localhost:3002/api/users`

Stop and clean:
- `npm run demo:down`



## Test creating users
### Postgres (port 3001)
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Ada Lovelace", "email": "ada@example.com"}'

curl http://localhost:3001/api/users
```

### MongoDB (port 3002)
```bash
curl -X POST http://localhost:3002/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Grace Hopper", "email": "grace@example.com"}'

curl http://localhost:3002/api/users
```
