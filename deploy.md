Docker build

2 - tagear:
docker tag dashboard-frontend:latest felipebatista54/dashboard-frontend:latest
docker tag dashboard-backend:latest felipebatista54/dashboard-backend:latest


docker push felipebatista54/dashboard-frontend:latest
docker push felipebatista54/dashboard-backend:latest