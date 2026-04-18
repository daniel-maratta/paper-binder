namespace PaperBinder.Api;

internal interface IRequestExecutionUserContext
{
    bool IsEstablished { get; }

    Guid ActorUserId { get; }

    Guid EffectiveUserId { get; }

    bool IsImpersonated { get; }

    Guid? ImpersonationSessionId { get; }
}

internal interface IRequestExecutionUserContextSetter
{
    void Establish(Guid actorUserId, Guid effectiveUserId, Guid? impersonationSessionId);
}

internal sealed class PaperBinderExecutionUserRequestContext
    : IRequestExecutionUserContext, IRequestExecutionUserContextSetter
{
    public bool IsEstablished { get; private set; }

    public Guid ActorUserId { get; private set; }

    public Guid EffectiveUserId { get; private set; }

    public bool IsImpersonated => ImpersonationSessionId.HasValue;

    public Guid? ImpersonationSessionId { get; private set; }

    public void Establish(Guid actorUserId, Guid effectiveUserId, Guid? impersonationSessionId)
    {
        if (actorUserId == Guid.Empty)
        {
            throw new ArgumentException("The actor user id must be a non-empty GUID.", nameof(actorUserId));
        }

        if (effectiveUserId == Guid.Empty)
        {
            throw new ArgumentException("The effective user id must be a non-empty GUID.", nameof(effectiveUserId));
        }

        EnsureNotEstablished();
        IsEstablished = true;
        ActorUserId = actorUserId;
        EffectiveUserId = effectiveUserId;
        ImpersonationSessionId = impersonationSessionId;
    }

    private void EnsureNotEstablished()
    {
        if (IsEstablished)
        {
            throw new InvalidOperationException("The execution user context can only be established once per request.");
        }
    }
}
