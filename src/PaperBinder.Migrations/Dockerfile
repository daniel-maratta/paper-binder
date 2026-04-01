FROM mcr.microsoft.com/dotnet/sdk:10.0.100 AS publish
WORKDIR /src

COPY global.json ./
COPY Directory.Build.props ./
COPY src/PaperBinder.Migrations/PaperBinder.Migrations.csproj src/PaperBinder.Migrations/
COPY src/PaperBinder.Infrastructure/PaperBinder.Infrastructure.csproj src/PaperBinder.Infrastructure/
COPY src/PaperBinder.Application/PaperBinder.Application.csproj src/PaperBinder.Application/
COPY src/PaperBinder.Domain/PaperBinder.Domain.csproj src/PaperBinder.Domain/
RUN dotnet restore src/PaperBinder.Migrations/PaperBinder.Migrations.csproj

COPY src/ ./src/

RUN dotnet publish src/PaperBinder.Migrations/PaperBinder.Migrations.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/runtime:10.0 AS runtime
WORKDIR /app

COPY --from=publish /app/publish ./

ENTRYPOINT ["dotnet", "PaperBinder.Migrations.dll"]
