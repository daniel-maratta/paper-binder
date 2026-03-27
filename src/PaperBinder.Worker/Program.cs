using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Worker;

var builder = Host.CreateApplicationBuilder(args);
var runtimeSettings = PaperBinderRuntimeSettings.Load(key => builder.Configuration[key]);

builder.Services.AddSingleton(runtimeSettings);
builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
