using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using PaperBinder.Api;
using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.UnitTests;

public sealed class DataProtectionConfigurationTests
{
    [Fact]
    public void Should_PersistDataProtectionKeysToFileSystem_When_KeyRingPathIsConfigured()
    {
        var keyRingPath = CreateTempDirectory();

        try
        {
            var services = new ServiceCollection();
            services.AddPaperBinderDataProtection(
                CreateRuntimeSettings(
                    keyRingPath,
                    new DataProtectionSettings("PaperBinder-UnitTests", null, null)),
                new TestHostEnvironment(Environments.Development));

            using var serviceProvider = services.BuildServiceProvider();
            var options = serviceProvider.GetRequiredService<IOptions<DataProtectionOptions>>();
            var provider = serviceProvider.GetRequiredService<IDataProtectionProvider>();

            Assert.Equal("PaperBinder-UnitTests", options.Value.ApplicationDiscriminator);

            var payload = provider.CreateProtector("paperbinder.unit-tests").Protect("payload");

            Assert.False(string.IsNullOrWhiteSpace(payload));
            Assert.Single(Directory.GetFiles(keyRingPath, "*.xml"));
        }
        finally
        {
            DeleteDirectoryIfExists(keyRingPath);
        }
    }

    [Fact]
    public void Should_RequireCertificateConfiguration_ForProductionLikeEnvironment_When_KeyRingPathIsConfigured()
    {
        var services = new ServiceCollection();

        var exception = Assert.Throws<InvalidOperationException>(
            () => services.AddPaperBinderDataProtection(
                CreateRuntimeSettings(
                    "paperbinder-local-keys",
                    new DataProtectionSettings(null, null, null)),
                new TestHostEnvironment(Environments.Production)));

        Assert.Contains(PaperBinderConfigurationKeys.AuthKeyRingPath, exception.Message);
        Assert.Contains(PaperBinderConfigurationKeys.DataProtectionCertificatePath, exception.Message);
        Assert.Contains(PaperBinderConfigurationKeys.DataProtectionCertificatePassword, exception.Message);
    }

    [Fact]
    public void Should_LoadConfiguredCertificate_ForProductionLikeEnvironment()
    {
        var keyRingPath = CreateTempDirectory();
        var certificatePath = Path.Combine(keyRingPath, "data-protection.pfx");
        const string certificatePassword = "unit-test-password";

        try
        {
            WriteCertificate(certificatePath, certificatePassword);

            var services = new ServiceCollection();
            services.AddPaperBinderDataProtection(
                CreateRuntimeSettings(
                    keyRingPath,
                    new DataProtectionSettings(
                        "PaperBinder-UnitTests",
                        certificatePath,
                        certificatePassword)),
                new TestHostEnvironment(Environments.Production));

            using var serviceProvider = services.BuildServiceProvider();
            var provider = serviceProvider.GetRequiredService<IDataProtectionProvider>();

            var payload = provider.CreateProtector("paperbinder.unit-tests").Protect("payload");

            Assert.False(string.IsNullOrWhiteSpace(payload));
            Assert.Single(Directory.GetFiles(keyRingPath, "*.xml"));
        }
        finally
        {
            DeleteDirectoryIfExists(keyRingPath);
        }
    }

    private static PaperBinderRuntimeSettings CreateRuntimeSettings(
        string keyRingPath,
        DataProtectionSettings dataProtectionSettings) =>
        new(
            new DatabaseSettings(
                "Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password",
                "localhost",
                5432),
            new PublicUrlSettings(new Uri("http://paperbinder.localhost:8080")),
            new AuthCookieSettings(".paperbinder.localhost", "paperbinder.auth", keyRingPath),
            dataProtectionSettings,
            new ChallengeSettings("local-demo-site-key", "local-demo-secret-key", false),
            new LeaseSettings(60, 10, 3, 60, 180),
            new RateLimitSettings(30, 120, 10),
            new AuditSettings(AuditRetentionMode.RetainTenantPurgedSummary),
            new ObservabilitySettings(null));

    private static string CreateTempDirectory()
    {
        var path = Path.Combine(Path.GetTempPath(), "paperbinder-dp-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(path);
        return path;
    }

    private static void DeleteDirectoryIfExists(string path)
    {
        if (Directory.Exists(path))
        {
            Directory.Delete(path, recursive: true);
        }
    }

    private static void WriteCertificate(string certificatePath, string certificatePassword)
    {
        using var rsa = RSA.Create(2048);
        var request = new CertificateRequest(
            "CN=PaperBinder Unit Tests",
            rsa,
            HashAlgorithmName.SHA256,
            RSASignaturePadding.Pkcs1);
        using var certificate = request.CreateSelfSigned(
            DateTimeOffset.UtcNow.AddDays(-1),
            DateTimeOffset.UtcNow.AddDays(30));

        File.WriteAllBytes(
            certificatePath,
            certificate.Export(X509ContentType.Pfx, certificatePassword));
    }

    private sealed class TestHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;

        public string ApplicationName { get; set; } = "PaperBinder.UnitTests";

        public string ContentRootPath { get; set; } = Directory.GetCurrentDirectory();

        public IFileProvider ContentRootFileProvider { get; set; } =
            new PhysicalFileProvider(Directory.GetCurrentDirectory());
    }
}
