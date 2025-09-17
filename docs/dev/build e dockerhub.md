# Build da imagem do backend

docker build -t felipebatista54/dashboard-backend:v1.2.0 -f apps/backend/Dockerfile .

# Build da imagem do frontend

docker build --build-arg VITE_API_BASE_URL=http://ccoapi.vpioneira.com.br:3021 -t felipebatista54/dashboard-frontend:v1.2.0 -f apps/frontend/Dockerfile .

# TAG E PUSH:

docker tag felipebatista54/dashboard-backend:v1.2.0 felipebatista54/dashboard-backend:latest
docker push felipebatista54/dashboard-backend:latest
docker tag felipebatista54/dashboard-frontend:v1.2.0 felipebatista54/dashboard-frontend:latest
docker push felipebatista54/dashboard-frontend:latest
