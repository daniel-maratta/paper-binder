FROM node:24.13-bookworm-slim AS frontend-build
WORKDIR /src/PaperBinder.Web

COPY src/PaperBinder.Web/package.json src/PaperBinder.Web/package-lock.json ./
RUN npm ci

ARG VITE_PAPERBINDER_ROOT_URL
ARG VITE_PAPERBINDER_API_BASE_URL
ARG VITE_PAPERBINDER_TENANT_BASE_DOMAIN

ENV VITE_PAPERBINDER_ROOT_URL=${VITE_PAPERBINDER_ROOT_URL}
ENV VITE_PAPERBINDER_API_BASE_URL=${VITE_PAPERBINDER_API_BASE_URL}
ENV VITE_PAPERBINDER_TENANT_BASE_DOMAIN=${VITE_PAPERBINDER_TENANT_BASE_DOMAIN}

COPY src/PaperBinder.Web/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0.100 AS publish
WORKDIR /src

COPY global.json ./
COPY src/PaperBinder.Api/PaperBinder.Api.csproj src/PaperBinder.Api/
COPY src/PaperBinder.Application/PaperBinder.Application.csproj src/PaperBinder.Application/
COPY src/PaperBinder.Domain/PaperBinder.Domain.csproj src/PaperBinder.Domain/
COPY src/PaperBinder.Infrastructure/PaperBinder.Infrastructure.csproj src/PaperBinder.Infrastructure/
RUN dotnet restore src/PaperBinder.Api/PaperBinder.Api.csproj

COPY src/ ./src/
COPY --from=frontend-build /src/PaperBinder.Web/dist ./src/PaperBinder.Web/dist

RUN dotnet publish src/PaperBinder.Api/PaperBinder.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=publish /app/publish ./

ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "PaperBinder.Api.dll"]
