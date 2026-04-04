FROM mcr.microsoft.com/dotnet/sdk:10.0.100 AS publish
WORKDIR /src

COPY global.json ./
COPY Directory.Build.props ./
COPY src/PaperBinder.Worker/PaperBinder.Worker.csproj src/PaperBinder.Worker/
COPY src/PaperBinder.Infrastructure/PaperBinder.Infrastructure.csproj src/PaperBinder.Infrastructure/
COPY src/PaperBinder.Application/PaperBinder.Application.csproj src/PaperBinder.Application/
COPY src/PaperBinder.Domain/PaperBinder.Domain.csproj src/PaperBinder.Domain/
RUN dotnet restore src/PaperBinder.Worker/PaperBinder.Worker.csproj

COPY src/ ./src/

RUN dotnet publish src/PaperBinder.Worker/PaperBinder.Worker.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/runtime:10.0 AS runtime
WORKDIR /app

COPY --from=publish /app/publish ./

ENTRYPOINT ["dotnet", "PaperBinder.Worker.dll"]
